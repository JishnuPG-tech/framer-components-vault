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

import { useReducedMotion } from "framer-motion"

type ResponsiveImage = { src?: string; srcSet?: string; alt?: string }

type Feature = {
    image?: ResponsiveImage
    title: string
    description: string
    accent: string
    textColor: string
    cta: string
    link: string
}

interface Props {
    items: Feature[]
    startAt: number
    cardHeight: number
    gap: number
    radius: number
    padding: number
    duration: number
    background: string
    controlColor: string
    style?: React.CSSProperties
}

const DEFAULT_ITEMS: Feature[] = [
    {
        image: {
            src: "https://images.unsplash.com/photo-1643116713931-a9577d6e0b9b?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=1400",
            alt: "Colorful geometric blocks arranged on a tabletop",
        },
        title: "Give ideas a place.",
        description:
            "Take that first spark and turn it into a website that feels entirely yours.",
        accent: "#DAFF68",
        textColor: "#171717",
        cta: "Discover Framer",
        link: "",
    },
    {
        image: {
            src: "https://images.unsplash.com/photo-1580553874067-be1d5ac6a94b?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=1400",
            alt: "Orange fruit resting on purple fabric",
        },
        title: "Make it your own.",
        description:
            "Play with layouts, colors and type until every little detail clicks.",
        accent: "#D0BCFF",
        textColor: "#171717",
        cta: "Discover Framer",
        link: "",
    },
    {
        image: {
            src: "https://images.unsplash.com/photo-1623728255598-43f412a12d53?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=1400",
            alt: "Red and green flower captured in a vibrant close-up",
        },
        title: "A little movement.",
        description:
            "Add thoughtful interactions that make a website feel alive.",
        accent: "#FF9CCB",
        textColor: "#171717",
        cta: "Discover Framer",
        link: "",
    },
    {
        image: {
            src: "https://images.unsplash.com/photo-1685452216345-0bf6117b80b2?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=1400",
            alt: "Bold red and cobalt architectural color fields",
        },
        title: "Ready for the world.",
        description:
            "Go from a work in progress to something you’re proud to share.",
        accent: "#FFC78A",
        textColor: "#171717",
        cta: "Discover Framer",
        link: "",
    },
]

