// Instructions from user:
// Create a FULL FUTURISTIC MARKETPLACE STYLE background with: main radial-gradient background, random neon grid/lines, circle outline effects, 4 glowing glassmorphism cards with hover lift/glow, chrome title text, small badges, title/subtitle typography, and neon marketplace aesthetic.

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

import { motion, useInView } from "framer-motion"

type FontStyle = Record<string, any>

type Badge = {
    label: string
}

type CardPreset = "Card 1" | "Card 2" | "Card 3" | "Card 4"

type Card = {
    preset: CardPreset
    eyebrow: string
    title: string
    body: string
}

type Circle = {
    x: number
    y: number
    size: number
    opacity: number
    blur: number
}

interface NeonMarketplaceProps {
    chromeText: string
    title: string
    subtitle: string

    badges: Badge[]
    cards: Card[]

    apiEnabled: boolean
    apiUrl: string
    apiPath: string
    apiPollSeconds: number
    apiHeadersJson: string

    backgroundBase: string
    neonCyan: string
    neonMagenta: string
    neonYellow: string

    showLines: boolean
    animateLines: boolean
    linesOpacity: number
    lineStyle: "Neon Grid" | "Diagonal Streaks" | "Circuit" | "Dots"

    showCircles: boolean
    circles: Circle[]

    cardRadius: number
    cardBorderColor: string
    cardGlass: number
    cardHoverLift: number

    chromeFont: FontStyle
    titleFont: FontStyle
    subtitleFont: FontStyle
    badgeFont: FontStyle
    cardEyebrowFont: FontStyle
    cardTitleFont: FontStyle
    cardBodyFont: FontStyle

    textColor: string
    mutedTextColor: string

    style?: React.CSSProperties
}

function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n))
}

function presetGradient(preset: CardPreset) {
    switch (preset) {
        case "Card 1":
            return "linear-gradient(180deg, rgba(20,40,120,0.8), rgba(30,20,90,0.7))"
        case "Card 2":
            return "linear-gradient(180deg, rgba(0,90,140,0.8), rgba(0,40,100,0.7))"
        case "Card 3":
            return "linear-gradient(180deg, rgba(90,20,140,0.8), rgba(60,0,90,0.7))"
        case "Card 4":
        default:
            return "linear-gradient(180deg, rgba(120,40,140,0.8), rgba(70,20,100,0.7))"
    }
}

