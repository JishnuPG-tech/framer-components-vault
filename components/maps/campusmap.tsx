import React, { useCallback, useEffect, useMemo, useRef, useState, startTransition, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


type PinType = "description" | "photo360"

type FramerResponsiveImage = {
    src: string
    srcSet?: string
    alt?: string
}

type Pin = {
    id: string
    label: string
    xPercent: number
    yPercent: number
    type: PinType
    description: string
    photo?: FramerResponsiveImage
    icon?: FramerResponsiveImage
}

type Props = {
    mapImage?: FramerResponsiveImage
    pins: Pin[]

    showSearch: boolean
    searchPlaceholder: string
    searchWidth: number
    searchPosition: "top-left" | "top-right"
    searchBackground: string
    searchBorderColor: string
    searchTextColor: string
    searchFont: any

    showOnHover: boolean
    tooltipWidth: number
    tooltipMaxHeight: number
    tooltipOffset: number

    pinSize: number
    pinColor: string
    pinBorderColor: string

    pinAnimationEnabled: boolean
    pinAnimationType: "pulse" | "bounce"
    pinAnimationDuration: number
    pinAnimationScale: number
    pinAnimationOnlyInactive: boolean

    tooltipBackground: string
    tooltipBorderColor: string
    titleColor: string
    bodyColor: string

    titleFont: any
    bodyFont: any

    viewerSensitivity: number
    viewerInitialOffset: number

    shadow: string
    borderRadius: string

    containerBackground: string
    containerBorder: any

    patternEnabled: boolean
    patternType: "dots" | "grid" | "diagonal"
    patternColor: string
    patternOpacity: number
    patternSize: number

    style?: CSSProperties
}

const defaultImages: { map: FramerResponsiveImage; photo360: FramerResponsiveImage } = {
    map: {
        src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
        alt: "Campus map background",
    },
    photo360: {
        src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
        alt: "360 photo",
    },
}

function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n))
}

