/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */

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


/* =========================
   TYPES
========================= */

type DayIndex = 1 | 2 | 3 | 4 | 5 | 6 | 7

type ResponsiveImageValue =
    | string
    | {
          src?: string
          srcSet?: string
          alt?: string
          width?: number
          height?: number
      }

type AvailabilityAutoColorMode = "Off" | "By Ratio"
type AvailabilityPulseColorMode = "Auto" | "Custom"

type AvailabilityStyle = {
    label?: string
    showAsFraction?: boolean

    // ✅ native Framer font controls
    numberFont?: any
    labelFont?: any

    autoColorMode?: AvailabilityAutoColorMode
    greenColor?: string
    yellowColor?: string
    redColor?: string
    yellowThreshold?: number
    redThreshold?: number

    height?: number
    paddingX?: number
    gap?: number

    dotSize?: number
    labelColor?: string

    pulseEnabled?: boolean
    pulseColorMode?: AvailabilityPulseColorMode
    pulseCustomColor?: string
    pulseSize?: number
    pulseDuration?: number
    pulseOpacity?: number
}

type TimetableEvent = {
    enabled?: boolean
    title: string
    day: DayIndex
    start: string
    durationMinutes?: number
    description?: string
    teacher?: string
    url?: string
    color?: string
    popupImage?: ResponsiveImageValue

    availabilityEnabled?: boolean
    totalSpots?: number
    availableSpots?: number
}

type TypographyToken = {
    font?: any // Framer Font control
    color?: string
    size?: number
    letterSpacing?: number // em
    lineHeight?: number // em
}

type PopupButtonStyle = {
    label?: string
    background?: string
    radius?: number
    paddingX?: number
    paddingY?: number
    borderColor?: string
    borderWidth?: number
    hoverBackground?: string
    hoverTextColor?: string
    hoverBorderColor?: string
}

/* =========================
   CONSTANTS / HELPERS
========================= */

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const

function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n))
}

function timeToMinutes(t: string) {
    const [hh, mm] = (t || "").split(":").map((x) => parseInt(x, 10))
    if (Number.isNaN(hh) || Number.isNaN(mm)) return NaN
    return hh * 60 + mm
}

