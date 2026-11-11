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


// Made with 💛 by Karim Saif

type CarouselItem = {
    title: string
    image?: string
    alt?: string
}

type Props = {
    items: CarouselItem[]
    background: string
    color: string
    slideWidth: number
    inactiveScale: number
    step: number
    radius: number
    bounce: number
    duration: number
    stepDuration: number
    showTitles: boolean
    titleSize: number
    fontFamily: string
    fontWeight: number
    showControls: boolean
    showDots: boolean
    startIndex: number
    swipeEnabled: boolean
    keyboardEnabled: boolean
    gap: number
    controlBackground: string
    controlColor: string
    ariaLabel: string
}

const defaultItems: CarouselItem[] = [
    {
        title: "Cable Car Station",
        image: "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?w=800&q=85",
    },
    {
        title: "Quiet Architecture",
        image: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800&q=85",
    },
    {
        title: "Cherry Blossoms",
        image: "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=800&q=85",
    },
    {
        title: "Morning Coffee",
        image: "https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=800&q=85",
    },
    {
        title: "Mountain Escape",
        image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=85",
    },
    {
        title: "Ocean Light",
        image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=85",
    },
]

function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max)
}

function springAt(t: number, bounce: number, duration: number) {
    const zeta = 1 - clamp(bounce, 0, 0.85)
    const omega = (2 * Math.PI) / Math.max(duration, 0.05)
    const damped = omega * Math.sqrt(1 - zeta * zeta)

    if (damped < 0.00001) {
        return 1 - Math.exp(-omega * t) * (1 + omega * t)
    }

    return (
        1 -
        Math.exp(-zeta * omega * t) *
            (Math.cos(damped * t) +
                ((zeta * omega) / damped) * Math.sin(damped * t))
    )
}

function springEasing(bounce: number, duration: number) {
    const zeta = 1 - clamp(bounce, 0, 0.85)
    const omega = (2 * Math.PI) / Math.max(duration, 0.05)
    const total = Math.log(1000) / (zeta * omega)
    const samples: string[] = []

    for (let i = 0; i <= 48; i++) {
        const value =
            i === 48 ? 1 : springAt((i / 48) * total, bounce, duration)

        samples.push(value.toFixed(4))
    }

    return {
        easing: `linear(${samples.join(",")})`,
        ms: Math.round(total * 1000),
    }
}

function Chevron({ direction }: { direction: -1 | 1 }) {
    return (
        <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <path
                d={direction === -1 ? "M15 18L9 12L15 6" : "M9 18L15 12L9 6"}
            />
        </svg>
    )
}