/**
 * @framerIntrinsicWidth 900
 * @framerIntrinsicHeight 520
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function CampusMap(props: Props) {
    const isStatic = useIsStaticRenderer()
    const isThumbnail = RenderTarget.current() === RenderTarget.thumbnail

    const {
        mapImage = defaultImages.map,
        pins,
        showSearch,
        searchPlaceholder,
        searchWidth,
        searchPosition,
        searchBackground,
        searchBorderColor,
        searchTextColor,
        searchFont,
        showOnHover,
        tooltipWidth,
        tooltipMaxHeight,
        tooltipOffset,
        pinSize,
        pinColor,
        pinBorderColor,
        pinAnimationEnabled,
        pinAnimationType,
        pinAnimationDuration,
        pinAnimationScale,
        pinAnimationOnlyInactive,
        tooltipBackground,
        tooltipBorderColor,
        titleColor,
        bodyColor,
        titleFont,
        bodyFont,
        viewerSensitivity,
        viewerInitialOffset,
        shadow,
        borderRadius,
        containerBackground,
        containerBorder,
        patternEnabled,
        patternType,
        patternColor,
        patternOpacity,
        patternSize,
        style,
    } = props

    const containerRef = useRef<HTMLDivElement | null>(null)
    const pinButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({})
    const [activeId, setActiveId] = useState<string | null>(pins?.[0]?.id ?? null)
    const [query, setQuery] = useState("")

    const displayedPins = useMemo(() => {
        const q = query.trim().toLowerCase()
        if (!q) return pins ?? []
        return (pins ?? []).filter((p) => {
            const label = p.label?.toLowerCase?.() ?? ""
            const desc = p.description?.toLowerCase?.() ?? ""
            return label.includes(q) || desc.includes(q) || (p.id ?? "").toLowerCase().includes(q)
        })
    }, [pins, query])

    useEffect(() => {
        if (!displayedPins?.length) {
            if (activeId !== null) startTransition(() => setActiveId(null))
            return
        }
        const stillExists = activeId ? displayedPins.some((p) => p.id === activeId) : false
        if (!stillExists) startTransition(() => setActiveId(displayedPins[0].id))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [displayedPins])

    const activePin = useMemo(() => {
        if (!pins?.length || !activeId) return null
        const p = pins.find((x) => x.id === activeId) ?? null
        if (!p) return null
        return {
            ...p,
            photo: p.photo?.src ? p.photo : defaultImages.photo360,
        }
    }, [pins, activeId])

    const handleActivate = useCallback((id: string) => {
        startTransition(() => setActiveId(id))
    }, [])

    const clearActive = useCallback(() => {
        if (!showOnHover) return
        startTransition(() => setActiveId(null))
    }, [showOnHover])

    const focusPin = useCallback((id: string) => {
        const el = pinButtonRefs.current?.[id]
        el?.focus?.()
    }, [])

    const getNextPinId = useCallback(
        (currentId: string | null, direction: "left" | "right" | "up" | "down") => {
            const list = displayedPins ?? []
            if (!list.length) return null
            const current = currentId ? list.find((p) => p.id === currentId) : list[0]
            if (!current) return list[0].id

            const dxSign = direction === "left" ? -1 : direction === "right" ? 1 : 0
            const dySign = direction === "up" ? -1 : direction === "down" ? 1 : 0

            let best: { id: string; score: number } | null = null

            for (const candidate of list) {
                if (candidate.id === current.id) continue
                const dx = candidate.xPercent - current.xPercent
                const dy = candidate.yPercent - current.yPercent

                if (dxSign !== 0 && Math.sign(dx) !== dxSign) continue
                if (dySign !== 0 && Math.sign(dy) !== dySign) continue

                const dist = Math.hypot(dx, dy)
                const axisPenalty = dxSign !== 0 ? Math.abs(dy) * 0.9 : Math.abs(dx) * 0.9
                const score = dist + axisPenalty

                if (!best || score < best.score) best = { id: candidate.id, score }
            }

            return best?.id ?? null
        },
        [displayedPins],
    )

    const patternStyle = useMemo((): CSSProperties => {
        if (!patternEnabled) return {}
        const alpha = clamp(patternOpacity, 0, 1)
        const c = patternColor
        const s = Math.max(4, patternSize)

        if (patternType === "dots") {
            return {
                backgroundImage: `radial-gradient(circle, ${c} 1px, transparent 1px)`,
                backgroundSize: `${s}px ${s}px`,
                opacity: alpha,
            }
        }

        if (patternType === "grid") {
            return {
                backgroundImage: `linear-gradient(${c} 1px, transparent 1px), linear-gradient(90deg, ${c} 1px, transparent 1px)`,
                backgroundSize: `${s}px ${s}px`,
                opacity: alpha,
            }
        }

        return {
            backgroundImage: `repeating-linear-gradient(45deg, ${c}, ${c} 2px, transparent 2px, transparent ${s}px)`,
            opacity: alpha,
        }
    }, [patternEnabled, patternOpacity, patternColor, patternSize, patternType])

    const pinAnimationCSS = useMemo(() => {
        const dur = Math.max(0.2, pinAnimationDuration)
        const scale = clamp(pinAnimationScale, 1, 1.6)
        return `\n@keyframes campusMapPinPulse {\n  0% { transform: translate(-50%, -50%) scale(1); }\n  50% { transform: translate(-50%, -50%) scale(${scale}); }\n  100% { transform: translate(-50%, -50%) scale(1); }\n}\n\n@keyframes campusMapPinBounce {\n  0%, 100% { transform: translate(-50%, -50%) translateY(0); }\n  50% { transform: translate(-50%, -50%) translateY(-4px); }\n}\n\n.campusMapPinAnimated {\n  will-change: transform;\n  transform-origin: 50% 50%;\n  animation-duration: ${dur}s;\n  animation-iteration-count: infinite;\n  animation-timing-function: ease-in-out;\n}\n\n.campusMapPinPulse { animation-name: campusMapPinPulse; }\n.campusMapPinBounce { animation-name: campusMapPinBounce; }\n\n@media (prefers-reduced-motion: reduce) {\n  .campusMapPinAnimated { animation: none !important; }\n}`
    }, [pinAnimationDuration, pinAnimationScale])

    if (isThumbnail) {
        return (
            <div
                style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    overflow: "hidden",
                    borderRadius,
                    boxShadow: shadow,
                    background: containerBackground,
                    ...containerBorder,
                    ...style,
                }}
            />
        )
    }

    return (
        <div
            ref={containerRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                borderRadius,
                boxShadow: shadow,
                background: containerBackground,
                ...containerBorder,
                ...style,
            }}
            role="region"
            aria-label="Interactive campus map"
            onMouseLeave={isStatic ? undefined : clearActive}
            onKeyDown={(e) => {
                if (e.key === "Escape") {
                    e.stopPropagation()
                    startTransition(() => setActiveId(null))
                    return
                }
            }}
        >
            {!isStatic && pinAnimationEnabled && <style>{pinAnimationCSS}</style>}
            {showSearch && (
                <div
                    style={{
                        position: "absolute",
                        top: 12,
                        left: searchPosition === "top-left" ? 12 : undefined,
                        right: searchPosition === "top-right" ? 12 : undefined,
                        width: searchWidth,
                        maxWidth: "calc(100% - 24px)",
                        zIndex: 5,
                    }}
                >
                    <input
                        value={query}
                        onChange={(e) => {
                            const next = e.currentTarget.value
                            startTransition(() => setQuery(next))
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "ArrowDown") {
                                const first = displayedPins?.[0]?.id
                                if (first) {
                                    e.preventDefault()
                                    handleActivate(first)
                                    focusPin(first)
                                }
                            }
                        }}
                        placeholder={searchPlaceholder}
                        aria-label="Search buildings"
                        aria-controls="campus-map-pins"
                        style={{
                            ...searchFont,
                            width: "100%",
                            height: 36,
                            padding: "8px 10px",
                            borderRadius: 10,
                            border: `1px solid ${searchBorderColor}`,
                            background: searchBackground,
                            color: searchTextColor,
                            outline: "none",
                            boxShadow: "0 10px 22px rgba(0,0,0,0.12)",
                        }}
                    />
                </div>
            )}
            <img
                src={mapImage.src}
                srcSet={mapImage.srcSet}
                alt={mapImage.alt ?? "Campus map"}
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    userSelect: "none",
                    pointerEvents: "none",
                }}
                draggable={false}
            />
            {patternEnabled && (
                <div
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        inset: 0,
                        pointerEvents: "none",
                        mixBlendMode: "multiply",
                        ...patternStyle,
                    }}
                />
            )}

            <div id="campus-map-pins" role="list" aria-label="Campus map pins">
                {displayedPins?.map((pin, index) => {
                    const isActive = activeId === pin.id
                    const left = `${clamp(pin.xPercent, 0, 100)}%`
                    const top = `${clamp(pin.yPercent, 0, 100)}%`
                    const fallbackTabStop = !activeId && index === 0
                    const tooltipId = `campus-tooltip-${pin.id}`

                    const shouldAnimate = !isStatic && pinAnimationEnabled && (!pinAnimationOnlyInactive || !isActive)

                    return (
                        <button
                            key={pin.id}
                            ref={(el) => {
                                pinButtonRefs.current[pin.id] = el
                            }}
                            type="button"
                            onMouseEnter={isStatic ? undefined : () => handleActivate(pin.id)}
                            onFocus={() => handleActivate(pin.id)}
                            onClick={() => handleActivate(pin.id)}
                            onBlur={(e) => {
                                if (!showOnHover) return
                                const nextTarget = e.relatedTarget as Node | null
                                if (nextTarget && containerRef.current?.contains(nextTarget)) return
                                clearActive()
                            }}
                            onKeyDown={(e) => {
                                const key = e.key
                                if (key === "Enter" || key === " " || key === "Spacebar") {
                                    e.preventDefault()
                                    handleActivate(pin.id)
                                    return
                                }
                                if (key === "ArrowLeft" || key === "ArrowRight" || key === "ArrowUp" || key === "ArrowDown") {
                                    e.preventDefault()
                                    const dir =
                                        key === "ArrowLeft"
                                            ? "left"
                                            : key === "ArrowRight"
                                              ? "right"
                                              : key === "ArrowUp"
                                                ? "up"
                                                : "down"
                                    const nextId = getNextPinId(pin.id, dir)
                                    if (nextId) {
                                        handleActivate(nextId)
                                        focusPin(nextId)
                                    }
                                    return
                                }
                                if (key === "Home") {
                                    const first = displayedPins?.[0]?.id
                                    if (first) {
                                        e.preventDefault()
                                        handleActivate(first)
                                        focusPin(first)
                                    }
                                }
                                if (key === "End") {
                                    const last = displayedPins?.[displayedPins.length - 1]?.id
                                    if (last) {
                                        e.preventDefault()
                                        handleActivate(last)
                                        focusPin(last)
                                    }
                                }
                            }}
                            style={{
                                position: "absolute",
                                left,
                                top,
                                transform: "translate(-50%, -50%)",
                                width: pinSize,
                                height: pinSize,
                                borderRadius: 999,
                                background: pinColor,
                                border: `2px solid ${pinBorderColor}`,
                                boxShadow: isActive ? "0 10px 24px rgba(0,0,0,0.22)" : "0 8px 18px rgba(0,0,0,0.16)",
                                cursor: "pointer",
                                display: "grid",
                                placeItems: "center",
                                padding: 0,
                                outline: "none",
                                animationPlayState: shouldAnimate ? "running" : "paused",
                            }}
                            className={
                                shouldAnimate
                                    ? `campusMapPinAnimated ${
                                          pinAnimationType === "bounce" ? "campusMapPinBounce" : "campusMapPinPulse"
                                      }`
                                    : undefined
                            }
                            aria-label={`Pin: ${pin.label}`}
                            aria-current={isActive ? "true" : undefined}
                            aria-expanded={isActive}
                            aria-describedby={isActive ? tooltipId : undefined}
                            tabIndex={isActive || fallbackTabStop ? 0 : -1}
                            role="listitem"
                        >
                            {pin.icon?.src ? (
                                <img
                                    src={pin.icon.src}
                                    srcSet={pin.icon.srcSet}
                                    alt=""
                                    aria-hidden="true"
                                    style={{
                                        width: Math.max(10, Math.round(pinSize * 0.78)),
                                        height: Math.max(10, Math.round(pinSize * 0.78)),
                                        objectFit: "contain",
                                        display: "block",
                                        filter: "drop-shadow(0 1px 0 rgba(0,0,0,0.12))",
                                    }}
                                    draggable={false}
                                />
                            ) : (
                                <span
                                    aria-hidden="true"
                                    style={{
                                        width: Math.max(4, Math.round(pinSize * 0.28)),
                                        height: Math.max(4, Math.round(pinSize * 0.28)),
                                        borderRadius: 999,
                                        background: "#FFFFFF",
                                        opacity: 0.9,
                                    }}
                                />
                            )}
                        </button>
                    )
                })}
            </div>

            {activePin && (
                <Tooltip
                    key={activePin.id}
                    id={`campus-tooltip-${activePin.id}`}
                    containerRef={containerRef}
                    pin={activePin}
                    pinSize={pinSize}
                    width={tooltipWidth}
                    maxHeight={tooltipMaxHeight}
                    offset={tooltipOffset}
                    background={tooltipBackground}
                    borderColor={tooltipBorderColor}
                    titleColor={titleColor}
                    bodyColor={bodyColor}
                    titleFont={titleFont}
                    bodyFont={bodyFont}
                    viewerSensitivity={viewerSensitivity}
                    viewerInitialOffset={viewerInitialOffset}
                    isStatic={isStatic}
                />
            )}
        </div>
    )
}

function Tooltip(props: {
    id: string
    containerRef: React.RefObject<HTMLDivElement | null>
    pin: Pin & { photo?: FramerResponsiveImage }
    pinSize: number
    width: number
    maxHeight: number
    offset: number
    background: string
    borderColor: string
    titleColor: string
    bodyColor: string
    titleFont: any
    bodyFont: any
    viewerSensitivity: number
    viewerInitialOffset: number
    isStatic: boolean
}) {
    const {
        id,
        containerRef,
        pin,
        pinSize,
        width,
        maxHeight,
        offset,
        background,
        borderColor,
        titleColor,
        bodyColor,
        titleFont,
        bodyFont,
        viewerSensitivity,
        viewerInitialOffset,
        isStatic,
    } = props

    const [pos, setPos] = useState<{ left: number; top: number; flipX: boolean; flipY: boolean }>({
        left: 0,
        top: 0,
        flipX: false,
        flipY: false,
    })

    useEffect(() => {
        if (typeof window === "undefined") return
        const el = containerRef.current
        if (!el) return

        const update = () => {
            const rect = el.getBoundingClientRect()
            const x = rect.left + (clamp(pin.xPercent, 0, 100) / 100) * rect.width
            const y = rect.top + (clamp(pin.yPercent, 0, 100) / 100) * rect.height

            const withinLeft = x - rect.left
            const withinTop = y - rect.top

            const preferRight = withinLeft < rect.width * 0.55
            const preferBottom = withinTop < rect.height * 0.6

            const leftLocal = withinLeft + (preferRight ? offset + pinSize / 2 : -(offset + width + pinSize / 2))
            const topLocal = withinTop + (preferBottom ? offset : -(offset + maxHeight * 0.85))

            startTransition(() =>
                setPos({
                    left: clamp(leftLocal, 8, rect.width - width - 8),
                    top: clamp(topLocal, 8, rect.height - 8),
                    flipX: !preferRight,
                    flipY: !preferBottom,
                })
            )
        }

        update()

        window.addEventListener("resize", update)
        return () => window.removeEventListener("resize", update)
    }, [containerRef, pin.xPercent, pin.yPercent, pinSize, width, maxHeight, offset])

    return (
        <div
            id={id}
            style={{
                position: "absolute",
                left: pos.left,
                top: pos.top,
                width,
                maxHeight,
                overflow: "hidden",
                borderRadius: 12,
                background,
                border: `1px solid ${borderColor}`,
                boxShadow: "0 16px 40px rgba(0,0,0,0.18)",
                backdropFilter: "blur(6px)",
                WebkitBackdropFilter: "blur(6px)",
            }}
            role="tooltip"
            aria-label={`${pin.label} details`}
        >
            <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                <div
                    style={{
                        display: "flex",
                        alignItems: "baseline",
                        justifyContent: "space-between",
                        gap: 10,
                    }}
                >
                    <div
                        style={{
                            ...titleFont,
                            color: titleColor,
                            lineHeight: titleFont?.lineHeight ?? "1.1em",
                            minWidth: 0,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                        }}
                    >
                        {pin.label}
                    </div>
                    <div
                        aria-hidden="true"
                        style={{
                            width: 8,
                            height: 8,
                            borderRadius: 999,
                            border: `2px solid ${borderColor}`,
                            opacity: 0.8,
                            flex: "0 0 auto",
                        }}
                    />
                </div>

                {pin.type === "photo360" ? (
                    <Viewer360
                        src={pin.photo?.src ?? defaultImages.photo360.src}
                        alt={pin.photo?.alt ?? `${pin.label} 360 photo`}
                        height={160}
                        sensitivity={viewerSensitivity}
                        initialOffset={viewerInitialOffset}
                        isStatic={isStatic}
                    />
                ) : (
                    <div
                        style={{
                            ...bodyFont,
                            color: bodyColor,
                            overflow: "auto",
                            maxHeight: maxHeight - 60,
                            paddingRight: 4,
                            whiteSpace: "pre-wrap",
                        }}
                    >
                        {pin.description}
                    </div>
                )}
            </div>
        </div>
    )
}

function Viewer360(props: {
    src: string
    alt: string
    height: number
    sensitivity: number
    initialOffset: number
    isStatic: boolean
}) {
    const { src, alt, height, sensitivity, initialOffset, isStatic } = props

    const draggingRef = useRef(false)
    const startXRef = useRef(0)
    const startOffsetRef = useRef(0)
    const [offset, setOffset] = useState(clamp(initialOffset, 0, 1))

    useEffect(() => {
        startTransition(() => setOffset(clamp(initialOffset, 0, 1)))
    }, [initialOffset])

    const onPointerDown = useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            if (isStatic) return
            draggingRef.current = true
            startXRef.current = e.clientX
            startOffsetRef.current = offset
            ;(e.currentTarget as HTMLDivElement).setPointerCapture?.(e.pointerId)
        },
        [offset, isStatic],
    )

    const onPointerMove = useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            if (isStatic) return
            if (!draggingRef.current) return
            const dx = e.clientX - startXRef.current
            const next = clamp(startOffsetRef.current + dx * sensitivity, 0, 1)
            startTransition(() => setOffset(next))
        },
        [sensitivity, isStatic],
    )

    const onPointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
        if (isStatic) return
        draggingRef.current = false
        ;(e.currentTarget as HTMLDivElement).releasePointerCapture?.(e.pointerId)
    }, [isStatic])

    const backgroundX = `${Math.round(offset * 100)}%`

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div
                role="img"
                aria-label={alt}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                style={{
                    height,
                    width: "100%",
                    borderRadius: 10,
                    border: "1px solid rgba(0,0,0,0.10)",
                    backgroundImage: `url(${src})`,
                    backgroundRepeat: "repeat-x",
                    backgroundSize: "auto 100%",
                    backgroundPosition: `${backgroundX} 50%`,
                    cursor: isStatic ? "default" : "grab",
                    userSelect: "none",
                    touchAction: "none",
                    overflow: "hidden",
                }}
            />
            <div
                style={{
                    fontSize: 12,
                    lineHeight: "1.2em",
                    color: "rgba(0,0,0,0.6)",
                }}
                aria-hidden="true"
            >
                {isStatic ? "360 preview" : "Drag to look around"}
            </div>
        </div>
    )
}

addPropertyControls(CampusMap, {
    mapImage: {
        type: ControlType.ResponsiveImage,
        title: "Map Image",
    },
    pins: {
        type: ControlType.Array,
        title: "Pins",
        maxCount: 24,
        defaultValue: [
            {
                id: "library",
                label: "Library",
                xPercent: 30,
                yPercent: 38,
                type: "photo360",
                description: "Quiet study floors, archives, and group rooms.",
            },
            {
                id: "cafeteria",
                label: "Cafeteria",
                xPercent: 58,
                yPercent: 52,
                type: "description",
                description: "Hot meals, coffee bar, and outdoor seating.",
            },
            {
                id: "labs",
                label: "Labs",
                xPercent: 72,
                yPercent: 30,
                type: "photo360",
                description: "Engineering and computer science labs.",
            },
        ],
        control: {
            type: ControlType.Object,
            controls: {
                id: { type: ControlType.String, title: "ID", defaultValue: "pin-1" },
                label: { type: ControlType.String, title: "Label", defaultValue: "Building" },
                xPercent: { type: ControlType.Number, title: "X (%)", defaultValue: 50, min: 0, max: 100, step: 1, unit: "%" },
                yPercent: { type: ControlType.Number, title: "Y (%)", defaultValue: 50, min: 0, max: 100, step: 1, unit: "%" },
                type: {
                    type: ControlType.Enum,
                    title: "Hover",
                    options: ["description", "photo360"],
                    optionTitles: ["Description", "360 Photo"],
                    defaultValue: "description",
                    displaySegmentedControl: true,
                },
                description: {
                    type: ControlType.String,
                    title: "Description",
                    defaultValue: "Add a short description for this building.",
                    displayTextArea: true,
                },
                photo: {
                    type: ControlType.ResponsiveImage,
                    title: "360 Photo",
                },
                icon: {
                    type: ControlType.ResponsiveImage,
                    title: "Icon",
                },
            },
        },
    },

    showSearch: {
        type: ControlType.Boolean,
        title: "Search",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    searchPlaceholder: {
        type: ControlType.String,
        title: "Search Placeholder",
        defaultValue: "Search buildings…",
        hidden: ({ showSearch }) => !showSearch,
    },
    searchWidth: {
        type: ControlType.Number,
        title: "Search Width",
        defaultValue: 240,
        min: 160,
        max: 520,
        step: 1,
        unit: "px",
        hidden: ({ showSearch }) => !showSearch,
    },
    searchPosition: {
        type: ControlType.Enum,
        title: "Search Position",
        options: ["top-left", "top-right"],
        optionTitles: ["Top Left", "Top Right"],
        defaultValue: "top-left",
        displaySegmentedControl: true,
        hidden: ({ showSearch }) => !showSearch,
    },
    searchBackground: {
        type: ControlType.Color,
        title: "Search BG",
        defaultValue: "#FFFFFF",
        hidden: ({ showSearch }) => !showSearch,
    },
    searchBorderColor: {
        type: ControlType.Color,
        title: "Search Border",
        defaultValue: "#EEEEEE",
        hidden: ({ showSearch }) => !showSearch,
    },
    searchTextColor: {
        type: ControlType.Color,
        title: "Search Text",
        defaultValue: "#000000",
        hidden: ({ showSearch }) => !showSearch,
    },
    searchFont: {
        type: ControlType.Font,
        title: "Search Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "13px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1em",
        },
        hidden: ({ showSearch }) => !showSearch,
    },

    showOnHover: {
        type: ControlType.Boolean,
        title: "Show On",
        defaultValue: true,
        enabledTitle: "Hover",
        disabledTitle: "Click/Focus",
    },

    tooltipWidth: { type: ControlType.Number, title: "Tooltip Width", defaultValue: 260, min: 180, max: 420, step: 1, unit: "px" },
    tooltipMaxHeight: { type: ControlType.Number, title: "Tooltip Height", defaultValue: 240, min: 160, max: 420, step: 1, unit: "px" },
    tooltipOffset: { type: ControlType.Number, title: "Tooltip Offset", defaultValue: 12, min: 0, max: 40, step: 1, unit: "px" },

    pinSize: { type: ControlType.Number, title: "Pin Size", defaultValue: 16, min: 10, max: 32, step: 1, unit: "px" },
    pinColor: { type: ControlType.Color, title: "Pin", defaultValue: "#000000" },
    pinBorderColor: { type: ControlType.Color, title: "Pin Border", defaultValue: "#FFFFFF" },

    pinAnimationEnabled: {
        type: ControlType.Boolean,
        title: "Pin Anim",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    pinAnimationType: {
        type: ControlType.Enum,
        title: "Anim Type",
        options: ["pulse", "bounce"],
        optionTitles: ["Pulse", "Bounce"],
        defaultValue: "pulse",
        displaySegmentedControl: true,
        hidden: ({ pinAnimationEnabled }) => !pinAnimationEnabled,
    },
    pinAnimationDuration: {
        type: ControlType.Number,
        title: "Anim Speed",
        defaultValue: 1.8,
        min: 0.4,
        max: 6,
        step: 0.1,
        unit: "s",
        hidden: ({ pinAnimationEnabled }) => !pinAnimationEnabled,
    },
    pinAnimationScale: {
        type: ControlType.Number,
        title: "Pulse Scale",
        defaultValue: 1.18,
        min: 1,
        max: 1.6,
        step: 0.01,
        hidden: ({ pinAnimationEnabled, pinAnimationType }) => !pinAnimationEnabled || pinAnimationType !== "pulse",
    },
    pinAnimationOnlyInactive: {
        type: ControlType.Boolean,
        title: "Only Inactive",
        defaultValue: true,
        enabledTitle: "Yes",
        disabledTitle: "No",
        hidden: ({ pinAnimationEnabled }) => !pinAnimationEnabled,
    },

    tooltipBackground: { type: ControlType.Color, title: "Tooltip BG", defaultValue: "#FFFFFF" },
    tooltipBorderColor: { type: ControlType.Color, title: "Tooltip Border", defaultValue: "#EEEEEE" },
    titleColor: { type: ControlType.Color, title: "Title", defaultValue: "#000000" },
    bodyColor: { type: ControlType.Color, title: "Body", defaultValue: "#000000" },

    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "15px",
            variant: "Semibold",
            letterSpacing: "-0.01em",
            lineHeight: "1.1em",
        },
    },
    bodyFont: {
        type: ControlType.Font,
        title: "Body Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "13px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.35em",
        },
    },

    viewerSensitivity: {
        type: ControlType.Number,
        title: "360 Sensitivity",
        defaultValue: 0.0012,
        min: 0.0002,
        max: 0.01,
        step: 0.0002,
    },
    viewerInitialOffset: {
        type: ControlType.Number,
        title: "360 Start",
        defaultValue: 0.5,
        min: 0,
        max: 1,
        step: 0.01,
    },

    shadow: { type: ControlType.BoxShadow, title: "Shadow", defaultValue: "0 8px 22px rgba(0,0,0,0.12)" },
    borderRadius: { type: ControlType.BorderRadius, title: "Radius", defaultValue: "16px" },

    containerBackground: { type: ControlType.Color, title: "Map BG", defaultValue: "#F5F5F5" },
    containerBorder: {
        type: ControlType.Border,
        title: "Map Border",
        optional: true,
        defaultValue: {
            borderWidth: 0,
            borderStyle: "solid",
            borderColor: "rgba(0,0,0,0.10)",
        },
    },

    patternEnabled: {
        type: ControlType.Boolean,
        title: "Pattern",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    patternType: {
        type: ControlType.Enum,
        title: "Pattern Type",
        options: ["dots", "grid", "diagonal"],
        optionTitles: ["Dots", "Grid", "Diagonal"],
        defaultValue: "dots",
        displaySegmentedControl: true,
        hidden: ({ patternEnabled }) => !patternEnabled,
    },
    patternColor: {
        type: ControlType.Color,
        title: "Pattern Color",
        defaultValue: "#000000",
        hidden: ({ patternEnabled }) => !patternEnabled,
    },
    patternOpacity: {
        type: ControlType.Number,
        title: "Pattern Opacity",
        defaultValue: 0.08,
        min: 0,
        max: 1,
        step: 0.01,
        hidden: ({ patternEnabled }) => !patternEnabled,
    },
    patternSize: {
        type: ControlType.Number,
        title: "Pattern Size",
        defaultValue: 16,
        min: 4,
        max: 80,
        step: 1,
        unit: "px",
        hidden: ({ patternEnabled }) => !patternEnabled,
    },
})