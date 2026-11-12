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


type Props = {
    enabledOnMobileOnly: boolean
}

/** @framerDisableUnlink */
export default function MobileHoverClickBridge(props: Props) {
    const { enabledOnMobileOnly } = props
    const overlayRef = React.useRef<HTMLDivElement>(null)
    const hoveredElements = React.useRef<Set<Element>>(new Set())

    const isMobile = React.useMemo(() => {
        if (typeof window === "undefined") return false
        const hasTouch =
            "ontouchstart" in window ||
            navigator.maxTouchPoints > 0 ||
            window.matchMedia("(pointer: coarse)").matches
        const isSmallScreen = window.matchMedia("(max-width: 809px)").matches
        return hasTouch && isSmallScreen
    }, [])

    const active = enabledOnMobileOnly ? isMobile : true

    // --- NATIVE OS SCROLL LOCK ---
    // This stops iOS/Android browsers from hijacking the touch into a page scroll
    React.useEffect(() => {
        const overlay = overlayRef.current
        if (!overlay || !active) return

        const preventNativeScroll = (e: TouchEvent) => {
            if (e.cancelable) {
                e.preventDefault() // Locks native scrolling ONLY while touching this specific frame
            }
        }

        // passive: false is the magic key that allows preventDefault() to work on modern mobile browsers
        overlay.addEventListener("touchmove", preventNativeScroll, {
            passive: false,
        })

        return () => {
            overlay.removeEventListener("touchmove", preventNativeScroll)
        }
    }, [active])

    // --- DISPATCHERS ---

    const dispatchLocalEvent = (
        target: Element,
        baseName: string,
        touch: {
            clientX: number
            clientY: number
            screenX: number
            screenY: number
        },
        bubbles: boolean
    ) => {
        const params = {
            bubbles,
            cancelable: true,
            view: window,
            clientX: touch.clientX,
            clientY: touch.clientY,
            screenX: touch.screenX,
            screenY: touch.screenY,
        }

        const pointerEvent = new PointerEvent(`pointer${baseName}`, {
            ...params,
            pointerId: 1,
            pointerType: "mouse",
            isPrimary: true,
        })
        target.dispatchEvent(pointerEvent)

        const mouseEvent = new MouseEvent(`mouse${baseName}`, params)
        target.dispatchEvent(mouseEvent)
    }

    const dispatchGlobalEvent = (
        eventName: string,
        touch: {
            clientX: number
            clientY: number
            screenX: number
            screenY: number
        }
    ) => {
        const pointerEvent = new PointerEvent(eventName, {
            bubbles: false,
            cancelable: true,
            view: window,
            clientX: touch.clientX,
            clientY: touch.clientY,
            screenX: touch.screenX,
            screenY: touch.screenY,
            pointerId: 1,
            pointerType: "mouse",
            isPrimary: true,
        })
        window.dispatchEvent(pointerEvent)
    }

    // --- DOM RAYCASTING ---

    const getElementsUnderTouch = (touch: React.Touch): Element[] => {
        if (typeof document.elementsFromPoint === "function") {
            const elements = Array.from(
                document.elementsFromPoint(touch.clientX, touch.clientY) || []
            )
            return elements.filter((el) => el !== overlayRef.current)
        }
        return []
    }

    const getLeafElements = (elements: Element[]): Element[] => {
        return elements.filter((el) => {
            return !elements.some((other) => other !== el && el.contains(other))
        })
    }

    const updateHoverStates = (touch: React.Touch, isEnd = false) => {
        const currentElements = isEnd ? [] : getElementsUnderTouch(touch)
        const currentSet = new Set(currentElements)

        hoveredElements.current.forEach((el) => {
            if (!currentSet.has(el)) {
                dispatchLocalEvent(el, "out", touch, true)
                dispatchLocalEvent(el, "leave", touch, false)
                hoveredElements.current.delete(el)
            }
        })

        if (isEnd) return

        currentElements.forEach((el) => {
            if (!hoveredElements.current.has(el)) {
                dispatchLocalEvent(el, "over", touch, true)
                dispatchLocalEvent(el, "enter", touch, false)
                hoveredElements.current.add(el)
            }
        })
    }

    // --- EVENT HANDLERS ---

    const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
        if (!active) return
        event.stopPropagation() // Block Framer's JS Scroll components from stealing the touch

        const touch = event.touches[0]
        updateHoverStates(touch)

        const leaves = getLeafElements(getElementsUnderTouch(touch))
        leaves.forEach((el) => {
            dispatchLocalEvent(el, "down", touch, true)
        })

        dispatchGlobalEvent("pointerdown", touch)
        dispatchGlobalEvent("pointermove", touch)
    }

    const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
        if (!active) return
        event.stopPropagation() // Block Framer's JS Scroll components from stealing the touch

        const touch = event.touches[0]
        updateHoverStates(touch)

        const leaves = getLeafElements(getElementsUnderTouch(touch))
        leaves.forEach((el) => {
            dispatchLocalEvent(el, "move", touch, true)
        })

        dispatchGlobalEvent("pointermove", touch)
    }

    const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
        if (!active) return
        event.stopPropagation() // Block Framer's JS Scroll components from stealing the touch

        const touch = event.changedTouches[0]
        const leaves = getLeafElements(getElementsUnderTouch(touch))

        leaves.forEach((el) => {
            dispatchLocalEvent(el, "up", touch, true)

            const clickEvent = new MouseEvent("click", {
                bubbles: true,
                cancelable: true,
                view: window,
                clientX: touch.clientX,
                clientY: touch.clientY,
            })
            el.dispatchEvent(clickEvent)
        })

        updateHoverStates(touch, true)

        dispatchGlobalEvent("pointerup", touch)
        const offScreenCoords = {
            clientX: -9999,
            clientY: -9999,
            screenX: -9999,
            screenY: -9999,
        }
        dispatchGlobalEvent("pointermove", offScreenCoords)
    }

    if (!active) return null

    return (
        <div
            ref={overlayRef}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                background: "transparent",
                opacity: 0,
                zIndex: 9999,
                pointerEvents: "auto",
                touchAction: "none", // Continues to provide base-level defense against scrolling
            }}
        />
    )
}

MobileHoverClickBridge.defaultProps = {
    enabledOnMobileOnly: true,
}

addPropertyControls(MobileHoverClickBridge, {
    enabledOnMobileOnly: {
        type: ControlType.Boolean,
        title: "Mobile Only",
        defaultValue: true,
        description:
            "Need help or custom work? [Contact Abdelrahman Farghaly](https://x.com/UX_Abdelrahman/)",
    },
})