function useReducedMotion() {
    const [reduced, setReduced] = React.useState(false)

    React.useEffect(() => {
        if (typeof window === "undefined") return

        const media = window.matchMedia("(prefers-reduced-motion: reduce)")

        const update = () => setReduced(media.matches)
        update()

        media.addEventListener?.("change", update)

        return () => {
            media.removeEventListener?.("change", update)
        }
    }, [])

    return reduced
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 1100
 * @framerIntrinsicHeight 700
 */
export default function KarimSaifStaircaseCarousel(props: Props) {
    const {
        items = defaultItems,
        background = "#F0EFEC",
        color = "#242424",
        slideWidth = 230,
        inactiveScale = 0.8,
        step = 1,
        radius = 0,
        bounce = 0.1,
        duration = 0.8,
        stepDuration = 0.6,
        showTitles = true,
        titleSize = 20,
        fontFamily = "Inter, sans-serif",
        fontWeight = 500,
        showControls = true,
        showDots = true,
        startIndex = 2,
        swipeEnabled = true,
        keyboardEnabled = true,
        gap = 0,
        controlBackground = "#E3E1DD",
        controlColor = "#242424",
        ariaLabel = "Staircase photo carousel",
    } = props

    const safeItems = Array.isArray(items) ? items : []
    const count = safeItems.length
    const reducedMotion = useReducedMotion()
    const isStatic = RenderTarget.current() === RenderTarget.canvas

    const initialIndex = clamp(
        Math.round(startIndex),
        0,
        Math.max(0, count - 1)
    )

    const [active, setActive] = React.useState(initialIndex)
    const [containerWidth, setContainerWidth] = React.useState(1100)
    const [containerHeight, setContainerHeight] = React.useState(700)

    const rootRef = React.useRef<HTMLDivElement>(null)
    const pointerRef = React.useRef({
        id: -1,
        x: 0,
        y: 0,
        moved: false,
    })
    const suppressClickRef = React.useRef(false)

    React.useEffect(() => {
        setActive(initialIndex)
    }, [initialIndex])

    React.useEffect(() => {
        const element = rootRef.current
        if (!element) return

        const update = () => {
            const rect = element.getBoundingClientRect()
            setContainerWidth(rect.width)
            setContainerHeight(rect.height)
        }

        update()

        if (typeof ResizeObserver === "undefined") return

        const observer = new ResizeObserver(update)
        observer.observe(element)

        return () => observer.disconnect()
    }, [])

    const current = clamp(active, 0, Math.max(0, count - 1))

    const spring = React.useMemo(
        () => springEasing(bounce, duration),
        [bounce, duration]
    )

    const canAnimate = !isStatic && !reducedMotion

    const effectiveWidth = Math.max(
        60,
        Math.min(slideWidth, Math.max(60, containerWidth * 0.65))
    )

    const photoHeight = (effectiveWidth * 4) / 3
    const stride = effectiveWidth + gap

    const titleBelow =
        containerWidth < effectiveWidth + Math.max(140, titleSize * 8)

    const goTo = React.useCallback(
        (index: number) => {
            if (count <= 0) return

            setActive(clamp(index, 0, count - 1))
        },
        [count]
    )

    const next = React.useCallback(() => {
        goTo(current + 1)
    }, [current, goTo])

    const previous = React.useCallback(() => {
        goTo(current - 1)
    }, [current, goTo])

    const handleKeyDown = (event: React.KeyboardEvent) => {
        if (!keyboardEnabled) return

        if (event.key === "ArrowRight" || event.key === "ArrowDown") {
            event.preventDefault()
            next()
        } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
            event.preventDefault()
            previous()
        } else if (event.key === "Home") {
            event.preventDefault()
            goTo(0)
        } else if (event.key === "End") {
            event.preventDefault()
            goTo(count - 1)
        }
    }

    const handlePointerDown = (event: React.PointerEvent) => {
        if (!swipeEnabled || count < 2) return
        if (event.pointerType === "mouse" && event.button !== 0) return

        pointerRef.current = {
            id: event.pointerId,
            x: event.clientX,
            y: event.clientY,
            moved: false,
        }
    }

    const handlePointerUp = (event: React.PointerEvent) => {
        const pointer = pointerRef.current
        if (!swipeEnabled || pointer.id !== event.pointerId) return

        const dx = event.clientX - pointer.x
        const dy = event.clientY - pointer.y

        if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) {
            pointer.moved = true
            suppressClickRef.current = true

            if (dx < 0) next()
            else previous()
        }

        pointer.id = -1
    }

    const handleClickCapture = (event: React.MouseEvent) => {
        if (!suppressClickRef.current) return
        event.preventDefault()
        event.stopPropagation()
        suppressClickRef.current = false
    }

    const transition = canAnimate
        ? `transform ${spring.ms}ms ${spring.easing}`
        : "none"

    const stepTransition = canAnimate
        ? `transform ${stepDuration}s ease-in-out`
        : "none"

    const stageLeft = (containerWidth - effectiveWidth) / 2
    const stageTop = (containerHeight - photoHeight) / 2

    const titleTop = titleBelow ? photoHeight + 12 : 0
    const titleLeft = titleBelow ? 0 : effectiveWidth + 16

    return (
        <div
            ref={rootRef}
            role="region"
            aria-roledescription="carousel"
            aria-label={ariaLabel}
            tabIndex={keyboardEnabled ? 0 : undefined}
            onKeyDown={handleKeyDown}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerCancel={() => {
                pointerRef.current.id = -1
            }}
            onClickCapture={handleClickCapture}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                minWidth: 0,
                minHeight: 0,
                overflow: "hidden",
                background,
                color,
                fontFamily,
                userSelect: "none",
                WebkitUserSelect: "none",
                touchAction: "pan-y",
                outlineOffset: -3,
                isolation: "isolate",
            }}
        >
            {count > 0 && (
                <div
                    style={{
                        position: "absolute",
                        left: stageLeft,
                        top: stageTop,
                        width: effectiveWidth,
                        height: photoHeight,
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            width: "max-content",
                            gap,
                            transform: `translate3d(${-current * stride}px,0,0)`,
                            transition,
                        }}
                    >
                        {safeItems.map((item, index) => {
                            const selected = index === current
                            const direction =
                                index < current ? -1 : index > current ? 1 : 0

                            const scale = selected ? 1 : inactiveScale
                            const vertical = direction * step * 100

                            const fallbackHue = (index * 47 + 200) % 360

                            return (
                                <button
                                    key={index}
                                    type="button"
                                    aria-label={`${index + 1} of ${count}: ${item.title}`}
                                    aria-current={selected ? "true" : undefined}
                                    tabIndex={selected ? 0 : -1}
                                    onClick={() => goTo(index)}
                                    style={{
                                        display: "block",
                                        position: "relative",
                                        flex: "0 0 auto",
                                        width: effectiveWidth,
                                        height: photoHeight,
                                        padding: 0,
                                        margin: 0,
                                        border: 0,
                                        borderRadius: radius,
                                        overflow: "hidden",
                                        cursor: "pointer",
                                        background: `linear-gradient(160deg,hsl(${fallbackHue},30%,80%),hsl(${(fallbackHue + 40) % 360},26%,58%))`,
                                        transform: `translateY(${vertical}%) scale(${scale})`,
                                        transition: stepTransition,
                                        transformOrigin: "center center",
                                        WebkitTapHighlightColor: "transparent",
                                    }}
                                >
                                    {item.image && (
                                        <img
                                            src={item.image}
                                            alt={item.alt || item.title || ""}
                                            draggable={false}
                                            loading={
                                                Math.abs(index - current) <= 1
                                                    ? "eager"
                                                    : "lazy"
                                            }
                                            decoding="async"
                                            style={{
                                                display: "block",
                                                width: "100%",
                                                height: "100%",
                                                objectFit: "cover",
                                                pointerEvents: "none",
                                            }}
                                        />
                                    )}
                                </button>
                            )
                        })}
                    </div>

                    {showTitles && (
                        <div
                            aria-hidden="true"
                            style={{
                                position: "absolute",
                                left: titleLeft,
                                top: titleTop,
                                width: titleBelow
                                    ? effectiveWidth
                                    : Math.max(
                                          100,
                                          containerWidth -
                                              stageLeft -
                                              effectiveWidth -
                                              24
                                      ),
                                height: titleBelow ? 40 : photoHeight,
                                display: "flex",
                                alignItems: titleBelow
                                    ? "flex-start"
                                    : "center",
                                justifyContent: titleBelow
                                    ? "center"
                                    : "flex-start",
                                pointerEvents: "none",
                                zIndex: -1,
                            }}
                        >
                            <span
                                key={current}
                                style={{
                                    fontSize: titleBelow
                                        ? Math.min(titleSize, 18)
                                        : titleSize,
                                    fontWeight,
                                    lineHeight: 1.2,
                                    letterSpacing: "-0.025em",
                                    whiteSpace: titleBelow
                                        ? "normal"
                                        : "nowrap",
                                    textAlign: titleBelow ? "center" : "left",
                                    animation: canAnimate
                                        ? "ks-title-enter 550ms cubic-bezier(.2,.8,.2,1) both"
                                        : "none",
                                }}
                            >
                                {safeItems[current]?.title}
                            </span>
                        </div>
                    )}
                </div>
            )}

            {showControls && count > 1 && (
                <div
                    onPointerDown={(event) => event.stopPropagation()}
                    style={{
                        position: "absolute",
                        left: "50%",
                        bottom: Math.max(
                            12,
                            Math.min(24, containerHeight * 0.04)
                        ),
                        transform: "translateX(-50%)",
                        zIndex: 10,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 12,
                        maxWidth: "calc(100% - 24px)",
                        minHeight: 42,
                        padding: "4px 10px",
                        borderRadius: 999,
                        background: controlBackground,
                        color: controlColor,
                        boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                    }}
                >
                    <button
                        type="button"
                        aria-label="Previous slide"
                        disabled={current === 0}
                        onClick={previous}
                        style={{
                            display: "grid",
                            placeItems: "center",
                            width: 32,
                            height: 32,
                            padding: 0,
                            border: 0,
                            borderRadius: "50%",
                            background: "transparent",
                            color: "inherit",
                            opacity: current === 0 ? 0.3 : 1,
                            cursor: current === 0 ? "default" : "pointer",
                        }}
                    >
                        <Chevron direction={-1} />
                    </button>

                    {showDots && count <= 14 ? (
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 7,
                            }}
                        >
                            {safeItems.map((item, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    aria-label={`Go to slide ${index + 1}: ${item.title}`}
                                    aria-current={
                                        index === current ? "true" : undefined
                                    }
                                    onClick={() => goTo(index)}
                                    style={{
                                        width: index === current ? 25 : 8,
                                        height: 8,
                                        border: 0,
                                        padding: 0,
                                        borderRadius: 999,
                                        background: "currentColor",
                                        opacity: index === current ? 1 : 0.3,
                                        cursor: "pointer",
                                        transition: canAnimate
                                            ? "width 250ms ease, opacity 250ms ease"
                                            : "none",
                                    }}
                                />
                            ))}
                        </div>
                    ) : (
                        <span
                            style={{
                                fontSize: 12,
                                minWidth: 58,
                                textAlign: "center",
                                fontVariantNumeric: "tabular-nums",
                            }}
                        >
                            {String(current + 1).padStart(2, "0")} /{" "}
                            {String(count).padStart(2, "0")}
                        </span>
                    )}

                    <button
                        type="button"
                        aria-label="Next slide"
                        disabled={current === count - 1}
                        onClick={next}
                        style={{
                            display: "grid",
                            placeItems: "center",
                            width: 32,
                            height: 32,
                            padding: 0,
                            border: 0,
                            borderRadius: "50%",
                            background: "transparent",
                            color: "inherit",
                            opacity: current === count - 1 ? 0.3 : 1,
                            cursor:
                                current === count - 1 ? "default" : "pointer",
                        }}
                    >
                        <Chevron direction={1} />
                    </button>
                </div>
            )}

            <div
                aria-live="polite"
                aria-atomic="true"
                style={{
                    position: "absolute",
                    width: 1,
                    height: 1,
                    padding: 0,
                    margin: -1,
                    overflow: "hidden",
                    clip: "rect(0,0,0,0)",
                    whiteSpace: "nowrap",
                    border: 0,
                }}
            >
                {count > 0
                    ? `Slide ${current + 1} of ${count}: ${safeItems[current]?.title}`
                    : "No carousel items"}
            </div>

            <style>
                {`
                    @keyframes ks-title-enter {
                        from {
                            opacity: 0;
                            transform: scale(0.55);
                            filter: blur(3px);
                        }
                        to {
                            opacity: 1;
                            transform: scale(1);
                            filter: blur(0);
                        }
                    }
                    @media (prefers-reduced-motion: reduce) {
                        @keyframes ks-title-enter {
                            from { opacity: 1; transform: none; filter: none; }
                            to { opacity: 1; transform: none; filter: none; }
                        }
                    }
                `}
            </style>
        </div>
    )
}

