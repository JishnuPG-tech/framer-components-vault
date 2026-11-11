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


/* @framerSupportedLayoutWidth any */
/* @framerSupportedLayoutHeight any */

type Preset =
    | "Drag Slider"
    | "Hover Scrub"
    | "Click Toggle"
    | "Auto Loop"
    | "Scroll Reveal"
    | "3D Flip"

type MediaType = "Image" | "Video"
type DividerOrientation = "Vertical" | "Horizontal"
type Fit = "Cover" | "Contain"
type HandleStyle = "Line" | "Circle" | "Line + Circle"
type LabelPlacement = "Top" | "Bottom"
type FlipAxis = "Y" | "X"
type ShadowPreset = "None" | "Soft" | "Medium" | "Strong" | "Custom"

type MediaGroup = {
    preset: Preset
    mediaType: MediaType
    beforeImage: string
    afterImage: string
    beforeAlt: string
    afterAlt: string
    beforeVideo: string
    afterVideo: string
    fit: Fit
    videoMuted: boolean
    videoLoop: boolean
    videoControls: boolean
    videoPreload: "none" | "metadata" | "auto"
}

type BehaviorGroup = {
    divider: DividerOrientation
    startPosition: number
    clickToggleTarget: number
    transitionMs: number
    autoSpeed: number
    autoAmplitude: number
    autoPauseOnHover: boolean
    scrollMin: number
    scrollMax: number
    flipAxis: FlipAxis
    flipPerspective: number
    flipTapToToggle: boolean
}

type AppearanceGroup = {
    borderRadius: number
    backgroundColor: string
    outlineWidth: number
    outlineColor: string
    shadowPreset: ShadowPreset
    shadowCustom: string
}

type HandleGroup = {
    handleStyle: HandleStyle
    handleColor: string
    handleSize: number
    useAdvancedHandleSizing: boolean
    dividerThickness: number
    knobSize: number
    handleShadowPreset: ShadowPreset
    handleShadowCustom: string
}

type LabelsGroup = {
    showLabels: boolean
    beforeLabel: string
    afterLabel: string
    labelPlacement: LabelPlacement
    labelFontSize: number
    labelPaddingX: number
    labelPaddingY: number
    labelRadius: number
    labelTextColor: string
    labelBg: string
    labelOpacity: number
}

type Props = {
    media?: Partial<MediaGroup>
    behavior?: Partial<BehaviorGroup>
    appearance?: Partial<AppearanceGroup>
    handle?: Partial<HandleGroup>
    labels?: Partial<LabelsGroup>
    style?: React.CSSProperties

    preset?: Preset
    mediaType?: MediaType
    divider?: DividerOrientation
    beforeImage?: string
    afterImage?: string
    beforeVideo?: string
    afterVideo?: string
    fit?: Fit
    startPosition?: number
}

function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n))
}

function lerp(a: number, b: number, t: number) {
    return a + (b - a) * t
}

function easeOutCubic(t: number) {
    return 1 - Math.pow(1 - t, 3)
}

function isTruthyUrl(s?: string) {
    return typeof s === "string" && s.trim().length > 0
}

function getPreset(p: any): Preset {
    return (p?.media?.preset ?? p?.preset ?? "Drag Slider") as Preset
}

function getMediaType(p: any): MediaType {
    return (p?.media?.mediaType ?? p?.mediaType ?? "Image") as MediaType
}

function getDivider(p: any): DividerOrientation {
    return (p?.behavior?.divider ??
        p?.divider ??
        "Vertical") as DividerOrientation
}

function getStartPosition(p: any): number {
    return Number(p?.behavior?.startPosition ?? p?.startPosition ?? 50)
}

function pickMediaSrc(p: any, which: "before" | "after") {
    const mediaType = getMediaType(p)
    const m = p?.media ?? {}
    if (mediaType === "Video") {
        const legacy = which === "before" ? p?.beforeVideo : p?.afterVideo
        return (
            (which === "before" ? m.beforeVideo : m.afterVideo) ?? legacy ?? ""
        )
    }
    const legacy = which === "before" ? p?.beforeImage : p?.afterImage
    return (which === "before" ? m.beforeImage : m.afterImage) ?? legacy ?? ""
}

function clipForBefore(divider: DividerOrientation, pos01: number) {
    const p = clamp(pos01, 0, 1) * 100
    if (divider === "Horizontal") return `inset(0% 0% ${100 - p}% 0%)`
    return `inset(0% ${100 - p}% 0% 0%)`
}

function axisPercent(divider: DividerOrientation, pos01: number) {
    const p = clamp(pos01, 0, 1) * 100
    if (divider === "Horizontal") return { top: `${p}%`, left: "0%" }
    return { left: `${p}%`, top: "0%" }
}

function labelPositions(placement: LabelPlacement) {
    const edgeY = placement === "Top" ? { top: 12 } : { bottom: 12 }
    return {
        before: { left: 12, ...edgeY },
        after: { right: 12, ...edgeY },
    }
}

