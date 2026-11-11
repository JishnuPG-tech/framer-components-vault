import * as React from "react"
import { useMemo, useState, useRef, useEffect } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


type ContributionLevel = 0 | 1 | 2 | 3 | 4

interface ContributionDay {
    date?: string
    level: ContributionLevel
    count?: number
}

type ContributionWeek = ContributionDay[]

type RealContributionMap = Map<
    string,
    { count: number; level: ContributionLevel }
>

type FetchStatus = "idle" | "loading" | "success" | "error"

/* --------------------------- deterministic PRNG -------------------------- */

function mulberry32(seed: number) {
    let a = seed
    return function () {
        a |= 0
        a = (a + 0x6d2b79f5) | 0
        let t = Math.imul(a ^ (a >>> 15), 1 | a)
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}

function generateContributionData(
    weeks: number,
    daysPerWeek: number,
    emptyChance: number,
    seed: number
): ContributionWeek[] {
    const rand = mulberry32(seed)
    const totalDays = weeks * daysPerWeek
    const cursor = new Date()
    cursor.setHours(0, 0, 0, 0)

    const flatDays: ContributionDay[] = []
    for (let i = totalDays - 1; i >= 0; i--) {
        const d = new Date(cursor)
        d.setDate(d.getDate() - i)

        let level: ContributionLevel = 0
        if (rand() > emptyChance) {
            const r = rand()
            level = r > 0.85 ? 4 : r > 0.65 ? 3 : r > 0.35 ? 2 : 1
        }
        const count = level === 0 ? 0 : Math.round(level * (2 + rand() * 4))

        flatDays.push({ date: d.toISOString().slice(0, 10), level, count })
    }

    const result: ContributionWeek[] = []
    for (let w = 0; w < weeks; w++) {
        result.push(
            flatDays.slice(w * daysPerWeek, w * daysPerWeek + daysPerWeek)
        )
    }
    return result
}

/* ---------------------------- real GitHub data ---------------------------- */

function normalizeGithubUsername(raw: string): string {
    let value = (raw || "").trim()
    // allow pasting a full profile URL, e.g. https://github.com/octocat
    const urlMatch = value.match(/github\.com\/([A-Za-z0-9-]+)/i)
    if (urlMatch) value = urlMatch[1]
    value = value.replace(/^@/, "")
    return value
}

async function fetchGithubContributions(
    username: string,
    signal: AbortSignal
): Promise<RealContributionMap> {
    const res = await fetch(
        `https://github-contributions-api.jogruber.de/v4/${encodeURIComponent(
            username
        )}?y=last`,
        { signal }
    )

    if (!res.ok) {
        if (res.status === 404)
            throw new Error(`"${username}" wasn't found on GitHub`)
        throw new Error(`GitHub data request failed (${res.status})`)
    }

    const data = await res.json()
    if (!data || !Array.isArray(data.contributions)) {
        throw new Error("Unexpected response from contributions service")
    }

    const map: RealContributionMap = new Map()
    for (const day of data.contributions) {
        const level = Math.max(
            0,
            Math.min(4, Number(day.level))
        ) as ContributionLevel
        map.set(day.date, { count: Number(day.count) || 0, level })
    }
    return map
}

function buildGridFromRealData(
    map: RealContributionMap,
    weeks: number,
    daysPerWeek: number
): ContributionWeek[] {
    const totalDays = weeks * daysPerWeek
    const cursor = new Date()
    cursor.setHours(0, 0, 0, 0)

    const flatDays: ContributionDay[] = []
    for (let i = totalDays - 1; i >= 0; i--) {
        const d = new Date(cursor)
        d.setDate(d.getDate() - i)
        const key = d.toISOString().slice(0, 10)
        const found = map.get(key)
        flatDays.push({
            date: key,
            level: found ? found.level : 0,
            count: found ? found.count : 0,
        })
    }

    const result: ContributionWeek[] = []
    for (let w = 0; w < weeks; w++) {
        result.push(
            flatDays.slice(w * daysPerWeek, w * daysPerWeek + daysPerWeek)
        )
    }
    return result
}

const WEEKDAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""]
const MONTH_NAMES = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
]

/* ------------------------------- component -------------------------------- */

interface Props {
    // data source
    githubUsername: string

