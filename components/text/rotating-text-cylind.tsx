import * as React from "react"
import { useState, useRef, useEffect } from "react"
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
 * Rotating Cylinder Menu
 *
 * @framerIntrinsicWidth 280
 * @framerIntrinsicHeight 360
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */

const DEFAULTS = {
    behavior: {
        mode: "drag",
        loop: false,
        startIndex: 2,
        smoothness: 9,
        scrollSensitivity: 1,
        autoInterval: 2,
        autoDuration: 0.9,
        autoSmoothness: 2,
        autoDirection: "up",
        pauseOnHover: true,
    },
    colors: {
        active: "#111111",
        inactive: "#8a8a8a",
    },
    cylinder: {
        itemHeight: 56,
        gap: 0,
        curve: 32,
        perspective: 900,
        visibleItems: 5,
        blur: 0.8,
    },
    indicator: {
        show: false,
        color: "rgba(0,0,0,0.12)",
    },
    link: {
        openInNewTab: false,
    },
}

const isFit = (v: any) =>
    v === undefined ||
    v === null ||
    v === "auto" ||
    v === "fit-content" ||
    v === "min-content" ||
    v === "max-content"

export default function RotatingCylinderMenu(props) {
    const { items, font, style } = props
    const behavior = { ...DEFAULTS.behavior, ...(props.behavior || {}) }
    const colors = { ...DEFAULTS.colors, ...(props.colors || {}) }
    const cylinder = { ...DEFAULTS.cylinder, ...(props.cylinder || {}) }
    const indicator = { ...DEFAULTS.indicator, ...(props.indicator || {}) }
    const link = { ...DEFAULTS.link, ...(props.link || {}) }

    const { mode, startIndex, smoothness, scrollSensitivity } = behavior
    const { autoInterval, autoDuration, autoSmoothness } = behavior
    const { autoDirection, pauseOnHover } = behavior
    const activeColor = colors.active
    const inactiveColor = colors.inactive

    const fontSize = parseFloat(String(font?.fontSize ?? 32)) || 32
    const align = font?.textAlign || "left"
    const { itemHeight, gap, curve, perspective, visibleItems, blur } = cylinder

    const pitch = Math.max(8, itemHeight + (gap || 0))

    const loop = behavior.loop || mode === "auto"

    const list: { label: string; link?: string }[] =
        Array.isArray(items) && items.length ? items : []
    const n = list.length

    const fitW = isFit(style?.width)
    const fitH = isFit(style?.height)

    const mod = (a: number, m: number) => ((a % m) + m) % m
    const clampT = (t: number) => (loop ? t : Math.max(0, Math.min(n - 1, t)))

    const initial = Math.max(0, Math.min(Math.max(n - 1, 0), startIndex || 0))

    const [pos, setPos] = useState(initial)
    const posRef = useRef(initial)
    const targetRef = useRef(initial)
    const raf = useRef(0)
    const lastTime = useRef(0)
    const wheelTimer = useRef<any>(null)
    const boxRef = useRef<HTMLDivElement>(null)
    const pausedRef = useRef(false)

    const tweenRef = useRef<{
        from: number
        to: number
        start: number
        duration: number
        power: number
    } | null>(null)
    const drag = useRef({
        down: false,
        startY: 0,
        startPos: 0,
        moved: false,
        captured: false,
    })
    const [reduceMotion, setReduceMotion] = useState(false)

    const isStatic = useIsStaticRenderer()

    const [inView, setInView] = useState(true)
    const inViewRef = useRef(true)

    useEffect(() => {
        const el = boxRef.current
        if (isStatic || !el || typeof IntersectionObserver === "undefined")
            return
        const io = new IntersectionObserver(
            ([entry]) => {
                inViewRef.current = entry.isIntersecting
                setInView(entry.isIntersecting)
            },
            { threshold: 0.01 }
        )
        io.observe(el)
        return () => io.disconnect()
    }, [isStatic, n])

    useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
        setReduceMotion(mq.matches)
        const onChange = () => setReduceMotion(mq.matches)
        mq.addEventListener?.("change", onChange)
        return () => mq.removeEventListener?.("change", onChange)
    }, [])

    useEffect(() => () => cancelAnimationFrame(raf.current), [])

    useEffect(() => {
        const t = Math.max(0, Math.min(Math.max(n - 1, 0), startIndex || 0))
        targetRef.current = t
        posRef.current = t
        setPos(t)
    }, [n, startIndex])

    const tickRef = useRef<(now: number) => void>(() => {})
    const loopFrame = (now: number) => tickRef.current(now)

    tickRef.current = (now: number) => {
        const dt = Math.min(0.05, (now - lastTime.current) / 1000)
        lastTime.current = now

        if (!inViewRef.current) {
            tweenRef.current = null
            posRef.current = targetRef.current
            setPos(posRef.current)
            raf.current = 0
            return
        }

        const tw = tweenRef.current
        if (tw) {
            const t = Math.min(1, (now - tw.start) / (tw.duration * 1000))

            const k = tw.power
            const e =
                t < 0.5
                    ? 0.5 * Math.pow(2 * t, k)
                    : 1 - 0.5 * Math.pow(2 - 2 * t, k)
            posRef.current = reduceMotion
                ? tw.to
                : tw.from + (tw.to - tw.from) * e
            setPos(posRef.current)
            if (t >= 1 || reduceMotion) {
                posRef.current = tw.to
                setPos(tw.to)
                tweenRef.current = null
                raf.current = 0
                return
            }
            raf.current = requestAnimationFrame(loopFrame)
            return
        }

        const diff = targetRef.current - posRef.current
        if (Math.abs(diff) < 0.002 || reduceMotion) {
            posRef.current = targetRef.current
            setPos(posRef.current)
            raf.current = 0
            return
        }
        posRef.current += diff * (1 - Math.exp(-dt * smoothness))
        setPos(posRef.current)
        raf.current = requestAnimationFrame(loopFrame)
    }

    const kick = () => {
        if (raf.current) return
        lastTime.current = performance.now()
        raf.current = requestAnimationFrame(loopFrame)
    }

    const setTarget = (t: number) => {
        tweenRef.current = null
        targetRef.current = clampT(t)
        kick()
    }

    useEffect(() => {
        if (isStatic || !inView || mode !== "auto" || n < 2) return
        const id = setInterval(
            () => {
                if (pausedRef.current || drag.current.down) return
                const dir = autoDirection === "down" ? -1 : 1
                const to = Math.round(targetRef.current) + dir
                targetRef.current = to
                tweenRef.current = {
                    from: posRef.current,
                    to,
                    start: performance.now(),
                    power: Math.max(1, autoSmoothness),
                    duration: Math.min(
                        Math.max(0.1, autoDuration),
                        Math.max(0.3, autoInterval)
                    ),
                }
                kick()
            },
            Math.max(0.3, autoInterval) * 1000
        )
        return () => clearInterval(id)
    }, [
        isStatic,
        inView,
        mode,
        n,
        autoInterval,
        autoDuration,
        autoSmoothness,
        autoDirection,
        loop,
    ])

    const pause = () => {
        pausedRef.current = true
    }
    const resume = () => {
        pausedRef.current = false
    }

    useEffect(() => {
        const el = boxRef.current
        if (isStatic || !el || mode !== "scroll") return
        const onWheel = (e: WheelEvent) => {
            if (n < 2) return
            const dy = e.deltaY
            const atEnd =
                !loop &&
                ((dy > 0 && targetRef.current >= n - 1) ||
                    (dy < 0 && targetRef.current <= 0))
            if (atEnd) return
            e.preventDefault()
            setTarget(targetRef.current + dy * 0.01 * scrollSensitivity)
            clearTimeout(wheelTimer.current)
            wheelTimer.current = setTimeout(() => {
                setTarget(Math.round(targetRef.current))
            }, 110)
        }
        el.addEventListener("wheel", onWheel, { passive: false })
        return () => {
            el.removeEventListener("wheel", onWheel)
            clearTimeout(wheelTimer.current)
        }
    }, [isStatic, mode, loop, n, scrollSensitivity])

    const canDrag = (e: React.PointerEvent) =>
        mode !== "scroll" || e.pointerType !== "mouse"

    const onPointerDown = (e: React.PointerEvent) => {
        if (!canDrag(e)) return
        if (tweenRef.current) {
            tweenRef.current = null
            targetRef.current = posRef.current
        }
        drag.current = {
            down: true,
            startY: e.clientY,
            startPos: targetRef.current,
            moved: false,
            captured: false,
        }
    }

    const onPointerMove = (e: React.PointerEvent) => {
        if (n < 2 || !drag.current.down) return
        const dy = e.clientY - drag.current.startY
        if (!drag.current.moved && Math.abs(dy) > 5) {
            drag.current.moved = true
            if (!drag.current.captured) {
                try {
                    ;(e.currentTarget as HTMLElement).setPointerCapture(
                        e.pointerId
                    )
                    drag.current.captured = true
                } catch (_) {}
            }
        }
        if (drag.current.moved) {
            setTarget(drag.current.startPos - dy / pitch)
        }
    }

    const onPointerUp = (e: React.PointerEvent) => {
        if (!drag.current.down) return
        drag.current.down = false
        if (drag.current.captured) {
            try {
                ;(e.currentTarget as HTMLElement).releasePointerCapture(
                    e.pointerId
                )
            } catch (_) {}
        }
        if (drag.current.moved) setTarget(Math.round(targetRef.current))
    }

    const activeIdx = n ? mod(Math.round(pos), n) : 0

    const goTo = (i: number) => {
        if (loop) {
            const cur = Math.round(targetRef.current)
            const delta = mod(i - cur + n / 2, n) - n / 2
            setTarget(cur + delta)
        } else {
            setTarget(i)
        }
    }

    const openLink = (href?: string) => {
        if (!href) return
        if (link.openInNewTab) window.open(href, "_blank", "noopener")
        else window.location.href = href
    }

    const onKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "ArrowDown" || e.key === "ArrowRight") {
            e.preventDefault()
            setTarget(Math.round(targetRef.current) + 1)
        } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
            e.preventDefault()
            setTarget(Math.round(targetRef.current) - 1)
        } else if (e.key === "Enter") {
            openLink(list[activeIdx]?.link)
        }
    }

    const justify =
        align === "center"
            ? "center"
            : align === "right" || align === "end"
              ? "flex-end"
              : "flex-start"

    const stepRad = (Math.max(curve, 1) * Math.PI) / 180
    const R = pitch / stepRad
    const fadeRange = Math.max(visibleItems, 1) / 2 + 0.5

    if (!n) {
        return (
            <div
                style={{
                    ...style,
                    width: fitW ? "max-content" : "100%",
                    height: fitH ? pitch * visibleItems : "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "rgba(128,128,128,0.8)",
                    fontFamily: "Inter, sans-serif",
                    fontSize: 13,
                }}
            >
                Add menu items
            </div>
        )
    }

    return (
        <div
            ref={boxRef}
            role="listbox"
            aria-label="Menu"
            aria-activedescendant={`rcm-item-${activeIdx}`}
            tabIndex={0}
            onKeyDown={onKeyDown}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onPointerEnter={(e) => {
                if (
                    mode === "auto" &&
                    pauseOnHover &&
                    e.pointerType === "mouse"
                )
                    pause()
            }}
            onPointerLeave={(e) => {
                if (
                    mode === "auto" &&
                    pauseOnHover &&
                    e.pointerType === "mouse"
                )
                    resume()
            }}
            onFocus={() => mode === "auto" && pause()}
            onBlur={() => mode === "auto" && resume()}
            style={{
                ...style,
                position: "relative",
                width: fitW ? "max-content" : "100%",
                height: fitH ? pitch * visibleItems : "100%",
                overflow: "hidden",
                perspective,
                perspectiveOrigin: "50% 50%",
                touchAction: "pan-x",
                outline: "none",
                userSelect: "none",
                WebkitUserSelect: "none",
            }}
        >
            {fitW && (
                <div
                    aria-hidden="true"
                    style={{
                        display: "grid",
                        height: 0,
                        overflow: "hidden",
                        visibility: "hidden",
                        pointerEvents: "none",
                    }}
                >
                    {list.map((item, i) => (
                        <span
                            key={i}
                            style={{
                                gridArea: "1 / 1",
                                padding: "0 4px",
                                whiteSpace: "nowrap",
                                ...font,
                                fontSize,
                                lineHeight: 1,
                            }}
                        >
                            {item.label}
                        </span>
                    ))}
                </div>
            )}

            {indicator.show && (
                <>
                    <div
                        aria-hidden="true"
                        style={{
                            position: "absolute",
                            left: 0,
                            right: 0,
                            top: `calc(50% - ${itemHeight / 2}px)`,
                            height: 1,
                            background: indicator.color,
                            pointerEvents: "none",
                        }}
                    />
                    <div
                        aria-hidden="true"
                        style={{
                            position: "absolute",
                            left: 0,
                            right: 0,
                            top: `calc(50% + ${itemHeight / 2}px)`,
                            height: 1,
                            background: indicator.color,
                            pointerEvents: "none",
                        }}
                    />
                </>
            )}

            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    transformStyle: "preserve-3d",
                }}
            >
                {list.map((item, i) => {
                    const raw = i - pos
                    const d = loop ? mod(raw + n / 2, n) - n / 2 : raw
                    const theta = d * curve
                    const hidden = Math.abs(theta) > 88
                    const rad = (theta * Math.PI) / 180
                    const y = R * Math.sin(rad)
                    const z = R * Math.cos(rad) - R
                    const absD = Math.abs(d)
                    const opacity = hidden
                        ? 0
                        : Math.pow(Math.max(0, 1 - absD / fadeRange), 1.3)
                    const isActive = i === activeIdx

                    const common: any = {
                        id: `rcm-item-${i}`,
                        role: "option",
                        "aria-selected": isActive,
                        onClick: (e: React.MouseEvent) => {
                            if (drag.current.moved) {
                                e.preventDefault()
                                drag.current.moved = false
                                return
                            }
                            if (!isActive) {
                                e.preventDefault()
                                goTo(i)
                            }
                        },
                        style: {
                            position: "absolute",
                            left: 0,
                            right: 0,
                            top: "50%",
                            height: itemHeight,
                            marginTop: -itemHeight / 2,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: justify,
                            padding: "0 4px",
                            boxSizing: "border-box",
                            ...font,
                            fontSize,
                            lineHeight: 1,
                            whiteSpace: "nowrap",
                            textDecoration: "none",
                            color: isActive ? activeColor : inactiveColor,
                            transition:
                                reduceMotion || isStatic
                                    ? "none"
                                    : "color 0.2s ease",
                            transform: `translateY(${y}px) translateZ(${z}px) rotateX(${-theta}deg)`,
                            opacity,
                            filter:
                                blur > 0 && absD > 0.05
                                    ? `blur(${Math.min(absD, 2) * blur}px)`
                                    : "none",
                            visibility: hidden ? "hidden" : "visible",
                            pointerEvents:
                                hidden || opacity < 0.08 ? "none" : "auto",
                            cursor: "pointer",
                            backfaceVisibility: "hidden",
                            WebkitBackfaceVisibility: "hidden",
                            willChange: "transform, opacity",
                        },
                    }

                    return item.link ? (
                        <a
                            key={i}
                            {...common}
                            href={item.link}
                            target={link.openInNewTab ? "_blank" : undefined}
                            rel={
                                link.openInNewTab
                                    ? "noopener noreferrer"
                                    : undefined
                            }
                            draggable={false}
                            tabIndex={-1}
                        >
                            {item.label}
                        </a>
                    ) : (
                        <div key={i} {...common}>
                            {item.label}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

RotatingCylinderMenu.defaultProps = {
    items: [
        { label: "Home", link: "" },
        { label: "Services", link: "" },
        { label: "Portfolio", link: "" },
        { label: "Team", link: "" },
        { label: "Blog", link: "" },
        { label: "Contact", link: "" },
    ],
    behavior: DEFAULTS.behavior,
    colors: DEFAULTS.colors,
    cylinder: DEFAULTS.cylinder,
    indicator: DEFAULTS.indicator,
    link: DEFAULTS.link,
}

addPropertyControls(RotatingCylinderMenu, {
    items: {
        type: ControlType.Array,
        title: "Items",
        control: {
            type: ControlType.Object,
            controls: {
                label: {
                    type: ControlType.String,
                    title: "Label",
                    defaultValue: "Menu",
                },
                link: {
                    type: ControlType.Link,
                    title: "Link",
                },
            },
        },
        defaultValue: [
            { label: "Home" },
            { label: "Services" },
            { label: "Portfolio" },
            { label: "Team" },
            { label: "Blog" },
            { label: "Contact" },
        ],
    },

    behavior: {
        type: ControlType.Object,
        title: "Behavior",
        controls: {
            mode: {
                type: ControlType.Enum,
                title: "Mode",
                options: ["drag", "scroll", "auto"],
                optionTitles: ["Drag", "Scroll", "Auto"],
                defaultValue: "drag",
                displaySegmentedControl: true,
            },
            loop: {
                type: ControlType.Boolean,
                title: "Loop",
                defaultValue: false,
                hidden: (p) => p.mode === "auto",
            },
            startIndex: {
                type: ControlType.Number,
                title: "Start Item",
                min: 0,
                max: 30,
                step: 1,
                displayStepper: true,
                defaultValue: 2,
            },
            smoothness: {
                type: ControlType.Number,
                title: "Smoothness",
                min: 2,
                max: 20,
                step: 0.5,
                defaultValue: 9,
                hidden: (p) => p.mode === "auto",
            },
            scrollSensitivity: {
                type: ControlType.Number,
                title: "Sensitivity",
                min: 0.2,
                max: 3,
                step: 0.1,
                defaultValue: 1,
                hidden: (p) => p.mode !== "scroll",
            },
            autoInterval: {
                type: ControlType.Number,
                title: "Interval",
                min: 0.5,
                max: 10,
                step: 0.1,
                defaultValue: 2,
                unit: "s",
                hidden: (p) => p.mode !== "auto",
            },
            autoDuration: {
                type: ControlType.Number,
                title: "Duration",
                min: 0.2,
                max: 3,
                step: 0.05,
                defaultValue: 0.9,
                unit: "s",
                hidden: (p) => p.mode !== "auto",
            },
            autoSmoothness: {
                type: ControlType.Number,
                title: "Smoothness",
                min: 1,
                max: 6,
                step: 0.1,
                defaultValue: 2,
                hidden: (p) => p.mode !== "auto",
            },
            autoDirection: {
                type: ControlType.Enum,
                title: "Direction",
                options: ["up", "down"],
                optionTitles: ["Up", "Down"],
                defaultValue: "up",
                displaySegmentedControl: true,
                hidden: (p) => p.mode !== "auto",
            },
            pauseOnHover: {
                type: ControlType.Boolean,
                title: "Pause on Hover",
                defaultValue: true,
                hidden: (p) => p.mode !== "auto",
            },
        },
    },

    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "32px",
            fontWeight: 600,
            textAlign: "left",
        },
    },

    colors: {
        type: ControlType.Object,
        title: "Colors",
        controls: {
            active: {
                type: ControlType.Color,
                title: "Active",
                defaultValue: "#111111",
            },
            inactive: {
                type: ControlType.Color,
                title: "Inactive",
                defaultValue: "#8a8a8a",
            },
        },
    },

    cylinder: {
        type: ControlType.Object,
        title: "Cylinder",
        controls: {
            itemHeight: {
                type: ControlType.Number,
                title: "Item Height",
                min: 24,
                max: 160,
                step: 1,
                defaultValue: 56,
                unit: "px",
            },
            gap: {
                type: ControlType.Number,
                title: "Gap",
                min: 0,
                max: 80,
                step: 1,
                defaultValue: 0,
                unit: "px",
            },
            curve: {
                type: ControlType.Number,
                title: "Curve",
                min: 10,
                max: 60,
                step: 1,
                defaultValue: 32,
                unit: "°",
            },
            perspective: {
                type: ControlType.Number,
                title: "Perspective",
                min: 300,
                max: 2500,
                step: 50,
                defaultValue: 900,
                unit: "px",
            },
            visibleItems: {
                type: ControlType.Number,
                title: "Visible Items",
                min: 1,
                max: 9,
                step: 1,
                displayStepper: true,
                defaultValue: 5,
            },
            blur: {
                type: ControlType.Number,
                title: "Blur",
                min: 0,
                max: 4,
                step: 0.1,
                defaultValue: 0.8,
                unit: "px",
            },
        },
    },

    indicator: {
        type: ControlType.Object,
        title: "Indicator",
        controls: {
            show: {
                type: ControlType.Boolean,
                title: "Show Lines",
                defaultValue: false,
            },
            color: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: "rgba(0,0,0,0.12)",
                hidden: (p) => !p.show,
            },
        },
    },

    link: {
        type: ControlType.Object,
        title: "Link",
        controls: {
            openInNewTab: {
                type: ControlType.Boolean,
                title: "New Tab",
                defaultValue: false,
            },
        },
    },
})
