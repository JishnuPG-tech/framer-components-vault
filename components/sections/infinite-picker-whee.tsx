// Made with 💛 by Karim Saif
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


type Project = {
    title: string
    image: string
    category: string
    location: string
    year: string
    position: string
    link: string
}

type Props = {
    projects: Project[]
    heading: string
    description: string
    background: string
    textColor: string
    inactiveColor: string
    wheelRadius: number
    angleStep: number
    perspective: number
    visibleItems: number
    itemSpacing: number
    activeSize: number
    inactiveScale: number
    fadeStrength: number
    scrollSensitivity: number
    dragSensitivity: number
    momentum: number
    friction: number
    snapStrength: number
    springStiffness: number
    rotationSpeed: number
    infinite: boolean
    mouseInteraction: boolean
    touchInteraction: boolean
    wheelDirection: string
    imageRadius: number
    imageRatio: number
    imageTransition: number
    imageSlide: number
    gradient: number
    gap: number
    padding: number
    showHeading: boolean
    showMetadata: boolean
    showCounter: boolean
    autoplay: boolean
    autoplayInterval: number
    pauseOnHover: boolean
    initialIndex: number
    font: any
    headingFont: any
    style?: React.CSSProperties
}

const DEMOS: Project[] = [
    {
        title: "Window Bar",
        image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1000&q=85",
        category: "Interior",
        location: "Copenhagen",
        year: "2026",
        position: "center",
        link: "",
    },
    {
        title: "Stair Kitchen",
        image: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1000&q=85",
        category: "Architecture",
        location: "Oslo",
        year: "2025",
        position: "center",
        link: "",
    },
    {
        title: "Double Height",
        image: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=1000&q=85",
        category: "Residential",
        location: "Stockholm",
        year: "2026",
        position: "center",
        link: "",
    },
    {
        title: "Sun Stair",
        image: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=1000&q=85",
        category: "Architecture",
        location: "Lisbon",
        year: "2024",
        position: "center",
        link: "",
    },
    {
        title: "Basket Wall",
        image: "https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=1000&q=85",
        category: "Interior",
        location: "Paris",
        year: "2025",
        position: "center",
        link: "",
    },
    {
        title: "Plant Desk",
        image: "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=1000&q=85",
        category: "Workspace",
        location: "Berlin",
        year: "2026",
        position: "center",
        link: "",
    },
    {
        title: "Quiet Dining",
        image: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=1000&q=85",
        category: "Hospitality",
        location: "Milan",
        year: "2025",
        position: "center",
        link: "",
    },
    {
        title: "Stripe Hall",
        image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1000&q=85",
        category: "Residential",
        location: "London",
        year: "2024",
        position: "center",
        link: "",
    },
    {
        title: "Linen Lounge",
        image: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1000&q=85",
        category: "Interior",
        location: "Tokyo",
        year: "2026",
        position: "center",
        link: "",
    },
]

const mod = (n: number, length: number) => ((n % length) + length) % length
const clamp = (n: number, lo: number, hi: number) =>
    Math.min(hi, Math.max(lo, n))