    // frame
    title: string
    subtitle: string
    showFrame: boolean
    background: string
    textColor: string
    accentColor: string
    radius: number
    padding: number

    // graph
    weeks: number
    daysPerWeek: number
    seed: number
    emptyChance: number
    colorEmpty: string
    colorLevel1: string
    colorLevel2: string
    colorLevel3: string
    colorLevel4: string
    cellSize: number
    gap: number
    cellRadius: number
    showWeekdayLabels: boolean
    showMonthLabels: boolean
    showLegend: boolean

    // animation
    animate: boolean
    animationDuration: number
    animationStagger: number
    replayOnView: boolean

    style?: React.CSSProperties
}

export default function ContributionGraph(props: Props) {
    const {
        githubUsername,
        title,
        subtitle,
        showFrame,
        background,
        textColor,
        accentColor,
        radius,
        padding,
        weeks,
        daysPerWeek,
        seed,
        emptyChance,
        colorEmpty,
        colorLevel1,
        colorLevel2,
        colorLevel3,
        colorLevel4,
        cellSize,
        gap,
        cellRadius,
        showWeekdayLabels,
        showMonthLabels,
        showLegend,
        animate,
        animationDuration,
        animationStagger,
        replayOnView,
        style,
    } = props

    // True on the Framer canvas and during export. Disable all animation,
    // transitions, hover effects and observers when this is true.
    const isStatic = useIsStaticRenderer()
    const shouldAnimate = animate && !isStatic

    const colors = [
        colorEmpty,
        colorLevel1,
        colorLevel2,
        colorLevel3,
        colorLevel4,
    ]
    const uidRef = useRef("cg" + Math.random().toString(36).slice(2, 9))
    const uid = uidRef.current

    const containerRef = useRef<HTMLDivElement | null>(null)
    const [inView, setInView] = useState(!replayOnView || isStatic)
    const [hovered, setHovered] = useState<{
        day: ContributionDay
        x: number
        y: number
    } | null>(null)

    const cleanUsername = useMemo(
        () => normalizeGithubUsername(githubUsername),
        [githubUsername]
    )

    const [status, setStatus] = useState<FetchStatus>("idle")
    const [errorMessage, setErrorMessage] = useState("")
    const [liveMap, setLiveMap] = useState<RealContributionMap | null>(null)
    const cacheRef = useRef<Map<string, RealContributionMap>>(new Map())

    useEffect(() => {
        if (!cleanUsername) {
            setStatus("idle")
            setLiveMap(null)
            setErrorMessage("")
            return
        }

        const cacheKey = cleanUsername.toLowerCase()
        const cached = cacheRef.current.get(cacheKey)
        if (cached) {
            setLiveMap(cached)
            setStatus("success")
            setErrorMessage("")
            return
        }

        const controller = new AbortController()
        setStatus("loading")
        setErrorMessage("")

        fetchGithubContributions(cleanUsername, controller.signal)
            .then((map) => {
                cacheRef.current.set(cacheKey, map)
                setLiveMap(map)
                setStatus("success")
            })
            .catch((err) => {
                if (controller.signal.aborted) return
                setLiveMap(null)
                setStatus("error")
                setErrorMessage(
                    err?.message || "Couldn't load GitHub contributions"
                )
            })

        return () => controller.abort()
    }, [cleanUsername])

    const placeholderGrid = useMemo(
        () => generateContributionData(weeks, daysPerWeek, emptyChance, seed),
        [weeks, daysPerWeek, emptyChance, seed]
    )

    const usingRealData =
        Boolean(cleanUsername) && status === "success" && !!liveMap

    const grid = useMemo(() => {
        if (usingRealData && liveMap) {
            return buildGridFromRealData(liveMap, weeks, daysPerWeek)
        }
        return placeholderGrid
    }, [usingRealData, liveMap, placeholderGrid, weeks, daysPerWeek])

    // Only observe visibility at runtime, never on the canvas or in exports.
    useEffect(() => {
        if (isStatic) {
            setInView(true)
            return
        }
        if (!replayOnView || !containerRef.current) {
            setInView(true)
            return
        }
        const el = containerRef.current
        const observer = new IntersectionObserver(
            ([entry]) => setInView(entry.isIntersecting),
            { threshold: 0.2 }
        )
        observer.observe(el)
        return () => observer.disconnect()
    }, [replayOnView, isStatic])

    const monthLabels = useMemo(() => {
        if (!showMonthLabels) return []
        const labels: { weekIndex: number; label: string }[] = []
        let lastMonth = -1
        grid.forEach((week, weekIndex) => {
            const firstDated = week.find((d) => d.date)
            if (!firstDated?.date) return
            const month = new Date(firstDated.date).getMonth()
            if (month !== lastMonth) {
                labels.push({ weekIndex, label: MONTH_NAMES[month] })
                lastMonth = month
            }
        })
        return labels
    }, [grid, showMonthLabels])

    const totalCells = weeks * daysPerWeek

    const statusLine =
        cleanUsername && status === "loading"
            ? `Loading @${cleanUsername}'s contributions…`
            : cleanUsername && status === "error"
              ? `${errorMessage} — showing demo data`
              : null

    const content = (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                gap: 8,
                boxSizing: "border-box",
                fontFamily:
                    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
                color: textColor,
            }}
        >
            <style>{`
                ${
                    shouldAnimate
                        ? `@keyframes contribPop-${uid} {
                    0%   { transform: scale(0.4); opacity: 0; }
                    60%  { transform: scale(1.08); opacity: 1; }
                    100% { transform: scale(1); opacity: 1; }
                }`
                        : ""
                }
                .contrib-grid-${uid} {
                    display: grid;
                    grid-template-columns: repeat(${weeks}, minmax(0, 1fr));
                    grid-auto-rows: 1fr;
                    gap: ${gap}px;
                    width: 100%;
                }
                .contrib-cell-${uid} {
                    aspect-ratio: 1 / 1;
                    width: 100%;
                    border-radius: ${cellRadius}px;
                    transform-origin: center;
                    ${
                        isStatic
                            ? ""
                            : "transition: outline-color 120ms ease, transform 120ms ease;"
                    }
                }
                ${
                    shouldAnimate
                        ? `.contrib-cell-${uid}.animated {
                    animation-name: contribPop-${uid};
                    animation-duration: ${animationDuration}ms;
                    animation-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1);
                    animation-fill-mode: backwards;
                }`
                        : ""
                }
                ${
                    isStatic
                        ? ""
                        : `.contrib-cell-${uid}:hover {
                    outline: 1px solid rgba(255,255,255,0.6);
                    outline-offset: 1px;
                    transform: scale(1.15);
                }`
                }
                .contrib-scroll-${uid} {
                    overflow-x: auto;
                    padding-bottom: 4px;
                }
            `}</style>

            {(title || subtitle) && (
                <div style={{ marginBottom: 4 }}>
                    {title && (
                        <div style={{ fontSize: 16, fontWeight: 600 }}>
                            {title}
                        </div>
                    )}
                    {subtitle && (
                        <div
                            style={{ fontSize: 12, opacity: 0.6, marginTop: 2 }}
                        >
                            {subtitle}
                        </div>
                    )}
                    {statusLine && (
                        <div
                            style={{
                                fontSize: 11,
                                opacity: 0.55,
                                marginTop: 2,
                                fontStyle: "italic",
                            }}
                        >
                            {statusLine}
                        </div>
                    )}
                </div>
            )}

            <div className={`contrib-scroll-${uid}`}>
                <div
                    style={{
                        display: "flex",
                        gap: 8,
                        minWidth: weeks * (cellSize + gap),
                    }}
                >
                    {showWeekdayLabels && (
                        <div
                            style={{
                                display: "grid",
                                gridTemplateRows: `repeat(${daysPerWeek}, 1fr)`,
                                gap: `${gap}px`,
                                fontSize: 10,
                                opacity: 0.6,
                                paddingTop: showMonthLabels ? 18 : 0,
                                flexShrink: 0,
                            }}
                        >
                            {Array.from({ length: daysPerWeek }).map((_, i) => (
                                <div
                                    key={i}
                                    style={{
                                        height: cellSize,
                                        display: "flex",
                                        alignItems: "center",
                                    }}
                                >
                                    {WEEKDAY_LABELS[i % 7]}
                                </div>
                            ))}
                        </div>
                    )}

                    <div style={{ flex: 1, minWidth: 0 }}>
                        {showMonthLabels && (
                            <div
                                style={{
                                    position: "relative",
                                    height: 16,
                                    fontSize: 10,
                                    opacity: 0.6,
                                }}
                            >
                                {monthLabels.map(({ weekIndex, label }) => (
                                    <span
                                        key={`${label}-${weekIndex}`}
                                        style={{
                                            position: "absolute",
                                            left: `${(weekIndex / weeks) * 100}%`,
                                        }}
                                    >
                                        {label}
                                    </span>
                                ))}
                            </div>
                        )}

                        <div className={`contrib-grid-${uid}`}>
                            {grid.map((week, weekIndex) =>
                                week.map((day, dayIndex) => {
                                    const cellIndex =
                                        weekIndex * daysPerWeek + dayIndex
                                    const delay = shouldAnimate
                                        ? Math.min(cellIndex, totalCells) *
                                          animationStagger
                                        : 0
                                    return (
                                        <div
                                            key={`${weekIndex}-${dayIndex}`}
                                            className={`contrib-cell-${uid}${
                                                shouldAnimate && inView
                                                    ? " animated"
                                                    : ""
                                            }`}
                                            style={{
                                                backgroundColor:
                                                    colors[day.level],
                                                animationDelay: `${delay}ms`,
                                                gridColumn: weekIndex + 1,
                                                gridRow: dayIndex + 1,
                                                cursor: isStatic
                                                    ? "default"
                                                    : "pointer",
                                            }}
                                            onMouseEnter={
                                                isStatic
                                                    ? undefined
                                                    : (e) => {
                                                          const rect = (
                                                              e.currentTarget as HTMLDivElement
                                                          ).getBoundingClientRect()
                                                          setHovered({
                                                              day,
                                                              x: rect.left,
                                                              y: rect.top,
                                                          })
                                                      }
                                            }
                                            onMouseLeave={
                                                isStatic
                                                    ? undefined
                                                    : () => setHovered(null)
                                            }
                                        />
                                    )
                                })
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {showLegend && (
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: 11,
                        opacity: 0.7,
                    }}
                >
                    <span>Less</span>
                    {colors.map((c, i) => (
                        <span
                            key={i}
                            style={{
                                width: 10,
                                height: 10,
                                borderRadius: 2,
                                background: c,
                                display: "inline-block",
                            }}
                        />
                    ))}
                    <span>More</span>
                </div>
            )}

            {!isStatic && hovered && (
                <div
                    style={{
                        position: "fixed",
                        left: hovered.x,
                        top: hovered.y - 36,
                        transform: "translateX(-50%)",
                        background: "#1c2128",
                        color: "#c9d1d9",
                        fontSize: 11,
                        padding: "4px 8px",
                        borderRadius: 4,
                        whiteSpace: "nowrap",
                        pointerEvents: "none",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
                        zIndex: 9999,
                    }}
                >
                    {hovered.day.count ?? 0} contribution
                    {hovered.day.count === 1 ? "" : "s"}
                    {hovered.day.date ? ` on ${hovered.day.date}` : ""}
                </div>
            )}
        </div>
    )

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                boxSizing: "border-box",
                background: showFrame ? background : "transparent",
                borderRadius: showFrame ? radius : 0,
                padding: showFrame ? padding : 0,
                border: showFrame ? `1px solid ${accentColor}33` : "none",
                boxShadow: showFrame ? "0 4px 24px rgba(0,0,0,0)" : "none",
                overflow: "hidden",
                ...style,
            }}
        >
            {content}
        </div>
    )
}

