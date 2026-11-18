// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useEffect, useId, useRef, useState, type CSSProperties } from "react"

const widgetOrigin = "https://widgets.strollplace.com"
const portalOrigin = "https://strollplace.com"
const defaultPlace = "Albuquerque"
const defaultReference = "city:406b2202-98d1-40ee-b62e-92594467f7df"
const referencePattern =
    /^(city|neighborhood):([a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12})$/i

type Place = {
    id: string
    type: "city" | "neighborhood"
    name: string
    context: string | null
    summary: string | null
    url: string
}

type Props = {
    place?: string
    showPicker?: boolean
    accent?: string
    style?: CSSProperties
}

type Lookup<T> = { key: string; data: T } | { key: string; error: true }

function parsePlace(value: unknown): Place | null {
    if (!value || typeof value !== "object") return null
    const { id, type, name, context, summary, url } = value as Record<
        string,
        unknown
    >
    if (
        typeof id !== "string" ||
        (type !== "city" && type !== "neighborhood") ||
        !referencePattern.test(`${type}:${id}`) ||
        typeof name !== "string" ||
        !name.trim() ||
        (context !== null && typeof context !== "string") ||
        (summary !== null && typeof summary !== "string") ||
        typeof url !== "string"
    ) {
        return null
    }
    try {
        const destination = new URL(url, portalOrigin)
        if (
            destination.origin !== portalOrigin ||
            destination.username ||
            destination.password
        ) {
            return null
        }
        return { id, type, name, context, summary, url: destination.href }
    } catch {
        return null
    }
}

async function readCatalog(
    path: string,
    signal: AbortSignal
): Promise<unknown> {
    const response = await fetch(`${widgetOrigin}/v1/places/${path}`, {
        credentials: "omit",
        referrerPolicy: "no-referrer",
        signal,
    })
    if (!response.ok) {
        void response.body?.cancel().catch(() => undefined)
        throw new Error("The place catalog is unavailable.")
    }
    return response.json()
}

async function searchPlaces(
    term: string,
    signal: AbortSignal
): Promise<Place[]> {
    const result = await readCatalog(
        `search?q=${encodeURIComponent(term)}`,
        signal
    )
    if (
        !result ||
        typeof result !== "object" ||
        !("places" in result) ||
        !Array.isArray(result.places)
    ) {
        throw new Error("Invalid place search response.")
    }
    return result.places.flatMap((value: unknown) => {
        const place = parsePlace(value)
        return place ? [place] : []
    })
}

const normalize = (name: string) => name.trim().toLocaleLowerCase("en-US")

async function findPlace(
    value: string,
    signal: AbortSignal
): Promise<Place | null> {
    if (value.length < 2 || value.length > 130) return null
    const ref = referencePattern.exec(
        normalize(value) === "albuquerque" ? defaultReference : value
    )
    if (ref) {
        return parsePlace(
            await readCatalog(
                `${ref[1].toLowerCase()}/${ref[2].toLowerCase()}`,
                signal
            )
        )
    }

    const [name, context] = value.split(" · ", 2)
    if (name.length < 2 || name.length > 100) return null
    const places = await searchPlaces(name, signal)
    const matches = places.filter(
        (place) =>
            normalize(place.name) === normalize(name) &&
            (!context || normalize(place.context ?? "") === normalize(context))
    )
    return matches.length === 1 ? matches[0] : null
}

function useLookup<T>(
    key: string,
    reader: (key: string, signal: AbortSignal) => Promise<T>,
    delay: number
) {
    const [result, setResult] = useState<Lookup<T>>()
    useEffect(() => {
        if (key.length < 2) return
        const request = new AbortController()
        let active = true
        const start = setTimeout(() => {
            const deadline = setTimeout(() => request.abort(), 6500)
            void reader(key, request.signal)
                .then((data) => {
                    if (active) setResult({ key, data })
                })
                .catch(() => {
                    if (active) setResult({ key, error: true })
                })
                .finally(() => clearTimeout(deadline))
        }, delay)
        return () => {
            active = false
            clearTimeout(start)
            request.abort()
        }
    }, [delay, key, reader])

    return result?.key === key ? result : undefined
}

const resultLabel = (place: Place) =>
    place.context ? `${place.name} · ${place.context}` : place.name

const styles = `
  .sp-framer-card * { box-sizing: border-box; }
  .sp-framer-card :focus-visible { outline: 2px solid #245d67; outline-offset: 3px; }
  .sp-framer-card input { width: 100%; min-width: 0; padding: 10px 12px; min-height: 44px; border-radius: 8px; border: 1px solid #a69c8d; background: #fff; color: inherit; font: inherit; }
  .sp-framer-card label { display: block; font-weight: 650; margin-bottom: 6px; }
  .sp-framer-card ul { margin: 8px 0 0; list-style: none; padding: 0; border: 1px solid #ded6c9; border-radius: 8px; background: #fff; }
  .sp-framer-card li + li { border-top: 1px solid #ede7dd; }
  .sp-framer-card li button { display: flex; gap: 3px; flex-direction: column; width: 100%; min-height: 44px; text-align: start; color: inherit; background: transparent; border: 0; border-radius: 7px; padding: 10px 12px; font: inherit; cursor: pointer; overflow-wrap: anywhere; }
  .sp-framer-card li button:hover { background: #f5efe5; }
  .sp-framer-card p { margin: 0; }
  .sp-framer-card .sp-framer-context { color: #59524a; font-size: 0.875rem; }
  .sp-framer-card .sp-framer-title { margin: 3px 0 8px; font-size: clamp(1.4rem, 1rem + 2cqi, 2.1rem); line-height: 1.16; letter-spacing: -0.035em; }
  .sp-framer-card .sp-framer-links { display: flex; flex-wrap: wrap; column-gap: 20px; align-items: center; margin-top: 8px; }
  .sp-framer-card a { color: #893923; text-underline-offset: 3px; overflow-wrap: anywhere; }
  .sp-framer-card .sp-framer-links a { display: inline-flex; align-items: center; min-height: 44px; }
  .sp-framer-card .sp-framer-brand { gap: 6px; }
  .sp-framer-card .sp-framer-brand svg { flex: none; }
`

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 420
 * @framerIntrinsicHeight 250
 */