function Arrow({ left = false }: { left?: boolean }) {
    return (
        <svg
            width="18"
            height="18"
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden="true"
            style={{ transform: left ? "rotate(180deg)" : undefined }}
        >
            <path
                d="M3.5 10H16.5M11 4.5L16.5 10L11 15.5"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}

const clamp = (value: number, count: number) =>
    Math.min(Math.max(0, value), Math.max(0, count - 1))

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1120
 * @framerIntrinsicHeight 478
 */
export default function ElasticFeatureCarousel(props: Props) {
    const {
        items = DEFAULT_ITEMS,
        startAt = 1,
        cardHeight = 396,
        gap = 12,
        radius = 20,
        padding = 27,
        duration = 0.65,
        background = "#FFFFFF",
        controlColor = "#171717",
        style,
    } = props

    const safeItems = Array.isArray(items) && items.length ? items : DEFAULT_ITEMS
    const [activeIndex, setActiveIndex] = React.useState(() =>
        clamp(Math.round(startAt) - 1, safeItems.length)
    )
    const active = clamp(activeIndex, safeItems.length)
    const staticRenderer = useIsStaticRenderer()
    const reducedMotion = useReducedMotion()
    const rootId = React.useId().replace(/[^a-zA-Z0-9_-]/g, "")
    const pointerStart = React.useRef<{ x: number; y: number } | null>(null)
    const lastSwipe = React.useRef(0)

    React.useEffect(() => {
        setActiveIndex((current) => clamp(current, safeItems.length))
    }, [safeItems.length])

    const select = React.useCallback(
        (index: number) => setActiveIndex((index + safeItems.length) % safeItems.length),
        [safeItems.length]
    )

    const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
        if (event.button !== 0) return
        pointerStart.current = { x: event.clientX, y: event.clientY }
    }

    const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
        const start = pointerStart.current
        pointerStart.current = null
        if (!start) return
        const dx = event.clientX - start.x
        const dy = event.clientY - start.y
        if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy) * 1.2) return
        lastSwipe.current = Date.now()
        select(active + (dx < 0 ? 1 : -1))
    }

    const shouldIgnoreClick = () => Date.now() - lastSwipe.current < 500

    const css = `
        [data-elastic-id="${rootId}"] { container-type: inline-size; font-family: Inter, Arial, sans-serif; }
        [data-elastic-id="${rootId}"] * { box-sizing: border-box; }
        [data-elastic-id="${rootId}"] .efc-deck { display: flex; align-items: stretch; width: 100%; gap: var(--efc-gap); height: var(--efc-height); touch-action: pan-y; }
        [data-elastic-id="${rootId}"] .efc-slot { position: relative; min-width: 0; flex-basis: 0%; transition: flex-grow var(--efc-duration) cubic-bezier(.22,1,.36,1); }
        [data-elastic-id="${rootId}"] .efc-card { position: relative; display: block; width: 100%; height: 100%; border: 0; padding: 0; margin: 0; border-radius: var(--efc-radius); overflow: hidden; text-align: left; color: inherit; background: var(--efc-accent); text-decoration: none; -webkit-tap-highlight-color: transparent; }
        [data-elastic-id="${rootId}"] button.efc-card { cursor: pointer; appearance: none; }
        [data-elastic-id="${rootId}"] a.efc-card { cursor: pointer; }
        [data-elastic-id="${rootId}"] .efc-card:focus-visible, [data-elastic-id="${rootId}"] .efc-arrow:focus-visible, [data-elastic-id="${rootId}"] .efc-thumb:focus-visible { outline: 3px solid #1A55FF; outline-offset: 3px; }
        [data-elastic-id="${rootId}"] .efc-photo { position: absolute; inset: 0 0 0 auto; width: 100%; height: 100%; overflow: hidden; transition: width var(--efc-duration) cubic-bezier(.22,1,.36,1); background: #e7e7e7; }
        [data-elastic-id="${rootId}"] .efc-photo img { width: 100%; height: 100%; display: block; object-fit: cover; object-position: center; transition: transform .8s cubic-bezier(.22,1,.36,1); }
        [data-elastic-id="${rootId}"] .efc-card[data-active="false"]:hover img { transform: scale(1.07); }
        [data-elastic-id="${rootId}"] .efc-card[data-active="true"] .efc-photo { width: 47%; }
        [data-elastic-id="${rootId}"] .efc-card[data-active="true"]:hover .efc-photo img { transform: scale(1.035); }
        [data-elastic-id="${rootId}"] .efc-panel { position: absolute; top: 0; bottom: 0; left: 0; width: 53%; padding: var(--efc-padding); display: flex; flex-direction: column; justify-content: space-between; gap: 14px; opacity: 0; transform: translateX(-15px); pointer-events: none; transition: opacity .2s ease, transform .35s ease; }
        [data-elastic-id="${rootId}"] .efc-card[data-active="true"] .efc-panel { opacity: 1; transform: translateX(0); transition-delay: .13s; }
        [data-elastic-id="${rootId}"] .efc-panel h3 { margin: 0; padding: 0; font-size: clamp(24px, 2.8vw, 40px); font-weight: 560; letter-spacing: -.056em; line-height: 1.04; overflow-wrap: break-word; }
        [data-elastic-id="${rootId}"] .efc-panel p { margin: 0; font-size: 14px; line-height: 1.49; letter-spacing: -.02em; max-width: 270px; }
        [data-elastic-id="${rootId}"] .efc-panel-bottom { display: flex; flex-direction: column; gap: 27px; }
        [data-elastic-id="${rootId}"] .efc-cta { display: flex; justify-content: space-between; align-items: center; width: 100%; border-top: 1px solid currentColor; padding-top: 13px; font-size: 12px; font-weight: 700; letter-spacing: .055em; text-transform: uppercase; }
        [data-elastic-id="${rootId}"] .efc-cta svg { transition: transform .25s ease; }
        [data-elastic-id="${rootId}"] a.efc-card:hover .efc-cta svg { transform: translate(3px,-3px) rotate(-45deg); }
        [data-elastic-id="${rootId}"] .efc-label { position: absolute; top: 18px; left: 18px; font-size: 11px; font-weight: 700; letter-spacing: .035em; color: #171717; background: rgba(255,255,255,.91); padding: 9px 12px; border-radius: 100px; backdrop-filter: blur(8px); }
        [data-elastic-id="${rootId}"] .efc-peek { position: absolute; bottom: 22px; left: 50%; writing-mode: vertical-rl; transform: translateX(-50%) rotate(180deg); font-size: 13px; line-height: 1.2; font-weight: 650; letter-spacing: -.025em; color: #fff; text-shadow: 0 1px 14px rgba(0,0,0,.45); white-space: nowrap; max-height: 80%; overflow: hidden; transition: opacity .18s ease; }
        [data-elastic-id="${rootId}"] .efc-card[data-active="true"] .efc-peek, [data-elastic-id="${rootId}"] .efc-card[data-active="true"] .efc-label { opacity: 0; }
        [data-elastic-id="${rootId}"] .efc-controls { display: flex; align-items: center; justify-content: space-between; margin-top: 16px; min-height: 43px; gap: 20px; }
        [data-elastic-id="${rootId}"] .efc-count { font-size: 12px; font-weight: 650; letter-spacing: .06em; font-variant-numeric: tabular-nums; }
        [data-elastic-id="${rootId}"] .efc-count span { opacity: .37; }
        [data-elastic-id="${rootId}"] .efc-arrows { display: flex; gap: 7px; }
        [data-elastic-id="${rootId}"] .efc-arrow { display: grid; place-items: center; width: 43px; height: 43px; padding: 0; border-radius: 100%; border: 1px solid currentColor; background: transparent; color: inherit; cursor: pointer; transition: color .2s ease, background .2s ease, transform .2s ease; }
        [data-elastic-id="${rootId}"] .efc-arrow:hover { background: currentColor; }
        [data-elastic-id="${rootId}"] .efc-arrow:hover svg { color: white; }
        [data-elastic-id="${rootId}"] .efc-arrow:active { transform: scale(.94); }
        [data-elastic-id="${rootId}"] .efc-mobile-stage, [data-elastic-id="${rootId}"] .efc-thumbs { display: none; }
        @container (max-width: 940px) {
            [data-elastic-id="${rootId}"] .efc-deck { display: none; }
            [data-elastic-id="${rootId}"] .efc-mobile-stage { display: block; height: var(--efc-height); }
            [data-elastic-id="${rootId}"] .efc-mobile-stage .efc-card { border-radius: var(--efc-radius); }
            [data-elastic-id="${rootId}"] .efc-mobile-stage .efc-card[data-active="true"] .efc-photo { width: 50%; }
            [data-elastic-id="${rootId}"] .efc-mobile-stage .efc-panel { width: 50%; opacity: 1; transform: none; }
            [data-elastic-id="${rootId}"] .efc-panel h3 { font-size: clamp(27px, 4vw, 42px); }
            [data-elastic-id="${rootId}"] .efc-thumbs { display: flex; margin-top: 12px; gap: 9px; }
            [data-elastic-id="${rootId}"] .efc-thumb { appearance: none; border: 0; padding: 0; position: relative; width: 66px; height: 54px; border-radius: 9px; overflow: hidden; cursor: pointer; background: #eee; box-shadow: inset 0 0 0 2px transparent; }
            [data-elastic-id="${rootId}"] .efc-thumb img { display: block; width: 100%; height: 100%; object-fit: cover; }
            [data-elastic-id="${rootId}"] .efc-thumb[data-selected="true"] { outline: 2px solid currentColor; outline-offset: 3px; }
            [data-elastic-id="${rootId}"] .efc-thumb span { position: absolute; bottom: 4px; left: 5px; font-size: 9px; font-weight: 750; background: #fff; color: #171717; padding: 3px 5px; border-radius: 3px; }
        }
        @container (max-width: 600px) {
            [data-elastic-id="${rootId}"] .efc-mobile-stage { height: 452px; }
            [data-elastic-id="${rootId}"] .efc-mobile-stage .efc-card[data-active="true"] .efc-photo { left: 0; top: 0; right: 0; bottom: auto; width: 100%; height: 49%; }
            [data-elastic-id="${rootId}"] .efc-mobile-stage .efc-panel { top: 49%; left: 0; right: 0; bottom: 0; width: 100%; height: 51%; padding: 21px; }
            [data-elastic-id="${rootId}"] .efc-mobile-stage .efc-panel h3 { font-size: clamp(25px, 7vw, 33px); }
            [data-elastic-id="${rootId}"] .efc-mobile-stage .efc-panel p { font-size: 12px; line-height: 1.42; }
            [data-elastic-id="${rootId}"] .efc-mobile-stage .efc-panel-bottom { gap: 15px; }
            [data-elastic-id="${rootId}"] .efc-mobile-stage .efc-cta { font-size: 11px; padding-top: 10px; }
            [data-elastic-id="${rootId}"] .efc-thumb { width: 54px; height: 48px; }
        }
        @media (prefers-reduced-motion: reduce) {
            [data-elastic-id="${rootId}"] .efc-slot, [data-elastic-id="${rootId}"] .efc-photo, [data-elastic-id="${rootId}"] .efc-photo img, [data-elastic-id="${rootId}"] .efc-panel, [data-elastic-id="${rootId}"] .efc-cta svg { transition: none !important; }
        }
    `

    const renderContents = (item: Feature, index: number, selected: boolean) => (
        <>
            <div className="efc-photo">
                {(item.image?.src || DEFAULT_ITEMS[index % DEFAULT_ITEMS.length].image?.src) && (
                    <img
                        src={item.image?.src || DEFAULT_ITEMS[index % DEFAULT_ITEMS.length].image?.src}
                        srcSet={item.image?.srcSet}
                        alt={selected ? item.image?.alt || DEFAULT_ITEMS[index % DEFAULT_ITEMS.length].image?.alt || item.title : ""}
                        draggable={false}
                    />
                )}
            </div>
            <div className="efc-label" aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
            </div>
            <div className="efc-peek" aria-hidden="true">{item.title}</div>
            <div className="efc-panel" style={{ color: item.textColor || "#171717" }}>
                <h3>{item.title}</h3>
                <div className="efc-panel-bottom">
                    <p>{item.description}</p>
                    {item.link?.trim() && item.cta?.trim() && (
                        <div className="efc-cta">
                            <span>{item.cta}</span>
                            <Arrow />
                        </div>
                    )}
                </div>
            </div>
        </>
    )

    const renderCard = (item: Feature, index: number, selected: boolean) => {
        const common = {
            className: "efc-card",
            "data-active": selected ? "true" : "false",
            style: { "--efc-accent": item.accent || "#D9FF68" } as React.CSSProperties,
        }
        const children = renderContents(item, index, selected)
        if (!selected) {
            return (
                <button
                    {...common}
                    type="button"
                    onClick={() => !shouldIgnoreClick() && select(index)}
                    aria-label={`Show ${item.title}`}
                    aria-pressed="false"
                >
                    {children}
                </button>
            )
        }
        if (item.link?.trim()) {
            return (
                <a
                    {...common}
                    href={item.link.trim()}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${item.cta || "Open"}: ${item.title} (opens a new tab)`}
                    onClick={(event) => {
                        if (shouldIgnoreClick()) event.preventDefault()
                    }}
                >
                    {children}
                </a>
            )
        }
        return (
            <div {...common} role="group" aria-label={item.title}>
                {children}
            </div>
        )
    }

    return (
        <div
            data-elastic-id={rootId}
            style={{
                width: "100%",
                height: "auto",
                minWidth: 0,
                ...style,
                background,
                color: controlColor,
                "--efc-gap": `${Math.max(0, gap)}px`,
                "--efc-radius": `${Math.max(0, radius)}px`,
                "--efc-padding": `${Math.max(12, padding)}px`,
                "--efc-height": `${Math.max(300, cardHeight)}px`,
                "--efc-duration": staticRenderer || reducedMotion ? "0s" : `${Math.max(0.1, duration)}s`,
            } as React.CSSProperties}
            onKeyDown={(event) => {
                if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
                    event.preventDefault()
                    select(active + (event.key === "ArrowRight" ? 1 : -1))
                }
            }}
        >
            <style>{css}</style>
            <div
                className="efc-deck"
                aria-label="Feature carousel"
                onPointerDown={onPointerDown}
                onPointerUp={onPointerUp}
                onPointerCancel={() => (pointerStart.current = null)}
            >
                {safeItems.map((item, index) => (
                    <div
                        key={`${index}-${item.title}`}
                        className="efc-slot"
                        style={{ flexGrow: index === active ? 4.8 : 0.9 }}
                    >
                        {renderCard(item, index, index === active)}
                    </div>
                ))}
            </div>

            <div
                className="efc-mobile-stage"
                onPointerDown={onPointerDown}
                onPointerUp={onPointerUp}
                onPointerCancel={() => (pointerStart.current = null)}
            >
                {renderCard(safeItems[active], active, true)}
            </div>

            <div className="efc-thumbs" role="group" aria-label="Choose a slide">
                {safeItems.map((item, index) => (
                    <button
                        key={`${index}-${item.title}`}
                        className="efc-thumb"
                        type="button"
                        data-selected={index === active ? "true" : "false"}
                        onClick={() => select(index)}
                        aria-label={`Show ${item.title}`}
                        aria-pressed={index === active}
                    >
                        {(item.image?.src || DEFAULT_ITEMS[index % DEFAULT_ITEMS.length].image?.src) && (
                            <img src={item.image?.src || DEFAULT_ITEMS[index % DEFAULT_ITEMS.length].image?.src} alt="" draggable={false} />
                        )}
                        <span>{String(index + 1).padStart(2, "0")}</span>
                    </button>
                ))}
            </div>

            <div className="efc-controls">
                <div className="efc-count" aria-live="polite">
                    {String(active + 1).padStart(2, "0")}{" "}
                    <span>/ {String(safeItems.length).padStart(2, "0")}</span>
                </div>
                <div className="efc-arrows">
                    <button
                        type="button"
                        className="efc-arrow"
                        aria-label="Previous slide"
                        onClick={() => select(active - 1)}
                    >
                        <Arrow left />
                    </button>
                    <button
                        type="button"
                        className="efc-arrow"
                        aria-label="Next slide"
                        onClick={() => select(active + 1)}
                    >
                        <Arrow />
                    </button>
                </div>
            </div>
        </div>
    )
}

addPropertyControls(ElasticFeatureCarousel, {
    items: {
        type: ControlType.Array,
        title: "Slides",
        control: {
            type: ControlType.Object,
            controls: {
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                title: { type: ControlType.String, title: "Title", defaultValue: "Make it yours." },
                description: {
                    type: ControlType.String,
                    title: "Description",
                    displayTextArea: true,
                    defaultValue: "Tell your story with a little personality.",
                },
                accent: { type: ControlType.Color, title: "Panel Color", defaultValue: "#DAFF68" },
                textColor: { type: ControlType.Color, title: "Text Color", defaultValue: "#171717" },
                cta: { type: ControlType.String, title: "CTA Label", defaultValue: "Discover More" },
                link: { type: ControlType.Link, title: "Link", defaultValue: "" },
            },
        },
        defaultValue: DEFAULT_ITEMS,
        maxCount: 10,
    },
    startAt: { type: ControlType.Number, title: "Start Slide", defaultValue: 1, min: 1, max: 10, step: 1 },
    cardHeight: { type: ControlType.Number, title: "Card Height", defaultValue: 396, min: 300, max: 620, step: 1, unit: "px" },
    gap: { type: ControlType.Number, title: "Card Gap", defaultValue: 12, min: 0, max: 30, step: 1, unit: "px" },
    radius: { type: ControlType.Number, title: "Radius", defaultValue: 20, min: 0, max: 48, step: 1, unit: "px" },
    padding: { type: ControlType.Number, title: "Panel Padding", defaultValue: 27, min: 12, max: 48, step: 1, unit: "px" },
    duration: { type: ControlType.Number, title: "Motion Speed", defaultValue: 0.65, min: 0.1, max: 1.5, step: 0.05, unit: "s" },
    background: { type: ControlType.Color, title: "Background", defaultValue: "#FFFFFF" },
    controlColor: { type: ControlType.Color, title: "Control Color", defaultValue: "#171717" },
})
