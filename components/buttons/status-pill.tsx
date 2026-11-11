import { useEffect, useRef, useState } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


// Status Pill — an availability badge for freelancers and studios.
// A pulsing status dot, your message, and your local time ticking live.

const STATUS = {
    available: { dot: "#22C55E", label: "Available for work" },
    limited: { dot: "#F59E0B", label: "Limited availability" },
    booked: { dot: "#EF4444", label: "Booked until next month" },
}

const THEMES = {
    light: { bg: "#FFFFFF", text: "#111111", muted: "#6B6B6B", border: "rgba(0,0,0,0.08)", shadow: "0 6px 20px rgba(0,0,0,0.08)" },
    dark: { bg: "#111111", text: "#F5F5F5", muted: "#9A9A9A", border: "rgba(255,255,255,0.1)", shadow: "0 6px 20px rgba(0,0,0,0.3)" },
    glass: { bg: "rgba(255,255,255,0.14)", text: "#FFFFFF", muted: "rgba(255,255,255,0.7)", border: "rgba(255,255,255,0.22)", shadow: "0 6px 24px rgba(0,0,0,0.18)" },
}

function timeIn(zone: string, h12: boolean, d: Date) {
    try {
        return new Intl.DateTimeFormat(h12 ? "en-US" : "en-GB", { hour: h12 ? "numeric" : "2-digit", minute: "2-digit", hour12: h12, timeZone: zone || undefined }).format(d)
    } catch {
        return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: h12 }).format(d)
    }
}

/**
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function StatusPill(props) {
    const { status, text, showTime, city, timeZone, hour12, theme, dotColor, link, newTab, font, size, style } = props
    const isStatic = useIsStaticRenderer()
    const ref = useRef<HTMLElement>(null)
    // The visitor's clock is unknown during the server pre-render, so the time
    // is filled in after mount. The clock and the pulse only run while the pill
    // is on screen and the tab is visible.
    const [now, setNow] = useState<Date | null>(null)
    const [active, setActive] = useState(false)
    useEffect(() => {
        if (isStatic) return
        const el = ref.current
        let onScreen = true
        const update = () => setActive(onScreen && document.visibilityState === "visible")
        const io = el && typeof IntersectionObserver !== "undefined" ? new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; update() }) : null
        if (io && el) io.observe(el)
        document.addEventListener("visibilitychange", update)
        update()
        return () => {
            io?.disconnect()
            document.removeEventListener("visibilitychange", update)
        }
    }, [isStatic])
    useEffect(() => {
        if (!showTime) return
        setNow(new Date())
        if (isStatic || !active) return
        // Tick on the minute boundary, since only hours and minutes are shown.
        let id: ReturnType<typeof setTimeout>
        const tick = () => {
            setNow(new Date())
            id = setTimeout(tick, 60000 - (Date.now() % 60000) + 50)
        }
        id = setTimeout(tick, 60000 - (Date.now() % 60000) + 50)
        return () => clearTimeout(id)
    }, [isStatic, showTime, active])

    const s = STATUS[status] || STATUS.available
    const t = THEMES[theme] || THEMES.light
    const dot = dotColor || s.dot
    const Tag: any = link ? "a" : "div"

    return (
        <Tag
            ref={ref}
            href={link || undefined}
            target={link && newTab ? "_blank" : undefined}
            rel={link ? "noopener" : undefined}
            style={{
                ...style,
                display: "inline-flex",
                alignItems: "center",
                gap: size * 0.6,
                padding: `${size * 0.55}px ${size * 1.05}px ${size * 0.55}px ${size * 0.85}px`,
                borderRadius: 999,
                background: t.bg,
                border: `1px solid ${t.border}`,
                boxShadow: t.shadow,
                backdropFilter: theme === "glass" ? "blur(14px)" : undefined,
                WebkitBackdropFilter: theme === "glass" ? "blur(14px)" : undefined,
                color: t.text,
                textDecoration: "none",
                whiteSpace: "nowrap",
                ...font,
                fontSize: size,
                lineHeight: 1,
                cursor: link ? "pointer" : "default",
            }}
        >
            <span style={{ position: "relative", width: size * 0.55, height: size * 0.55, flex: "none" }}>
                {!isStatic && (
                    <span
                        style={{
                            position: "absolute",
                            inset: 0,
                            borderRadius: 999,
                            background: dot,
                            animation: "statuspill-ping 1.8s cubic-bezier(0,0,.2,1) infinite",
                            animationPlayState: active ? "running" : "paused",
                        }}
                    />
                )}
                <span style={{ position: "absolute", inset: 0, borderRadius: 999, background: dot, boxShadow: `0 0 ${size * 0.5}px ${dot}88` }} />
            </span>
            <span>{text || s.label}</span>
            {showTime && (
                <>
                    <span style={{ width: 1, height: size * 0.9, background: t.border }} />
                    <span style={{ color: t.muted, fontVariantNumeric: "tabular-nums" }}>
                        {now || isStatic ? timeIn(timeZone, hour12, now || new Date()) : "--:--"}
                        {city ? ` in ${city}` : ""}
                    </span>
                </>
            )}
            {!isStatic && <style>{`@keyframes statuspill-ping { 75%, 100% { transform: scale(2.4); opacity: 0 } }`}</style>}
        </Tag>
    )
}

StatusPill.defaultProps = {
    status: "available",
    text: "",
    showTime: true,
    city: "Sarajevo",
    timeZone: "Europe/Sarajevo",
    hour12: false,
    theme: "light",
    dotColor: "",
    link: "",
    newTab: false,
    font: { fontFamily: "Inter, sans-serif", fontWeight: 500 },
    size: 14,
}

addPropertyControls(StatusPill, {
    status: {
        type: ControlType.Enum,
        title: "Status",
        options: ["available", "limited", "booked"],
        optionTitles: ["Available", "Limited", "Booked"],
    },
    text: { type: ControlType.String, title: "Text", placeholder: "Uses the status label" },
    showTime: { type: ControlType.Boolean, title: "Local Time" },
    city: { type: ControlType.String, title: "City", hidden: (p) => !p.showTime },
    timeZone: { type: ControlType.String, title: "Time Zone", description: "IANA name, e.g. Europe/London, America/New_York.", hidden: (p) => !p.showTime },
    hour12: { type: ControlType.Boolean, title: "12-hour", hidden: (p) => !p.showTime },
    theme: { type: ControlType.Enum, title: "Theme", options: ["light", "dark", "glass"], optionTitles: ["Light", "Dark", "Glass"], displaySegmentedControl: true },
    dotColor: { type: ControlType.Color, title: "Dot Colour", optional: true },
    link: { type: ControlType.Link, title: "Link" },
    newTab: { type: ControlType.Boolean, title: "New Tab", hidden: (p) => !p.link },
    font: { type: ControlType.Font, title: "Font", controls: "extended", defaultFontType: "sans-serif" },
    size: { type: ControlType.Number, title: "Size", min: 10, max: 32, step: 1 },
})