function minutesToLabel(m: number) {
    const mmSafe = clamp(Math.round(m), 0, 24 * 60)
    const hh = Math.floor(mmSafe / 60)
    const mm = mmSafe % 60
    return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`
}

function normalizeUrl(raw?: string) {
    const s = (raw || "").trim()
    if (!s) return ""
    if (/^https?:\/\//i.test(s)) return s
    if (s.startsWith("//")) return "https:" + s
    return "https://" + s
}

// JS getDay(): Sun=0..Sat=6 -> DayIndex: Mon=1..Sun=7
function normalizeWeekdayIndex(jsGetDay: number): DayIndex {
    const map: DayIndex[] = [7, 1, 2, 3, 4, 5, 6]
    return map[jsGetDay] ?? 1
}

function getResponsiveImageProps(value?: ResponsiveImageValue) {
    if (!value)
        return { src: "", srcSet: undefined as string | undefined, alt: "" }
    if (typeof value === "string")
        return { src: value, srcSet: undefined, alt: "" }
    return {
        src: value.src || "",
        srcSet: value.srcSet,
        alt: value.alt || "",
    }
}

function resolveFont(
    font: any,
    fallback: {
        family: string
        size: number
        weight: number
        lineHeight: number
        letterSpacing: number | string
    }
) {
    const family =
        font?.family ||
        font?.fontFamily ||
        (typeof font === "string" ? font : undefined) ||
        fallback.family

    const size = font?.size ?? font?.fontSize ?? fallback.size
    const weight = font?.weight ?? font?.fontWeight ?? fallback.weight
    const lineHeight =
        font?.lineHeight ??
        font?.lineHeightPx ??
        font?.leading ??
        fallback.lineHeight
    const letterSpacing =
        font?.letterSpacing ??
        font?.tracking ??
        font?.letterSpacingPx ??
        fallback.letterSpacing

    return { family, size, weight, lineHeight, letterSpacing }
}

function typographyToCSS(
    token: TypographyToken | undefined,
    fallback: {
        family: string
        size: number
        weight: number
        lineHeight: number
        letterSpacing: number
        color: string
    }
): React.CSSProperties {
    const f = resolveFont(token?.font, {
        family: fallback.family,
        size: fallback.size,
        weight: fallback.weight,
        lineHeight: fallback.lineHeight,
        letterSpacing: fallback.letterSpacing,
    })

    const size = token?.size ?? f.size
    const lineHeight = token?.lineHeight ?? f.lineHeight
    const letter =
        token?.letterSpacing ??
        (typeof f.letterSpacing === "number"
            ? f.letterSpacing
            : fallback.letterSpacing)

    return {
        fontFamily: f.family,
        fontWeight: f.weight,
        fontSize: size,
        lineHeight: lineHeight,
        letterSpacing: `${letter}em`,
        color: token?.color ?? fallback.color,
    }
}

/* =========================
   AVAILABILITY BADGE (PULSE VERSION)
========================= */

const DEFAULT_AVAIL_STYLE: AvailabilityStyle = {
    label: "spots left",
    showAsFraction: true,

    numberFont: { family: "Inter", size: 14, weight: 700, lineHeight: 1.0 },
    labelFont: { family: "Inter", size: 12, weight: 600, lineHeight: 1.1 },

    autoColorMode: "By Ratio",
    greenColor: "#2BD24A",
    yellowColor: "#FFD54A",
    redColor: "#FF3B30",
    yellowThreshold: 0.6,
    redThreshold: 0.3,

    height: 28,
    paddingX: 8,
    gap: 6,

    dotSize: 10,
    labelColor: "rgba(0,0,0,0.55)",

    pulseEnabled: true,
    pulseColorMode: "Auto",
    pulseCustomColor: "#FF3B30",
    pulseSize: 10,
    pulseDuration: 1.6,
    pulseOpacity: 0.35,
}

function pickAutoColorByRatio(
    ratio: number,
    green: string,
    yellow: string,
    red: string,
    yellowAtOrBelow: number,
    redAtOrBelow: number
) {
    if (ratio <= redAtOrBelow) return red
    if (ratio <= yellowAtOrBelow) return yellow
    return green
}

function AvailabilityBadgeInline({
    available,
    total,
    style,
}: {
    available: number
    total: number
    style?: AvailabilityStyle
}) {
    const cfg = { ...DEFAULT_AVAIL_STYLE, ...(style || {}) }

    const safeTotal = Math.max(1, Math.floor(total || 10))
    const safeAvailable = clamp(Math.floor(available || 0), 0, safeTotal)
    const ratio = safeAvailable / safeTotal

    const autoColorMode: AvailabilityAutoColorMode = (cfg.autoColorMode ||
        "By Ratio") as any

    const greenColor = cfg.greenColor || "#2BD24A"
    const yellowColor = cfg.yellowColor || "#FFD54A"
    const redColor = cfg.redColor || "#FF3B30"
    const yellowThreshold = clamp(cfg.yellowThreshold ?? 0.6, 0, 1)
    const redThreshold = clamp(cfg.redThreshold ?? 0.3, 0, 1)

    const picked =
        autoColorMode === "By Ratio"
            ? pickAutoColorByRatio(
                  ratio,
                  greenColor,
                  yellowColor,
                  redColor,
                  yellowThreshold,
                  redThreshold
              )
            : redColor

    const label = (cfg.label || "spots left").trim()
    const showAsFraction = cfg.showAsFraction ?? true
    const text = showAsFraction
        ? `${safeAvailable}/${safeTotal}`
        : `${safeAvailable}`

    const height = clamp(cfg.height ?? 28, 14, 200)
    const paddingX = clamp(cfg.paddingX ?? 8, 0, 60)
    const gap = clamp(cfg.gap ?? 6, 0, 24)
    const dotSize = clamp(cfg.dotSize ?? 10, 6, 24)

    const pulseEnabled = cfg.pulseEnabled ?? true
    const pulseSize = clamp(cfg.pulseSize ?? 10, 0, 40)
    const pulseDuration = clamp(cfg.pulseDuration ?? 1.6, 0.6, 6)
    const pulseOpacity = clamp(cfg.pulseOpacity ?? 0.35, 0, 1)

    const pulseColorMode: AvailabilityPulseColorMode = (cfg.pulseColorMode ||
        "Auto") as any
    const pulseColor =
        pulseColorMode === "Custom" ? cfg.pulseCustomColor || picked : picked

    // ✅ badge typography is ONLY controlled by Availability Badge UI
    const numberF = resolveFont(cfg.numberFont, {
        family: "Inter",
        size: 14,
        weight: 500,
        lineHeight: 1.0,
        letterSpacing: 0,
    })
    const labelF = resolveFont(cfg.labelFont, {
        family: "Inter",
        size: 14,
        weight: 500,
        lineHeight: 1.1,
        letterSpacing: 0,
    })

    return (
        <div
            style={{
                height,
                paddingLeft: paddingX,
                paddingRight: paddingX,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "flex-start",
                gap,
                background: "rgba(0,0,0,0)",
                border: "none",
                boxShadow: "none",
                borderRadius: 0,
                boxSizing: "border-box",
                userSelect: "none",
                WebkitUserSelect: "none",
                whiteSpace: "nowrap",
                minWidth: 0,
            }}
        >
            <style>{`
                @keyframes availPulse {
                    0% { transform: scale(0.65); opacity: ${pulseOpacity}; }
                    60% { transform: scale(1.0); opacity: 0; }
                    100% { transform: scale(1.0); opacity: 0; }
                }
            `}</style>

            <div
                style={{
                    position: "relative",
                    width: dotSize,
                    height: dotSize,
                    flex: "0 0 auto",
                    display: "grid",
                    placeItems: "center",
                }}
            >
                {pulseEnabled && (
                    <div
                        style={{
                            position: "absolute",
                            width: dotSize + pulseSize * 2,
                            height: dotSize + pulseSize * 2,
                            borderRadius: 999,
                            background: pulseColor,
                            opacity: pulseOpacity,
                            zIndex: 1,
                            animation: `availPulse ${pulseDuration}s ease-in-out infinite`,
                        }}
                    />
                )}
                <div
                    style={{
                        width: dotSize,
                        height: dotSize,
                        borderRadius: 999,
                        background: picked,
                        position: "relative",
                        zIndex: 2,
                    }}
                />
            </div>

            <div
                style={{
                    fontFamily: numberF.family,
                    fontSize: numberF.size,
                    fontWeight: numberF.weight,
                    color: picked,
                    lineHeight: numberF.lineHeight,
                    letterSpacing:
                        typeof numberF.letterSpacing === "number"
                            ? `${numberF.letterSpacing}em`
                            : (numberF.letterSpacing as any),
                    whiteSpace: "nowrap",
                }}
            >
                {text}
            </div>

            <div
                style={{
                    fontFamily: labelF.family,
                    fontSize: labelF.size,
                    fontWeight: labelF.weight,
                    color: cfg.labelColor || "rgba(0,0,0,0.55)",
                    lineHeight: labelF.lineHeight,
                    letterSpacing:
                        typeof labelF.letterSpacing === "number"
                            ? `${labelF.letterSpacing}em`
                            : (labelF.letterSpacing as any),
                    opacity: 0.95,
                    whiteSpace: "nowrap",
                }}
            >
                {label}
            </div>
        </div>
    )
}

/* =========================
   COMPONENT
========================= */

function InteractiveTimetable(props: any) {
    const {
        componentWidth,
        componentHeight,

        startTime,
        endTime,

        headerStyle,
        timeStyle,
        eventStyle,

        events,

        showGrid,
        gridLines,

        activeDayColor,

        eventStripeOnly,
        showNowLine,

        popup,

        showTeacher,

        availabilityBadgeStyle,

        typography,
    } = props

    const now = new Date()
    const activeDay: DayIndex = normalizeWeekdayIndex(now.getDay())

    const cw = clamp(Number(componentWidth ?? 1020), 360, 5000)
    const ch = clamp(Number(componentHeight ?? 720), 460, 3000)

    const narrowWidth = cw < 820

    const ty = (typography || {}) as {
        header?: TypographyToken
        timeLabels?: TypographyToken
        eventTitle?: TypographyToken
        eventMeta?: TypographyToken
        popupTime?: TypographyToken
        popupTitle?: TypographyToken
        popupTeacher?: TypographyToken
        popupDescription?: TypographyToken
        popupButtons?: TypographyToken
    }

    /* ----- Header ----- */
    const headerCfg = headerStyle || {}
    const headerHeight = clamp(headerCfg.height ?? 56, 44, 96)
    const headerBG = headerCfg.background ?? "#FFFFFF"
    const headerActiveDayBG =
        headerCfg.activeDayBackground ?? "rgba(0,0,0,0.06)"

    const headerTextStyle = typographyToCSS(ty.header, {
        family: "Inter",
        size: 14,
        weight: 600,
        lineHeight: 1.1,
        letterSpacing: 0,
        color: "#000000",
    })

    /* ----- Time gutter ----- */
    const timeCfg = timeStyle || {}
    const timeIntervalMinutes = clamp(
        Math.floor(timeCfg.intervalMinutes ?? 60),
        5,
        180
    )
    const gutterWidth = clamp(timeCfg.gutterWidth ?? 84, 56, 180)

    const timeTextStyle = typographyToCSS(ty.timeLabels, {
        family: "Inter",
        size: 12,
        weight: 500,
        lineHeight: 1.1,
        letterSpacing: 0,
        color: "rgba(0,0,0,0.6)",
    })

    /* ----- Events ----- */
    const eventCfg = eventStyle || {}
    const eventCardBG = eventCfg.background ?? "rgba(0,0,0,0.06)"
    const eventRadius = clamp(Number(eventCfg.radius ?? 14), 0, 64)

    const eventTitleTextStyle = typographyToCSS(ty.eventTitle, {
        family: "Inter",
        size: 14,
        weight: 600,
        lineHeight: 1.1,
        letterSpacing: 0,
        color: "#111111",
    })

    const eventMetaTextStyle = typographyToCSS(ty.eventMeta, {
        family: "Inter",
        size: 12,
        weight: 500,
        lineHeight: 1.1,
        letterSpacing: 0,
        color: "rgba(0,0,0,0.6)",
    })

    const slotBreathing = 2 // px

    /* ----- Start/end ----- */
    const startMinutesRaw = timeToMinutes(startTime || "08:00")
    const safeStartMinutes = Number.isFinite(startMinutesRaw)
        ? clamp(startMinutesRaw, 0, 23 * 60 + 59)
        : 8 * 60

    const endMinutesRaw = timeToMinutes(endTime || "21:30")
    const safeEndMinutes = Number.isFinite(endMinutesRaw)
        ? clamp(endMinutesRaw, safeStartMinutes + 15, 24 * 60)
        : clamp(21 * 60 + 30, safeStartMinutes + 15, 24 * 60)

    const totalMinutes = safeEndMinutes - safeStartMinutes
    const rows = Math.max(1, Math.ceil(totalMinutes / timeIntervalMinutes))

    const minutesToPct = React.useCallback(
        (minutesFromStart: number) => (minutesFromStart / totalMinutes) * 100,
        [totalMinutes]
    )
    const durationToPct = React.useCallback(
        (durationMinutes: number) => (durationMinutes / totalMinutes) * 100,
        [totalMinutes]
    )

    /* ----- Popup ----- */
    const popupCfg = popup || {}
    const popupBG = popupCfg.background || "#FFFFFF"
    const popupRadius = clamp(popupCfg.cornerRadius ?? 18, 0, 40)
    const insetPadding = clamp(popupCfg.insetPadding ?? 16, 0, 80)
    const maxWidth = clamp(popupCfg.maxWidth ?? 420, 280, 820)
    const popupPaddingFinal = clamp(popupCfg.padding ?? 16, 8, 48)
    const hasImage = popupCfg.imageEnabled ?? true
    const popupImageRadius = clamp(popupCfg.imageCornerRadius ?? 14, 0, 40)
    const showCTA = popupCfg.showCTA ?? true
    const showClose = popupCfg.showClose ?? true
    const closeOnBackdrop = popupCfg.closeOnBackdrop ?? false

    // Typography
    const popupTimeStyle = typographyToCSS(ty.popupTime, {
        family: "Inter",
        size: 14,
        weight: 500,
        lineHeight: 1.2,
        letterSpacing: 0,
        color: "rgba(0,0,0,0.55)",
    })

    const popupTitleStyle = typographyToCSS(ty.popupTitle, {
        family: "Inter",
        size: 20,
        weight: 700,
        lineHeight: 1.15,
        letterSpacing: 0,
        color: "#000",
    })

    const popupTeacherStyle = typographyToCSS(ty.popupTeacher, {
        family: "Inter",
        size: 16,
        weight: 400,
        lineHeight: 1.2,
        letterSpacing: 0,
        color: "rgba(0,0,0,0.85)",
    })

    const popupDescStyle = typographyToCSS(ty.popupDescription, {
        family: "Inter",
        size: 16,
        weight: 400,
        lineHeight: 1.45,
        letterSpacing: 0,
        color: "rgba(0,0,0,0.75)",
    })

    const popupBtnTextStyle = typographyToCSS(ty.popupButtons, {
        family: "Inter",
        size: 14,
        weight: 500,
        lineHeight: 1.2,
        letterSpacing: 0,
        color: "#000",
    })

    // Button configs (defaults preserve your current design)
    const closeBtn: PopupButtonStyle = {
        label: popupCfg.closeButton?.label ?? "Close",
        background: popupCfg.closeButton?.background ?? "rgba(0,0,0,0.04)",
        radius: popupCfg.closeButton?.radius ?? 12,
        paddingX: popupCfg.closeButton?.paddingX ?? 12,
        paddingY: popupCfg.closeButton?.paddingY ?? 10,
        borderColor: popupCfg.closeButton?.borderColor ?? "rgba(0,0,0,0.10)",
        borderWidth: popupCfg.closeButton?.borderWidth ?? 1,
        hoverBackground:
            popupCfg.closeButton?.hoverBackground ?? "rgba(0,0,0,0.06)",
        hoverTextColor:
            popupCfg.closeButton?.hoverTextColor ??
            (popupBtnTextStyle.color as any),
        hoverBorderColor:
            popupCfg.closeButton?.hoverBorderColor ?? "rgba(0,0,0,0.14)",
    }

    const ctaBtn: PopupButtonStyle = {
        label: popupCfg.ctaButton?.label ?? "Open",
        background: popupCfg.ctaButton?.background ?? "rgba(0,0,0,0.08)",
        radius: popupCfg.ctaButton?.radius ?? 12,
        paddingX: popupCfg.ctaButton?.paddingX ?? 12,
        paddingY: popupCfg.ctaButton?.paddingY ?? 10,
        borderColor: popupCfg.ctaButton?.borderColor ?? "rgba(0,0,0,0.10)",
        borderWidth: popupCfg.ctaButton?.borderWidth ?? 1,
        hoverBackground:
            popupCfg.ctaButton?.hoverBackground ?? "rgba(0,0,0,0.10)",
        hoverTextColor:
            popupCfg.ctaButton?.hoverTextColor ??
            (popupBtnTextStyle.color as any),
        hoverBorderColor:
            popupCfg.ctaButton?.hoverBorderColor ?? "rgba(0,0,0,0.14)",
    }

    const [popupEvent, setPopupEvent] = React.useState<TimetableEvent | null>(
        null
    )
    const openPopup = React.useCallback(
        (e: TimetableEvent) => setPopupEvent(e),
        []
    )
    const closePopup = React.useCallback(() => setPopupEvent(null), [])

    const normalizedEvents = React.useMemo(() => {
        return ((events || []) as TimetableEvent[])
            .filter((e) => e && e.enabled !== false)
            .map((e) => {
                const total = Math.max(1, Math.floor(e.totalSpots ?? 10))
                const avail = clamp(Math.floor(e.availableSpots ?? 0), 0, total)
                const dur = clamp(
                    Math.floor(e.durationMinutes ?? 60),
                    5,
                    24 * 60
                )
                return {
                    ...e,
                    color: e.color || "#111111",
                    totalSpots: total,
                    availableSpots: avail,
                    durationMinutes: dur,
                    availabilityEnabled: !!e.availabilityEnabled,
                }
            })
    }, [events])

    const outerStyle: React.CSSProperties = {
        width: `${cw}px`,
        height: `${ch}px`,
        padding: 0,
        boxSizing: "border-box",
        background: "transparent",
        overflow: "hidden",
    }

    const EventsLayer = React.useCallback(
        ({ dayIdx }: { dayIdx: DayIndex }) => {
            const dayEvents = normalizedEvents.filter((e) => e.day === dayIdx)

            return (
                <>
                    {dayEvents.map((e, idx) => {
                        const s = timeToMinutes(e.start)
                        const sSafe = Number.isFinite(s)
                            ? clamp(s, 0, 24 * 60)
                            : safeStartMinutes
                        const endSafe = clamp(
                            sSafe + (e.durationMinutes ?? 60),
                            safeStartMinutes,
                            safeEndMinutes
                        )

                        const topMinutes = clamp(
                            sSafe - safeStartMinutes,
                            0,
                            totalMinutes
                        )
                        const durMinutes = clamp(
                            endSafe - sSafe,
                            5,
                            totalMinutes
                        )

                        const topPct = minutesToPct(topMinutes)
                        const heightPct = Math.max(
                            0.5,
                            durationToPct(durMinutes)
                        )

                        const stripeOnly = narrowWidth
                            ? true
                            : !!eventStripeOnly

                        // ✅ hide teacher when event block < 54px
                        const eventPixelHeight =
                            (heightPct / 100) * ch - slotBreathing * 2
                        const allowTeacher =
                            !!showTeacher && eventPixelHeight >= 54

                        const teacherLine =
                            allowTeacher && (e.teacher || "").trim()
                                ? `with ${e.teacher}`
                                : ""

                        const padY = 6
                        const padX = 12

                        return (
                            <button
                                key={`${dayIdx}-${idx}-${e.title}`}
                                onClick={() => openPopup(e)}
                                style={{
                                    position: "absolute",
                                    left: slotBreathing,
                                    right: slotBreathing,
                                    top: `calc(${topPct}% + ${slotBreathing}px)`,
                                    height: `calc(${heightPct}% - ${
                                        slotBreathing * 2
                                    }px)`,
                                    border: "none",
                                    borderRadius: eventRadius,
                                    padding: stripeOnly
                                        ? 0
                                        : `${padY}px ${padX}px`,
                                    cursor: "pointer",
                                    background: stripeOnly
                                        ? "transparent"
                                        : eventCardBG,
                                    outline: "none",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: stripeOnly ? 0 : 6,
                                    overflow: "hidden",
                                    boxSizing: "border-box",
                                    textAlign: "left",
                                }}
                                aria-label={e.title}
                                title={e.title}
                            >
                                {stripeOnly ? (
                                    <div
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            background: e.color,
                                            borderRadius: eventRadius,
                                        }}
                                    />
                                ) : (
                                    <>
                                        <div
                                            style={{
                                                width: 8,
                                                borderRadius: 999,
                                                background: e.color,
                                                flex: "0 0 auto",
                                                alignSelf: "stretch",
                                            }}
                                        />

                                        <div
                                            style={{
                                                minWidth: 0,
                                                flex: 1,
                                                display: "flex",
                                                flexDirection: "column",
                                                justifyContent: "center",
                                                alignItems: "flex-start",
                                                gap: teacherLine ? 6 : 0,
                                            }}
                                        >
                                            <div
                                                style={{
                                                    ...eventTitleTextStyle,
                                                    whiteSpace: "nowrap",
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    width: "100%",
                                                    textAlign: "left",
                                                }}
                                            >
                                                {e.title}
                                            </div>

                                            {teacherLine ? (
                                                <div
                                                    style={{
                                                        ...eventMetaTextStyle,
                                                        opacity: 0.75,
                                                        whiteSpace: "nowrap",
                                                        overflow: "hidden",
                                                        textOverflow:
                                                            "ellipsis",
                                                        width: "100%",
                                                        textAlign: "left",
                                                    }}
                                                >
                                                    {teacherLine}
                                                </div>
                                            ) : null}
                                        </div>
                                    </>
                                )}
                            </button>
                        )
                    })}
                </>
            )
        },
        [
            normalizedEvents,
            openPopup,
            minutesToPct,
            durationToPct,
            eventRadius,
            eventCardBG,
            eventStripeOnly,
            narrowWidth,
            showTeacher,
            eventTitleTextStyle,
            eventMetaTextStyle,
            safeStartMinutes,
            safeEndMinutes,
            totalMinutes,
            slotBreathing,
            ch,
        ]
    )

    const Popup = () => {
        if (!popupEvent || popupEvent.enabled === false) return null

        const imgProps = getResponsiveImageProps(popupEvent.popupImage)

        const startMin = timeToMinutes(popupEvent.start || "09:00")
        const startLabel = Number.isFinite(startMin)
            ? minutesToLabel(startMin)
            : popupEvent.start
        const endLabel = Number.isFinite(startMin)
            ? minutesToLabel(startMin + (popupEvent.durationMinutes ?? 60))
            : ""

        const metaLine = `${DAY_LABELS[(popupEvent.day as number) - 1]} • ${startLabel}${
            endLabel ? `–${endLabel}` : ""
        }`

        const showBadge = !!popupEvent.availabilityEnabled
        const totalSpots = Math.max(1, Math.floor(popupEvent.totalSpots ?? 10))
        const availableSpots = clamp(
            Math.floor(popupEvent.availableSpots ?? 0),
            0,
            totalSpots
        )

        return (
            <div
                style={{
                    position: "absolute",
                    inset: insetPadding,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 9999,
                }}
                onClick={() => closeOnBackdrop && closePopup()}
            >
                {/* hover styling */}
                <style>{`
                    .tt-popup-btn {
                        transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
                    }
                    .tt-popup-btn-close:hover {
                        background: ${closeBtn.hoverBackground};
                        border-color: ${closeBtn.hoverBorderColor};
                        color: ${closeBtn.hoverTextColor};
                    }
                    .tt-popup-btn-cta:hover {
                        background: ${ctaBtn.hoverBackground};
                        border-color: ${ctaBtn.hoverBorderColor};
                        color: ${ctaBtn.hoverTextColor};
                    }
                `}</style>

                <div
                    style={{
                        width: "100%",
                        maxWidth,
                        background: popupBG,
                        borderRadius: popupRadius,
                        padding: popupPaddingFinal,
                        boxSizing: "border-box",
                        maxHeight: "100%",
                        overflow: "auto",
                        WebkitOverflowScrolling: "touch",
                        boxShadow:
                            (popupCfg.shadow?.enabled ?? true)
                                ? `${popupCfg.shadow?.x ?? 0}px ${
                                      popupCfg.shadow?.y ?? 18
                                  }px ${popupCfg.shadow?.blur ?? 50}px ${
                                      popupCfg.shadow?.spread ?? 0
                                  }px ${
                                      popupCfg.shadow?.color ??
                                      "rgba(0,0,0,0.12)"
                                  }`
                                : "none",
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {hasImage && imgProps.src ? (
                        <div
                            style={{
                                width: "100%",
                                aspectRatio: "16 / 9",
                                overflow: "hidden",
                                borderRadius: popupImageRadius,
                                marginBottom: 14,
                                background: "rgba(0,0,0,0.04)",
                            }}
                        >
                            <img
                                src={imgProps.src}
                                srcSet={imgProps.srcSet}
                                alt={imgProps.alt}
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    display: "block",
                                }}
                                loading="lazy"
                                decoding="async"
                            />
                        </div>
                    ) : null}

                    {/* Popup Time */}
                    <div
                        style={{
                            ...popupTimeStyle,
                            marginBottom: 10,
                        }}
                    >
                        {metaLine}
                    </div>

                    {/* Popup Title */}
                    <div
                        style={{
                            ...popupTitleStyle,
                            marginBottom: popupEvent.teacher ? 10 : 16,
                        }}
                    >
                        {popupEvent.title}
                    </div>

                    {/* Popup Teacher (80% opacity) */}
                    {popupEvent.teacher ? (
                        <div
                            style={{
                                ...popupTeacherStyle,
                                opacity: 0.8,
                                marginBottom: 18,
                            }}
                        >
                            with {popupEvent.teacher}
                        </div>
                    ) : null}

                    {/* Popup Description */}
                    {popupEvent.description ? (
                        <div
                            style={{
                                ...popupDescStyle,
                                marginTop: 0,
                            }}
                        >
                            {popupEvent.description}
                        </div>
                    ) : null}

                    {(showBadge ||
                        showClose ||
                        (showCTA && popupEvent.url)) && (
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "flex-start",
                                gap: 12,
                                marginTop: 22,
                                flexWrap: "wrap",
                            }}
                        >
                            {showBadge ? (
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "flex-start",
                                        minWidth: 0,
                                    }}
                                >
                                    <AvailabilityBadgeInline
                                        available={availableSpots}
                                        total={totalSpots}
                                        style={availabilityBadgeStyle}
                                    />
                                </div>
                            ) : null}

                            <div style={{ flex: 1 }} />

                            <div
                                style={{
                                    display: "flex",
                                    gap: 10,
                                    justifyContent: "flex-end",
                                    flex: "0 0 auto",
                                }}
                            >
                                {showClose ? (
                                    <button
                                        className="tt-popup-btn tt-popup-btn-close"
                                        onClick={() => closePopup()}
                                        style={{
                                            ...popupBtnTextStyle,
                                            padding: `${closeBtn.paddingY}px ${closeBtn.paddingX}px`,
                                            borderRadius: clamp(
                                                closeBtn.radius ?? 12,
                                                0,
                                                40
                                            ),
                                            border: `${clamp(
                                                closeBtn.borderWidth ?? 1,
                                                0,
                                                8
                                            )}px solid ${
                                                closeBtn.borderColor ??
                                                "rgba(0,0,0,0.10)"
                                            }`,
                                            background:
                                                closeBtn.background ??
                                                "rgba(0,0,0,0.04)",
                                            cursor: "pointer",
                                        }}
                                    >
                                        {closeBtn.label || "Close"}
                                    </button>
                                ) : null}

                                {showCTA && popupEvent.url ? (
                                    <a
                                        className="tt-popup-btn tt-popup-btn-cta"
                                        href={normalizeUrl(popupEvent.url)}
                                        target="_blank"
                                        rel="noreferrer"
                                        style={{
                                            ...popupBtnTextStyle,
                                            padding: `${ctaBtn.paddingY}px ${ctaBtn.paddingX}px`,
                                            borderRadius: clamp(
                                                ctaBtn.radius ?? 12,
                                                0,
                                                40
                                            ),
                                            border: `${clamp(
                                                ctaBtn.borderWidth ?? 1,
                                                0,
                                                8
                                            )}px solid ${
                                                ctaBtn.borderColor ??
                                                "rgba(0,0,0,0.10)"
                                            }`,
                                            background:
                                                ctaBtn.background ??
                                                "rgba(0,0,0,0.08)",
                                            textDecoration: "none",
                                            color: popupBtnTextStyle.color as any,
                                            display: "inline-flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                        }}
                                    >
                                        {ctaBtn.label || "Open"}
                                    </a>
                                ) : null}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )
    }

    const activeDayColumnColor =
        headerCfg.activeDayColumn || activeDayColor || "rgba(0,153,255,0.13)"

    return (
        <div style={outerStyle}>
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                    position: "relative",
                    minHeight: 0,
                }}
            >
                {/* Header */}
                <div
                    style={{
                        height: headerHeight,
                        display: "grid",
                        gridTemplateColumns: `${gutterWidth}px repeat(7, 1fr)`,
                        alignItems: "center",
                        background: headerBG,
                        ...headerTextStyle,
                        flex: "0 0 auto",
                        boxSizing: "border-box",
                    }}
                >
                    <div />
                    {DAY_LABELS.map((d, i) => {
                        const dayNum = (i + 1) as DayIndex
                        return (
                            <div
                                key={`${d}-${i}`}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    height: "100%",
                                    background:
                                        dayNum === activeDay
                                            ? headerActiveDayBG
                                            : "transparent",
                                }}
                            >
                                <span>{d}</span>
                            </div>
                        )
                    })}
                </div>

                {/* Grid */}
                <div
                    style={{
                        flex: 1,
                        display: "grid",
                        gridTemplateColumns: `${gutterWidth}px repeat(7, 1fr)`,
                        position: "relative",
                        minHeight: 0,
                    }}
                >
                    {/* Time gutter */}
                    <div
                        style={{
                            borderRight: showGrid
                                ? `1px solid ${gridLines}`
                                : "none",
                            ...timeTextStyle,
                            position: "relative",
                            overflow: "hidden",
                            boxSizing: "border-box",
                            padding: "0px 10px",
                        }}
                    >
                        {Array.from({ length: rows }).map((_, i) => {
                            const m = safeStartMinutes + i * timeIntervalMinutes
                            const label = minutesToLabel(m)
                            const minutesFromStart = i * timeIntervalMinutes
                            const y = minutesToPct(minutesFromStart)

                            return (
                                <div
                                    key={`t-${i}`}
                                    style={{
                                        position: "absolute",
                                        top: `${y}%`,
                                        left: 10,
                                        transform:
                                            i === 0
                                                ? "translateY(0)"
                                                : "translateY(-50%)",
                                        opacity: i % 2 === 0 ? 0.9 : 0.65,
                                        whiteSpace: "nowrap",
                                        pointerEvents: "none",
                                    }}
                                >
                                    {label}
                                </div>
                            )
                        })}
                    </div>

                    {/* Day columns */}
                    {Array.from({ length: 7 }).map((_, i) => {
                        const dayNum = (i + 1) as DayIndex
                        return (
                            <div
                                key={dayNum}
                                style={{
                                    position: "relative",
                                    borderRight:
                                        showGrid && i !== 6
                                            ? `1px solid ${gridLines}`
                                            : "none",
                                    background:
                                        dayNum === activeDay
                                            ? activeDayColumnColor
                                            : "transparent",
                                    overflow: "hidden",
                                    boxSizing: "border-box",
                                }}
                            >
                                {showGrid ? (
                                    <div
                                        style={{
                                            position: "absolute",
                                            inset: 0,
                                            pointerEvents: "none",
                                        }}
                                    >
                                        {Array.from({ length: rows + 1 }).map(
                                            (_, r) => {
                                                const minutesFromStart =
                                                    r * timeIntervalMinutes
                                                const y =
                                                    minutesToPct(
                                                        minutesFromStart
                                                    )
                                                return (
                                                    <div
                                                        key={r}
                                                        style={{
                                                            position:
                                                                "absolute",
                                                            left: 0,
                                                            right: 0,
                                                            top: `${y}%`,
                                                            height: 1,
                                                            background:
                                                                gridLines,
                                                            transform:
                                                                "translateY(-0.5px)",
                                                        }}
                                                    />
                                                )
                                            }
                                        )}
                                    </div>
                                ) : null}

                                <div style={{ position: "absolute", inset: 0 }}>
                                    <EventsLayer dayIdx={dayNum} />
                                </div>
                            </div>
                        )
                    })}

                    {/* Now line */}
                    {showNowLine
                        ? (() => {
                              const minutesNow =
                                  now.getHours() * 60 + now.getMinutes()
                              if (
                                  minutesNow < safeStartMinutes ||
                                  minutesNow > safeEndMinutes
                              )
                                  return null
                              const y = minutesToPct(
                                  minutesNow - safeStartMinutes
                              )
                              return (
                                  <div
                                      style={{
                                          position: "absolute",
                                          left: gutterWidth,
                                          right: 0,
                                          top: `${y}%`,
                                          height: 2,
                                          background: "#ff3b30",
                                          opacity: 0.8,
                                          pointerEvents: "none",
                                      }}
                                  />
                              )
                          })()
                        : null}
                </div>

                <Popup />
            </div>
        </div>
    )
}

/* =========================
   CONTROLS
========================= */

addPropertyControls(InteractiveTimetable, {
    typography: {
        type: ControlType.Object,
        title: "Typography",
        controls: {
            header: {
                type: ControlType.Object,
                title: "Header",
                controls: {
                    font: { type: ControlType.Font, title: "Font" },
                    color: { type: ControlType.Color, title: "Color" },
                    size: {
                        type: ControlType.Number,
                        title: "Size",
                        min: 6,
                        max: 72,
                        step: 1,
                    },
                    letterSpacing: {
                        type: ControlType.Number,
                        title: "Letter",
                        min: -0.2,
                        max: 0.5,
                        step: 0.01,
                    },
                    lineHeight: {
                        type: ControlType.Number,
                        title: "Line",
                        min: 0.8,
                        max: 3,
                        step: 0.05,
                    },
                },
                defaultValue: {
                    font: { family: "Inter", weight: 600 },
                    color: "#000000",
                    size: 14,
                    letterSpacing: 0,
                    lineHeight: 1.1,
                },
            },

            timeLabels: {
                type: ControlType.Object,
                title: "Time Labels",
                controls: {
                    font: { type: ControlType.Font, title: "Font" },
                    color: { type: ControlType.Color, title: "Color" },
                    size: {
                        type: ControlType.Number,
                        title: "Size",
                        min: 6,
                        max: 72,
                        step: 1,
                    },
                    letterSpacing: {
                        type: ControlType.Number,
                        title: "Letter",
                        min: -0.2,
                        max: 0.5,
                        step: 0.01,
                    },
                    lineHeight: {
                        type: ControlType.Number,
                        title: "Line",
                        min: 0.8,
                        max: 3,
                        step: 0.05,
                    },
                },
                defaultValue: {
                    font: { family: "Inter", weight: 500 },
                    color: "rgba(0,0,0,0.6)",
                    size: 12,
                    letterSpacing: 0,
                    lineHeight: 1.1,
                },
            },

            eventTitle: {
                type: ControlType.Object,
                title: "Event Title",
                controls: {
                    font: { type: ControlType.Font, title: "Font" },
                    color: { type: ControlType.Color, title: "Color" },
                    size: {
                        type: ControlType.Number,
                        title: "Size",
                        min: 6,
                        max: 72,
                        step: 1,
                    },
                    letterSpacing: {
                        type: ControlType.Number,
                        title: "Letter",
                        min: -0.2,
                        max: 0.5,
                        step: 0.01,
                    },
                    lineHeight: {
                        type: ControlType.Number,
                        title: "Line",
                        min: 0.8,
                        max: 3,
                        step: 0.05,
                    },
                },
                defaultValue: {
                    font: { family: "Inter", weight: 600 },
                    color: "#111111",
                    size: 14,
                    letterSpacing: 0,
                    lineHeight: 1.1,
                },
            },

            eventMeta: {
                type: ControlType.Object,
                title: "Event Meta",
                controls: {
                    font: { type: ControlType.Font, title: "Font" },
                    color: { type: ControlType.Color, title: "Color" },
                    size: {
                        type: ControlType.Number,
                        title: "Size",
                        min: 6,
                        max: 72,
                        step: 1,
                    },
                    letterSpacing: {
                        type: ControlType.Number,
                        title: "Letter",
                        min: -0.2,
                        max: 0.5,
                        step: 0.01,
                    },
                    lineHeight: {
                        type: ControlType.Number,
                        title: "Line",
                        min: 0.8,
                        max: 3,
                        step: 0.05,
                    },
                },
                defaultValue: {
                    font: { family: "Inter", weight: 500 },
                    color: "rgba(0,0,0,0.6)",
                    size: 12,
                    letterSpacing: 0,
                    lineHeight: 1.1,
                },
            },

            popupTime: {
                type: ControlType.Object,
                title: "Popup Time",
                controls: {
                    font: { type: ControlType.Font, title: "Font" },
                    color: { type: ControlType.Color, title: "Color" },
                    size: {
                        type: ControlType.Number,
                        title: "Size",
                        min: 6,
                        max: 72,
                        step: 1,
                    },
                    letterSpacing: {
                        type: ControlType.Number,
                        title: "Letter",
                        min: -0.2,
                        max: 0.5,
                        step: 0.01,
                    },
                    lineHeight: {
                        type: ControlType.Number,
                        title: "Line",
                        min: 0.8,
                        max: 3,
                        step: 0.05,
                    },
                },
                defaultValue: {
                    font: { family: "Inter", weight: 500 },
                    color: "rgba(0,0,0,0.55)",
                    size: 14,
                    letterSpacing: 0,
                    lineHeight: 1.2,
                },
            },

            popupTitle: {
                type: ControlType.Object,
                title: "Popup Title",
                controls: {
                    font: { type: ControlType.Font, title: "Font" },
                    color: { type: ControlType.Color, title: "Color" },
                    size: {
                        type: ControlType.Number,
                        title: "Size",
                        min: 6,
                        max: 72,
                        step: 1,
                    },
                    letterSpacing: {
                        type: ControlType.Number,
                        title: "Letter",
                        min: -0.2,
                        max: 0.5,
                        step: 0.01,
                    },
                    lineHeight: {
                        type: ControlType.Number,
                        title: "Line",
                        min: 0.8,
                        max: 3,
                        step: 0.05,
                    },
                },
                defaultValue: {
                    font: { family: "Inter", weight: 700 },
                    color: "#000000",
                    size: 20,
                    letterSpacing: 0,
                    lineHeight: 1.15,
                },
            },

            popupTeacher: {
                type: ControlType.Object,
                title: "Popup Teacher",
                controls: {
                    font: { type: ControlType.Font, title: "Font" },
                    color: { type: ControlType.Color, title: "Color" },
                    size: {
                        type: ControlType.Number,
                        title: "Size",
                        min: 6,
                        max: 72,
                        step: 1,
                    },
                    letterSpacing: {
                        type: ControlType.Number,
                        title: "Letter",
                        min: -0.2,
                        max: 0.5,
                        step: 0.01,
                    },
                    lineHeight: {
                        type: ControlType.Number,
                        title: "Line",
                        min: 0.8,
                        max: 3,
                        step: 0.05,
                    },
                },
                defaultValue: {
                    font: { family: "Inter", weight: 400 },
                    color: "rgba(0,0,0,0.85)",
                    size: 16,
                    letterSpacing: 0,
                    lineHeight: 1.2,
                },
            },

            popupDescription: {
                type: ControlType.Object,
                title: "Popup Desc",
                controls: {
                    font: { type: ControlType.Font, title: "Font" },
                    color: { type: ControlType.Color, title: "Color" },
                    size: {
                        type: ControlType.Number,
                        title: "Size",
                        min: 6,
                        max: 72,
                        step: 1,
                    },
                    letterSpacing: {
                        type: ControlType.Number,
                        title: "Letter",
                        min: -0.2,
                        max: 0.5,
                        step: 0.01,
                    },
                    lineHeight: {
                        type: ControlType.Number,
                        title: "Line",
                        min: 0.8,
                        max: 3,
                        step: 0.05,
                    },
                },
                defaultValue: {
                    font: { family: "Inter", weight: 400 },
                    color: "rgba(0,0,0,0.75)",
                    size: 16,
                    letterSpacing: 0,
                    lineHeight: 1.45,
                },
            },

            popupButtons: {
                type: ControlType.Object,
                title: "Popup Buttons",
                controls: {
                    font: { type: ControlType.Font, title: "Font" },
                    color: { type: ControlType.Color, title: "Color" },
                    size: {
                        type: ControlType.Number,
                        title: "Size",
                        min: 6,
                        max: 72,
                        step: 1,
                    },
                    letterSpacing: {
                        type: ControlType.Number,
                        title: "Letter",
                        min: -0.2,
                        max: 0.5,
                        step: 0.01,
                    },
                    lineHeight: {
                        type: ControlType.Number,
                        title: "Line",
                        min: 0.8,
                        max: 3,
                        step: 0.05,
                    },
                },
                defaultValue: {
                    font: { family: "Inter", weight: 500 },
                    color: "#000000",
                    size: 14,
                    letterSpacing: 0,
                    lineHeight: 1.2,
                },
            },
        },
    },

    events: {
        type: ControlType.Array,
        title: "Events",
        control: {
            type: ControlType.Object,
            controls: {
                enabled: {
                    type: ControlType.Boolean,
                    title: "Show",
                    defaultValue: true,
                },
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "Meditation",
                },
                day: {
                    type: ControlType.Enum,
                    title: "Day",
                    options: [1, 2, 3, 4, 5, 6, 7],
                    optionTitles: [
                        "Mon (1)",
                        "Tue (2)",
                        "Wed (3)",
                        "Thu (4)",
                        "Fri (5)",
                        "Sat (6)",
                        "Sun (7)",
                    ],
                    defaultValue: 3,
                },
                start: {
                    type: ControlType.String,
                    title: "Start",
                    defaultValue: "12:00",
                },
                durationMinutes: {
                    type: ControlType.Number,
                    title: "Duration",
                    defaultValue: 60,
                    min: 5,
                    max: 240,
                    step: 5,
                },
                teacher: {
                    type: ControlType.String,
                    title: "Teacher",
                    defaultValue: "Frank",
                },
                description: {
                    type: ControlType.String,
                    title: "Description",
                    multiline: true,
                    defaultValue:
                        "A guided meditation session centered on breath awareness and mental clarity. You’ll practice simple techniques to slow the nervous system, release tension, and build focus—ideal for stress relief and mental reset.",
                },
                url: {
                    type: ControlType.String,
                    title: "CTA URL",
                    defaultValue: "",
                },
                color: {
                    type: ControlType.Color,
                    title: "Stripe",
                    defaultValue: "#111111",
                },
                popupImage: {
                    type: ControlType.ResponsiveImage,
                    title: "Popup Image",
                },
                availabilityEnabled: {
                    type: ControlType.Boolean,
                    title: "Availability",
                    defaultValue: true,
                },
                totalSpots: {
                    type: ControlType.Number,
                    title: "Total",
                    defaultValue: 10,
                    min: 1,
                    max: 1000,
                    step: 1,
                    hidden: (p: any) => !p.availabilityEnabled,
                },
                availableSpots: {
                    type: ControlType.Number,
                    title: "Available",
                    defaultValue: 1,
                    min: 0,
                    max: 1000,
                    step: 1,
                    hidden: (p: any) => !p.availabilityEnabled,
                },
            },
        },
        defaultValue: [
            {
                enabled: true,
                title: "Meditation",
                day: 3,
                start: "12:00",
                durationMinutes: 60,
                description:
                    "A guided meditation session centered on breath awareness and mental clarity. You’ll practice simple techniques to slow the nervous system, release tension, and build focus—ideal for stress relief and mental reset.",
                teacher: "Frank",
                color: "#111111",
                availabilityEnabled: true,
                totalSpots: 10,
                availableSpots: 1,
            },
        ],
    },

    componentHeight: {
        type: ControlType.Number,
        title: "Height",
        defaultValue: 720,
        min: 460,
        max: 3000,
        step: 1,
    },
    componentWidth: {
        type: ControlType.Number,
        title: "Width",
        defaultValue: 1020,
        min: 360,
        max: 5000,
        step: 1,
    },

    startTime: {
        type: ControlType.String,
        title: "Start Time",
        defaultValue: "08:00",
    },
    endTime: {
        type: ControlType.String,
        title: "End Time",
        defaultValue: "21:30",
    },

    headerStyle: {
        type: ControlType.Object,
        title: "Header",
        controls: {
            height: {
                type: ControlType.Number,
                title: "Height",
                defaultValue: 56,
                min: 44,
                max: 96,
            },
            background: {
                type: ControlType.Color,
                title: "BG",
                defaultValue: "#FFFFFF",
            },
            activeDayBackground: {
                type: ControlType.Color,
                title: "Active Day BG",
                defaultValue: "rgba(0,0,0,0.06)",
            },
            activeDayColumn: {
                type: ControlType.Color,
                title: "Active Column",
                defaultValue: "rgba(0,153,255,0.13)",
            },
        },
    },

    timeStyle: {
        type: ControlType.Object,
        title: "Time",
        controls: {
            intervalMinutes: {
                type: ControlType.Number,
                title: "Interval",
                defaultValue: 60,
                min: 5,
                max: 180,
                step: 5,
            },
            gutterWidth: {
                type: ControlType.Number,
                title: "Gutter",
                defaultValue: 84,
                min: 56,
                max: 180,
            },
        },
    },

    eventStyle: {
        type: ControlType.Object,
        title: "Events",
        controls: {
            radius: {
                type: ControlType.Number,
                title: "Radius",
                defaultValue: 14,
                min: 0,
                max: 64,
                step: 1,
            },
            background: {
                type: ControlType.Color,
                title: "Card BG",
                defaultValue: "rgba(0,0,0,0.06)",
            },
        },
    },

    // ✅ UPDATED: add helper note under the toggle
    showTeacher: {
        type: ControlType.Boolean,
        title: "Show Teacher",
        defaultValue: true,
        description:
            "Note: Teacher text only appears when the event block is at least 54px tall.",
    },

    availabilityBadgeStyle: {
        type: ControlType.Object,
        title: "Availability Badge",
        controls: {
            label: {
                type: ControlType.String,
                title: "Label",
                defaultValue: "spots left",
            },
            showAsFraction: {
                type: ControlType.Boolean,
                title: "Show 3/10",
                defaultValue: true,
            },

            numberFont: {
                type: ControlType.Font,
                title: "Number Font",
                defaultValue: { family: "Inter" },
            },
            labelFont: {
                type: ControlType.Font,
                title: "Label Font",
                defaultValue: { family: "Inter" },
            },

            autoColorMode: {
                type: ControlType.Enum,
                title: "AutoColor",
                options: ["Off", "By Ratio"],
                optionTitles: ["Off", "By Ratio"],
                defaultValue: "By Ratio",
            },
            greenColor: {
                type: ControlType.Color,
                title: "Green",
                defaultValue: "#2BD24A",
                hidden: (p: any) => p.autoColorMode !== "By Ratio",
            },
            yellowColor: {
                type: ControlType.Color,
                title: "Yellow",
                defaultValue: "#FFD54A",
                hidden: (p: any) => p.autoColorMode !== "By Ratio",
            },
            redColor: {
                type: ControlType.Color,
                title: "Red",
                defaultValue: "#FF3B30",
                hidden: (p: any) => p.autoColorMode !== "By Ratio",
            },
            yellowThreshold: {
                type: ControlType.Number,
                title: "Yellow ≤",
                defaultValue: 0.6,
                min: 0,
                max: 1,
                step: 0.05,
                hidden: (p: any) => p.autoColorMode !== "By Ratio",
            },
            redThreshold: {
                type: ControlType.Number,
                title: "Red ≤",
                defaultValue: 0.3,
                min: 0,
                max: 1,
                step: 0.05,
                hidden: (p: any) => p.autoColorMode !== "By Ratio",
            },

            height: {
                type: ControlType.Number,
                title: "Height",
                defaultValue: 28,
                min: 14,
                max: 200,
                step: 1,
            },
            paddingX: {
                type: ControlType.Number,
                title: "Padding X",
                defaultValue: 8,
                min: 0,
                max: 60,
                step: 1,
            },
            gap: {
                type: ControlType.Number,
                title: "Gap",
                defaultValue: 6,
                min: 0,
                max: 24,
                step: 1,
            },

            dotSize: {
                type: ControlType.Number,
                title: "Dot Size",
                defaultValue: 10,
                min: 6,
                max: 24,
                step: 1,
            },
            labelColor: {
                type: ControlType.Color,
                title: "Label Color",
                defaultValue: "rgba(0,0,0,0.55)",
            },

            pulseEnabled: {
                type: ControlType.Boolean,
                title: "Pulse",
                defaultValue: true,
            },
            pulseColorMode: {
                type: ControlType.Enum,
                title: "Pulse Color",
                options: ["Auto", "Custom"],
                optionTitles: ["Auto", "Custom"],
                defaultValue: "Auto",
                hidden: (p: any) => !p.pulseEnabled,
            },
            pulseCustomColor: {
                type: ControlType.Color,
                title: "Pulse Custom",
                defaultValue: "#FF3B30",
                hidden: (p: any) =>
                    !p.pulseEnabled || p.pulseColorMode !== "Custom",
            },
            pulseSize: {
                type: ControlType.Number,
                title: "Pulse Size",
                defaultValue: 10,
                min: 0,
                max: 40,
                step: 1,
                hidden: (p: any) => !p.pulseEnabled,
            },
            pulseDuration: {
                type: ControlType.Number,
                title: "Pulse Sec",
                defaultValue: 1.6,
                min: 0.6,
                max: 6,
                step: 0.1,
                hidden: (p: any) => !p.pulseEnabled,
            },
            pulseOpacity: {
                type: ControlType.Number,
                title: "Pulse Op",
                defaultValue: 0.35,
                min: 0,
                max: 1,
                step: 0.05,
                hidden: (p: any) => !p.pulseEnabled,
            },
        },
        defaultValue: DEFAULT_AVAIL_STYLE,
    },

    popup: {
        type: ControlType.Object,
        title: "Popup",
        controls: {
            closeOnBackdrop: {
                type: ControlType.Boolean,
                title: "Outside Click Closes",
                defaultValue: false,
            },
            showClose: {
                type: ControlType.Boolean,
                title: "Show Close",
                defaultValue: true,
            },
            showCTA: {
                type: ControlType.Boolean,
                title: "Show CTA",
                defaultValue: true,
            },
            insetPadding: {
                type: ControlType.Number,
                title: "Inset Pad",
                defaultValue: 16,
                min: 0,
                max: 80,
                step: 1,
            },
            background: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: "#FFFFFF",
            },
            maxWidth: {
                type: ControlType.Number,
                title: "Max Width",
                defaultValue: 420,
                min: 280,
                max: 820,
            },
            cornerRadius: {
                type: ControlType.Number,
                title: "Radius",
                defaultValue: 18,
                min: 0,
                max: 40,
                step: 1,
            },
            padding: {
                type: ControlType.Number,
                title: "Padding",
                defaultValue: 16,
                min: 8,
                max: 48,
                step: 1,
            },
            imageEnabled: {
                type: ControlType.Boolean,
                title: "Image",
                defaultValue: true,
            },
            imageCornerRadius: {
                type: ControlType.Number,
                title: "Image Radius",
                defaultValue: 14,
                min: 0,
                max: 40,
                step: 1,
            },

            shadow: {
                type: ControlType.Object,
                title: "Shadow",
                controls: {
                    enabled: {
                        type: ControlType.Boolean,
                        title: "Enabled",
                        defaultValue: true,
                    },
                    x: {
                        type: ControlType.Number,
                        title: "X",
                        defaultValue: 0,
                        min: -50,
                        max: 50,
                    },
                    y: {
                        type: ControlType.Number,
                        title: "Y",
                        defaultValue: 18,
                        min: -50,
                        max: 50,
                    },
                    blur: {
                        type: ControlType.Number,
                        title: "Blur",
                        defaultValue: 50,
                        min: 0,
                        max: 120,
                    },
                    spread: {
                        type: ControlType.Number,
                        title: "Spread",
                        defaultValue: 0,
                        min: -20,
                        max: 40,
                    },
                    color: {
                        type: ControlType.Color,
                        title: "Color",
                        defaultValue: "rgba(0,0,0,0.12)",
                    },
                },
            },

            closeButton: {
                type: ControlType.Object,
                title: "Close Button",
                controls: {
                    label: {
                        type: ControlType.String,
                        title: "Label",
                        defaultValue: "Close",
                    },
                    background: {
                        type: ControlType.Color,
                        title: "BG",
                        defaultValue: "rgba(0,0,0,0.04)",
                    },
                    radius: {
                        type: ControlType.Number,
                        title: "Radius",
                        defaultValue: 12,
                        min: 0,
                        max: 40,
                        step: 1,
                    },
                    paddingX: {
                        type: ControlType.Number,
                        title: "Pad X",
                        defaultValue: 12,
                        min: 0,
                        max: 40,
                        step: 1,
                    },
                    paddingY: {
                        type: ControlType.Number,
                        title: "Pad Y",
                        defaultValue: 10,
                        min: 0,
                        max: 40,
                        step: 1,
                    },
                    borderColor: {
                        type: ControlType.Color,
                        title: "Border",
                        defaultValue: "rgba(0,0,0,0.10)",
                    },
                    borderWidth: {
                        type: ControlType.Number,
                        title: "Border W",
                        defaultValue: 1,
                        min: 0,
                        max: 8,
                        step: 1,
                    },
                    hoverBackground: {
                        type: ControlType.Color,
                        title: "Hover BG",
                        defaultValue: "rgba(0,0,0,0.06)",
                    },
                    hoverTextColor: {
                        type: ControlType.Color,
                        title: "Hover Text",
                        defaultValue: "#000000",
                    },
                    hoverBorderColor: {
                        type: ControlType.Color,
                        title: "Hover Border",
                        defaultValue: "rgba(0,0,0,0.14)",
                    },
                },
            },
            ctaButton: {
                type: ControlType.Object,
                title: "CTA Button",
                controls: {
                    label: {
                        type: ControlType.String,
                        title: "Label",
                        defaultValue: "Open",
                    },
                    background: {
                        type: ControlType.Color,
                        title: "BG",
                        defaultValue: "rgba(0,0,0,0.08)",
                    },
                    radius: {
                        type: ControlType.Number,
                        title: "Radius",
                        defaultValue: 12,
                        min: 0,
                        max: 40,
                        step: 1,
                    },
                    paddingX: {
                        type: ControlType.Number,
                        title: "Pad X",
                        defaultValue: 12,
                        min: 0,
                        max: 40,
                        step: 1,
                    },
                    paddingY: {
                        type: ControlType.Number,
                        title: "Pad Y",
                        defaultValue: 10,
                        min: 0,
                        max: 40,
                        step: 1,
                    },
                    borderColor: {
                        type: ControlType.Color,
                        title: "Border",
                        defaultValue: "rgba(0,0,0,0.10)",
                    },
                    borderWidth: {
                        type: ControlType.Number,
                        title: "Border W",
                        defaultValue: 1,
                        min: 0,
                        max: 8,
                        step: 1,
                    },
                    hoverBackground: {
                        type: ControlType.Color,
                        title: "Hover BG",
                        defaultValue: "rgba(0,0,0,0.10)",
                    },
                    hoverTextColor: {
                        type: ControlType.Color,
                        title: "Hover Text",
                        defaultValue: "#000000",
                    },
                    hoverBorderColor: {
                        type: ControlType.Color,
                        title: "Hover Border",
                        defaultValue: "rgba(0,0,0,0.14)",
                    },
                },
            },
        },
    },

    showGrid: { type: ControlType.Boolean, title: "Grid", defaultValue: true },
    gridLines: {
        type: ControlType.Color,
        title: "Grid Lines",
        defaultValue: "#EDEDED",
        hidden: (p: any) => !p.showGrid,
    },
    eventStripeOnly: {
        type: ControlType.Boolean,
        title: "Stripe Only",
        defaultValue: false,
    },
    showNowLine: {
        type: ControlType.Boolean,
        title: "Now Line",
        defaultValue: false,
    },

    activeDayColor: {
        type: ControlType.Color,
        title: "Active Day Column (legacy)",
        defaultValue: "rgba(0,153,255,0.13)",
        hidden: () => true,
    },
})

export default InteractiveTimetable
