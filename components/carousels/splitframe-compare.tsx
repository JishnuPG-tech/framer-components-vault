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


const DEFAULT_BEFORE =
    "https://images.unsplash.com/photo-1737291937135-3a0fcb5e0c44?auto=format&fit=crop&w=2200&q=85"
const DEFAULT_AFTER =
    "https://images.unsplash.com/photo-1553774661-0651f14b2da4?auto=format&fit=crop&w=2200&q=85"

type SplitFrameProps = {
    style?: React.CSSProperties
    beforeImage?: string
    afterImage?: string
    beforeLabel?: string
    afterLabel?: string
    beforeAlt?: string
    afterAlt?: string
    startAt?: number
    frameHeight?: number
    radius?: number
    accent?: string
    showInstructions?: boolean
}

const styles = [
    ".sf-component{height:auto;display:flex;position:relative;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;color:#fff}",
    ".sf-frame{--sf-accent:#ffffff;position:relative;width:100%;height:auto;min-height:280px;overflow:hidden;isolation:isolate;background:#17191d;cursor:col-resize;touch-action:none;user-select:none;-webkit-user-select:none;box-shadow:0 24px 80px rgba(16,18,24,.18)}",
    ".sf-image{position:absolute;inset:0;overflow:hidden}",
    ".sf-image img{display:block;height:100%;width:100%;max-width:none;object-fit:cover;object-position:center;pointer-events:none;-webkit-user-drag:none}",
    ".sf-image--before{z-index:1}",
    ".sf-image--before img{width:200%}",
    ".sf-image--after{z-index:0}",
    ".sf-image--after img{width:100%}",
    ".sf-tone{position:absolute;inset:0;z-index:2;pointer-events:none}",
    ".sf-tone--before{background:linear-gradient(90deg,rgba(40,31,24,.13),transparent 65%)}",
    ".sf-tone--after{background:linear-gradient(270deg,rgba(10,13,18,.2),transparent 70%)}",
    ".sf-bottom-fade{position:absolute;z-index:3;inset:auto 0 0;height:38%;pointer-events:none;background:linear-gradient(0deg,rgba(11,13,17,.62),transparent)}",
    ".sf-topline{position:absolute;z-index:5;top:0;left:0;right:0;display:flex;justify-content:space-between;align-items:center;padding:22px 25px;pointer-events:none}",
    ".sf-mark{display:flex;align-items:center;gap:9px;font-size:9px;line-height:1;font-weight:750;letter-spacing:.17em;text-shadow:0 1px 8px rgba(0,0,0,.22)}",
    ".sf-mark i{width:8px;height:8px;display:block;border-radius:50%;background:var(--sf-accent);box-shadow:0 0 16px var(--sf-accent)}",
    ".sf-hint{padding:8px 11px;border:1px solid rgba(255,255,255,.3);border-radius:999px;background:rgba(20,22,26,.14);backdrop-filter:blur(12px);font-size:8px;font-weight:650;letter-spacing:.12em;color:rgba(255,255,255,.92)}",
    ".sf-caption{position:absolute;z-index:5;bottom:22px;left:25px;right:25px;display:flex;justify-content:space-between;align-items:flex-end;pointer-events:none}",
    ".sf-caption-block{display:flex;flex-direction:column;gap:5px;text-shadow:0 2px 14px rgba(0,0,0,.35)}",
    ".sf-caption-block--right{text-align:right;align-items:flex-end}",
    ".sf-eyebrow{font-size:9px;line-height:1;font-weight:650;letter-spacing:.16em;color:rgba(255,255,255,.8)}",
    ".sf-title{font-size:clamp(19px,2.1vw,27px);line-height:1.08;font-weight:650;letter-spacing:-.045em;color:#fff}",
    ".sf-divider{position:absolute;z-index:6;top:0;bottom:0;width:1px;background:rgba(255,255,255,.92);box-shadow:0 0 0 1px rgba(16,18,24,.08);pointer-events:none}",
    ".sf-handle{position:absolute;z-index:7;top:50%;left:50%;width:46px;height:58px;display:grid;place-items:center;transform:translate(-50%,-50%);border:1px solid rgba(24,25,28,.08);border-radius:17px;background:rgba(255,255,255,.97);color:#24262a;box-shadow:0 6px 24px rgba(0,0,0,.2);outline:none;cursor:col-resize;touch-action:none}",
    ".sf-handle:focus-visible{box-shadow:0 0 0 4px rgba(255,255,255,.28),0 0 0 6px var(--sf-accent),0 8px 28px rgba(0,0,0,.22)}",
    ".sf-grip{display:flex;align-items:center;gap:3px}",
    ".sf-grip i{width:2px;height:17px;border-radius:2px;background:#42454b}",
    ".sf-component[data-static=true] .sf-frame{cursor:default}",
    "@media(max-width:700px){.sf-topline{padding:16px}.sf-caption{left:16px;right:16px;bottom:16px}.sf-mark{font-size:8px}.sf-hint{font-size:7px;padding:7px 9px}.sf-title{font-size:20px}.sf-eyebrow{font-size:7px}.sf-handle{width:42px;height:54px;border-radius:15px}}",
    "@media(prefers-reduced-motion:reduce){.sf-frame *{scroll-behavior:auto!important;animation-duration:.01ms!important;transition-duration:.01ms!important}}",
].join("\n")

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function SplitFrame(props: SplitFrameProps) {
    const {
        style,
        beforeImage = DEFAULT_BEFORE,
        afterImage = DEFAULT_AFTER,
        beforeLabel = "Warm finish",
        afterLabel = "Midnight finish",
        beforeAlt = "Cream over-ear headphones on a warm studio background",
        afterAlt = "Black over-ear headphones on a dark textile background",
        startAt = 50,
        frameHeight = 540,
        radius = 24,
        accent = "#ffffff",
        showInstructions = true,
    } = props

    const [position, setPosition] = React.useState(startAt)
    const [isCaptionMoving, setIsCaptionMoving] = React.useState(false)
    const frameRef = React.useRef<HTMLDivElement>(null)
    const dragging = React.useRef(false)
    const hasAnimatedOnMount = React.useRef(false)
    const introAnimationFrame = React.useRef<number | null>(null)
    const captionRestoreTimeout = React.useRef<number | null>(null)
    const isStatic = useIsStaticRenderer()
    const prefersReducedMotion =
        typeof window !== "undefined" &&
        typeof window.matchMedia === "function" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches

    const clampPosition = React.useCallback((value: number) => {
        return Math.max(2, Math.min(98, value))
    }, [])

    const cancelIntroAnimation = React.useCallback(() => {
        if (introAnimationFrame.current !== null) {
            cancelAnimationFrame(introAnimationFrame.current)
            introAnimationFrame.current = null
        }
    }, [])

    const clearCaptionRestoreTimeout = React.useCallback(() => {
        if (captionRestoreTimeout.current !== null) {
            clearTimeout(captionRestoreTimeout.current)
            captionRestoreTimeout.current = null
        }
    }, [])

    const beginCaptionMotion = React.useCallback(() => {
        clearCaptionRestoreTimeout()
        React.startTransition(() => setIsCaptionMoving(true))
    }, [clearCaptionRestoreTimeout])

    const endCaptionMotion = React.useCallback(
        (delay = 0) => {
            clearCaptionRestoreTimeout()
            if (delay <= 0 || prefersReducedMotion) {
                React.startTransition(() => setIsCaptionMoving(false))
                return
            }
            captionRestoreTimeout.current = window.setTimeout(() => {
                React.startTransition(() => setIsCaptionMoving(false))
                captionRestoreTimeout.current = null
            }, delay)
        },
        [clearCaptionRestoreTimeout, prefersReducedMotion]
    )

    React.useEffect(() => {
        const target = clampPosition(startAt)

        if (isStatic || prefersReducedMotion) {
            cancelIntroAnimation()
            React.startTransition(() => setPosition(target))
            endCaptionMotion(0)
            hasAnimatedOnMount.current = true
            return
        }

        if (hasAnimatedOnMount.current) {
            React.startTransition(() => setPosition(target))
            endCaptionMotion(0)
            return
        }

        const from = 20
        const duration = 900
        const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)
        const startTime =
            typeof performance !== "undefined" ? performance.now() : Date.now()

        beginCaptionMotion()
        React.startTransition(() => setPosition(from))

        const tick = (time: number) => {
            if (dragging.current) {
                hasAnimatedOnMount.current = true
                cancelIntroAnimation()
                return
            }

            const elapsed = time - startTime
            const progress = Math.min(1, elapsed / duration)
            const eased = easeOutCubic(progress)
            const next = from + (target - from) * eased

            React.startTransition(() => setPosition(clampPosition(next)))

            if (progress < 1) {
                introAnimationFrame.current = requestAnimationFrame(tick)
            } else {
                hasAnimatedOnMount.current = true
                introAnimationFrame.current = null
                endCaptionMotion(0)
            }
        }

        introAnimationFrame.current = requestAnimationFrame(tick)

        return () => {
            cancelIntroAnimation()
        }
    }, [
        startAt,
        isStatic,
        prefersReducedMotion,
        clampPosition,
        cancelIntroAnimation,
        beginCaptionMotion,
        endCaptionMotion,
    ])

    React.useEffect(() => {
        return () => {
            cancelIntroAnimation()
            clearCaptionRestoreTimeout()
        }
    }, [cancelIntroAnimation, clearCaptionRestoreTimeout])

    const updateFromPointer = React.useCallback((clientX: number) => {
        const frame = frameRef.current
        if (!frame) return
        const bounds = frame.getBoundingClientRect()
        const next = ((clientX - bounds.left) / bounds.width) * 100
        React.startTransition(() => setPosition(clampPosition(next)))
    }, [clampPosition])

    const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
        if (isStatic) return
        hasAnimatedOnMount.current = true
        cancelIntroAnimation()
        beginCaptionMotion()
        dragging.current = true
        event.currentTarget.setPointerCapture(event.pointerId)
        updateFromPointer(event.clientX)
    }

    const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
        if (dragging.current) updateFromPointer(event.clientX)
    }

    const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
        dragging.current = false
        endCaptionMotion(0)
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId)
        }
    }

    const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        hasAnimatedOnMount.current = true
        cancelIntroAnimation()
        let handled = false
        const step = event.shiftKey ? 10 : 2
        if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
            event.preventDefault()
            handled = true
            beginCaptionMotion()
            React.startTransition(() =>
                setPosition((value) => clampPosition(value - step))
            )
        } else if (event.key === "ArrowRight" || event.key === "ArrowUp") {
            event.preventDefault()
            handled = true
            beginCaptionMotion()
            React.startTransition(() =>
                setPosition((value) => clampPosition(value + step))
            )
        } else if (event.key === "Home") {
            event.preventDefault()
            handled = true
            beginCaptionMotion()
            React.startTransition(() => setPosition(2))
        } else if (event.key === "End") {
            event.preventDefault()
            handled = true
            beginCaptionMotion()
            React.startTransition(() => setPosition(98))
        }
        if (handled) {
            endCaptionMotion(220)
        }
    }

    const beforeWidth = String(10000 / position) + "%"
    const captionOpacity = isCaptionMoving ? 0 : 1
    const captionTransition = prefersReducedMotion
        ? "none"
        : "opacity 220ms ease"
    const legacyHeightProp = (props as { height?: unknown }).height
    const rawFrameHeight =
        typeof frameHeight === "number" ? frameHeight : Number(legacyHeightProp)
    const validatedFrameHeight = Number.isFinite(rawFrameHeight)
        ? Math.max(280, rawFrameHeight)
        : 540
    const splitStyle = {
        ...style,
        "--sf-accent": accent,
        width: style?.width ?? "100%",
        maxWidth: style?.maxWidth ?? "100%",
        height: style?.height ?? "auto",
        display: style?.display ?? "flex",
    } as React.CSSProperties

    return (
        <>
            <style>{styles}</style>
            <div
                className="sf-component"
                data-static={isStatic ? "true" : "false"}
                style={splitStyle}
            >
                <div
                    className="sf-frame"
                    ref={frameRef}
                    style={{
                        borderRadius: radius + "px",
                        height: validatedFrameHeight + "px",
                    }}
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    onPointerCancel={onPointerUp}
                >
                    <div
                        className="sf-image sf-image--after"
                        style={{ clipPath: "inset(0 0 0 " + position + "%)" }}
                    >
                        <img
                            src={afterImage}
                            alt={afterAlt}
                            draggable={false}
                        />
                        <div className="sf-tone sf-tone--after" />
                    </div>
                    <div
                        className="sf-image sf-image--before"
                        style={{ width: position + "%" }}
                    >
                        <img
                            src={beforeImage}
                            alt={beforeAlt}
                            draggable={false}
                            style={{ width: beforeWidth }}
                        />
                        <div className="sf-tone sf-tone--before" />
                    </div>
                    <div
                        className="sf-divider"
                        aria-hidden="true"
                        style={{ left: position + "%" }}
                    />
                    <div className="sf-topline">
                        <div className="sf-mark">
                            <i />
                            SPLITFRAME / 01
                        </div>
                        {showInstructions && (
                            <div className="sf-hint">DRAG TO COMPARE</div>
                        )}
                    </div>
                    <div className="sf-caption">
                        <div
                            className="sf-caption-block"
                            style={{
                                opacity: captionOpacity,
                                transition: captionTransition,
                            }}
                        >
                            <span className="sf-eyebrow">BEFORE</span>
                            <span className="sf-title">{beforeLabel}</span>
                        </div>
                        <div
                            className="sf-caption-block sf-caption-block--right"
                            style={{
                                opacity: captionOpacity,
                                transition: captionTransition,
                            }}
                        >
                            <span className="sf-eyebrow">AFTER</span>
                            <span className="sf-title">{afterLabel}</span>
                        </div>
                    </div>
                    <div
                        className="sf-handle"
                        role="slider"
                        tabIndex={0}
                        aria-label="Image comparison position"
                        aria-orientation="horizontal"
                        aria-valuemin={2}
                        aria-valuemax={98}
                        aria-valuenow={Math.round(position)}
                        aria-valuetext={
                            Math.round(position) + "% before image visible"
                        }
                        style={{ left: position + "%" }}
                        onKeyDown={onKeyDown}
                    >
                        <span className="sf-grip" aria-hidden="true">
                            <i />
                            <i />
                            <i />
                        </span>
                    </div>
                </div>
            </div>
        </>
    )
}