function shadowFromPreset(preset: ShadowPreset, custom: string) {
    if (preset === "None") return "none"
    if (preset === "Soft") return "0 14px 40px rgba(0,0,0,0.28)"
    if (preset === "Medium") return "0 18px 55px rgba(0,0,0,0.34)"
    if (preset === "Strong") return "0 24px 80px rgba(0,0,0,0.40)"
    return (custom || "").trim() || "0 18px 55px rgba(0,0,0,0.34)"
}

function Placeholder({ text }: { text: string }) {
    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                color: "rgba(255,255,255,0.85)",
                userSelect: "none",
                WebkitUserSelect: "none",
                padding: 16,
                textAlign: "center",
                lineHeight: 1.35,
                pointerEvents: "none",
            }}
        >
            {text}
        </div>
    )
}

function MediaLayer(props: {
    mediaType: MediaType
    src: string
    alt?: string
    fit: Fit
    muted: boolean
    loop: boolean
    controls: boolean
    preload: "none" | "metadata" | "auto"
    refCb?: (el: HTMLVideoElement | null) => void
}) {
    const commonStyle: React.CSSProperties = {
        width: "100%",
        height: "100%",
        objectFit: props.fit === "Contain" ? "contain" : "cover",
        display: "block",
        userSelect: "none",
        WebkitUserSelect: "none",
        WebkitUserDrag: "none" as any,
        pointerEvents: "none",
    }

    if (props.mediaType === "Video") {
        return (
            <video
                ref={props.refCb}
                src={props.src}
                style={commonStyle}
                muted={props.muted}
                loop={props.loop}
                controls={props.controls}
                playsInline
                preload={props.preload}
            />
        )
    }

    return (
        <img
            src={props.src}
            alt={props.alt || ""}
            draggable={false}
            onDragStart={(e) => e.preventDefault()}
            style={commonStyle}
        />
    )
}

