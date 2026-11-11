// Custom graffiti cursor with a small green dot that leaves a trail of spray particles.
import { useEffect, useRef, useState, startTransition, useCallback } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface GraffitiCursorProps {
    dotColor: string
    sprayColor: string
    sprayCount: number
    spraySize: number
    sprayRadius: number
    style?: React.CSSProperties
}

/**
 * Graffiti Cursor
 *
 * @framerIntrinsicWidth 300
 * @framerIntrinsicHeight 300
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function GraffitiCursor(props: GraffitiCursorProps) {
    const { dotColor, sprayColor, sprayCount, spraySize, sprayRadius, style } = props
    const [cursor, setCursor] = useState<{x: number, y: number}>({x: 150, y: 150})
    const [sprays, setSprays] = useState<Array<{x: number, y: number, r: number, o: number}>>([])
    const ref = useRef<HTMLDivElement>(null)
    const isStatic = useIsStaticRenderer()

    // Mouse move handler
    const handlePointerMove = useCallback((e: PointerEvent) => {
        if (!ref.current) return
        const rect = ref.current.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        setCursor(prev => {
            // Detect real movement
            if (prev.x !== x || prev.y !== y) {
                // Calculate direction of movement
                const dx = x - prev.x
                const dy = y - prev.y
                const velocity = Math.sqrt(dx * dx + dy * dy)
                if (velocity < 1.8) return {x, y} // Don't emit spray if very slow
                const moveAngle = Math.atan2(dy, dx) + Math.PI // Opposite direction
                // Number of particles/trail length is a function of velocity
                const sprayDensity = Math.floor(Math.max(sprayCount * 3.9 * Math.min(velocity / 7, 2.75), 10)) // HIGHER DENSITY
                let newSprays: any[] = []
                for (let i = 0; i < sprayDensity; i++) {
                    const t = i / (sprayDensity - 1)
                    const d = sprayRadius * 2.28 * t * (0.84 + Math.random() * 0.24) // LARGER CIRCUMFERENCE
                    // Uniform circle around, but density is a little higher near opposite of move direction
                    const angleSpread = Math.PI * 1.71 // wider
                    let angle = moveAngle + (Math.random() - 0.5) * angleSpread
                    // Distribute more particles backward, but some all around
                    if (Math.random() < 0.54) angle = moveAngle + (Math.random()-0.5) * Math.PI * 2.17
                    const ox = Math.cos(angle) * d
                    const oy = Math.sin(angle) * d
                    // Radius and opacity shrink with t (distance from dot)
                    const rsize = spraySize * (0.070 + 0.057 * (1 - t) + Math.random() * 0.07) // slightly larger minimum particle
                    const alpha = (1 - t) * (0.38 + 0.54 * Math.min(velocity / 25, 1.0))
                    newSprays.push({
                        x: x + ox,
                        y: y + oy,
                        r: rsize,
                        o: Math.max(0.12, Math.min(0.88, alpha)),
                    })
                }
                startTransition(() => setSprays(prevSprays => [...prevSprays.slice(-480), ...newSprays]))
            }
            return {x, y}
        })
    }, [sprayCount, sprayRadius, spraySize])

    // Attach pointer event
    useEffect(() => {
        const node = ref.current
        if (!node || isStatic) return
        node.addEventListener("pointermove", handlePointerMove)
        return () => node.removeEventListener("pointermove", handlePointerMove)
    }, [handlePointerMove, isStatic])

    // Remove spray particles after inactivity
    useEffect(() => {
        if (isStatic) return
        let fadeIntervalId: number | null = null
        let idleTimeoutId: number | null = null
        function startFadeOut() {
            if (fadeIntervalId) window.clearInterval(fadeIntervalId)
            fadeIntervalId = window.setInterval(() => {
                startTransition(() => setSprays((oldSprays) => oldSprays.map(s => ({...s, o: Math.max(0, s.o - 0.045)}))))
            }, 33)
        }
        function stopFadeOut() {
            if (fadeIntervalId) { window.clearInterval(fadeIntervalId); fadeIntervalId = null }
        }
        function handlePointerMove() {
            stopFadeOut()
            if (idleTimeoutId) window.clearTimeout(idleTimeoutId)
            idleTimeoutId = window.setTimeout(() => {
                startFadeOut()
            }, 90)
        }
        const node = ref.current
        if (!node) return
        node.addEventListener("pointermove", handlePointerMove)
        return () => {
            if (fadeIntervalId) window.clearInterval(fadeIntervalId)
            if (idleTimeoutId) window.clearTimeout(idleTimeoutId)
            node.removeEventListener("pointermove", handlePointerMove)
        }
    }, [isStatic])

    // Remove fully transparent sprays
    useEffect(() => {
        if (!sprays.length) return
        let cleanupId = window.setTimeout(() => {
            startTransition(() => setSprays(sprays => sprays.filter(s => s.o > 0.02)))
        }, 320)
        return () => window.clearTimeout(cleanupId)
    }, [sprays])

    // Hide native cursor
    useEffect(() => {
        const node = ref.current
        if (!node) return
        const saved = node.style.cursor
        node.style.cursor = "none"
        return () => { node.style.cursor = saved }
    }, [])

    if (isStatic) {
        return <div style={{...style, width: "100%", height: "100%", background: "transparent", position: "relative", pointerEvents: "none" }} />
    }

    return (
        <div
            ref={ref}
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                background: "transparent",
                overflow: "hidden"
            }}
            tabIndex={0}
            role="presentation"
            aria-label="Graffiti Cursor Interactive Area"
        >
            {/* Spray Particles */}
            <svg width="100%" height="100%" style={{position: "absolute", left: 0, top: 0, pointerEvents: "none"}}>
                {sprays.map((s, i) => (
                    <circle key={i} cx={s.x} cy={s.y} r={s.r} fill={sprayColor} fillOpacity={s.o}
                        style={{
                            transition: "fill-opacity 0.29s cubic-bezier(0.4,0,0.2,1)",
                            opacity: s.o,
                        }}
                    />
                ))}
            </svg>
            {/* Green Dot Cursor */}
            <div
                style={{
                    position: "absolute",
                    left: cursor.x - 7,
                    top: cursor.y - 7,
                    width: 14,
                    height: 14,
                    background: dotColor,
                    borderRadius: "50%",
                    boxShadow: `0 2px 6px 0 ${dotColor}99`,
                    pointerEvents: "none",
                }}
            />
        </div>
    )
}

addPropertyControls(GraffitiCursor, {
    dotColor: {
        type: ControlType.Color,
        title: "Dot Color",
        defaultValue: "#2ee800"
    },
    sprayColor: {
        type: ControlType.Color,
        title: "Spray Color",
        defaultValue: "#50ff79"
    },
    sprayCount: {
        type: ControlType.Number,
        title: "Particles/Move",
        min: 2,
        max: 30,
        defaultValue: 6,
        step: 1,
    },
    spraySize: {
        type: ControlType.Number,
        title: "Spray Size",
        min: 1,
        max: 8,
        defaultValue: 3.5,
        step: 0.1,
    },
    sprayRadius: {
        type: ControlType.Number,
        title: "Spray Radius",
        min: 1,
        max: 32,
        defaultValue: 16,
        step: 1,
    },
})