SplitFrame.defaultProps = {
    width: 1180,
    frameHeight: 540,
    beforeImage: DEFAULT_BEFORE,
    afterImage: DEFAULT_AFTER,
    beforeLabel: "Warm finish",
    afterLabel: "Midnight finish",
    beforeAlt: "Cream over-ear headphones on a warm studio background",
    afterAlt: "Black over-ear headphones on a dark textile background",
    startAt: 50,
    radius: 24,
    accent: "#ffffff",
    showInstructions: true,
}

addPropertyControls(SplitFrame, {
    beforeImage: { type: ControlType.Image, title: "Before image" },
    afterImage: { type: ControlType.Image, title: "After image" },
    beforeLabel: {
        type: ControlType.String,
        title: "Before label",
        defaultValue: "Warm finish",
    },
    afterLabel: {
        type: ControlType.String,
        title: "After label",
        defaultValue: "Midnight finish",
    },
    beforeAlt: {
        type: ControlType.String,
        title: "Before alt text",
        defaultValue: "Cream over-ear headphones on a warm studio background",
    },
    afterAlt: {
        type: ControlType.String,
        title: "After alt text",
        defaultValue: "Black over-ear headphones on a dark textile background",
    },
    startAt: {
        type: ControlType.Number,
        title: "Start split",
        min: 5,
        max: 95,
        step: 1,
        unit: "%",
    },
    frameHeight: {
        type: ControlType.Number,
        title: "Height",
        min: 280,
        max: 900,
        step: 10,
        unit: "px",
    },
    radius: {
        type: ControlType.Number,
        title: "Corner radius",
        min: 0,
        max: 40,
        step: 2,
        unit: "px",
    },
    accent: { type: ControlType.Color, title: "Accent" },
    showInstructions: {
        type: ControlType.Boolean,
        title: "Show hint",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
})