export default function BeforeAfterPro(p: Props) {
    const rootRef = React.useRef<HTMLDivElement | null>(null)
    const rafRef = React.useRef<number | null>(null)
    const dragActiveRef = React.useRef(false)
    const hoverRef = React.useRef(false)
    const canHoverRef = React.useRef(true)

    const beforeVideoRef = React.useRef<HTMLVideoElement | null>(null)
    const afterVideoRef = React.useRef<HTMLVideoElement | null>(null)

    const preset = getPreset(p)
    const mediaType = getMediaType(p)
    const divider = getDivider(p)

    const media = (p.media ?? {}) as Partial<MediaGroup>
    const behavior = (p.behavior ?? {}) as Partial<BehaviorGroup>
    const appearance = (p.appearance ?? {}) as Partial<AppearanceGroup>
    const handle = (p.handle ?? {}) as Partial<HandleGroup>
    const labelsCfg = (p.labels ?? {}) as Partial<LabelsGroup>

    const beforeSrc = pickMediaSrc(p, "before")
    const afterSrc = pickMediaSrc(p, "after")

    const hasBefore = isTruthyUrl(beforeSrc)
    const hasAfter = isTruthyUrl(afterSrc)
    const ready = hasBefore && hasAfter

    const isFlip = ready && preset === "3D Flip"

    React.useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return
        canHoverRef.current = window.matchMedia("(hover: hover)").matches
    }, [])

    const fit = (media.fit ?? p.fit ?? "Cover") as Fit
    const startPosition = clamp(getStartPosition(p), 2, 98)

    const transitionMs =
        preset === "3D Flip"
            ? 1000
            : Math.max(60, Number(behavior.transitionMs ?? 1000))

    const [pos, setPos] = React.useState(() =>
        clamp(startPosition / 100, 0.02, 0.98)
    )
    const [toggleState, setToggleState] = React.useState(false)
    const [flipOn, setFlipOn] = React.useState(false)

    const killRaf = React.useCallback(() => {
        if (rafRef.current != null) {
            cancelAnimationFrame(rafRef.current)
            rafRef.current = null
        }
    }, [])

    const safePlayVideos = React.useCallback(() => {
        if (mediaType !== "Video") return
        const tryPlay = (v: HTMLVideoElement | null) => {
            if (!v) return
            const pr = v.play()
            if (pr && typeof (pr as any).catch === "function")
                (pr as any).catch(() => {})
        }
        tryPlay(beforeVideoRef.current)
        tryPlay(afterVideoRef.current)
    }, [mediaType])

    React.useEffect(() => {
        setPos(clamp(startPosition / 100, 0.02, 0.98))
    }, [startPosition])

    React.useEffect(() => {
        safePlayVideos()
    }, [safePlayVideos, beforeSrc, afterSrc])

    const setPosFromClientPoint = React.useCallback(
        (clientX: number, clientY: number) => {
            const el = rootRef.current
            if (!el) return
            const r = el.getBoundingClientRect()

            let next = pos
            if (divider === "Horizontal") {
                const y = clamp(clientY - r.top, 0, r.height)
                next = r.height > 0 ? y / r.height : pos
            } else {
                const x = clamp(clientX - r.left, 0, r.width)
                next = r.width > 0 ? x / r.width : pos
            }

            setPos(clamp(next, 0.02, 0.98))
        },
        [divider, pos]
    )

    const onPointerDown = React.useCallback(
        (e: React.PointerEvent) => {
            if (!ready) return
            if (preset !== "Drag Slider") return
            dragActiveRef.current = true
            e.preventDefault()
            ;(e.currentTarget as any).setPointerCapture?.(e.pointerId)
            setPosFromClientPoint(e.clientX, e.clientY)
            safePlayVideos()
        },
        [preset, ready, setPosFromClientPoint, safePlayVideos]
    )

    const onPointerMove = React.useCallback(
        (e: React.PointerEvent) => {
            if (!ready) return

            if (preset === "Drag Slider") {
                if (!dragActiveRef.current) return
                e.preventDefault()
                setPosFromClientPoint(e.clientX, e.clientY)
                return
            }

            if (preset === "Hover Scrub") {
                if (!hoverRef.current) return
                setPosFromClientPoint(e.clientX, e.clientY)
            }
        },
        [preset, ready, setPosFromClientPoint]
    )

    const onPointerUp = React.useCallback(() => {
        dragActiveRef.current = false
    }, [])

    const animateTo = React.useCallback(
        (to: number) => {
            killRaf()
            const from = pos
            const start = performance.now()
            const dur = transitionMs

            const tick = (now: number) => {
                const t = clamp((now - start) / dur, 0, 1)
                const v = lerp(from, to, easeOutCubic(t))
                setPos(clamp(v, 0.02, 0.98))
                if (t < 1) rafRef.current = requestAnimationFrame(tick)
            }

            rafRef.current = requestAnimationFrame(tick)
        },
        [killRaf, transitionMs, pos]
    )

    // ── FIXED: Click Toggle now fully reveals After (0.98) then Before (0.02) ──
    const onClick = React.useCallback(() => {
        if (!ready) return

        if (preset === "Click Toggle") {
            safePlayVideos()
            const next = !toggleState
            setToggleState(next)
            animateTo(next ? 0.98 : 0.02)
            return
        }

        if (preset === "3D Flip") {
            if (canHoverRef.current) return
            if (!(behavior.flipTapToToggle ?? true)) return
            safePlayVideos()
            setFlipOn((v) => !v)
        }
    }, [
        preset,
        ready,
        toggleState,
        animateTo,
        safePlayVideos,
        behavior.flipTapToToggle,
    ])

    // ── FIXED: Auto Loop ping-pongs fully to each reveal with eased animation ─
    React.useEffect(() => {
        if (!ready) return
        if (preset !== "Auto Loop") {
            killRaf()
            return
        }

        const speed = Math.max(0.05, Number(behavior.autoSpeed ?? 0.2))
        const pauseOnHover = Boolean(behavior.autoPauseOnHover ?? true)

        // speed 0.2 → ~2000ms transition, speed 1 → ~600ms, speed 3 → ~250ms
        const transDuration = Math.round(1200 / speed)
        // brief hold at each extreme so the full reveal is visible
        const pauseDuration = Math.round(300 / speed)

        const lo = 0.02 // full Before reveal (left edge)
        const hi = 0.98 // full After reveal (right edge)

        let animFrom = lo
        let animTo = hi

        // snap to left edge immediately so the loop always starts from the beginning
        setPos(lo)
        let phase: "animating" | "pausing" = "animating"
        let phaseStart = performance.now()
        let cancelled = false

        const tick = (now: number) => {
            if (cancelled) return

            if (pauseOnHover && hoverRef.current) {
                // freeze phase timing while hovered so it resumes cleanly
                phaseStart = now - (phase === "animating" ? 0 : pauseDuration)
                rafRef.current = requestAnimationFrame(tick)
                return
            }

            const elapsed = now - phaseStart

            if (phase === "animating") {
                const t = clamp(elapsed / transDuration, 0, 1)
                setPos(lerp(animFrom, animTo, easeOutCubic(t)))
                if (t >= 1) {
                    phase = "pausing"
                    phaseStart = now
                }
            } else {
                if (elapsed >= pauseDuration) {
                    // swap direction for next cycle
                    const tmp = animFrom
                    animFrom = animTo
                    animTo = tmp
                    phase = "animating"
                    phaseStart = now
                }
            }

            rafRef.current = requestAnimationFrame(tick)
        }

        rafRef.current = requestAnimationFrame(tick)
        return () => {
            cancelled = true
            killRaf()
        }
    }, [
        preset,
        behavior.autoAmplitude,
        behavior.autoSpeed,
        behavior.autoPauseOnHover,
        ready,
        killRaf,
    ])

    React.useEffect(() => {
        if (!ready) return
        if (preset !== "Scroll Reveal") return

        killRaf()

        let ticking = false
        const min01 = clamp(Number(behavior.scrollMin ?? 10) / 100, 0, 1)
        const max01 = clamp(Number(behavior.scrollMax ?? 90) / 100, 0, 1)

        const compute = () => {
            ticking = false
            const el = rootRef.current
            if (!el) return
            const r = el.getBoundingClientRect()
            const vh = window.innerHeight || 1

            const start = vh * (1 - max01)
            const end = vh * (1 - min01)
            const denom = Math.max(1, end - start)

            const t = clamp((start - r.top) / denom, 0, 1)
            setPos(clamp(t, 0.02, 0.98))
        }

        const onScroll = () => {
            if (ticking) return
            ticking = true
            rafRef.current = requestAnimationFrame(compute)
        }

        compute()
        window.addEventListener("scroll", onScroll, { passive: true })
        window.addEventListener("resize", onScroll)

        return () => {
            window.removeEventListener("scroll", onScroll)
            window.removeEventListener("resize", onScroll)
            killRaf()
        }
    }, [preset, behavior.scrollMin, behavior.scrollMax, ready, killRaf])

    const enterHover = React.useCallback(() => {
        hoverRef.current = true
        if (ready) safePlayVideos()
        if (preset === "3D Flip") setFlipOn(true)
    }, [preset, ready, safePlayVideos])

    const leaveHover = React.useCallback(() => {
        hoverRef.current = false
        if (!ready) return
        if (preset === "Hover Scrub")
            setPos(clamp(startPosition / 100, 0.02, 0.98))
        if (preset === "3D Flip") setFlipOn(false)
    }, [preset, startPosition, ready])

    const borderRadius = Number(appearance.borderRadius ?? 18)
    const backgroundColor = String(
        appearance.backgroundColor ?? "rgba(18,18,18,1)"
    )
    const outlineWidth = Number(appearance.outlineWidth ?? 0)
    const outlineColor = String(
        appearance.outlineColor ?? "rgba(255,255,255,0.12)"
    )

    const boxShadow = shadowFromPreset(
        (appearance.shadowPreset ?? "None") as ShadowPreset,
        String(appearance.shadowCustom ?? "")
    )

    const effectiveCardShadow = preset === "3D Flip" ? "none" : boxShadow

    const showLabels = Boolean(labelsCfg.showLabels ?? true)
    const beforeLabel = String(labelsCfg.beforeLabel ?? "Before")
    const afterLabel = String(labelsCfg.afterLabel ?? "After")
    const labelPlacement = (labelsCfg.labelPlacement ?? "Top") as LabelPlacement
    const labelsPos = labelPositions(labelPlacement)

    const labelBase: React.CSSProperties = {
        position: "absolute",
        maxWidth: "70%",
        fontSize: Number(labelsCfg.labelFontSize ?? 12),
        padding: `${Number(labelsCfg.labelPaddingY ?? 8)}px ${Number(labelsCfg.labelPaddingX ?? 10)}px`,
        borderRadius: Number(labelsCfg.labelRadius ?? 999),
        color: String(labelsCfg.labelTextColor ?? "rgba(255,255,255,0.92)"),
        background: String(labelsCfg.labelBg ?? "rgba(0,0,0,0.45)"),
        opacity: clamp(Number(labelsCfg.labelOpacity ?? 1), 0, 1),
        lineHeight: 1.1,
        userSelect: "none",
        WebkitUserSelect: "none",
        pointerEvents: "none",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        boxShadow:
            preset === "3D Flip" ? "none" : "0 6px 20px rgba(0,0,0,0.25)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
    }

    const beforeAlt = String(media.beforeAlt ?? "")
    const afterAlt = String(media.afterAlt ?? "")

    const handleStyle = (handle.handleStyle ?? "Line + Circle") as HandleStyle
    const handleColor = String(handle.handleColor ?? "rgba(255,255,255,0.9)")
    const handleSize = clamp(Number(handle.handleSize ?? 44), 16, 140)

    const useAdvancedHandleSizing = Boolean(
        handle.useAdvancedHandleSizing ?? false
    )
    const derivedThickness = clamp(Math.round(handleSize / 18), 1, 12)
    const dividerThickness = useAdvancedHandleSizing
        ? clamp(Number(handle.dividerThickness ?? 2), 1, 16)
        : derivedThickness

    const knobSize = useAdvancedHandleSizing
        ? clamp(Number(handle.knobSize ?? handleSize), 16, 160)
        : handleSize

    const muted = Boolean(media.videoMuted ?? true)
    const loop = Boolean(media.videoLoop ?? true)
    const controls = Boolean(media.videoControls ?? false)
    const preload = (media.videoPreload ?? "metadata") as
        | "none"
        | "metadata"
        | "auto"

    const layerStyle: React.CSSProperties = { position: "absolute", inset: 0 }

    const clip = ready ? clipForBefore(divider, pos) : "none"
    const axis = axisPercent(divider, pos)

    const beforeStyle: React.CSSProperties = {
        ...layerStyle,
        clipPath: clip,
        WebkitClipPath: clip,
        willChange: "clip-path",
        pointerEvents: "none",
    }

    const handleLineStyle: React.CSSProperties = {
        position: "absolute",
        ...(divider === "Horizontal"
            ? {
                  left: 0,
                  right: 0,
                  top: axis.top,
                  height: dividerThickness,
                  transform: "translateY(-50%)",
              }
            : {
                  top: 0,
                  bottom: 0,
                  left: axis.left,
                  width: dividerThickness,
                  transform: "translateX(-50%)",
              }),
        background: handleColor,
        pointerEvents: "none",
    }

    const handleKnobStyle: React.CSSProperties = {
        position: "absolute",
        left: divider === "Horizontal" ? "50%" : axis.left,
        top: divider === "Horizontal" ? axis.top : "50%",
        width: knobSize,
        height: knobSize,
        borderRadius: 999,
        transform: "translate(-50%, -50%)",
        background: handleColor,
        pointerEvents: "none",
        boxShadow: "none",
    }

    const flipAxis = (behavior.flipAxis ?? "Y") as FlipAxis
    const flipPerspective = 1000

    const isDrag = ready && preset === "Drag Slider"
    const cursor = isFlip
        ? "default"
        : isDrag && divider === "Horizontal"
          ? "ns-resize"
          : isDrag
            ? "ew-resize"
            : "default"

    const rootStyle: React.CSSProperties = {
        width: "100%",
        height: "100%",
        boxShadow: effectiveCardShadow,
        cursor,
        touchAction: isDrag ? "none" : isFlip ? "manipulation" : "auto",
        userSelect: "none",
        WebkitUserSelect: "none",
        WebkitUserDrag: "none" as any,
        ...p.style,
    }

    const stageBase: React.CSSProperties = {
        width: "100%",
        height: "100%",
        position: "relative",
        borderRadius,
        background: backgroundColor,
        outline:
            outlineWidth > 0
                ? `${outlineWidth}px solid ${outlineColor}`
                : "none",
        isolation: "isolate",
    }

    const stageSlider: React.CSSProperties = {
        ...stageBase,
        overflow: "hidden",
    }

    const stageFlip: React.CSSProperties = {
        ...stageBase,
        overflow: "visible",
        perspective: flipPerspective,
        WebkitPerspective: flipPerspective,
        perspectiveOrigin: "50% 50%",
        WebkitPerspectiveOrigin: "50% 50%" as any,
    }

    const flipCard: React.CSSProperties = {
        position: "absolute",
        inset: 0,
        borderRadius,
        transformStyle: "preserve-3d",
        WebkitTransformStyle: "preserve-3d",
        transition: `transform 1000ms cubic-bezier(0.2, 0.8, 0.2, 1)`,
        willChange: "transform",
        transformOrigin: "50% 50%",
        transform:
            flipAxis === "X"
                ? `rotateX(${flipOn ? 180 : 0}deg)`
                : `rotateY(${flipOn ? 180 : 0}deg)`,
    }

    const flipFaceBase: React.CSSProperties = {
        position: "absolute",
        inset: 0,
        backfaceVisibility: "hidden",
        WebkitBackfaceVisibility: "hidden",
        borderRadius,
        overflow: "visible",
        background: "transparent",
        transformStyle: "preserve-3d",
        WebkitTransformStyle: "preserve-3d",
    }

    const faceClip: React.CSSProperties = {
        position: "absolute",
        inset: 0,
        borderRadius,
        overflow: "hidden",
        background: backgroundColor,
    }

    const flipFront: React.CSSProperties = {
        ...flipFaceBase,
        transform: flipAxis === "X" ? "rotateX(0deg)" : "rotateY(0deg)",
    }

    const flipBack: React.CSSProperties = {
        ...flipFaceBase,
        transform: flipAxis === "X" ? "rotateX(180deg)" : "rotateY(180deg)",
    }

    return (
        <div
            ref={rootRef}
            style={rootStyle}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onPointerEnter={enterHover}
            onPointerLeave={leaveHover}
            onMouseEnter={enterHover}
            onMouseLeave={leaveHover}
            onClick={onClick}
            onDragStart={(e) => e.preventDefault()}
            role="img"
            aria-label="Before and after comparison"
        >
            <div style={isFlip ? stageFlip : stageSlider}>
                {!ready && (
                    <Placeholder
                        text={
                            mediaType === "Video"
                                ? "Add both videos in Media to enable the comparison."
                                : "Add both images in Media to enable the comparison."
                        }
                    />
                )}

                {ready && preset === "3D Flip" && (
                    <div style={flipCard}>
                        <div style={flipFront}>
                            <div style={faceClip}>
                                <MediaLayer
                                    mediaType={mediaType}
                                    src={beforeSrc}
                                    alt={mediaType === "Image" ? beforeAlt : ""}
                                    fit={fit}
                                    muted={muted}
                                    loop={loop}
                                    controls={controls}
                                    preload={preload}
                                    refCb={(el) => {
                                        beforeVideoRef.current = el
                                    }}
                                />
                            </div>
                            {showLabels && (
                                <div
                                    style={{
                                        ...labelBase,
                                        ...labelsPos.before,
                                    }}
                                >
                                    {beforeLabel}
                                </div>
                            )}
                        </div>

                        <div style={flipBack}>
                            <div style={faceClip}>
                                <MediaLayer
                                    mediaType={mediaType}
                                    src={afterSrc}
                                    alt={mediaType === "Image" ? afterAlt : ""}
                                    fit={fit}
                                    muted={muted}
                                    loop={loop}
                                    controls={controls}
                                    preload={preload}
                                    refCb={(el) => {
                                        afterVideoRef.current = el
                                    }}
                                />
                            </div>
                            {showLabels && (
                                <div
                                    style={{ ...labelBase, ...labelsPos.after }}
                                >
                                    {afterLabel}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {ready && preset !== "3D Flip" && (
                    <>
                        <div style={layerStyle}>
                            <MediaLayer
                                mediaType={mediaType}
                                src={afterSrc}
                                alt={mediaType === "Image" ? afterAlt : ""}
                                fit={fit}
                                muted={muted}
                                loop={loop}
                                controls={controls}
                                preload={preload}
                                refCb={(el) => {
                                    afterVideoRef.current = el
                                }}
                            />
                        </div>

                        <div style={beforeStyle}>
                            <MediaLayer
                                mediaType={mediaType}
                                src={beforeSrc}
                                alt={mediaType === "Image" ? beforeAlt : ""}
                                fit={fit}
                                muted={muted}
                                loop={loop}
                                controls={controls}
                                preload={preload}
                                refCb={(el) => {
                                    beforeVideoRef.current = el
                                }}
                            />
                        </div>

                        {(handleStyle === "Line" ||
                            handleStyle === "Line + Circle") && (
                            <div style={handleLineStyle} />
                        )}
                        {(handleStyle === "Circle" ||
                            handleStyle === "Line + Circle") && (
                            <div style={handleKnobStyle} />
                        )}

                        {showLabels && (
                            <>
                                <div
                                    style={{
                                        ...labelBase,
                                        ...labelsPos.before,
                                    }}
                                >
                                    {beforeLabel}
                                </div>
                                <div
                                    style={{ ...labelBase, ...labelsPos.after }}
                                >
                                    {afterLabel}
                                </div>
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}

addPropertyControls(BeforeAfterPro, {
    media: {
        type: ControlType.Object,
        title: "Media",
        controls: {
            preset: {
                type: ControlType.Enum,
                title: "Preset",
                options: [
                    "Drag Slider",
                    "Hover Scrub",
                    "Click Toggle",
                    "Auto Loop",
                    "Scroll Reveal",
                    "3D Flip",
                ],
                defaultValue: "Drag Slider",
            },
            mediaType: {
                type: ControlType.Enum,
                title: "Type",
                options: ["Image", "Video"],
                defaultValue: "Image",
            },
            beforeImage: {
                type: ControlType.Image,
                title: "Before",
                hidden: (pp) => getMediaType(pp) !== "Image",
            },
            afterImage: {
                type: ControlType.Image,
                title: "After",
                hidden: (pp) => getMediaType(pp) !== "Image",
            },
            beforeAlt: {
                type: ControlType.String,
                title: "Before ALT",
                description: "Image alt text.",
                defaultValue: "",
                hidden: (pp) => getMediaType(pp) !== "Image",
            },
            afterAlt: {
                type: ControlType.String,
                title: "After ALT",
                description: "Image alt text.",
                defaultValue: "",
                hidden: (pp) => getMediaType(pp) !== "Image",
            },
            beforeVideo: {
                type: ControlType.File,
                title: "Before",
                allowedFileTypes: ["mp4", "webm", "mov"],
                hidden: (pp) => getMediaType(pp) !== "Video",
            },
            afterVideo: {
                type: ControlType.File,
                title: "After",
                allowedFileTypes: ["mp4", "webm", "mov"],
                hidden: (pp) => getMediaType(pp) !== "Video",
            },
            fit: {
                type: ControlType.Enum,
                title: "Fit",
                options: ["Cover", "Contain"],
                defaultValue: "Cover",
            },
            videoMuted: {
                type: ControlType.Boolean,
                title: "Muted",
                defaultValue: true,
                hidden: (pp) => getMediaType(pp) !== "Video",
            },
            videoLoop: {
                type: ControlType.Boolean,
                title: "Loop",
                defaultValue: true,
                hidden: (pp) => getMediaType(pp) !== "Video",
            },
            videoControls: {
                type: ControlType.Boolean,
                title: "Controls",
                defaultValue: false,
                hidden: (pp) => getMediaType(pp) !== "Video",
            },
            videoPreload: {
                type: ControlType.Enum,
                title: "Preload",
                options: ["none", "metadata", "auto"],
                defaultValue: "metadata",
                hidden: (pp) => getMediaType(pp) !== "Video",
            },
        },
    },

    behavior: {
        type: ControlType.Object,
        title: "Behavior",
        controls: {
            divider: {
                type: ControlType.Enum,
                title: "Divider",
                options: ["Vertical", "Horizontal"],
                defaultValue: "Vertical",
                hidden: (pp) => getPreset(pp) === "3D Flip",
            },
            startPosition: {
                type: ControlType.Number,
                title: "Start",
                min: 2,
                max: 98,
                step: 1,
                unit: "%",
                defaultValue: 50,
                hidden: (pp) => getPreset(pp) === "3D Flip",
            },
            transitionMs: {
                type: ControlType.Number,
                title: "Transition",
                min: 60,
                max: 1500,
                step: 10,
                unit: "ms",
                defaultValue: 1000,
                hidden: (pp) => getPreset(pp) !== "Click Toggle",
            },
            autoSpeed: {
                type: ControlType.Number,
                title: "Auto Speed",
                min: 0.05,
                max: 3,
                step: 0.05,
                defaultValue: 0.2,
                hidden: (pp) => getPreset(pp) !== "Auto Loop",
            },
            autoAmplitude: {
                type: ControlType.Number,
                title: "Auto Range",
                min: 5,
                max: 48,
                step: 1,
                unit: "%",
                defaultValue: 48,
                hidden: (pp) => getPreset(pp) !== "Auto Loop",
            },
            autoPauseOnHover: {
                type: ControlType.Boolean,
                title: "Pause Hover",
                defaultValue: true,
                hidden: (pp) => getPreset(pp) !== "Auto Loop",
            },
            scrollMin: {
                type: ControlType.Number,
                title: "Scroll Min",
                min: 0,
                max: 50,
                step: 1,
                unit: "%",
                defaultValue: 10,
                hidden: (pp) => getPreset(pp) !== "Scroll Reveal",
            },
            scrollMax: {
                type: ControlType.Number,
                title: "Scroll Max",
                min: 50,
                max: 100,
                step: 1,
                unit: "%",
                defaultValue: 90,
                hidden: (pp) => getPreset(pp) !== "Scroll Reveal",
            },
            flipAxis: {
                type: ControlType.Enum,
                title: "Flip Axis",
                options: ["Y", "X"],
                defaultValue: "Y",
                hidden: (pp) => getPreset(pp) !== "3D Flip",
            },
            flipPerspective: {
                type: ControlType.Number,
                title: "Perspective",
                min: 1000,
                max: 1000,
                step: 1,
                unit: "px",
                defaultValue: 1000,
                hidden: (pp) => getPreset(pp) !== "3D Flip",
            },
            flipTapToToggle: {
                type: ControlType.Boolean,
                title: "Tap Toggle",
                defaultValue: true,
                hidden: (pp) => getPreset(pp) !== "3D Flip",
            },
        },
    },

    appearance: {
        type: ControlType.Object,
        title: "Appearance",
        controls: {
            borderRadius: {
                type: ControlType.Number,
                title: "Radius",
                min: 0,
                max: 120,
                step: 1,
                unit: "px",
                defaultValue: 18,
            },
            backgroundColor: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: "rgba(18,18,18,1)",
            },
            outlineWidth: {
                type: ControlType.Number,
                title: "Outline",
                min: 0,
                max: 12,
                step: 1,
                unit: "px",
                defaultValue: 0,
            },
            outlineColor: {
                type: ControlType.Color,
                title: "Outline Color",
                defaultValue: "rgba(255,255,255,0.12)",
                hidden: (pp) => Number(pp?.appearance?.outlineWidth ?? 0) <= 0,
            },
            shadowPreset: {
                type: ControlType.Enum,
                title: "Shadow",
                options: ["None", "Soft", "Medium", "Strong", "Custom"],
                defaultValue: "None",
            },
            shadowCustom: {
                type: ControlType.String,
                title: "Shadow CSS",
                description: "CSS box-shadow value.",
                defaultValue: "",
                hidden: (pp) =>
                    String(pp?.appearance?.shadowPreset ?? "Medium") !==
                    "Custom",
            },
        },
    },

    handle: {
        type: ControlType.Object,
        title: "Handle",
        controls: {
            handleStyle: {
                type: ControlType.Enum,
                title: "Style",
                options: ["Line", "Circle", "Line + Circle"],
                defaultValue: "Line + Circle",
                hidden: (pp) => getPreset(pp) === "3D Flip",
            },
            handleColor: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: "rgba(255,255,255,0.9)",
                hidden: (pp) => getPreset(pp) === "3D Flip",
            },
            handleSize: {
                type: ControlType.Number,
                title: "Size",
                description: "Knob size, line auto scales.",
                min: 16,
                max: 140,
                step: 1,
                unit: "px",
                defaultValue: 44,
                hidden: (pp) => getPreset(pp) === "3D Flip",
            },
            useAdvancedHandleSizing: {
                type: ControlType.Boolean,
                title: "Advanced",
                defaultValue: false,
                hidden: (pp) => getPreset(pp) === "3D Flip",
            },
            dividerThickness: {
                type: ControlType.Number,
                title: "Line Size",
                min: 1,
                max: 16,
                step: 1,
                unit: "px",
                defaultValue: 2,
                hidden: (pp) =>
                    getPreset(pp) === "3D Flip" ||
                    !Boolean(pp?.handle?.useAdvancedHandleSizing) ||
                    String(pp?.handle?.handleStyle ?? "Line + Circle") ===
                        "Circle",
            },
            knobSize: {
                type: ControlType.Number,
                title: "Knob Size",
                min: 16,
                max: 160,
                step: 1,
                unit: "px",
                defaultValue: 44,
                hidden: (pp) =>
                    getPreset(pp) === "3D Flip" ||
                    !Boolean(pp?.handle?.useAdvancedHandleSizing) ||
                    String(pp?.handle?.handleStyle ?? "Line + Circle") ===
                        "Line",
            },
            handleShadowPreset: {
                type: ControlType.Enum,
                title: "Shadow",
                options: ["None", "Soft", "Medium", "Strong", "Custom"],
                defaultValue: "None",
                hidden: (pp) => getPreset(pp) === "3D Flip",
            },
            handleShadowCustom: {
                type: ControlType.String,
                title: "Shadow CSS",
                description: "CSS box-shadow value.",
                defaultValue: "",
                hidden: (pp) =>
                    getPreset(pp) === "3D Flip" ||
                    String(pp?.handle?.handleShadowPreset ?? "Medium") !==
                        "Custom",
            },
        },
    },

    labels: {
        type: ControlType.Object,
        title: "Labels",
        controls: {
            showLabels: {
                type: ControlType.Boolean,
                title: "Enabled",
                defaultValue: true,
            },
            beforeLabel: {
                type: ControlType.String,
                title: "Before",
                defaultValue: "Before",
                hidden: (pp) => !Boolean(pp?.labels?.showLabels ?? true),
            },
            afterLabel: {
                type: ControlType.String,
                title: "After",
                defaultValue: "After",
                hidden: (pp) => !Boolean(pp?.labels?.showLabels ?? true),
            },
            labelPlacement: {
                type: ControlType.Enum,
                title: "Placement",
                options: ["Top", "Bottom"],
                defaultValue: "Top",
                hidden: (pp) => !Boolean(pp?.labels?.showLabels ?? true),
            },
            labelFontSize: {
                type: ControlType.Number,
                title: "Font",
                min: 10,
                max: 24,
                step: 1,
                unit: "px",
                defaultValue: 12,
                hidden: (pp) => !Boolean(pp?.labels?.showLabels ?? true),
            },
            labelPaddingX: {
                type: ControlType.Number,
                title: "Pad X",
                min: 6,
                max: 24,
                step: 1,
                unit: "px",
                defaultValue: 10,
                hidden: (pp) => !Boolean(pp?.labels?.showLabels ?? true),
            },
            labelPaddingY: {
                type: ControlType.Number,
                title: "Pad Y",
                min: 4,
                max: 18,
                step: 1,
                unit: "px",
                defaultValue: 8,
                hidden: (pp) => !Boolean(pp?.labels?.showLabels ?? true),
            },
            labelRadius: {
                type: ControlType.Number,
                title: "Radius",
                min: 0,
                max: 999,
                step: 1,
                unit: "px",
                defaultValue: 999,
                hidden: (pp) => !Boolean(pp?.labels?.showLabels ?? true),
            },
            labelTextColor: {
                type: ControlType.Color,
                title: "Text",
                defaultValue: "rgba(255,255,255,0.92)",
                hidden: (pp) => !Boolean(pp?.labels?.showLabels ?? true),
            },
            labelBg: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: "rgba(0,0,0,0.45)",
                hidden: (pp) => !Boolean(pp?.labels?.showLabels ?? true),
            },
            labelOpacity: {
                type: ControlType.Number,
                title: "Opacity",
                min: 0,
                max: 1,
                step: 0.05,
                defaultValue: 1,
                hidden: (pp) => !Boolean(pp?.labels?.showLabels ?? true),
            },
        },
    },
    _contact: {
        type: ControlType.Link,
        title: "Need help?",
        defaultValue: "zlatkomarjanovic.zm@gmail.com",
    },
})