KarimSaifStaircaseCarousel.defaultProps = {
    items: defaultItems,
    background: "#F0EFEC",
    color: "#242424",
    slideWidth: 230,
    inactiveScale: 0.8,
    step: 1,
    radius: 0,
    bounce: 0.1,
    duration: 0.8,
    stepDuration: 0.6,
    showTitles: true,
    titleSize: 20,
    fontFamily: "Inter, sans-serif",
    fontWeight: 500,
    showControls: true,
    showDots: true,
    startIndex: 2,
    swipeEnabled: true,
    keyboardEnabled: true,
    gap: 0,
    controlBackground: "#E3E1DD",
    controlColor: "#242424",
    ariaLabel: "Staircase photo carousel",
}

addPropertyControls(KarimSaifStaircaseCarousel, {
    items: {
        type: ControlType.Array,
        title: "Photos",
        description:
            "Add, remove, and reorder the portrait images displayed in the staircase carousel.",
        control: {
            type: ControlType.Object,
            controls: {
                title: {
                    type: ControlType.String,
                    title: "Title",
                    description:
                        "The title displayed beside the selected photograph.",
                    defaultValue: "Photo Title",
                },
                image: {
                    type: ControlType.Image,
                    title: "Image",
                    description:
                        "Upload or select the photograph for this carousel item.",
                },
                alt: {
                    type: ControlType.String,
                    title: "Alt Text",
                    description:
                        "Accessible description of the image for screen readers.",
                    defaultValue: "",
                },
            },
        },
        defaultValue: defaultItems,
        maxCount: 30,
    },
    background: {
        type: ControlType.Color,
        title: "Background",
        description: "Set the background color behind the staircase gallery.",
        defaultValue: "#F0EFEC",
    },
    color: {
        type: ControlType.Color,
        title: "Text Color",
        description: "Set the color of carousel titles and text.",
        defaultValue: "#242424",
    },
    slideWidth: {
        type: ControlType.Number,
        title: "Photo Width",
        description:
            "Adjust the width of each portrait photograph. The aspect ratio remains 3:4.",
        defaultValue: 230,
        min: 80,
        max: 500,
        step: 1,
        unit: "px",
        displayStepper: true,
    },
    inactiveScale: {
        type: ControlType.Number,
        title: "Inactive Scale",
        description:
            "Control how much photographs shrink when they are not selected.",
        defaultValue: 0.8,
        min: 0.3,
        max: 1,
        step: 0.01,
        displayStepper: true,
    },
    step: {
        type: ControlType.Number,
        title: "Step Height",
        description:
            "Control the vertical staircase distance between selected and inactive photos, relative to photo height.",
        defaultValue: 1,
        min: 0,
        max: 2,
        step: 0.05,
        displayStepper: true,
    },
    gap: {
        type: ControlType.Number,
        title: "Photo Gap",
        description:
            "Set the horizontal spacing between consecutive photographs.",
        defaultValue: 0,
        min: 0,
        max: 100,
        step: 1,
        unit: "px",
    },
    radius: {
        type: ControlType.Number,
        title: "Corner Radius",
        description: "Adjust the rounded corners of every photograph.",
        defaultValue: 0,
        min: 0,
        max: 100,
        step: 1,
        unit: "px",
    },
    bounce: {
        type: ControlType.Number,
        title: "Spring Bounce",
        description:
            "Control the overshoot and bounce of horizontal carousel movement.",
        defaultValue: 0.1,
        min: 0,
        max: 0.5,
        step: 0.01,
    },
    duration: {
        type: ControlType.Number,
        title: "Spring Duration",
        description:
            "Adjust the response time of the horizontal spring animation.",
        defaultValue: 0.8,
        min: 0.2,
        max: 2,
        step: 0.05,
        unit: "s",
    },
    stepDuration: {
        type: ControlType.Number,
        title: "Step Duration",
        description:
            "Set how long photographs take to move vertically into their new staircase positions.",
        defaultValue: 0.6,
        min: 0.1,
        max: 2,
        step: 0.05,
        unit: "s",
    },
    showTitles: {
        type: ControlType.Boolean,
        title: "Show Titles",
        description:
            "Show or hide the animated title beside the active photograph.",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    titleSize: {
        type: ControlType.Number,
        title: "Title Size",
        description: "Set the font size of the active photograph title.",
        defaultValue: 20,
        min: 10,
        max: 80,
        step: 1,
        unit: "px",
        hidden: (props) => !props.showTitles,
    },
    fontFamily: {
        type: ControlType.String,
        title: "Font Family",
        description: "Enter a CSS font-family name for the carousel titles.",
        defaultValue: "Inter, sans-serif",
        hidden: (props) => !props.showTitles,
    },
    fontWeight: {
        type: ControlType.Number,
        title: "Font Weight",
        description: "Control the thickness of the carousel title text.",
        defaultValue: 500,
        min: 100,
        max: 900,
        step: 100,
        hidden: (props) => !props.showTitles,
    },
    showControls: {
        type: ControlType.Boolean,
        title: "Navigation",
        description:
            "Show or hide the navigation bar with previous and next buttons.",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    showDots: {
        type: ControlType.Boolean,
        title: "Show Dots",
        description:
            "Display interactive pagination dots. Large galleries use a slide counter.",
        defaultValue: true,
        hidden: (props) => !props.showControls,
    },
    controlBackground: {
        type: ControlType.Color,
        title: "Nav Background",
        description: "Set the background color of the navigation bar.",
        defaultValue: "#E3E1DD",
        hidden: (props) => !props.showControls,
    },
    controlColor: {
        type: ControlType.Color,
        title: "Nav Color",
        description:
            "Set the color of navigation arrows, dots, and counter text.",
        defaultValue: "#242424",
        hidden: (props) => !props.showControls,
    },
    startIndex: {
        type: ControlType.Number,
        title: "Start Index",
        description:
            "Choose the initially selected photograph, starting from zero.",
        defaultValue: 2,
        min: 0,
        max: 29,
        step: 1,
        displayStepper: true,
    },
    swipeEnabled: {
        type: ControlType.Boolean,
        title: "Touch Swipe",
        description:
            "Enable horizontal swipe navigation for mouse, touch, and pen interactions.",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    keyboardEnabled: {
        type: ControlType.Boolean,
        title: "Keyboard",
        description:
            "Enable arrow keys, Home, and End for accessible keyboard navigation.",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    ariaLabel: {
        type: ControlType.String,
        title: "ARIA Label",
        description:
            "Made with 💛 by [@karimsaif](https://x.com/karimsaif0) · Built with [Framer](https://framer.link/karimsaif0)",
        defaultValue: "Staircase photo carousel",
    },
})