export default function KarimSaifInfinitePickerWheel(props: Props) {
    const {
        heading,
        description,
        background,
        textColor,
        inactiveColor,
        wheelRadius,
        angleStep,
        perspective,
        visibleItems,
        itemSpacing,
        activeSize,
        inactiveScale,
        fadeStrength,
        scrollSensitivity,
        dragSensitivity,
        momentum,
        friction,
        snapStrength,
        springStiffness,
        rotationSpeed,
        infinite,
        mouseInteraction,
        touchInteraction,
        wheelDirection,
        imageRadius,
        imageRatio,
        imageTransition,
        imageSlide,
        gradient,
        gap,
        padding,
        showHeading,
        showMetadata,
        showCounter,
        autoplay,
        autoplayInterval,
        pauseOnHover,
        initialIndex,
        font,
        headingFont,
        style,
    } = props

    const projects = props.projects?.length ? props.projects : DEMOS
    const count = projects.length
    const staticMode = useIsStaticRenderer()

    const [reduced, setReduced] = React.useState(false)
    const [visible, setVisible] = React.useState(true)
    const [pageVisible, setPageVisible] = React.useState(true)
    const [hovered, setHovered] = React.useState(false)
    const [selected, setSelected] = React.useState(mod(initialIndex, count))
    const [incomingReady, setIncomingReady] = React.useState(true)
    const [displayed, setDisplayed] = React.useState(mod(initialIndex, count))
    const [previous, setPrevious] = React.useState<number | null>(null)
    const [transitionDirection, setTransitionDirection] = React.useState(1)
    const [transitionStarted, setTransitionStarted] = React.useState(false)

    const root = React.useRef<HTMLDivElement>(null)
    const wheel = React.useRef<HTMLDivElement>(null)
    const position = React.useRef(initialIndex)
    const target = React.useRef(initialIndex)
    const velocity = React.useRef(0)

    const dragging = React.useRef<{
        y: number
        t: number
        moved: boolean
        pointer: number
    } | null>(null)

    const ignoreClickUntil = React.useRef(0)
    const frame = React.useRef<number | null>(null)
    const lastTime = React.useRef(0)
    const lastInput = React.useRef(0)
    const direction = React.useRef(1)
    const nodes = React.useRef(new Map<number, HTMLButtonElement>())
    const lastSelection = React.useRef(mod(initialIndex, count))
    const reducedRef = React.useRef(false)
    const selectedRef = React.useRef(mod(initialIndex, count))

    const imageTransitionTimer = React.useRef<ReturnType<
        typeof setTimeout
    > | null>(null)

    const transitionFrame = React.useRef<number | null>(null)

    const activeAnimation = !staticMode && !reduced && visible && pageVisible

    const wheelHeight = Math.max(
        250,
        Math.min(530, wheelRadius * 2 + activeSize * 2)
    )

    const stepRadians = (angleStep * Math.PI) / 180
    const halfCount = Math.max(2, Math.floor(visibleItems / 2) + 2)
    const wheelSign = wheelDirection === "Reverse" ? -1 : 1

    const image = projects[displayed] || projects[0]
    const activeProject = projects[selected] || projects[0]

    React.useEffect(() => {
        if (staticMode || typeof window === "undefined") return

        const query = window.matchMedia("(prefers-reduced-motion: reduce)")
        const update = () => setReduced(query.matches)

        update()
        query.addEventListener?.("change", update)

        return () => query.removeEventListener?.("change", update)
    }, [staticMode])

    React.useEffect(() => {
        reducedRef.current = reduced || staticMode
    }, [reduced, staticMode])

    React.useEffect(() => {
        const element = root.current

        if (
            !element ||
            staticMode ||
            typeof IntersectionObserver === "undefined"
        )
            return

        const observer = new IntersectionObserver(
            ([entry]) => setVisible(entry.isIntersecting),
            { threshold: 0.01 }
        )

        observer.observe(element)

        return () => observer.disconnect()
    }, [staticMode])

    React.useEffect(() => {
        if (staticMode || typeof document === "undefined") return

        const update = () => setPageVisible(!document.hidden)

        document.addEventListener("visibilitychange", update)

        return () => document.removeEventListener("visibilitychange", update)
    }, [staticMode])

    const setWheelTransforms = React.useCallback(
        (p: number) => {
            const nearest = Math.round(p)
            const span = halfCount
            const r = Math.max(25, wheelRadius)
            const spacing = itemSpacing / Math.max(1, r * stepRadians)

            for (const [slot, el] of nodes.current) {
                let diff = slot - p

                if (!infinite && (slot < 0 || slot >= count)) {
                    el.style.visibility = "hidden"
                    continue
                }

                if (Math.abs(diff) > span + 1) {
                    el.style.visibility = "hidden"
                    continue
                }

                el.style.visibility = "visible"

                const a = diff * stepRadians
                const depth = Math.cos(a)
                const y = Math.sin(a) * r * spacing
                const z = (depth - 1) * r

                const attenuation = Math.pow(
                    Math.max(0, depth),
                    Math.max(0.2, fadeStrength)
                )

                const scale =
                    inactiveScale +
                    (1 - inactiveScale) * Math.pow(Math.max(0, depth), 2)

                el.style.transform = `translate3d(-50%, ${y}px, ${z}px) rotateX(${-a}rad) scale(${scale})`
                el.style.opacity = String(clamp(attenuation, 0, 1))

                el.style.color =
                    Math.abs(diff) < 0.48 ? textColor : inactiveColor

                el.style.background =
                    Math.abs(diff) < 0.48 ? "#F8F8F8" : "transparent"

                el.style.borderColor =
                    Math.abs(diff) < 0.48 ? "#E1E1E1" : "transparent"

                el.style.fontWeight = Math.abs(diff) < 0.48 ? "650" : "450"

                el.style.zIndex = String(Math.round((depth + 1) * 100))

                // The row itself is not clickable.
                // Only its project title receives pointer events.
                el.style.pointerEvents = "none"

                el.setAttribute(
                    "aria-hidden",
                    Math.abs(diff) > 0.5 ? "true" : "false"
                )

                el.tabIndex = -1
            }

            const next = mod(nearest, count)

            if (next !== lastSelection.current) {
                lastSelection.current = next
                selectedRef.current = next
                setSelected(next)
            }
        },
        [
            wheelRadius,
            angleStep,
            itemSpacing,
            fadeStrength,
            inactiveScale,
            textColor,
            inactiveColor,
            infinite,
            count,
            visibleItems,
            halfCount,
        ]
    )

    const moveTo = React.useCallback(
        (next: number, immediate = false) => {
            if (count <= 1) return

            let dest = next

            if (!infinite) dest = clamp(dest, 0, count - 1)

            if (immediate || reducedRef.current) {
                position.current = dest
                target.current = dest
                velocity.current = 0
                setWheelTransforms(dest)
            } else {
                target.current = dest
                lastInput.current = performance.now()
            }
        },
        [count, infinite, setWheelTransforms]
    )

    const animate = React.useCallback(
        (now: number) => {
            frame.current = null

            const dt = clamp(
                (now - (lastTime.current || now)) / 16.6667,
                0.25,
                2.5
            )

            lastTime.current = now

            if (!visible || !pageVisible || reducedRef.current || staticMode)
                return

            if (!dragging.current) {
                const spring = clamp(springStiffness * 0.0005, 0.002, 0.2)
                const damping = clamp(friction, 0.65, 0.995)
                const diff = target.current - position.current

                velocity.current =
                    (velocity.current +
                        diff * spring * dt * clamp(snapStrength, 0.1, 3)) *
                    Math.pow(damping, dt)

                velocity.current = clamp(
                    velocity.current,
                    -Math.max(0.3, rotationSpeed * 0.1),
                    Math.max(0.3, rotationSpeed * 0.1)
                )

                position.current += velocity.current * dt

                if (
                    Math.abs(diff) < 0.0007 &&
                    Math.abs(velocity.current) < 0.0007
                ) {
                    position.current = target.current
                    velocity.current = 0
                }
            }

            setWheelTransforms(position.current)

            if (
                dragging.current ||
                Math.abs(target.current - position.current) > 0.0007 ||
                Math.abs(velocity.current) > 0.0007
            ) {
                frame.current = requestAnimationFrame(animate)
            }
        },
        [
            visible,
            pageVisible,
            staticMode,
            springStiffness,
            friction,
            snapStrength,
            rotationSpeed,
            setWheelTransforms,
        ]
    )

    const animateRef = React.useRef(animate)

    React.useEffect(() => {
        animateRef.current = animate
    }, [animate])

    const wake = React.useCallback(() => {
        if (staticMode || reducedRef.current || !visible || !pageVisible) return

        if (frame.current === null) {
            lastTime.current = 0
            frame.current = requestAnimationFrame((t) => animateRef.current(t))
        }
    }, [staticMode, visible, pageVisible])

    React.useEffect(() => {
        setWheelTransforms(position.current)
        wake()
    }, [setWheelTransforms, wake])

    React.useEffect(() => {
        if (!activeAnimation && frame.current !== null) {
            cancelAnimationFrame(frame.current)
            frame.current = null
        }

        if (activeAnimation) wake()
    }, [activeAnimation, wake])

    React.useEffect(
        () => () => {
            if (frame.current !== null) cancelAnimationFrame(frame.current)

            if (transitionFrame.current !== null)
                cancelAnimationFrame(transitionFrame.current)

            if (imageTransitionTimer.current !== null)
                clearTimeout(imageTransitionTimer.current)
        },
        []
    )

    React.useEffect(() => {
        if (selected === displayed) return

        if (imageTransitionTimer.current !== null)
            clearTimeout(imageTransitionTimer.current)

        if (transitionFrame.current !== null)
            cancelAnimationFrame(transitionFrame.current)

        setPrevious(displayed)
        setTransitionDirection(direction.current)
        setTransitionStarted(false)
        setIncomingReady(false)
        setDisplayed(selected)

        if (staticMode || reduced) {
            setPrevious(null)
            setIncomingReady(true)
            return
        }

        transitionFrame.current = requestAnimationFrame(() => {
            transitionFrame.current = requestAnimationFrame(() =>
                setTransitionStarted(true)
            )
        })

        imageTransitionTimer.current = setTimeout(
            () => setPrevious(null),
            imageTransition + 90
        )
    }, [selected, staticMode, reduced, imageTransition])

    React.useEffect(() => {
        if (
            !autoplay ||
            !activeAnimation ||
            count < 2 ||
            (pauseOnHover && hovered)
        )
            return

        const id = window.setInterval(
            () => {
                if (dragging.current) return

                direction.current = 1
                moveTo(Math.round(target.current) + 1)
                wake()
            },
            Math.max(800, autoplayInterval)
        )

        return () => window.clearInterval(id)
    }, [
        autoplay,
        activeAnimation,
        count,
        pauseOnHover,
        hovered,
        autoplayInterval,
        moveTo,
        wake,
    ])

    const onWheel = React.useCallback(
        (event: WheelEvent) => {
            if (!mouseInteraction || count <= 1) return
            if (event.ctrlKey || event.metaKey) return

            const normalized =
                event.deltaY *
                (event.deltaMode === 1
                    ? 16
                    : event.deltaMode === 2
                      ? wheelHeight
                      : 1)

            if (Math.abs(normalized) < 0.01) return

            const delta = normalized * scrollSensitivity * 0.009 * wheelSign
            const next = target.current + delta

            if (
                !infinite &&
                ((next < 0 && normalized * wheelSign < 0) ||
                    (next > count - 1 && normalized * wheelSign > 0))
            )
                return

            event.preventDefault()

            direction.current = Math.sign(delta) || 1
            target.current = infinite ? next : clamp(next, 0, count - 1)
            lastInput.current = performance.now()

            if (reducedRef.current) moveTo(Math.round(target.current), true)
            else wake()
        },
        [
            mouseInteraction,
            count,
            wheelHeight,
            scrollSensitivity,
            wheelSign,
            infinite,
            moveTo,
            wake,
        ]
    )

    React.useEffect(() => {
        const el = wheel.current
        if (!el) return

        el.addEventListener("wheel", onWheel, { passive: false })

        return () => el.removeEventListener("wheel", onWheel)
    }, [onWheel])

    React.useEffect(() => {
        if (staticMode || reduced || !activeAnimation) return
        if (dragging.current) return

        const id = window.setTimeout(() => {
            if (
                !dragging.current &&
                performance.now() - lastInput.current >= 110
            ) {
                target.current = Math.round(target.current)

                if (!infinite)
                    target.current = clamp(target.current, 0, count - 1)

                wake()
            }
        }, 145)

        return () => window.clearTimeout(id)
    }, [selected, activeAnimation, staticMode, reduced, infinite, count, wake])

    const pointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
        if (
            count < 2 ||
            (event.pointerType === "mouse" && !mouseInteraction) ||
            (event.pointerType !== "mouse" && !touchInteraction)
        )
            return

        if (event.pointerType === "mouse" && event.button !== 0) return

        dragging.current = {
            y: event.clientY,
            t: performance.now(),
            moved: false,
            pointer: event.pointerId,
        }

        velocity.current = 0
        target.current = position.current

        event.currentTarget.setPointerCapture(event.pointerId)
        wake()
    }

    const pointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
        const d = dragging.current

        if (!d || d.pointer !== event.pointerId) return

        const dy = event.clientY - d.y
        const now = performance.now()
        const dt = Math.max(1, now - d.t)

        if (Math.abs(dy) > 2) d.moved = true

        const change = -dy * dragSensitivity * 0.025 * wheelSign

        direction.current = Math.sign(change) || direction.current

        const next = infinite
            ? position.current + change
            : clamp(position.current + change, 0, count - 1)

        velocity.current = clamp(
            (next - position.current) / (dt / 16.6667),
            -2,
            2
        )

        position.current = next
        target.current = next
        d.y = event.clientY
        d.t = now

        setWheelTransforms(next)
        wake()
    }

    const pointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
        const d = dragging.current

        if (!d || d.pointer !== event.pointerId) return

        if (d.moved) ignoreClickUntil.current = performance.now() + 250

        dragging.current = null

        try {
            event.currentTarget.releasePointerCapture(event.pointerId)
        } catch {}

        const projected = position.current + velocity.current * momentum * 5

        target.current = infinite
            ? Math.round(projected)
            : clamp(Math.round(projected), 0, count - 1)

        if (reducedRef.current) moveTo(target.current, true)
        else wake()
    }

    const choose = (slot: number) => {
        if (performance.now() < ignoreClickUntil.current) return

        direction.current = Math.sign(slot - position.current) || 1
        moveTo(slot)
        wake()
    }

    // Only the title text calls this function.
    const chooseFromTitle = (
        event: React.PointerEvent<HTMLSpanElement>,
        slot: number
    ) => {
        event.stopPropagation()
        choose(slot)
    }

    const onKey = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (count < 2) return

        const delta =
            event.key === "ArrowDown"
                ? 1
                : event.key === "ArrowUp"
                  ? -1
                  : event.key === "PageDown"
                    ? 3
                    : event.key === "PageUp"
                      ? -3
                      : 0

        if (!delta && event.key !== "Home" && event.key !== "End") return

        event.preventDefault()

        direction.current = Math.sign(delta) || 1

        const next =
            event.key === "Home"
                ? 0
                : event.key === "End"
                  ? count - 1
                  : Math.round(target.current) + delta

        moveTo(next)
        wake()
    }

    const currentSlot = Math.round(position.current)
    const slots: number[] = []

    for (let i = currentSlot - halfCount; i <= currentSlot + halfCount; i++) {
        if (infinite || (i >= 0 && i < count)) slots.push(i)
    }

    const [renderTick, forceRender] = React.useReducer((n: number) => n + 1, 0)

    React.useEffect(() => {
        if (staticMode || reduced || !activeAnimation) return

        const timer = window.setInterval(() => {
            if (
                Math.abs(Math.round(position.current) - currentSlot) > 1 ||
                Math.abs(position.current - currentSlot) > 0.65
            )
                forceRender()
        }, 65)

        return () => window.clearInterval(timer)
    }, [currentSlot, staticMode, reduced, activeAnimation, renderTick])

    const safeSlot = staticMode ? initialIndex : Math.round(position.current)
    const renderedSlots: number[] = []

    for (let i = safeSlot - halfCount; i <= safeSlot + halfCount; i++) {
        if (infinite || (i >= 0 && i < count)) renderedSlots.push(i)
    }

    const imageStyle: React.CSSProperties = {
        width: "100%",
        height: "100%",
        objectFit: "cover",
        objectPosition: image.position || "center",
        display: "block",
    }

    return (
        <div
            ref={root}
            style={{
                ...style,
                width: "100%",
                height: "100%",
                minHeight: 340,
                boxSizing: "border-box",
                overflow: "hidden",
                background,
                color: textColor,
                padding,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "Inter, sans-serif",
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <style>{`@media(max-width:650px){.ks-picker-layout{flex-direction:column!important;gap:12px!important}.ks-picker-left,.ks-picker-right{width:100%!important;flex:none!important}.ks-picker-left{min-height:0!important}.ks-picker-wheel{height:220px!important}.ks-picker-right{max-height:440px!important}}`}</style>

            <div
                className="ks-picker-layout"
                style={{
                    width: "100%",
                    maxWidth: 1350,
                    height: "100%",
                    display: "flex",
                    gap,
                    alignItems: "center",
                    justifyContent: "space-between",
                }}
            >
                <div
                    className="ks-picker-left"
                    style={{
                        flex: "1 1 48%",
                        minWidth: 0,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        height: "100%",
                    }}
                >
                    {showHeading && (
                        <div style={{ marginBottom: 10 }}>
                            <h2
                                style={{
                                    ...headingFont,
                                    fontSize: headingFont?.fontSize || 32,
                                    fontWeight: headingFont?.fontWeight || 700,
                                    lineHeight: 1.12,
                                    letterSpacing: "-0.045em",
                                    margin: 0,
                                }}
                            >
                                {heading}
                            </h2>

                            <p
                                style={{
                                    fontSize: 13,
                                    lineHeight: 1.65,
                                    color: inactiveColor,
                                    maxWidth: 340,
                                    margin: "12px 0 0",
                                }}
                            >
                                {description}
                            </p>
                        </div>
                    )}

                    <div
                        ref={wheel}
                        className="ks-picker-wheel"
                        role="listbox"
                        aria-label="Rotate to select a real estate property"
                        aria-activedescendant={`ks-wheel-item-${selected}`}
                        tabIndex={0}
                        onKeyDown={onKey}
                        onPointerDown={pointerDown}
                        onPointerMove={pointerMove}
                        onPointerUp={pointerUp}
                        onPointerCancel={pointerUp}
                        style={{
                            height: wheelHeight,
                            width: "100%",
                            maxWidth: 680,
                            position: "relative",
                            perspective: `${perspective}px`,
                            perspectiveOrigin: "50% 50%",
                            touchAction: "pan-x",
                            userSelect: "none",
                            cursor: dragging.current ? "grabbing" : "grab",
                            outlineOffset: 4,
                            WebkitUserSelect: "none",
                            overflow: "hidden",
                            maskImage:
                                "linear-gradient(to bottom,transparent,black 14%,black 86%,transparent)",
                            WebkitMaskImage:
                                "linear-gradient(to bottom,transparent,black 14%,black 86%,transparent)",
                        }}
                    >
                        <div
                            style={{
                                position: "absolute",
                                inset: 0,
                                transformStyle: "preserve-3d",
                                pointerEvents: "none",
                            }}
                        >
                            {renderedSlots.map((slot) => {
                                const index = mod(slot, count)
                                const item = projects[index]

                                const diff =
                                    slot -
                                    (staticMode
                                        ? initialIndex
                                        : position.current)

                                const a = diff * stepRadians
                                const depth = Math.cos(a)

                                const attenuation = Math.pow(
                                    Math.max(0, depth),
                                    Math.max(0.2, fadeStrength)
                                )

                                const scale =
                                    inactiveScale +
                                    (1 - inactiveScale) *
                                        Math.pow(Math.max(0, depth), 2)

                                const y =
                                    Math.sin(a) *
                                    wheelRadius *
                                    (itemSpacing /
                                        Math.max(1, wheelRadius * stepRadians))

                                const z = (depth - 1) * wheelRadius
                                const active = Math.abs(diff) < 0.48

                                return (
                                    <button
                                        key={slot}
                                        id={
                                            active
                                                ? `ks-wheel-item-${index}`
                                                : undefined
                                        }
                                        ref={(node) => {
                                            if (node)
                                                nodes.current.set(slot, node)
                                            else nodes.current.delete(slot)
                                        }}
                                        type="button"
                                        role="option"
                                        aria-selected={
                                            index === selected && active
                                        }
                                        aria-label={`${String(index + 1).padStart(2, "0")} ${item.title}, ${item.location}`}
                                        tabIndex={-1}
                                        onClick={(event) =>
                                            event.stopPropagation()
                                        }
                                        style={{
                                            ...font,
                                            position: "absolute",
                                            top: "50%",
                                            left: "50%",
                                            width: "98%",
                                            minHeight: 49,
                                            display: "grid",
                                            gridTemplateColumns:
                                                "40px minmax(0, 1fr) minmax(70px, 115px)",
                                            alignItems: "center",
                                            textAlign: "left",
                                            gap: 8,
                                            transform: `translate3d(-50%,${y}px,${z}px) rotateX(${-a}rad) scale(${scale})`,
                                            transformOrigin: "center center",
                                            transformStyle: "preserve-3d",
                                            backfaceVisibility: "hidden",
                                            WebkitBackfaceVisibility: "hidden",
                                            margin: 0,
                                            padding: "8px 14px",
                                            background: active
                                                ? "#F8F8F8"
                                                : "transparent",
                                            border: "1px solid",
                                            borderColor: active
                                                ? "#E1E1E1"
                                                : "transparent",
                                            borderRadius: 13,
                                            opacity: attenuation,
                                            color: active
                                                ? textColor
                                                : inactiveColor,
                                            cursor: "default",
                                            pointerEvents: "none",
                                            zIndex: Math.round(
                                                (depth + 1) * 100
                                            ),
                                        }}
                                    >
                                        <span
                                            style={{
                                                fontFamily: "monospace",
                                                fontSize: 11,
                                                fontWeight: 400,
                                                letterSpacing: "-0.03em",
                                                fontVariantNumeric:
                                                    "tabular-nums",
                                                opacity: active ? 0.8 : 0.65,
                                                pointerEvents: "none",
                                            }}
                                        >
                                            {String(index + 1).padStart(2, "0")}
                                        </span>

                                        <span
                                            onPointerDown={(event) =>
                                                chooseFromTitle(event, slot)
                                            }
                                            onClick={(event) => {
                                                event.stopPropagation()
                                                choose(slot)
                                            }}
                                            style={{
                                                fontSize: activeSize,
                                                fontWeight: active ? 700 : 560,
                                                lineHeight: 1.15,
                                                letterSpacing: "-0.045em",
                                                whiteSpace: "nowrap",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                pointerEvents: "auto",
                                                cursor: "pointer",
                                                justifySelf: "start",
                                            }}
                                        >
                                            {item.title}
                                        </span>

                                        <span
                                            style={{
                                                fontSize: Math.max(
                                                    10,
                                                    activeSize * 0.43
                                                ),
                                                fontWeight: 400,
                                                textAlign: "right",
                                                whiteSpace: "nowrap",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                opacity: active ? 0.7 : 0.8,
                                                pointerEvents: "none",
                                            }}
                                        >
                                            {item.location}
                                        </span>
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                </div>

                <div
                    className="ks-picker-right"
                    style={{
                        flex: "1 1 52%",
                        width: "52%",
                        minWidth: 0,
                        height: "100%",
                        maxHeight: 740,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <div
                        style={{
                            position: "relative",
                            width: "100%",
                            height: "100%",
                            maxHeight: "100%",
                            aspectRatio: `${imageRatio}`,
                            overflow: "hidden",
                            borderRadius: imageRadius,
                            background: "#D9D9D6",
                            isolation: "isolate",
                        }}
                    >
                        {previous !== null && projects[previous] && (
                            <img
                                key={`out-${previous}`}
                                src={projects[previous].image}
                                alt=""
                                aria-hidden="true"
                                style={{
                                    ...imageStyle,
                                    position: "absolute",
                                    inset: 0,
                                    objectPosition:
                                        projects[previous].position || "center",
                                    transition: `transform ${imageTransition}ms cubic-bezier(.22,1,.36,1),opacity ${imageTransition}ms ease`,
                                    transform: transitionStarted
                                        ? `translateY(${-transitionDirection * imageSlide}px) scale(1.035)`
                                        : "translateY(0px) scale(1)",
                                    opacity: transitionStarted ? 0 : 1,
                                }}
                            />
                        )}

                        <img
                            key={`in-${displayed}`}
                            src={image.image}
                            alt={image.title}
                            onLoad={() => setIncomingReady(true)}
                            onError={() => setIncomingReady(true)}
                            style={{
                                ...imageStyle,
                                position: "absolute",
                                inset: 0,
                                transition:
                                    staticMode || reduced
                                        ? "none"
                                        : `transform ${imageTransition}ms cubic-bezier(.22,1,.36,1),opacity ${imageTransition}ms ease`,
                                transform:
                                    previous !== null && !transitionStarted
                                        ? `translateY(${transitionDirection * imageSlide}px) scale(1.035)`
                                        : "translateY(0px) scale(1)",
                                opacity:
                                    previous !== null &&
                                    !transitionStarted &&
                                    incomingReady
                                        ? 0
                                        : 1,
                            }}
                        />

                        <div
                            style={{
                                position: "absolute",
                                inset: "40% 0 0",
                                background: `linear-gradient(to bottom,transparent,rgba(0,0,0,${gradient}))`,
                                pointerEvents: "none",
                            }}
                        />

                        <div
                            style={{
                                position: "absolute",
                                bottom: 0,
                                left: 0,
                                right: 0,
                                padding: "clamp(16px,3vw,34px)",
                                display: "flex",
                                alignItems: "end",
                                justifyContent: "space-between",
                                gap: 12,
                                color: "white",
                            }}
                        >
                            <div style={{ minWidth: 0 }}>
                                <div
                                    style={{
                                        fontSize: "clamp(18px,2.5vw,32px)",
                                        fontWeight: 600,
                                        letterSpacing: "-0.04em",
                                        lineHeight: 1.15,
                                    }}
                                >
                                    {image.title}
                                </div>

                                {showMetadata && (
                                    <div
                                        style={{
                                            fontSize: 11,
                                            opacity: 0.82,
                                            marginTop: 8,
                                            letterSpacing: "0.03em",
                                        }}
                                    >
                                        {[
                                            image.category,
                                            image.location,
                                            image.year,
                                        ]
                                            .filter(Boolean)
                                            .join(" · ")}
                                    </div>
                                )}
                            </div>

                            {showCounter && (
                                <div
                                    style={{
                                        whiteSpace: "nowrap",
                                        fontSize: 11,
                                        letterSpacing: "0.1em",
                                        fontVariantNumeric: "tabular-nums",
                                    }}
                                >
                                    {String(displayed + 1).padStart(2, "0")} /{" "}
                                    {String(count).padStart(2, "0")}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

KarimSaifInfinitePickerWheel.defaultProps = {
    heading: "Real Estate Gallery",
    description: "Explore exceptional properties and architectural spaces.",
    projects: DEMOS,
    background: "#FFFFFF",
    textColor: "#161616",
    inactiveColor: "#A0A0A0",
    wheelRadius: 210,
    angleStep: 22,
    perspective: 700,
    visibleItems: 7,
    itemSpacing: 43,
    activeSize: 23,
    inactiveScale: 0.88,
    fadeStrength: 1.4,
    scrollSensitivity: 1,
    dragSensitivity: 1,
    momentum: 0.8,
    friction: 0.84,
    snapStrength: 1,
    springStiffness: 75,
    rotationSpeed: 12,
    infinite: true,
    mouseInteraction: true,
    touchInteraction: true,
    wheelDirection: "Normal",
    imageRadius: 12,
    imageRatio: 0.78,
    imageTransition: 540,
    imageSlide: 55,
    gradient: 0.78,
    gap: 38,
    padding: 28,
    showHeading: true,
    showMetadata: true,
    showCounter: true,
    autoplay: false,
    autoplayInterval: 3400,
    pauseOnHover: true,
    initialIndex: 0,
}

addPropertyControls(KarimSaifInfinitePickerWheel, {
    projects: {
        type: ControlType.Array,
        title: "Properties",
        description:
            "Real estate listings with numbered wheel titles, locations, and synchronized property images.",
        maxCount: 60,
        control: {
            type: ControlType.Object,
            controls: {
                title: {
                    type: ControlType.String,
                    title: "Title",
                    description:
                        "Project name displayed on the rotating cylinder.",
                },
                image: {
                    type: ControlType.Image,
                    title: "Image",
                    description: "Project preview image.",
                },
                category: {
                    type: ControlType.String,
                    title: "Category",
                    description: "Project category in the image footer.",
                },
                location: {
                    type: ControlType.String,
                    title: "Location",
                    description:
                        "City displayed in the right column of each rotating wheel row and in the image footer.",
                },
                year: {
                    type: ControlType.String,
                    title: "Year",
                    description: "Project year in the image footer.",
                },
                position: {
                    type: ControlType.String,
                    title: "Image Position",
                    description:
                        "CSS object-position such as center or 50% 30%.",
                },
                link: {
                    type: ControlType.Link,
                    title: "Link",
                    description:
                        "Optional project destination for future navigation.",
                },
            },
        },
    },
    heading: {
        type: ControlType.String,
        title: "Heading",
        description: "Main editorial heading.",
    },
    description: {
        type: ControlType.String,
        title: "Description",
        description: "Short description below the heading.",
        displayTextArea: true,
    },
    showHeading: {
        type: ControlType.Boolean,
        title: "Show Heading",
        description: "Show or hide the heading and description.",
    },
    showMetadata: {
        type: ControlType.Boolean,
        title: "Metadata",
        description: "Show project category, location and year.",
    },
    showCounter: {
        type: ControlType.Boolean,
        title: "Counter",
        description: "Show the current project number and total.",
    },
    initialIndex: {
        type: ControlType.Number,
        title: "Initial Project",
        description: "Zero-based index of the initially selected project.",
        min: 0,
        max: 50,
        step: 1,
    },
    background: {
        type: ControlType.Color,
        title: "Background",
        description: "Background color of the entire component.",
    },
    textColor: {
        type: ControlType.Color,
        title: "Active Text",
        description: "Color of the centered active project.",
    },
    inactiveColor: {
        type: ControlType.Color,
        title: "Inactive Text",
        description: "Color of neighboring project names and description.",
    },
    font: {
        type: ControlType.Font,
        title: "Wheel Font",
        description: "Font family and style for rotating project names.",
        controls: "extended",
    },
    headingFont: {
        type: ControlType.Font,
        title: "Heading Font",
        description: "Font family and style for the editorial heading.",
        controls: "extended",
    },
    wheelRadius: {
        type: ControlType.Number,
        title: "Wheel Radius",
        description: "Radius of the imaginary 3D text cylinder in pixels.",
        min: 60,
        max: 350,
        step: 1,
    },
    angleStep: {
        type: ControlType.Number,
        title: "Rotation Angle",
        description:
            "Angular distance between consecutive text items in degrees.",
        min: 10,
        max: 50,
        step: 1,
    },
    perspective: {
        type: ControlType.Number,
        title: "Perspective",
        description:
            "3D perspective distance; lower values increase depth distortion.",
        min: 250,
        max: 1600,
        step: 10,
    },
    visibleItems: {
        type: ControlType.Number,
        title: "Visible Items",
        description:
            "Approximate number of text options visible in the picker.",
        min: 3,
        max: 11,
        step: 2,
    },
    itemSpacing: {
        type: ControlType.Number,
        title: "Item Spacing",
        description: "Vertical distance between items around the center.",
        min: 18,
        max: 90,
        step: 1,
    },
    activeSize: {
        type: ControlType.Number,
        title: "Title Size",
        description:
            "Font size of property titles in the center column of the rotating wheel.",
        min: 14,
        max: 72,
        step: 1,
    },
    inactiveScale: {
        type: ControlType.Number,
        title: "Inactive Scale",
        description:
            "Relative size of project names away from the wheel center.",
        min: 0.5,
        max: 1,
        step: 0.01,
    },
    fadeStrength: {
        type: ControlType.Number,
        title: "Text Fade",
        description: "How quickly distant cylinder items fade out.",
        min: 0.2,
        max: 4,
        step: 0.1,
    },
    scrollSensitivity: {
        type: ControlType.Number,
        title: "Scroll Sensitivity",
        description: "Response to trackpad and mouse wheel input.",
        min: 0.1,
        max: 3,
        step: 0.1,
    },
    dragSensitivity: {
        type: ControlType.Number,
        title: "Drag Sensitivity",
        description: "Rotation response to mouse or touch dragging.",
        min: 0.1,
        max: 3,
        step: 0.1,
    },
    momentum: {
        type: ControlType.Number,
        title: "Momentum",
        description: "How far the wheel coasts after a swipe.",
        min: 0,
        max: 2,
        step: 0.05,
    },
    friction: {
        type: ControlType.Number,
        title: "Friction",
        description: "Velocity retention during spring settling.",
        min: 0.65,
        max: 0.98,
        step: 0.01,
    },
    snapStrength: {
        type: ControlType.Number,
        title: "Snap Strength",
        description: "Magnetic pull toward the selected project.",
        min: 0.1,
        max: 3,
        step: 0.1,
    },
    springStiffness: {
        type: ControlType.Number,
        title: "Spring Stiffness",
        description: "Responsiveness of the wheel spring animation.",
        min: 10,
        max: 200,
        step: 1,
    },
    rotationSpeed: {
        type: ControlType.Number,
        title: "Rotation Speed",
        description: "Maximum rotational velocity during animated movement.",
        min: 2,
        max: 30,
        step: 1,
    },
    infinite: {
        type: ControlType.Boolean,
        title: "Infinite Loop",
        description:
            "Allow the wheel to rotate endlessly through the project list.",
    },
    mouseInteraction: {
        type: ControlType.Boolean,
        title: "Mouse",
        description: "Enable mouse dragging and wheel scrolling.",
    },
    touchInteraction: {
        type: ControlType.Boolean,
        title: "Touch",
        description: "Enable touch dragging and swipe interaction.",
    },
    wheelDirection: {
        type: ControlType.Enum,
        title: "Direction",
        description: "Choose the rotation direction relative to user gestures.",
        options: ["Normal", "Reverse"],
        optionTitles: ["Normal", "Reverse"],
    },
    imageRadius: {
        type: ControlType.Number,
        title: "Image Radius",
        description: "Rounded corner radius of the project image.",
        min: 0,
        max: 60,
        step: 1,
    },
    imageRatio: {
        type: ControlType.Number,
        title: "Image Ratio",
        description: "Target width-to-height ratio of the image preview.",
        min: 0.5,
        max: 1.8,
        step: 0.01,
    },
    imageTransition: {
        type: ControlType.Number,
        title: "Image Duration",
        description: "Duration of image transitions in milliseconds.",
        min: 100,
        max: 1500,
        step: 10,
    },
    imageSlide: {
        type: ControlType.Number,
        title: "Image Slide",
        description: "Vertical image movement during project transitions.",
        min: 0,
        max: 180,
        step: 1,
    },
    gradient: {
        type: ControlType.Number,
        title: "Gradient",
        description: "Darkness of the image footer gradient.",
        min: 0,
        max: 1,
        step: 0.05,
    },
    gap: {
        type: ControlType.Number,
        title: "Column Gap",
        description: "Spacing between the text wheel and image preview.",
        min: 0,
        max: 150,
        step: 1,
    },
    padding: {
        type: ControlType.Number,
        title: "Padding",
        description: "Outer padding around the component.",
        min: 0,
        max: 100,
        step: 1,
    },
    autoplay: {
        type: ControlType.Boolean,
        title: "Autoplay",
        description:
            "Made with 💛 by [@karimsaif](https://x.com/karimsaif0) · Built with [Framer](https://framer.link/karimsaif0)",
    },
    autoplayInterval: {
        type: ControlType.Number,
        title: "Autoplay Delay",
        description: "Time in milliseconds between automatic selections.",
        min: 800,
        max: 15000,
        step: 100,
        hidden: (p) => !p.autoplay,
    },
    pauseOnHover: {
        type: ControlType.Boolean,
        title: "Pause on Hover",
        description:
            "Made with 💛 by [@karimsaif](https://x.com/karimsaif0) · Built with [Framer](https://framer.link/karimsaif0)",
        hidden: (p) => !p.autoplay,
    },
})
