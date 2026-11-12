import {
    Children,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
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


type EaseName = "out" | "inOut" | "expo" | "linear"

interface FlipModalProps {
    children?: React.ReactNode
    columns: number
    gap: number
    aspect: number
    radius: number
    modalWidth: number
    modalHeight: number
    keepAspect: boolean
    duration: number
    ease: EaseName
    backdropColor: string
    backdropBlur: number
    showClose: boolean
    closeOnBackdrop: boolean
}

const EASES: Record<EaseName, string> = {
    out: "cubic-bezier(0.22, 1, 0.36, 1)",
    inOut: "cubic-bezier(0.65, 0, 0.35, 1)",
    expo: "cubic-bezier(0.16, 1, 0.3, 1)",
    linear: "linear",
}

const SWATCHES = [
    ["#FF9A5C", "#F0576E"],
    ["#6C8CF6", "#7EE2CD"],
    ["#C6AAFF", "#FFC470"],
    ["#F0576E", "#C6AAFF"],
    ["#7EE2CD", "#6C8CF6"],
    ["#FFC470", "#FF9A5C"],
    ["#8FA7FF", "#F58EA8"],
    ["#FFB27A", "#B98CFF"],
    ["#63D6C0", "#FFD37A"],
]

const VIEWPORT_PAD = 24
const FOCUSABLE =
    'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'

// useLayoutEffect warns during server rendering, and the FLIP read has to happen
// before paint, so take the layout version only where there is a layout.
const useIsomorphicLayoutEffect =
    typeof window !== "undefined" ? useLayoutEffect : useEffect

/**
 * FLIP Modal - a tile travels out of the grid and becomes the modal, then
 * returns to the exact slot it came from.
 *
 * This is a real FLIP: the tile is measured, moved to its final geometry, then
 * transformed back to where it started and released. Only transform animates,
 * so nothing reflows during the transit.
 *
 * The opened layer is the same DOM node as the tile, not a copy of it, so a
 * playing video, a loaded iframe or any component state inside carries straight
 * through the transition.
 *
 * @framerIntrinsicWidth 960
 * @framerIntrinsicHeight 620
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function FlipModal(props: FlipModalProps) {
    const {
        children,
        columns,
        gap,
        aspect,
        radius,
        modalWidth,
        modalHeight,
        keepAspect,
        duration,
        ease,
        backdropColor,
        backdropBlur,
        showClose,
        closeOnBackdrop,
    } = props

    const isStatic = useIsStaticRenderer()
    const items = Children.toArray(children)
    const usingSwatches = items.length === 0
    const count = usingSwatches ? SWATCHES.length : items.length
    const cols = Math.max(1, Math.round(columns))
    const safeAspect = Math.max(0.2, aspect)

    const cellRefs = useRef<(HTMLDivElement | null)[]>([])
    const moverRefs = useRef<(HTMLDivElement | null)[]>([])
    const backdropRef = useRef<HTMLDivElement>(null)
    const firstRect = useRef<DOMRect | null>(null)
    const returnFocus = useRef<HTMLElement | null>(null)
    const closing = useRef(false)
    const safety = useRef<number | null>(null)

    const [open, setOpen] = useState<{
        index: number
        left: number
        top: number
        width: number
        height: number
    } | null>(null)

    const reduced = () =>
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches

    const targetRect = () => {
        // innerWidth, not clientWidth. This is measured while the scrollbar is
        // still there, but the scroll lock removes it a moment later, and a
        // fixed layer is then centred in the full window. Measuring the smaller
        // box here would leave the panel half a scrollbar off centre.
        const vw = window.innerWidth
        const vh = window.innerHeight
        let width = Math.min(modalWidth, vw - VIEWPORT_PAD * 2)
        let height = Math.min(
            (vh * Math.min(Math.max(modalHeight, 20), 100)) / 100,
            vh - VIEWPORT_PAD * 2
        )
        if (keepAspect) {
            if (width / height > safeAspect) width = height * safeAspect
            else height = width / safeAspect
        }
        return {
            left: (vw - width) / 2,
            top: (vh - height) / 2,
            width,
            height,
        }
    }

    const lockScroll = () => {
        const bar = window.innerWidth - document.documentElement.clientWidth
        document.body.style.overflow = "hidden"
        if (bar > 0) document.body.style.paddingRight = bar + "px"
    }

    const unlockScroll = () => {
        document.body.style.overflow = ""
        document.body.style.paddingRight = ""
    }

    const openAt = (index: number) => {
        if (isStatic || open) return
        const mover = moverRefs.current[index]
        if (!mover) return
        firstRect.current = mover.getBoundingClientRect()
        returnFocus.current = document.activeElement as HTMLElement
        const rect = targetRect()
        lockScroll()
        setOpen({ index, ...rect })
    }

    const close = () => {
        if (!open || closing.current) return
        const mover = moverRefs.current[open.index]
        const cell = cellRefs.current[open.index]
        if (!mover || !cell) {
            finish()
            return
        }

        // Measured now, not remembered from opening: the page may have moved,
        // or the grid may have reflowed underneath.
        const to = cell.getBoundingClientRect()
        const from = mover.getBoundingClientRect()
        if (reduced() || duration <= 0 || from.width === 0) {
            finish()
            return
        }

        closing.current = true
        // transitionend is not a promise. A background tab, an interrupted
        // transition or a display change can all swallow it, and without this
        // the panel would stay open with the page scroll still locked.
        if (safety.current !== null) window.clearTimeout(safety.current)
        safety.current = window.setTimeout(finish, duration * 1000 + 120)

        if (backdropRef.current) backdropRef.current.style.opacity = "0"
        mover.style.transition = `transform ${duration}s ${EASES[ease] || EASES.out}`
        mover.style.transformOrigin = "top left"
        mover.style.transform =
            "translate(" +
            (to.left - from.left) +
            "px," +
            (to.top - from.top) +
            "px) scale(" +
            to.width / from.width +
            "," +
            to.height / from.height +
            ")"
    }

    const finish = () => {
        if (safety.current !== null) {
            window.clearTimeout(safety.current)
            safety.current = null
        }
        closing.current = false
        const mover = open ? moverRefs.current[open.index] : null
        if (mover) {
            mover.style.transition = ""
            mover.style.transform = ""
            mover.style.transformOrigin = ""
        }
        unlockScroll()
        setOpen(null)
        const back = returnFocus.current
        if (back && typeof back.focus === "function") back.focus()
    }

    // The Invert and Play halves of FLIP. First was read before the state change.
    useIsomorphicLayoutEffect(() => {
        if (!open) return
        const mover = moverRefs.current[open.index]
        const first = firstRect.current
        if (!mover || !first) return

        mover.focus({ preventScroll: true })
        if (reduced() || duration <= 0) return

        const last = mover.getBoundingClientRect()
        if (last.width === 0 || last.height === 0) return

        mover.style.transition = "none"
        mover.style.transformOrigin = "top left"
        mover.style.transform =
            "translate(" +
            (first.left - last.left) +
            "px," +
            (first.top - last.top) +
            "px) scale(" +
            first.width / last.width +
            "," +
            first.height / last.height +
            ")"

        // Read forces the inverted transform to be committed before the
        // transition is attached, or the browser folds both into one frame.
        void mover.offsetWidth

        mover.style.transition = `transform ${duration}s ${EASES[ease] || EASES.out}`
        mover.style.transform = "translate(0px, 0px) scale(1, 1)"
    }, [open ? open.index : -1])

    // Keep the opened layer centred if the window changes under it.
    useEffect(() => {
        if (!open || isStatic) return
        const onResize = () => {
            setOpen((prev) => (prev ? { ...prev, ...targetRect() } : prev))
        }
        window.addEventListener("resize", onResize)
        return () => window.removeEventListener("resize", onResize)
    }, [open, isStatic, modalWidth, modalHeight, keepAspect, safeAspect])

    useEffect(() => {
        return () => {
            if (safety.current !== null) window.clearTimeout(safety.current)
            if (typeof document !== "undefined") unlockScroll()
        }
    }, [])

    const onMoverKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (!open) return
        if (event.key === "Escape") {
            event.stopPropagation()
            close()
            return
        }
        if (event.key !== "Tab") return

        // Focus stays inside the opened layer while it is modal.
        const mover = moverRefs.current[open.index]
        if (!mover) return
        const nodes = Array.from(
            mover.querySelectorAll<HTMLElement>(FOCUSABLE)
        ).filter((el) => el.offsetParent !== null || el === document.activeElement)
        if (nodes.length === 0) {
            event.preventDefault()
            return
        }
        const first = nodes[0]
        const last = nodes[nodes.length - 1]
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault()
            last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault()
            first.focus()
        }
    }

    const onCellKeyDown = (
        event: React.KeyboardEvent<HTMLDivElement>,
        index: number
    ) => {
        if (event.key !== "Enter" && event.key !== " ") return
        event.preventDefault()
        openAt(index)
    }

    const onTransitionEnd = (event: React.TransitionEvent<HTMLDivElement>) => {
        if (event.propertyName !== "transform") return
        if (closing.current) finish()
    }

    const swatch = (index: number) => {
        const pair = SWATCHES[index % SWATCHES.length]
        return (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    background:
                        "linear-gradient(135deg, " + pair[0] + ", " + pair[1] + ")",
                    display: "flex",
                    alignItems: "flex-end",
                    padding: 16,
                    boxSizing: "border-box",
                    font: "600 14px/1 sans-serif",
                    color: "rgba(255, 255, 255, 0.88)",
                }}
            >
                {("0" + (index + 1)).slice(-2)}
            </div>
        )
    }

    return (
        <div style={{ position: "relative", width: "100%" }}>
            {open && (
                <div
                    ref={backdropRef}
                    onClick={closeOnBackdrop ? close : undefined}
                    style={{
                        position: "fixed",
                        inset: 0,
                        zIndex: 2147483000,
                        background: backdropColor,
                        backdropFilter: backdropBlur
                            ? `blur(${backdropBlur}px)`
                            : undefined,
                        WebkitBackdropFilter: backdropBlur
                            ? `blur(${backdropBlur}px)`
                            : undefined,
                        opacity: 1,
                        transition: `opacity ${duration}s ${EASES[ease] || EASES.out}`,
                    }}
                />
            )}

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                    gap,
                    width: "100%",
                }}
            >
                {Array.from({ length: count }).map((_, i) => {
                    const isOpen = open != null && open.index === i
                    return (
                        <div
                            key={i}
                            ref={(el) => {
                                cellRefs.current[i] = el
                            }}
                            role={isOpen ? undefined : "button"}
                            tabIndex={isOpen ? -1 : 0}
                            aria-label={isOpen ? undefined : "Open item " + (i + 1)}
                            onClick={() => openAt(i)}
                            onKeyDown={(e) => onCellKeyDown(e, i)}
                            style={{
                                position: "relative",
                                width: "100%",
                                aspectRatio: String(safeAspect),
                                cursor: isOpen ? "default" : "zoom-in",
                            }}
                        >
                            <div
                                ref={(el) => {
                                    moverRefs.current[i] = el
                                }}
                                role={isOpen ? "dialog" : undefined}
                                aria-modal={isOpen ? true : undefined}
                                tabIndex={isOpen ? -1 : undefined}
                                onKeyDown={isOpen ? onMoverKeyDown : undefined}
                                onTransitionEnd={isOpen ? onTransitionEnd : undefined}
                                style={
                                    isOpen
                                        ? {
                                              position: "fixed",
                                              left: open.left,
                                              top: open.top,
                                              width: open.width,
                                              height: open.height,
                                              zIndex: 2147483001,
                                              borderRadius: radius,
                                              overflow: "hidden",
                                              outline: "none",
                                              willChange: "transform",
                                          }
                                        : {
                                              position: "absolute",
                                              inset: 0,
                                              borderRadius: radius,
                                              overflow: "hidden",
                                          }
                                }
                            >
                                {usingSwatches ? swatch(i) : items[i]}

                                {isOpen && showClose && (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            close()
                                        }}
                                        aria-label="Close"
                                        style={{
                                            position: "absolute",
                                            top: 14,
                                            right: 14,
                                            width: 34,
                                            height: 34,
                                            borderRadius: 999,
                                            border: "1px solid rgba(255, 255, 255, 0.22)",
                                            background: "rgba(10, 10, 13, 0.55)",
                                            color: "rgb(245, 245, 250)",
                                            font: "500 17px/1 sans-serif",
                                            cursor: "pointer",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            backdropFilter: "blur(6px)",
                                            WebkitBackdropFilter: "blur(6px)",
                                        }}
                                    >
                                        ×
                                    </button>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

FlipModal.displayName = "FLIP Modal"

addPropertyControls(FlipModal, {
    children: {
        type: ControlType.Slot,
        title: "Items",
        description: "Tiles for the grid. Empty shows placeholders.",
    },
    columns: {
        type: ControlType.Number,
        title: "Columns",
        defaultValue: 3,
        min: 1,
        max: 8,
        step: 1,
        displayStepper: true,
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 16,
        min: 0,
        max: 120,
        step: 2,
        unit: "px",
    },
    aspect: {
        type: ControlType.Number,
        title: "Aspect",
        description: "Tile width divided by height. 1 is square, 1.5 is landscape.",
        defaultValue: 1,
        min: 0.3,
        max: 3,
        step: 0.05,
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 16,
        min: 0,
        max: 80,
        step: 1,
        unit: "px",
    },
    modalWidth: {
        type: ControlType.Number,
        title: "Open Width",
        defaultValue: 900,
        min: 200,
        max: 2000,
        step: 20,
        unit: "px",
    },
    modalHeight: {
        type: ControlType.Number,
        title: "Open Height",
        description: "Share of the window height the opened tile may use.",
        defaultValue: 86,
        min: 20,
        max: 100,
        step: 1,
        unit: "%",
    },
    keepAspect: {
        type: ControlType.Boolean,
        title: "Keep Aspect",
        description:
            "Holds the tile ratio when open, so a photo is never stretched. Turn off for cards of text.",
        defaultValue: true,
    },
    duration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 0.5,
        min: 0,
        max: 2,
        step: 0.05,
        unit: "s",
    },
    ease: {
        type: ControlType.Enum,
        title: "Ease",
        defaultValue: "out",
        options: ["out", "expo", "inOut", "linear"],
        optionTitles: ["Ease Out", "Expo Out", "Ease In Out", "Linear"],
    },
    backdropColor: {
        type: ControlType.Color,
        title: "Backdrop",
        defaultValue: "rgba(8, 8, 11, 0.72)",
    },
    backdropBlur: {
        type: ControlType.Number,
        title: "Backdrop Blur",
        defaultValue: 8,
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
    },
    showClose: {
        type: ControlType.Boolean,
        title: "Close Button",
        defaultValue: true,
    },
    closeOnBackdrop: {
        type: ControlType.Boolean,
        title: "Click Outside",
        description: "Closes when the backdrop is clicked. Escape always closes.",
        defaultValue: true,
    },
})
