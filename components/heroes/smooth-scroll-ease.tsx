// User request: remove slot/children model and make ScrollEase apply smooth scrolling globally while at least one instance exists; show a small selectable helper badge in Framer canvas/static only; render no visible UI at runtime; keep Intensity control; avoid browser globals during render; preserve modifier-key zoom, editable fields, nested scrollables, reduced-motion, deduplicated listeners, and correct cleanup.
import { useEffect, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface MyComponentProps {
    intensity: number
    style?: CSSProperties
}

type GlobalManager = {
    instances: Map<number, number>
    nextId: number
    targetY: number
    currentY: number
    running: boolean
    rafId: number
    wheelListener?: (event: WheelEvent) => void
    visibilityListener?: () => void
}

const manager: GlobalManager = {
    instances: new Map(),
    nextId: 1,
    targetY: 0,
    currentY: 0,
    running: false,
    rafId: 0,
}

function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value))
}

function getEffectiveIntensity(): number {
    if (manager.instances.size === 0) return 70
    let max = 0
    manager.instances.forEach((value) => {
        if (value > max) max = value
    })
    return clamp(max, 0, 100)
}

function isEditableElement(target: EventTarget | null): boolean {
    if (!(target instanceof Element)) return false
    return Boolean(
        target.closest(
            'input, textarea, select, [contenteditable="true"], [contenteditable=""], [contenteditable="plaintext-only"]'
        )
    )
}

function isScrollableStyle(overflowY: string): boolean {
    return (
        overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay"
    )
}

function canNestedScrollableConsumeDelta(
    target: EventTarget | null,
    deltaY: number
): boolean {
    if (!(target instanceof Element) || typeof window === "undefined") return false

    let node: Element | null = target
    while (node && node !== document.body && node !== document.documentElement) {
        if (node instanceof HTMLElement) {
            const style = window.getComputedStyle(node)
            const overflowY = style.overflowY
            if (isScrollableStyle(overflowY) && node.scrollHeight > node.clientHeight) {
                if (deltaY > 0 && node.scrollTop + node.clientHeight < node.scrollHeight)
                    return true
                if (deltaY < 0 && node.scrollTop > 0) return true
            }
        }
        node = node.parentElement
    }
    return false
}

function getPageMaxScroll(): number {
    if (typeof window === "undefined" || typeof document === "undefined") return 0
    const doc = document.documentElement
    const body = document.body
    const scrollHeight = Math.max(
        doc?.scrollHeight ?? 0,
        body?.scrollHeight ?? 0,
        doc?.offsetHeight ?? 0,
        body?.offsetHeight ?? 0
    )
    return Math.max(0, scrollHeight - window.innerHeight)
}

function stopAnimation(): void {
    if (typeof window === "undefined") return
    if (manager.rafId) window.cancelAnimationFrame(manager.rafId)
    manager.running = false
    manager.rafId = 0
}

function startAnimation(): void {
    if (typeof window === "undefined") return
    if (manager.running) return
    manager.running = true

    const animate = () => {
        const intensity = getEffectiveIntensity()
        const ease = 0.16 - (intensity / 100) * 0.14
        manager.currentY += (manager.targetY - manager.currentY) * ease

        if (Math.abs(manager.targetY - manager.currentY) < 0.5) {
            manager.currentY = manager.targetY
            window.scrollTo(0, manager.currentY)
            stopAnimation()
            return
        }

        window.scrollTo(0, manager.currentY)
        manager.rafId = window.requestAnimationFrame(animate)
    }

    manager.rafId = window.requestAnimationFrame(animate)
}

function attachGlobalBehavior(): void {
    if (typeof window === "undefined" || typeof document === "undefined") return
    if (manager.wheelListener) return

    manager.targetY = window.scrollY || window.pageYOffset || 0
    manager.currentY = manager.targetY

    manager.wheelListener = (event: WheelEvent) => {
        if (event.defaultPrevented) return
        if (event.ctrlKey || event.metaKey) return
        if (isEditableElement(event.target)) return
        if (canNestedScrollableConsumeDelta(event.target, event.deltaY)) return

        const reducedMotion = window.matchMedia
            ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
            : false
        if (reducedMotion) return

        const max = getPageMaxScroll()
        if (max <= 0) return

        if (!manager.running) {
            const y = window.scrollY || window.pageYOffset || 0
            manager.currentY = y
            manager.targetY = y
        }

        const intensity = getEffectiveIntensity()
        const wheelMult = 1 - (intensity / 100) * 0.4
        const next = clamp(
            manager.targetY + event.deltaY * wheelMult,
            0,
            getPageMaxScroll()
        )

        if (next === manager.targetY) return

        event.preventDefault()
        manager.targetY = next
        startAnimation()
    }

    manager.visibilityListener = () => {
        if (typeof document === "undefined") return
        if (document.visibilityState !== "visible") stopAnimation()
    }

    window.addEventListener("wheel", manager.wheelListener, { passive: false })
    document.addEventListener("visibilitychange", manager.visibilityListener)
}

function detachGlobalBehavior(): void {
    if (typeof window === "undefined" || typeof document === "undefined") return
    stopAnimation()
    if (manager.wheelListener) {
        window.removeEventListener("wheel", manager.wheelListener)
        manager.wheelListener = undefined
    }
    if (manager.visibilityListener) {
        document.removeEventListener("visibilitychange", manager.visibilityListener)
        manager.visibilityListener = undefined
    }
}

/**
 * @framerIntrinsicWidth 100
 * @framerIntrinsicHeight 100
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function ScrollEase(props: MyComponentProps) {
    const { intensity = 70 } = props
    const isStatic = useIsStaticRenderer()

    useEffect(() => {
        const clampedIntensity = clamp(intensity, 0, 100)
        if (isStatic || typeof window === "undefined") return

        const id = manager.nextId++
        manager.instances.set(id, clampedIntensity)
        attachGlobalBehavior()

        return () => {
            manager.instances.delete(id)
            if (manager.instances.size === 0) detachGlobalBehavior()
        }
    }, [intensity, isStatic])

    if (!isStatic) return null

    return (
        <div
            style={{
                position: "relative",
                backgroundColor: "transparent",
                border: "none",
                borderRadius: 0,
                color: "transparent",
                fontSize: 0,
                lineHeight: 0,
                ...props.style,
                width: 100,
                height: 100,
            }}
        />
    )
}

addPropertyControls(ScrollEase, {
    intensity: {
        type: ControlType.Number,
        title: "Intensity",
        defaultValue: 70,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
    },
})