export default function StrollPlacePlaceCard({
    place = defaultPlace,
    showPicker = true,
    accent = "#b8442a",
    style,
}: Props) {
    const initial = place.trim() || defaultPlace
    const inputId = useId()
    const input = useRef<HTMLInputElement>(null)
    const [query, setQuery] = useState("")
    const [picked, setPicked] = useState<{ initial: string; place: Place }>()
    const term = showPicker ? query.trim() : ""
    const startingPlace = useLookup(initial, findPlace, 250)
    const search = useLookup(term, searchPlaces, 275)
    const choose =
        picked?.initial === initial && showPicker ? picked.place : null
    const displayed =
        choose ??
        (startingPlace && "data" in startingPlace ? startingPlace.data : null)
    const places = search && "data" in search ? search.data.slice(0, 8) : []
    const status =
        term.length < 2
            ? ""
            : !search
              ? "Searching…"
              : "error" in search
                ? "Search is temporarily unavailable. Try again."
                : places.length === 0
                  ? "No cities or neighborhoods found."
                  : ""

    return (
        <section
            aria-label="StrollPlace place card"
            className="sp-framer-card"
            style={{
                width: 420,
                maxWidth: "100%",
                ...style,
                minWidth: 0,
                boxSizing: "border-box",
                containerType: "inline-size",
                display: "grid",
                gap: 16,
                padding: "clamp(14px, 4cqi, 24px)",
                border: "1px solid #ded6c9",
                borderTop: `3px solid ${accent}`,
                borderRadius: 14,
                background: "#fffaf2",
                color: "#28241f",
                fontFamily: "Inter, system-ui, sans-serif",
                fontSize: "1rem",
                lineHeight: 1.5,
                overflowWrap: "anywhere",
            }}
        >
            <style>{styles}</style>
            {showPicker && (
                <div>
                    <label htmlFor={inputId}>Find a city or neighborhood</label>
                    <input
                        ref={input}
                        id={inputId}
                        type="search"
                        maxLength={100}
                        autoComplete="off"
                        placeholder="Search places"
                        value={query}
                        onChange={(event) =>
                            setQuery(event.currentTarget.value)
                        }
                        onKeyDown={(event) => {
                            if (event.key === "Escape") setQuery("")
                        }}
                    />
                    {term.length >= 2 && (
                        <p
                            role="status"
                            className="sp-framer-context"
                            style={{ marginTop: 5 }}
                        >
                            {status ||
                                `${places.length} ${places.length === 1 ? "result" : "results"}`}
                        </p>
                    )}
                    {places.length > 0 && (
                        <ul aria-label="Matching places">
                            {places.map((match) => (
                                <li key={match.id}>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setPicked({ initial, place: match })
                                            setQuery("")
                                            input.current?.focus()
                                        }}
                                    >
                                        <strong>{resultLabel(match)}</strong>
                                        <span className="sp-framer-context">
                                            {match.type === "city"
                                                ? "City"
                                                : "Neighborhood"}
                                        </span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
            <div aria-live="polite">
                {displayed ? (
                    <>
                        <p className="sp-framer-context">
                            {displayed.type === "city"
                                ? "City"
                                : "Neighborhood"}
                            {displayed.context ? ` · ${displayed.context}` : ""}
                        </p>
                        <h2 className="sp-framer-title">{displayed.name}</h2>
                        {displayed.summary && <p>{displayed.summary}</p>}
                        <div className="sp-framer-links">
                            <a href={displayed.url} style={{ fontWeight: 650 }}>
                                Explore {displayed.name}{" "}
                                <span aria-hidden="true">&nbsp;↗</span>
                            </a>
                            <a
                                href={portalOrigin}
                                className="sp-framer-context sp-framer-brand"
                                style={{ color: "#59524a" }}
                            >
                                <svg
                                    aria-hidden="true"
                                    width="12"
                                    height="16"
                                    viewBox="0 0 43 59"
                                >
                                    <path
                                        d="M21.5 57 C17.1 50.1 2.2 34.5 2.2 22.0 C2.2 10.3 10.6 2.0 21.5 2.0 C32.4 2.0 40.2 10.5 40.2 22.0 C40.2 34.4 27.0 50.1 21.5 57 Z"
                                        fill="#D14411"
                                    />
                                </svg>
                                StrollPlace
                            </a>
                        </div>
                    </>
                ) : (
                    <p className="sp-framer-context">
                        {initial.length >= 2 && !startingPlace
                            ? "Loading place guide…"
                            : startingPlace && "error" in startingPlace
                              ? "The place guide is temporarily unavailable."
                              : showPicker
                                ? "Search to choose a city or neighborhood."
                                : "No matching place guide."}
                    </p>
                )}
            </div>
        </section>
    )
}

addPropertyControls(StrollPlacePlaceCard, {
    place: {
        type: ControlType.String,
        title: "Starting place",
        defaultValue: defaultPlace,
        description:
            "Enter an exact place name, Name · Context, or a city/neighborhood reference.",
    },
    showPicker: {
        type: ControlType.Boolean,
        title: "Show picker",
        defaultValue: true,
    },
    accent: {
        type: ControlType.Color,
        title: "Accent",
        defaultValue: "#b8442a",
    },
})