/**
 * Neon Marketplace
 *
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 700
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function NeonMarketplace(props: NeonMarketplaceProps) {
    const {
        chromeText = "MARKETPLACE",
        title = "Quantum UI",
        subtitle = "NEON MARKET DASHBOARD",
        badges = [{ label: "AI" }, { label: "AURORA" }, { label: "GLASS" }],
        cards = [
            {
                preset: "Card 1",
                eyebrow: "FEATURED",
                title: "AI Listings",
                body: "Discover next-gen assets with glowing, glassmorphic clarity.",
            },
            {
                preset: "Card 2",
                eyebrow: "TRENDING",
                title: "Neon Drops",
                body: "Limited releases powered by realtime demand signals.",
            },
            {
                preset: "Card 3",
                eyebrow: "SECURE",
                title: "Quantum Wallet",
                body: "Encrypted transfers with instant settlement.",
            },
            {
                preset: "Card 4",
                eyebrow: "CURATED",
                title: "Creator Vault",
                body: "Premium packs, verified creators, and custom bundles.",
            },
        ],
        apiEnabled = false,
        apiUrl = "https://example.com/api/marketplace",
        apiPath = "",
        apiPollSeconds = 0,
        apiHeadersJson = "{}",
        backgroundBase = "#050816",
        neonCyan = "#00D9FF",
        neonMagenta = "#D946EF",
        neonYellow = "#FFD500",
        showLines = true,
        animateLines = true,
        linesOpacity = 1,
        lineStyle = "Neon Grid",
        showCircles = true,
        circles = [
            { x: 12, y: 18, size: 520, opacity: 0.08, blur: 0.3 },
            { x: 72, y: 22, size: 360, opacity: 0.06, blur: 0.3 },
            { x: 20, y: 72, size: 420, opacity: 0.07, blur: 0.3 },
            { x: 78, y: 74, size: 540, opacity: 0.05, blur: 0.3 },
        ],
        cardRadius = 32,
        cardBorderColor = "rgba(255,255,255,0.08)",
        cardGlass = 20,
        cardHoverLift = 10,
        chromeFont,
        titleFont,
        subtitleFont,
        badgeFont,
        cardEyebrowFont,
        cardTitleFont,
        cardBodyFont,
        textColor = "#FFFFFF",
        mutedTextColor = "rgba(255,255,255,0.6)",
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const rootRef = React.useRef<HTMLDivElement>(null)
    const inView = useInView(rootRef, { amount: 0.25, margin: "200px" })

    const [remoteCards, setRemoteCards] = React.useState<Card[] | null>(null)
    const [remoteError, setRemoteError] = React.useState<string>("")
    const [remoteLoading, setRemoteLoading] = React.useState<boolean>(false)

    const [expandedIndex, setExpandedIndex] = React.useState<number | null>(null)

    const toggleExpanded = React.useCallback((idx: number) => {
        React.startTransition(() => {
            setExpandedIndex((prev) => (prev === idx ? null : idx))
        })
    }, [])

    const collapseExpanded = React.useCallback(() => {
        React.startTransition(() => setExpandedIndex(null))
    }, [])

    const parsedHeaders = React.useMemo(() => {
        try {
            const val = JSON.parse(apiHeadersJson || "{}")
            if (!val || typeof val !== "object") return {}
            return val
        } catch {
            return {}
        }
    }, [apiHeadersJson])

    const extractByPath = React.useCallback((obj: any, path: string) => {
        if (!path) return obj
        const parts = path.split(".").map((p) => p.trim()).filter(Boolean)
        let cur = obj
        for (const part of parts) {
            if (cur == null) return undefined
            cur = cur?.[part]
        }
        return cur
    }, [])

    const normalizeCardPreset = React.useCallback((p: any): CardPreset => {
        if (p === "Card 1" || p === "Card 2" || p === "Card 3" || p === "Card 4") return p
        const n = String(p ?? "").toLowerCase()
        if (n.includes("2")) return "Card 2"
        if (n.includes("3")) return "Card 3"
        if (n.includes("4")) return "Card 4"
        return "Card 1"
    }, [])

    React.useEffect(() => {
        if (isStatic) return
        if (!apiEnabled) {
            React.startTransition(() => {
                setRemoteCards(null)
                setRemoteError("")
                setRemoteLoading(false)
            })
            return
        }

        if (typeof window === "undefined") return
        if (!apiUrl) return

        let alive = true
        const controller = new AbortController()

        const load = async () => {
            React.startTransition(() => {
                setRemoteLoading(true)
                setRemoteError("")
            })

            try {
                const res = await fetch(apiUrl, {
                    method: "GET",
                    headers: parsedHeaders as any,
                    signal: controller.signal,
                })

                if (!res.ok) throw new Error(`Request failed (${res.status})`)

                const json = await res.json()
                const data = extractByPath(json, apiPath)

                if (!Array.isArray(data)) {
                    throw new Error("API response is not an array (check Api Path)")
                }

                const mapped: Card[] = data.slice(0, 4).map((item: any, idx: number) => {
                    return {
                        preset: normalizeCardPreset(item?.preset ?? item?.theme ?? item?.variant ?? ((idx % 4) + 1)),
                        eyebrow: String(item?.eyebrow ?? item?.badge ?? item?.tag ?? "NEW"),
                        title: String(item?.title ?? item?.name ?? "Card"),
                        body: String(item?.body ?? item?.description ?? "Description"),
                    }
                })

                if (!alive) return
                React.startTransition(() => {
                    setRemoteCards(mapped)
                    setRemoteLoading(false)
                    setRemoteError("")
                })
            } catch (e: any) {
                if (!alive) return
                if (e?.name === "AbortError") return
                React.startTransition(() => {
                    setRemoteCards(null)
                    setRemoteLoading(false)
                    setRemoteError(e?.message ? String(e.message) : "Failed to load")
                })
            }
        }

        load()

        const pollMs = Math.max(0, apiPollSeconds) * 1000
        let intervalId: number | null = null
        if (pollMs > 0) {
            intervalId = window.setInterval(() => {
                load()
            }, pollMs)
        }

        return () => {
            alive = false
            controller.abort()
            if (intervalId != null) window.clearInterval(intervalId)
        }
    }, [apiEnabled, apiUrl, apiPath, apiPollSeconds, extractByPath, isStatic, normalizeCardPreset, parsedHeaders])

    const safeOpacity = clamp(linesOpacity, 0, 1)

    const background = React.useMemo(() => {
        return `radial-gradient(circle at top left, rgba(0,229,255,0.18), transparent 30%), radial-gradient(circle at bottom right, rgba(217,70,239,0.18), transparent 30%), ${backgroundBase}`
    }, [backgroundBase])

    const lines = React.useMemo(() => {
        if (lineStyle === "Dots") {
            return `radial-gradient(circle, ${neonCyan}66 1.2px, transparent 1.4px), radial-gradient(circle, ${neonMagenta}55 1.1px, transparent 1.3px), radial-gradient(circle, ${neonYellow}44 0.9px, transparent 1.1px)`
        }

        if (lineStyle === "Circuit") {
            return `linear-gradient(90deg, ${neonCyan}55 1px, transparent 1px), linear-gradient(0deg, ${neonMagenta}44 1px, transparent 1px), repeating-linear-gradient(135deg, ${neonYellow}33 0 2px, transparent 2px 12px)`
        }

        if (lineStyle === "Diagonal Streaks") {
            return `repeating-linear-gradient(120deg, ${neonCyan}55 0 2px, transparent 2px 28px), repeating-linear-gradient(45deg, ${neonMagenta}44 0 2px, transparent 2px 34px), repeating-linear-gradient(90deg, ${neonYellow}33 0 1px, transparent 1px 70px)`
        }

        // Neon Grid
        return `linear-gradient(120deg, rgba(0,217,255,0.5) 2px, transparent 2px), linear-gradient(45deg, rgba(217,70,239,0.4) 2px, transparent 2px), linear-gradient(90deg, rgba(255,213,0,0.35) 2px, transparent 2px)`
    }, [lineStyle, neonCyan, neonMagenta, neonYellow])

    const linesSize = React.useMemo(() => {
        if (lineStyle === "Dots") return "34px 34px, 44px 44px, 56px 56px"
        if (lineStyle === "Circuit") return "90px 90px, 110px 110px, 160px 160px"
        if (lineStyle === "Diagonal Streaks") return "260px 260px, 320px 320px, 500px 500px"
        return "300px 300px, 250px 250px, 200px 200px"
    }, [lineStyle])

    const shouldAnimateLines = !isStatic && inView && animateLines

    const chromeTextStyle: React.CSSProperties = React.useMemo(
        () => ({
            ...chromeFont,
            backgroundImage:
                "linear-gradient(180deg,#ffffff 0%,#d9d9d9 20%,#8f8f8f 40%,#ffffff 55%,#6e6e6e 75%,#ffffff 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            textShadow: `0 0 10px rgba(255,255,255,0.4), 0 0 25px rgba(0,229,255,0.4)`,
            filter: `drop-shadow(0 0 20px ${neonCyan})`,
            letterSpacing: (chromeFont?.letterSpacing ?? "10px") as any,
            lineHeight: (chromeFont?.lineHeight ?? "1em") as any,
            margin: 0,
            padding: 0,
            whiteSpace: "nowrap",
        }),
        [chromeFont, neonCyan],
    )

    const cardShadow = React.useMemo(() => {
        return `0 0 25px rgba(0,229,255,0.15), 0 0 60px rgba(217,70,239,0.12)`
    }, [])

    const cardHoverShadow = React.useMemo(() => {
        return `0 0 30px rgba(0,229,255,0.35), 0 0 80px rgba(217,70,239,0.25)`
    }, [])

    const css = React.useMemo(() => {
        const cls = "nm_card"
        const styleString = `
          .${cls} {
            transition: transform 0.4s ease, box-shadow 0.4s ease, outline-color 0.2s ease;
            will-change: transform, box-shadow;
            outline: none;
            transform-origin: center;
          }
          .${cls}:hover {
            transform: translateY(-${cardHoverLift}px) scale(1.03);
            box-shadow: ${cardHoverShadow};
          }
          .${cls}:focus-visible {
            transform: translateY(-${cardHoverLift}px) scale(1.03);
            box-shadow: ${cardHoverShadow};
            outline: 2px solid ${neonCyan};
            outline-offset: 3px;
          }
          .${cls}.nm_expanded {
            transform: scaleX(1.12);
            box-shadow: ${cardHoverShadow};
            z-index: 5;
          }
          .${cls}.nm_expanded:hover {
            transform: scaleX(1.12);
          }
          .${cls}.nm_expanded:focus-visible {
            transform: scaleX(1.12);
          }
        `
        return styleString
    }, [cardHoverLift, cardHoverShadow, neonCyan])

    const cardItems = React.useMemo(() => {
        const source = remoteCards && remoteCards.length ? remoteCards : cards
        const list = (source ?? []).slice(0, 4)
        while (list.length < 4) {
            list.push({ preset: "Card 1", eyebrow: "NEW", title: "Card", body: "Description" })
        }
        return list
    }, [cards, remoteCards])

    return (
        <div
            ref={rootRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                background,
                ...style,
            }}
            onPointerDown={(e) => {
                const t = e.target as HTMLElement | null
                if (!t) return
                if (t.closest?.(".nm_card")) return
                collapseExpanded()
            }}
        >
            <style>{css}</style>

            {showLines && (
                <motion.div
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        inset: 0,
                        backgroundImage: lines,
                        backgroundSize: linesSize,
                        mixBlendMode: "screen",
                        opacity: safeOpacity,
                        pointerEvents: "none",
                    }}
                    animate={
                        shouldAnimateLines
                            ? {
                                  backgroundPosition: ["0px 0px, 0px 0px, 0px 0px", "-700px 700px, 650px -650px, -500px 0px"],
                              }
                            : undefined
                    }
                    transition={
                        shouldAnimateLines
                            ? {
                                  duration: 14,
                                  ease: "linear",
                                  repeat: Infinity,
                              }
                            : undefined
                    }
                />
            )}

            {showCircles &&
                (circles ?? []).map((c, idx) => {
                    const left = `${clamp(c.x, 0, 100)}%`
                    const top = `${clamp(c.y, 0, 100)}%`
                    const size = clamp(c.size, 40, 2000)
                    const opacity = clamp(c.opacity, 0, 1)
                    const blur = clamp(c.blur, 0, 6)

                    return (
                        <div
                            key={idx}
                            aria-hidden="true"
                            style={{
                                position: "absolute",
                                left,
                                top,
                                width: size,
                                height: size,
                                transform: "translate(-50%, -50%)",
                                border: "1px solid rgba(255,255,255,0.08)",
                                borderRadius: 9999,
                                filter: `blur(${blur}px)`,
                                opacity,
                                pointerEvents: "none",
                            }}
                        />
                    )
                })}

            <div
                style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    padding: "56px 56px",
                    gap: 26,
                }}
            >
                <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ position: "relative", width: "100%", overflow: "visible" }}>
                        <h1 style={chromeTextStyle}>{chromeText}</h1>
                    </div>

                    <div style={{ position: "relative", display: "flex", flexWrap: "wrap", gap: 10 }}>
                        {(badges ?? []).slice(0, 8).map((b, i) => (
                            <span
                                key={i}
                                style={{
                                    ...badgeFont,
                                    padding: "8px 18px",
                                    borderRadius: 999,
                                    background: "rgba(255,255,255,0.15)",
                                    WebkitBackdropFilter: "blur(12px)",
                                    backdropFilter: "blur(12px)",
                                    color: textColor,
                                    letterSpacing: (badgeFont?.letterSpacing ?? "2px") as any,
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {b?.label ?? "BADGE"}
                            </span>
                        ))}
                    </div>

                    <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 6 }}>
                        <div
                            style={{
                                ...titleFont,
                                color: textColor,
                                margin: 0,
                                padding: 0,
                                width: "max-content",
                                maxWidth: "100%",
                            }}
                        >
                            {title}
                        </div>
                        <div
                            style={{
                                ...subtitleFont,
                                color: mutedTextColor,
                                letterSpacing: (subtitleFont?.letterSpacing ?? "4px") as any,
                                width: "max-content",
                                maxWidth: "100%",
                            }}
                        >
                            {subtitle}
                        </div>
                    </div>
                </div>

                <div
                    style={{
                        position: "relative",
                        width: "100%",
                        display: "grid",
                        gridTemplateColumns: "repeat(4, minmax(220px, 1fr))",
                        gap: 22,
                        alignItems: "stretch",
                    }}
                >
                    {remoteLoading && apiEnabled && (
                        <div
                            role="status"
                            aria-live="polite"
                            style={{
                                gridColumn: "1 / -1",
                                color: mutedTextColor,
                                ...cardBodyFont,
                            }}
                        >
                            Loading…
                        </div>
                    )}
                    {!remoteLoading && remoteError && apiEnabled && (
                        <div
                            role="alert"
                            style={{
                                gridColumn: "1 / -1",
                                color: textColor,
                                ...cardBodyFont,
                            }}
                        >
                            {remoteError}
                        </div>
                    )}
                    {cardItems.map((card, i) => {
                        const titleId = `nm_card_title_${i}`
                        const bodyId = `nm_card_body_${i}`
                        const isExpanded = expandedIndex === i
                        return (
                        <article
                            key={i}
                            className={"nm_card" + (isExpanded ? " nm_expanded" : "")}
                            tabIndex={0}
                            role="group"
                            aria-labelledby={titleId}
                            aria-describedby={bodyId}
                            onDoubleClick={() => toggleExpanded(i)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault()
                                    toggleExpanded(i)
                                }
                                if (e.key === "Escape") {
                                    e.preventDefault()
                                    React.startTransition(() => setExpandedIndex(null))
                                }
                            }}
                            style={{
                                position: "relative",
                                width: "100%",
                                height: 380,
                                borderRadius: cardRadius,
                                overflow: "hidden",
                                background: presetGradient(card.preset),
                                border: `1px solid ${cardBorderColor}`,
                                boxShadow: cardShadow,
                                WebkitBackdropFilter: `blur(${cardGlass}px)`,
                                backdropFilter: `blur(${cardGlass}px)`,
                                padding: 22,
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "space-between",
                            }}
                        >
                            <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 14 }}>
                                <div
                                    style={{
                                        ...cardEyebrowFont,
                                        display: "inline-flex",
                                        alignSelf: "flex-start",
                                        padding: "8px 14px",
                                        borderRadius: 999,
                                        background: "rgba(255,255,255,0.08)",
                                        color: textColor,
                                        border: "1px solid rgba(255,255,255,0.10)",
                                        WebkitBackdropFilter: "blur(12px)",
                                        backdropFilter: "blur(12px)",
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    {card.eyebrow}
                                </div>

                                <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 10 }}>
                                    <h3
                                        id={titleId}
                                        style={{
                                            ...cardTitleFont,
                                            color: textColor,
                                            margin: 0,
                                            padding: 0,
                                            width: "100%",
                                        }}
                                    >
                                        {card.title}
                                    </h3>
                                    <p
                                        id={bodyId}
                                        style={{
                                            ...cardBodyFont,
                                            color: mutedTextColor,
                                            margin: 0,
                                            padding: 0,
                                        }}
                                    >
                                        {card.body}
                                    </p>
                                </div>
                            </div>

                            <div
                                aria-hidden="true"
                                style={{
                                    position: "absolute",
                                    inset: -60,
                                    background:
                                        `radial-gradient(circle at 30% 20%, ${neonCyan}33, transparent 45%),` +
                                        `radial-gradient(circle at 70% 80%, ${neonMagenta}2b, transparent 50%),` +
                                        `radial-gradient(circle at 40% 90%, ${neonYellow}22, transparent 55%)`,
                                    filter: "blur(2px)",
                                    pointerEvents: "none",
                                }}
                            />
                        </article>
                    )
                    })}
                </div>

                <div
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        right: -120,
                        bottom: -160,
                        width: 520,
                        height: 520,
                        borderRadius: 9999,
                        background: `radial-gradient(circle at 30% 30%, ${neonCyan}44, transparent 55%), radial-gradient(circle at 70% 70%, ${neonMagenta}33, transparent 60%)`,
                        filter: "blur(24px)",
                        opacity: 0.8,
                        pointerEvents: "none",
                    }}
                />
            </div>
        </div>
    )
}

addPropertyControls(NeonMarketplace, {
    chromeText: {
        type: ControlType.String,
        title: "Chrome",
        defaultValue: "MARKETPLACE",
    },
    title: {
        type: ControlType.String,
        title: "Title",
        defaultValue: "Quantum UI",
    },
    subtitle: {
        type: ControlType.String,
        title: "Subtitle",
        defaultValue: "NEON MARKET DASHBOARD",
    },

    badges: {
        type: ControlType.Array,
        title: "Badges",
        maxCount: 8,
        control: {
            type: ControlType.Object,
            controls: {
                label: { type: ControlType.String, title: "Label", defaultValue: "AI" },
            },
        },
        defaultValue: [{ label: "AI" }, { label: "AURORA" }, { label: "GLASS" }],
    },

    cards: {
        type: ControlType.Array,
        title: "Cards",
        maxCount: 4,
        control: {
            type: ControlType.Object,
            controls: {
                preset: {
                    type: ControlType.Enum,
                    title: "Preset",
                    options: ["Card 1", "Card 2", "Card 3", "Card 4"],
                    optionTitles: ["Card 1", "Card 2", "Card 3", "Card 4"],
                    defaultValue: "Card 1",
                },
                eyebrow: { type: ControlType.String, title: "Badge", defaultValue: "FEATURED" },
                title: { type: ControlType.String, title: "Title", defaultValue: "AI Listings" },
                body: {
                    type: ControlType.String,
                    title: "Body",
                    defaultValue: "Discover next-gen assets with glowing, glassmorphic clarity.",
                    displayTextArea: true,
                },
            },
        },
        defaultValue: [
            {
                preset: "Card 1",
                eyebrow: "FEATURED",
                title: "AI Listings",
                body: "Discover next-gen assets with glowing, glassmorphic clarity.",
            },
            {
                preset: "Card 2",
                eyebrow: "TRENDING",
                title: "Neon Drops",
                body: "Limited releases powered by realtime demand signals.",
            },
            {
                preset: "Card 3",
                eyebrow: "SECURE",
                title: "Quantum Wallet",
                body: "Encrypted transfers with instant settlement.",
            },
            {
                preset: "Card 4",
                eyebrow: "CURATED",
                title: "Creator Vault",
                body: "Premium packs, verified creators, and custom bundles.",
            },
        ],
    },

    apiEnabled: {
        type: ControlType.Boolean,
        title: "Use API",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    apiUrl: {
        type: ControlType.String,
        title: "API URL",
        defaultValue: "https://example.com/api/marketplace",
        hidden: ({ apiEnabled }) => !apiEnabled,
    },
    apiPath: {
        type: ControlType.String,
        title: "API Path",
        defaultValue: "",
        placeholder: "e.g. data.items",
        hidden: ({ apiEnabled }) => !apiEnabled,
    },
    apiHeadersJson: {
        type: ControlType.String,
        title: "API Headers",
        defaultValue: "{}",
        displayTextArea: true,
        hidden: ({ apiEnabled }) => !apiEnabled,
    },
    apiPollSeconds: {
        type: ControlType.Number,
        title: "Poll (s)",
        defaultValue: 0,
        min: 0,
        max: 3600,
        step: 1,
        hidden: ({ apiEnabled }) => !apiEnabled,
    },

    backgroundBase: {
        type: ControlType.Color,
        title: "Base BG",
        defaultValue: "#050816",
    },
    neonCyan: {
        type: ControlType.Color,
        title: "Neon Cyan",
        defaultValue: "#00D9FF",
    },
    neonMagenta: {
        type: ControlType.Color,
        title: "Neon Magenta",
        defaultValue: "#D946EF",
    },
    neonYellow: {
        type: ControlType.Color,
        title: "Neon Yellow",
        defaultValue: "#FFD500",
    },

    textColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#FFFFFF",
    },
    mutedTextColor: {
        type: ControlType.Color,
        title: "Muted",
        defaultValue: "rgba(255,255,255,0.6)",
    },

    showLines: {
        type: ControlType.Boolean,
        title: "Neon Lines",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    animateLines: {
        type: ControlType.Boolean,
        title: "Animate Lines",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: ({ showLines }) => !showLines,
    },
    linesOpacity: {
        type: ControlType.Number,
        title: "Lines Opacity",
        defaultValue: 1,
        min: 0,
        max: 1,
        step: 0.05,
        hidden: ({ showLines }) => !showLines,
    },
    lineStyle: {
        type: ControlType.Enum,
        title: "Line Style",
        options: ["Neon Grid", "Diagonal Streaks", "Circuit", "Dots"],
        optionTitles: ["Neon Grid", "Diagonal", "Circuit", "Dots"],
        defaultValue: "Neon Grid",
        hidden: ({ showLines }) => !showLines,
    },

    showCircles: {
        type: ControlType.Boolean,
        title: "Circles",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    circles: {
        type: ControlType.Array,
        title: "Circle FX",
        maxCount: 10,
        hidden: ({ showCircles }) => !showCircles,
        control: {
            type: ControlType.Object,
            controls: {
                x: { type: ControlType.Number, title: "X%", defaultValue: 12, min: 0, max: 100, step: 1 },
                y: { type: ControlType.Number, title: "Y%", defaultValue: 18, min: 0, max: 100, step: 1 },
                size: { type: ControlType.Number, title: "Size", defaultValue: 520, min: 40, max: 2000, step: 10 },
                opacity: { type: ControlType.Number, title: "Opacity", defaultValue: 0.08, min: 0, max: 1, step: 0.01 },
                blur: { type: ControlType.Number, title: "Blur", defaultValue: 0.3, min: 0, max: 6, step: 0.1 },
            },
        },
        defaultValue: [
            { x: 12, y: 18, size: 520, opacity: 0.08, blur: 0.3 },
            { x: 72, y: 22, size: 360, opacity: 0.06, blur: 0.3 },
            { x: 20, y: 72, size: 420, opacity: 0.07, blur: 0.3 },
            { x: 78, y: 74, size: 540, opacity: 0.05, blur: 0.3 },
        ],
    },

    cardRadius: {
        type: ControlType.Number,
        title: "Card Radius",
        defaultValue: 32,
        min: 8,
        max: 64,
        step: 1,
    },
    cardGlass: {
        type: ControlType.Number,
        title: "Blur",
        defaultValue: 20,
        min: 0,
        max: 40,
        step: 1,
    },
    cardBorderColor: {
        type: ControlType.Color,
        title: "Card Border",
        defaultValue: "rgba(255,255,255,0.08)",
    },
    cardHoverLift: {
        type: ControlType.Number,
        title: "Hover Lift",
        defaultValue: 10,
        min: 0,
        max: 30,
        step: 1,
        unit: "px",
    },

    chromeFont: {
        type: ControlType.Font,
        title: "Chrome Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "72px",
            variant: "Black",
            letterSpacing: "10px",
            lineHeight: "1em",
        },
    },
    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "42px",
            variant: "Extra Bold",
            letterSpacing: "-0.03em",
            lineHeight: "1.05em",
        },
    },
    subtitleFont: {
        type: ControlType.Font,
        title: "Subtitle Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "18px",
            variant: "Semibold",
            letterSpacing: "4px",
            lineHeight: "1.2em",
        },
    },
    badgeFont: {
        type: ControlType.Font,
        title: "Badge Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "12px",
            variant: "Bold",
            letterSpacing: "2px",
            lineHeight: "1em",
        },
    },

    cardEyebrowFont: {
        type: ControlType.Font,
        title: "Card Tag Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "12px",
            variant: "Bold",
            letterSpacing: "2px",
            lineHeight: "1em",
        },
    },
    cardTitleFont: {
        type: ControlType.Font,
        title: "Card Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "22px",
            variant: "Semibold",
            letterSpacing: "-0.01em",
            lineHeight: "1.1em",
        },
    },
    cardBodyFont: {
        type: ControlType.Font,
        title: "Card Body Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "15px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.35em",
        },
    },
})

function cardHoverHoverShadowFallback(shadow: string) { return shadow }