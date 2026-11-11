// Card Fan Mini — 4-slot card fan with hover interactions

import React, {
    useEffect,
    useState,
    useRef,
    useMemo,
    useCallback,
    type CSSProperties,
} from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface CardFanMiniProps {
    card1: React.ReactNode
    card2: React.ReactNode
    card3: React.ReactNode
    card4: React.ReactNode
    cardGap: number
    hoverLift: number
    neighborSpread: number
    revealStyle: "fan" | "scale"
    revealDirection: "left" | "right" | "center" | "edges"
    revealDuration: number
    revealStagger: number
    revealThreshold: number
    hoverDuration: number
    showShine: boolean
    showDarken: boolean
    darkenAmount: number
    mobileMode: "auto" | "touch" | "hover"
    style?: CSSProperties
}

const DEFAULTS = {
    cardGap: 80,
    hoverLift: 24,
    neighborSpread: 30,
    revealStyle: "scale" as const,
    revealDirection: "left" as const,
    revealDuration: 900,
    revealStagger: 70,
    revealThreshold: 0.3,
    hoverDuration: 400,
    showShine: true,
    showDarken: true,
    darkenAmount: 0.15,
    mobileMode: "auto" as const,
}

let idCounter = 0

function useDeviceIsTouch(): boolean {
    const [isTouch, setIsTouch] = useState(false)
    useEffect(() => {
        const mq = window.matchMedia("(pointer: coarse)")
        setIsTouch(mq.matches)
        const handler = (e: MediaQueryListEvent) => setIsTouch(e.matches)
        mq.addEventListener("change", handler)
        return () => mq.removeEventListener("change", handler)
    }, [])
    return isTouch
}

