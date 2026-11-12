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


type Preset = "Portfolio" | "Custom"

type Props = {
    enabled: boolean
    preset: Preset
    smoothTime: number
    maxSpeed: number
    keyboardStepLines: number
    pageJumpRatio: number
    touchEnabled: boolean
    clampToDocument: boolean
    respectReduceMotion: boolean
    showBadge: boolean
}

/** Critically damped spring (Unity-like SmoothDamp). */
function smoothDamp(
    current: number,
    target: number,
    currentVelocity: number,
    smoothTime: number,
    maxSpeed: number,
    deltaTime: number
): [number, number] {
    const EPS = 0.0001
    smoothTime = Math.max(EPS, smoothTime)
    const maxChange = maxSpeed * smoothTime
    let delta = target - current
    const originalTarget = target
    if (Math.abs(delta) > maxChange) {
        target = current + Math.sign(delta) * maxChange
    }
    const omega = 2 / smoothTime
    const x = omega * deltaTime
    const exp = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x)

    const change = current - target
    const temp = (currentVelocity + omega * change) * deltaTime
    let newVelocity = (currentVelocity - omega * temp) * exp
    let newValue = target + (change + temp) * exp

    const origToCurrent = originalTarget - current
    const newToOrig = newValue - originalTarget
    if (origToCurrent > 0 === newToOrig > 0) {
        newValue = originalTarget
        newVelocity = 0
    }
    return [newValue, newVelocity]
}

const PRESETS: Record<
    Exclude<Preset, "Custom">,
    {
        smoothTime: number // s
        maxSpeed: number // px/s
        keyboardLines: number
        pageJumpRatio: number
        clamp: boolean
    }
> = {
    // Sutileza premium, arranque e parada aveludados
    Portfolio: {
        smoothTime: 0.6,
        maxSpeed: 4500,
        keyboardLines: 1.0,
        pageJumpRatio: 0.9,
        clamp: true,
    },
}