ContributionGraph.displayName = "Contribution Graph"

ContributionGraph.defaultProps = {
    githubUsername: "",

    title: "Contribution activity",
    subtitle: "Last 52 weeks",
    showFrame: true,
    background: "#0d1117",
    textColor: "#c9d1d9",
    accentColor: "#39d353",
    radius: 12,
    padding: 20,

    weeks: 52,
    daysPerWeek: 7,
    seed: 42,
    emptyChance: 0.35,
    colorEmpty: "#161b22",
    colorLevel1: "#0e4429",
    colorLevel2: "#006d32",
    colorLevel3: "#26a641",
    colorLevel4: "#39d353",
    cellSize: 12,
    gap: 3,
    cellRadius: 2,
    showWeekdayLabels: true,
    showMonthLabels: true,
    showLegend: true,

    animate: true,
    animationDuration: 500,
    animationStagger: 6,
    replayOnView: true,
}

addPropertyControls(ContributionGraph, {
    githubUsername: {
        type: ControlType.String,
        title: "GitHub User",
        placeholder: "e.g. octocat",
        defaultValue: "",
        description:
            "Leave blank to use generated demo data. Accepts a username or a full github.com profile URL.",
    },

    title: {
        type: ControlType.String,
        title: "Title",
        defaultValue: "Contribution activity",
    },
    subtitle: {
        type: ControlType.String,
        title: "Subtitle",
        defaultValue: "Last 52 weeks",
    },
    showFrame: {
        type: ControlType.Boolean,
        title: "Show Frame",
        defaultValue: true,
    },
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#0d1117",
        hidden: (p) => !p.showFrame,
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#c9d1d9",
    },
    accentColor: {
        type: ControlType.Color,
        title: "Accent",
        defaultValue: "#39d353",
        hidden: (p) => !p.showFrame,
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 40,
        defaultValue: 12,
        hidden: (p) => !p.showFrame,
    },
    padding: {
        type: ControlType.Number,
        title: "Padding",
        min: 0,
        max: 60,
        defaultValue: 20,
        hidden: (p) => !p.showFrame,
    },

    weeks: {
        type: ControlType.Number,
        title: "Weeks",
        min: 4,
        max: 104,
        step: 1,
        defaultValue: 52,
    },
    daysPerWeek: {
        type: ControlType.Number,
        title: "Days/Week",
        min: 1,
        max: 7,
        step: 1,
        defaultValue: 7,
    },
    seed: {
        type: ControlType.Number,
        title: "Seed",
        min: 0,
        max: 9999,
        step: 1,
        defaultValue: 42,
        hidden: (p) => !!normalizeGithubUsername(p.githubUsername),
    },
    emptyChance: {
        type: ControlType.Number,
        title: "Empty %",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 0.35,
        hidden: (p) => !!normalizeGithubUsername(p.githubUsername),
    },

    colorEmpty: {
        type: ControlType.Color,
        title: "Level 0",
        defaultValue: "#161b22",
    },
    colorLevel1: {
        type: ControlType.Color,
        title: "Level 1",
        defaultValue: "#0e4429",
    },
    colorLevel2: {
        type: ControlType.Color,
        title: "Level 2",
        defaultValue: "#006d32",
    },
    colorLevel3: {
        type: ControlType.Color,
        title: "Level 3",
        defaultValue: "#26a641",
    },
    colorLevel4: {
        type: ControlType.Color,
        title: "Level 4",
        defaultValue: "#39d353",
    },

    cellSize: {
        type: ControlType.Number,
        title: "Cell Size",
        min: 4,
        max: 30,
        defaultValue: 12,
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        min: 0,
        max: 10,
        defaultValue: 3,
    },
    cellRadius: {
        type: ControlType.Number,
        title: "Cell Radius",
        min: 0,
        max: 10,
        defaultValue: 2,
    },

    showWeekdayLabels: {
        type: ControlType.Boolean,
        title: "Weekday Labels",
        defaultValue: true,
    },
    showMonthLabels: {
        type: ControlType.Boolean,
        title: "Month Labels",
        defaultValue: true,
    },
    showLegend: {
        type: ControlType.Boolean,
        title: "Legend",
        defaultValue: true,
    },

    animate: {
        type: ControlType.Boolean,
        title: "Animate",
        defaultValue: true,
    },
    animationDuration: {
        type: ControlType.Number,
        title: "Anim Duration",
        min: 100,
        max: 2000,
        step: 50,
        defaultValue: 500,
        hidden: (p) => !p.animate,
    },
    animationStagger: {
        type: ControlType.Number,
        title: "Stagger (ms)",
        min: 0,
        max: 50,
        step: 1,
        defaultValue: 6,
        hidden: (p) => !p.animate,
    },
    replayOnView: {
        type: ControlType.Boolean,
        title: "Replay On View",
        defaultValue: true,
        hidden: (p) => !p.animate,
    },
})