/**
 * Card Fan Mini
 *
 * @framerIntrinsicWidth 500
 * @framerIntrinsicHeight 350
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
function CardFanMini(props: CardFanMiniProps) {
    const {
        card1, card2, card3, card4,
        cardGap = DEFAULTS.cardGap,
        hoverLift = DEFAULTS.hoverLift,
        neighborSpread = DEFAULTS.neighborSpread,
        revealStyle = DEFAULTS.revealStyle,
        revealDirection = DEFAULTS.revealDirection,
        revealDuration = DEFAULTS.revealDuration,
        revealStagger = DEFAULTS.revealStagger,
        revealThreshold = DEFAULTS.revealThreshold,
        hoverDuration = DEFAULTS.hoverDuration,
        showShine = DEFAULTS.showShine,
        showDarken = DEFAULTS.showDarken,
        darkenAmount = DEFAULTS.darkenAmount,
        mobileMode = DEFAULTS.mobileMode,
    } = props

    const REVEAL_EASING = "cubic-bezier(0.22, 1, 0.36, 1)"
    const HOVER_EASING = "cubic-bezier(0.25, 1, 0.5, 1)"
    const deviceIsTouch = useDeviceIsTouch()
    const isTouch = mobileMode === "auto" ? deviceIsTouch : mobileMode === "touch"
    const isFan = revealStyle === "fan"

    const slots = useMemo(() => [card1, card2, card3, card4].filter(Boolean), [card1, card2, card3, card4])
    const count = slots.length

    const [phase, setPhase] = useState<"waiting" | "revealing" | "open">("waiting")
    const [hoverIndex, setHoverIndex] = useState(-1)
    const [engaged, setEngaged] = useState(false)
    const [tappedIndex, setTappedIndex] = useState(-1)
    const rootRef = useRef<HTMLDivElement>(null)
    const stageRef = useRef<HTMLDivElement>(null)
    const mountedRef = useRef(true)
    const hoverRef = useRef(-1)
    const rafRef = useRef(0)
    const lastMouseRef = useRef<{ x: number; y: number } | null>(null)
    const hasRevealedRef = useRef(false)
    const cardBoundsRef = useRef<DOMRect | null>(null)
    const timersRef = useRef<number[]>([])

    const animId = useMemo(() => { idCounter += 1; return "cfm_" + idCounter }, [])
    const animIdScale = animId + "_s"

    useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false } }, [])

    const clearTimers = useCallback(() => { timersRef.current.forEach(clearTimeout); timersRef.current = [] }, [])
    useEffect(() => clearTimers, [clearTimers])
    const addTimer = useCallback((fn: () => void, ms: number) => { timersRef.current.push(window.setTimeout(fn, ms)) }, [])

    const basePositions = useMemo(() => {
        if (count === 0) return []
        const mid = (count - 1) / 2
        return Array.from({ length: count }, (_, i) => Math.round((i - mid) * cardGap))
    }, [count, cardGap])

    const getStaggerDelay = useCallback((index: number): number => {
        if (count === 0) return 0
        switch (revealDirection) {
            case "left": return index * revealStagger
            case "right": return (count - 1 - index) * revealStagger
            case "center": { const mid = (count - 1) / 2; return Math.round(Math.abs(index - mid) * revealStagger) }
            case "edges": { const mid = (count - 1) / 2; return Math.round((mid - Math.abs(index - mid)) * revealStagger) }
            default: return index * revealStagger
        }
    }, [count, revealStagger, revealDirection])

    const maxStaggerDelay = useMemo(() => {
        if (count === 0) return 0
        let max = 0
        for (let i = 0; i < count; i++) { const d = getStaggerDelay(i); if (d > max) max = d }
        return max
    }, [count, getStaggerDelay])

    const staggerDelays = useMemo(() => Array.from({ length: count }, (_, i) => getStaggerDelay(i)), [count, getStaggerDelay])

    const findClosest = useCallback((clientX: number): number => {
        const rect = stageRef.current?.getBoundingClientRect()
        if (!rect || count === 0) return -1
        const mx = clientX - rect.left - rect.width / 2
        let closest = 0, minDist = Infinity
        for (let i = 0; i < basePositions.length; i++) {
            const d = Math.abs(mx - basePositions[i])
            if (d < minDist) { minDist = d; closest = i }
        }
        return closest
    }, [basePositions, count])

    const measureCardBounds = useCallback(() => {
        if (!stageRef.current || count === 0) return
        const cards = stageRef.current.querySelectorAll("[data-fan-card]")
        if (cards.length === 0) return
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
        cards.forEach((card) => {
            const r = card.getBoundingClientRect()
            if (r.left < minX) minX = r.left
            if (r.top < minY) minY = r.top
            if (r.right > maxX) maxX = r.right
            if (r.bottom > maxY) maxY = r.bottom
        })
        cardBoundsRef.current = new DOMRect(minX, minY, maxX - minX, maxY - minY)
    }, [count])

    const isWithinHoverZone = useCallback((clientX: number, clientY: number): boolean => {
        const bounds = cardBoundsRef.current
        if (!bounds) return false
        const padX = bounds.width * 0.25
        const padY = bounds.height * 0.25
        return clientX >= bounds.left - padX && clientX <= bounds.right + padX && clientY >= bounds.top - padY && clientY <= bounds.bottom + padY
    }, [])

    const clearHover = useCallback(() => { hoverRef.current = -1; setHoverIndex(-1); setEngaged(false) }, [])

    const revealOrigin = useMemo(() => {
        if (count === 0) return 100
        return Math.abs(basePositions[count - 1]) + 80
    }, [basePositions, count])

    const runReveal = useCallback(() => {
        clearTimers()
        setPhase("revealing")
        setHoverIndex(-1); setEngaged(false); setTappedIndex(-1)
        hoverRef.current = -1
        const fullTime = maxStaggerDelay + revealDuration + 100
        addTimer(() => { if (mountedRef.current) setPhase("open") }, fullTime)
    }, [maxStaggerDelay, revealDuration, clearTimers, addTimer])

    useEffect(() => {
        if (count === 0 || !rootRef.current) return
        hasRevealedRef.current = false
        const observer = new IntersectionObserver((entries) => {
            const entry = entries[0]
            if (entry && entry.isIntersecting && !hasRevealedRef.current) { hasRevealedRef.current = true; runReveal(); observer.disconnect() }
        }, { threshold: revealThreshold })
        observer.observe(rootRef.current)
        return () => observer.disconnect()
    }, [count, runReveal, revealThreshold])

    useEffect(() => {
        if (phase !== "open") return
        const measure = () => requestAnimationFrame(measureCardBounds)
        measure(); window.addEventListener("resize", measure)
        return () => window.removeEventListener("resize", measure)
    }, [phase, measureCardBounds])

    useEffect(() => {
        if (phase !== "open" || isTouch) return
        if (!lastMouseRef.current) return
        if (!isWithinHoverZone(lastMouseRef.current.x, lastMouseRef.current.y)) return
        const closest = findClosest(lastMouseRef.current.x)
        if (closest >= 0) { setEngaged(true); setHoverIndex(closest); hoverRef.current = closest }
    }, [phase, isWithinHoverZone, findClosest, isTouch])

    useEffect(() => {
        if (!isTouch || phase !== "open") return
        const handler = (e: TouchEvent) => { const target = e.target as HTMLElement; if (!target.closest("[data-fan-card]")) setTappedIndex(-1) }
        document.addEventListener("touchstart", handler, { passive: true })
        return () => document.removeEventListener("touchstart", handler)
    }, [isTouch, phase])

    const handleCardClick = useCallback((i: number) => {
        if (phase !== "open" || !isTouch) return
        setTappedIndex(prev => prev === i ? -1 : i)
    }, [phase, isTouch])

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (isTouch) return
        lastMouseRef.current = { x: e.clientX, y: e.clientY }
        if (phase !== "open" || count === 0) return
        if (!isWithinHoverZone(e.clientX, e.clientY)) { if (engaged) clearHover(); return }
        if (!engaged) return
        if (rafRef.current) return
        const cx = e.clientX
        rafRef.current = requestAnimationFrame(() => {
            rafRef.current = 0
            const closest = findClosest(cx)
            if (closest >= 0 && closest !== hoverRef.current) { hoverRef.current = closest; setHoverIndex(closest) }
        })
    }, [phase, count, engaged, findClosest, isWithinHoverZone, clearHover, isTouch])

    useEffect(() => { return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) } }, [])

    const handleCardEnter = useCallback((i: number) => {
        if (isTouch || phase !== "open") return
        if (!engaged) setEngaged(true)
        hoverRef.current = i; setHoverIndex(i)
    }, [phase, engaged, isTouch])

    const handleMouseLeave = useCallback(() => {
        if (isTouch) return
        lastMouseRef.current = null; clearHover()
    }, [clearHover, isTouch])

    const activeIndex = isTouch ? tappedIndex : hoverIndex

    const cardTransforms = useMemo(() => {
        return basePositions.map((base, i) => {
            let tx = base, ty = 0, zIndex = i + 1
            if (activeIndex >= 0) {
                if (i === activeIndex) {
                    ty = -hoverLift; zIndex = count + 2
                } else if (i < activeIndex) {
                    tx = base - Math.round(neighborSpread / (activeIndex - i))
                } else {
                    tx = base + Math.round(neighborSpread / (i - activeIndex))
                }
            }
            return { tx, ty, zIndex }
        })
    }, [basePositions, activeIndex, hoverLift, neighborSpread, count])

    const buildTransform = useCallback((tx: number, ty: number): string => {
        if (isFan) return `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) scaleX(1)`
        return `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) scale(1)`
    }, [isFan])

    const keyframeStyles = useMemo(() => `
        @keyframes ${animId} {
            0% { transform: translate(calc(-50% + ${revealOrigin}px), -50%) scaleX(0.05); opacity: 0; }
            15% { opacity: 1; }
            100% { transform: translate(calc(-50% + var(--cf-x)), -50%) scaleX(1); opacity: 1; }
        }
        @keyframes ${animIdScale} {
            0% { transform: translate(calc(-50% + var(--cf-x)), -50%) scale(0.4); opacity: 0; }
            20% { opacity: 1; }
            100% { transform: translate(calc(-50% + var(--cf-x)), -50%) scale(1); opacity: 1; }
        }
    `, [animId, animIdScale, revealOrigin])

    const getCardStyle = useCallback((index: number): CSSProperties => {
        const base = basePositions[index] ?? 0
        const restingZ = index + 1

        if (phase === "waiting") {
            return {
                position: "absolute", left: "50%", top: "50%",
                transform: isFan
                    ? `translate(calc(-50% + ${base}px), -50%) scaleX(1)`
                    : `translate(calc(-50% + ${base}px), -50%) scale(0.4)`,
                opacity: 0, zIndex: restingZ, pointerEvents: "none" as const,
            }
        }

        if (phase === "revealing") {
            const delay = staggerDelays[index] ?? 0
            return {
                position: "absolute", left: "50%", top: "50%",
                transform: isFan
                    ? `translate(calc(-50% + ${revealOrigin}px), -50%) scaleX(0.05)`
                    : `translate(calc(-50% + ${base}px), -50%) scale(0.4)`,
                opacity: 0, zIndex: restingZ, pointerEvents: "none" as const,
                animation: `${isFan ? animId : animIdScale} ${revealDuration}ms ${REVEAL_EASING} ${delay}ms both`,
                // @ts-ignore
                "--cf-x": `${base}px`,
            }
        }

        const { tx, ty, zIndex } = cardTransforms[index] ?? { tx: base, ty: 0, zIndex: restingZ }
        const touchMode = isTouch && phase === "open"

        return {
            position: "absolute", left: "50%", top: "50%", zIndex,
            transform: buildTransform(tx, ty),
            transition: `transform ${hoverDuration}ms ${HOVER_EASING}`,
            pointerEvents: touchMode ? "auto" as const : (engaged ? "none" as const : "auto" as const),
            cursor: "pointer",
        }
    }, [phase, basePositions, isFan, revealOrigin, animId, animIdScale, revealDuration, REVEAL_EASING, staggerDelays, cardTransforms, isTouch, engaged, hoverDuration, HOVER_EASING, buildTransform])

    if (count === 0) {
        return (
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#999", fontSize: 14 }}>
                Connect components to the card slots
            </div>
        )
    }

    return (
        <div
            ref={rootRef}
            style={{ width: "100%", height: "100%", position: "relative", overflow: "visible" }}
        >
            <style dangerouslySetInnerHTML={{ __html: keyframeStyles }} />

            <div
                ref={stageRef} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}
                style={{ position: "absolute", inset: 0, cursor: !isTouch && engaged ? "pointer" : undefined }}
            >
                {slots.map((card, i) => {
                    const isDarkened = showDarken && activeIndex >= 0 && i !== activeIndex
                    return (
                        <div
                            key={`card-${i}`} data-fan-card="" style={getCardStyle(i)}
                            onMouseEnter={() => handleCardEnter(i)}
                            onClick={() => handleCardClick(i)}
                        >
                            {card}
                            {showDarken && (
                                <div style={{
                                    position: "absolute", inset: 0, borderRadius: "inherit",
                                    backgroundColor: `rgba(0, 0, 0, ${isDarkened ? darkenAmount : 0})`,
                                    pointerEvents: "none",
                                    transition: `background-color ${hoverDuration}ms ${HOVER_EASING}`,
                                }} />
                            )}
                            {showShine && (
                                <div style={{
                                    position: "absolute", inset: 0, borderRadius: "inherit",
                                    background: "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 50%, rgba(255,255,255,0.04) 100%)",
                                    opacity: activeIndex === i ? 1 : 0, transition: "opacity 300ms ease", pointerEvents: "none",
                                }} />
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

addPropertyControls(CardFanMini, {
    card1: { type: ControlType.ComponentInstance, title: "Card 1" },
    card2: { type: ControlType.ComponentInstance, title: "Card 2" },
    card3: { type: ControlType.ComponentInstance, title: "Card 3" },
    card4: { type: ControlType.ComponentInstance, title: "Card 4" },
    cardGap: { type: ControlType.Number, title: "Card gap", defaultValue: DEFAULTS.cardGap, min: 20, max: 200, step: 2, unit: "px", description: "Use the connector tool to connect frames, images, or videos to this fan. Click [here](https://buy.polar.sh/polar_cl_HWucbVpwRE7vN14EBjDEXK0KsMfPd4YOW7eh632fsTw) to get the unlimited version." },
    hoverLift: { type: ControlType.Number, title: "Hover lift", defaultValue: DEFAULTS.hoverLift, min: 0, max: 60, step: 1, unit: "px" },
    neighborSpread: { type: ControlType.Number, title: "Spread", defaultValue: DEFAULTS.neighborSpread, min: 0, max: 80, step: 1, unit: "px" },
    revealStyle: { type: ControlType.Enum, title: "Intro style", options: ["fan", "scale"], optionTitles: ["Fan out", "Scale up"], defaultValue: DEFAULTS.revealStyle, displaySegmentedControl: true },
    revealDirection: { type: ControlType.Enum, title: "Direction", options: ["left", "right", "center", "edges"], optionTitles: ["Left →", "← Right", "← Center →", "→ Edges ←"], defaultValue: DEFAULTS.revealDirection },
    revealThreshold: { type: ControlType.Number, title: "Reveal at", defaultValue: DEFAULTS.revealThreshold, min: 0, max: 1, step: 0.1 },
    revealDuration: { type: ControlType.Number, title: "Reveal duration", defaultValue: DEFAULTS.revealDuration, min: 200, max: 2500, step: 50, unit: "ms" },
    revealStagger: { type: ControlType.Number, title: "Reveal stagger", defaultValue: DEFAULTS.revealStagger, min: 0, max: 300, step: 10, unit: "ms" },
    hoverDuration: { type: ControlType.Number, title: "Hover speed", defaultValue: DEFAULTS.hoverDuration, min: 100, max: 800, step: 25, unit: "ms" },
    mobileMode: { type: ControlType.Enum, title: "Interaction", options: ["auto", "touch", "hover"], optionTitles: ["Auto", "Tap", "Hover"], defaultValue: DEFAULTS.mobileMode, displaySegmentedControl: true },
    showShine: { type: ControlType.Boolean, title: "Shine effect", defaultValue: DEFAULTS.showShine, enabledTitle: "On", disabledTitle: "Off" },
    showDarken: { type: ControlType.Boolean, title: "Depth darken", defaultValue: DEFAULTS.showDarken, enabledTitle: "On", disabledTitle: "Off" },
    darkenAmount: { type: ControlType.Number, title: "Darken amount", defaultValue: DEFAULTS.darkenAmount, min: 0, max: 0.5, step: 0.01, hidden: (props: any) => !props.showDarken },
})

export default CardFanMini