export default function SexyScroll(props: Partial<Props>) {
    const {
        enabled = true,
        preset = "Portfolio",
        smoothTime = 0.6,
        maxSpeed = 4500,
        keyboardStepLines = 1.0,
        pageJumpRatio = 0.9,
        touchEnabled = false, // default: off (recomendado)
        clampToDocument = true,
        respectReduceMotion = true,
        showBadge = true,
    } = props

    // A11y: prefers-reduced-motion
    const prefersReduced = React.useMemo(() => {
        if (typeof window === "undefined" || typeof matchMedia === "undefined")
            return false
        try {
            return matchMedia("(prefers-reduced-motion: reduce)").matches
        } catch {
            return false
        }
    }, [])

    const cfg = React.useMemo(() => {
        if (preset !== "Custom") {
            const p = PRESETS[preset]
            return {
                smoothTime: p.smoothTime,
                maxSpeed: p.maxSpeed,
                keyboardLines: p.keyboardLines,
                pageJumpRatio: p.pageJumpRatio,
                touch: touchEnabled, // sempre controlado pela prop
                clamp: p.clamp,
            }
        }
        return {
            smoothTime,
            maxSpeed,
            keyboardLines: keyboardStepLines,
            pageJumpRatio,
            touch: touchEnabled,
            clamp: clampToDocument,
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        preset,
        smoothTime,
        maxSpeed,
        keyboardStepLines,
        pageJumpRatio,
        touchEnabled,
        clampToDocument,
    ])

    const active = enabled && !(respectReduceMotion && prefersReduced)

    // Estado físico
    const yRef = React.useRef(0)
    const vRef = React.useRef(0)
    const targetRef = React.useRef(0)
    const rafRef = React.useRef<number | null>(null)
    const lastTsRef = React.useRef<number | null>(null)

    const clampDoc = React.useCallback(
        (y: number) => {
            if (!cfg.clamp) return y
            const max = Math.max(
                0,
                document.documentElement.scrollHeight - window.innerHeight
            )
            return Math.min(Math.max(0, y), max)
        },
        [cfg.clamp]
    )

    const cancel = React.useCallback(() => {
        if (rafRef.current != null) {
            cancelAnimationFrame(rafRef.current)
            rafRef.current = null
        }
        lastTsRef.current = null
    }, [])

    const loop = React.useCallback(
        (ts: number) => {
            if (lastTsRef.current == null) lastTsRef.current = ts
            const dt = Math.max(
                0.001,
                Math.min(0.033, (ts - lastTsRef.current) / 1000)
            )
            lastTsRef.current = ts

            const current = yRef.current
            const target = clampDoc(targetRef.current)

            const [ny, nv] = smoothDamp(
                current,
                target,
                vRef.current,
                cfg.smoothTime,
                cfg.maxSpeed,
                dt
            )
            yRef.current = ny
            vRef.current = nv
            window.scrollTo(0, ny)

            // Mantém o loop leve; pronto para novos inputs
            if (Math.abs(ny - target) < 0.2 && Math.abs(nv) < 2) {
                yRef.current = target
                vRef.current = 0
                window.scrollTo(0, target)
                rafRef.current = requestAnimationFrame(loop)
                return
            }
            rafRef.current = requestAnimationFrame(loop)
        },
        [cfg.maxSpeed, cfg.smoothTime, clampDoc]
    )

    const ensureLoop = React.useCallback(() => {
        if (rafRef.current == null) {
            yRef.current = window.scrollY
            targetRef.current = window.scrollY
            rafRef.current = requestAnimationFrame(loop)
        }
    }, [loop])

    const nudge = React.useCallback(
        (deltaY: number) => {
            targetRef.current = clampDoc(targetRef.current + deltaY)
            ensureLoop()
        },
        [clampDoc, ensureLoop]
    )

    // Wheel / trackpad
    React.useEffect(() => {
        if (!active) return
        const onWheel = (e: WheelEvent) => {
            if (e.ctrlKey || e.shiftKey || e.altKey) return
            e.preventDefault()
            const factor =
                e.deltaMode === 1
                    ? 16
                    : e.deltaMode === 2
                      ? window.innerHeight
                      : 1
            const dy = e.deltaY * factor
            nudge(dy)
        }
        window.addEventListener("wheel", onWheel, { passive: false })
        return () => {
            window.removeEventListener("wheel", onWheel as any, false)
            cancel()
        }
    }, [active, nudge, cancel])

    // Teclado
    React.useEffect(() => {
        if (!active) return
        const onKey = (e: KeyboardEvent) => {
            const el = e.target as HTMLElement | null
            if (
                el &&
                (el.tagName === "INPUT" ||
                    el.tagName === "TEXTAREA" ||
                    el.isContentEditable)
            )
                return

            const line = 48 * cfg.keyboardLines
            const h = window.innerHeight * cfg.pageJumpRatio
            switch (e.code) {
                case "ArrowDown":
                    e.preventDefault()
                    nudge(line)
                    break
                case "ArrowUp":
                    e.preventDefault()
                    nudge(-line)
                    break
                case "PageDown":
                    e.preventDefault()
                    nudge(h)
                    break
                case "PageUp":
                    e.preventDefault()
                    nudge(-h)
                    break
                case "Space":
                    e.preventDefault()
                    nudge(h)
                    break
            }
        }
        window.addEventListener("keydown", onKey, { passive: false })
        return () => window.removeEventListener("keydown", onKey)
    }, [active, cfg.keyboardLines, cfg.pageJumpRatio, nudge])

    // Touch (agora disponível em qualquer modo)
    React.useEffect(() => {
        if (!active || !cfg.touch) return
        let lastY = 0
        const onTouchMove = (e: TouchEvent) => {
            if (e.touches.length !== 1) return
            const y = e.touches[0].clientY
            const dy = lastY ? lastY - y : 0
            lastY = y
            if (Math.abs(dy) > 0) {
                e.preventDefault()
                nudge(dy)
            }
        }
        const onTouchEnd = () => {
            lastY = 0
        }
        window.addEventListener("touchmove", onTouchMove, { passive: false })
        window.addEventListener("touchend", onTouchEnd, { passive: true })
        return () => {
            window.removeEventListener("touchmove", onTouchMove as any)
            window.removeEventListener("touchend", onTouchEnd as any)
        }
    }, [active, cfg.touch, nudge])

    // Sincroniza com alterações externas de scroll (ex.: hash jump)
    React.useEffect(() => {
        const onScroll = () => {
            if (!active) return
            if (rafRef.current == null) {
                yRef.current = window.scrollY
                targetRef.current = window.scrollY
            }
        }
        window.addEventListener("scroll", onScroll, { passive: true })
        return () => window.removeEventListener("scroll", onScroll)
    }, [active])

    // Badge visual
    return (
        <>
            {showBadge && (
                <div
                    style={{
                        position: "fixed",
                        top: 12,
                        left: 12,
                        zIndex: 99999,
                        pointerEvents: "none",
                        userSelect: "none",
                        fontFamily: "Inter, system-ui, sans-serif",
                        fontSize: 12,
                        padding: "6px 8px",
                        borderRadius: 8,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                        background: "rgba(20,20,20,0.85)",
                        color: "#fff",
                    }}
                >
                    Sexy Scroll (by Baco): {preset}
                    {cfg.touch ? " · Touch" : ""}
                </div>
            )}
        </>
    )
}

addPropertyControls(SexyScroll, {
    enabled: {
        type: ControlType.Boolean,
        title: "Enabled",
        description: "Turn the smooth scrolling behavior on or off.",
        defaultValue: true,
    },
    preset: {
        type: ControlType.Enum,
        title: "Preset",
        description:
            "Use a ready-made tuning (Portfolio) or switch to Custom to edit all settings.",
        defaultValue: "Portfolio",
        options: ["Portfolio", "Custom"],
        optionTitles: ["Portfolio", "Custom"],
    },
    // Custom-only knobs
    smoothTime: {
        type: ControlType.Number,
        title: "Smooth Time (s)",
        description:
            "Response time of the spring. Lower = snappier; higher = smoother.",
        defaultValue: 0.6,
        min: 0.08,
        max: 0.6,
        step: 0.01,
        displayStepper: true,
        hidden: (p: Partial<Props>) => p.preset !== "Custom",
    },
    maxSpeed: {
        type: ControlType.Number,
        title: "Max Speed (px/s)",
        description: "Caps the maximum scrolling speed in pixels per second.",
        defaultValue: 4500,
        min: 1500,
        max: 8000,
        step: 50,
        displayStepper: true,
        hidden: (p: Partial<Props>) => p.preset !== "Custom",
    },
    keyboardStepLines: {
        type: ControlType.Number,
        title: "Keyboard Lines",
        description: "How many ‘lines’ Arrow Up/Down move. (≈48px per line)",
        defaultValue: 1.0,
        min: 0.5,
        max: 3,
        step: 0.1,
        displayStepper: true,
        hidden: (p: Partial<Props>) => p.preset !== "Custom",
    },
    pageJumpRatio: {
        type: ControlType.Number,
        title: "Page Jump (×vh)",
        description:
            "Distance for PageUp/PageDown/Space as a fraction of the viewport height.",
        defaultValue: 0.9,
        min: 0.4,
        max: 1.0,
        step: 0.05,
        displayStepper: true,
        hidden: (p: Partial<Props>) => p.preset !== "Custom",
    },
    // Agora visível em qualquer preset
    touchEnabled: {
        type: ControlType.Boolean,
        title: "Enable on Touch",
        description:
            "Enable smooth scrolling on touch devices (mobile/tablet).",
        defaultValue: false,
    },
    clampToDocument: {
        type: ControlType.Boolean,
        title: "Clamp Bounds",
        description:
            "Prevents scrolling past the document bounds when using Custom.",
        defaultValue: true,
        hidden: (p: Partial<Props>) => p.preset !== "Custom",
    },
    respectReduceMotion: {
        type: ControlType.Boolean,
        title: "Respect Reduced Motion",
        description:
            "Automatically disable the effect if the user prefers reduced motion.",
        defaultValue: true,
    },
    showBadge: {
        type: ControlType.Boolean,
        title: "Show Badge",
        description:
            "Shows a small fixed badge with the active preset (useful while testing).",
        defaultValue: true,
    },
})
