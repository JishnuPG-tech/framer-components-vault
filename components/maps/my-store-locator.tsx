// My Store Locator – Framer code component.
// Paste this file into a Framer code file (Assets → Code → New file) or use the Marketplace listing.
// Renders the official widget (https://app.my-store-locator.com/widget.js) – the map itself stays in My Store Locator.
// Strict consent: with "Click to load" on, the published site shows a local placeholder and requests widget.js only after the click.
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useEffect, useRef, useState, type CSSProperties } from "react"

// ---- shared embed helpers (same code as wix/…/msl-embed.ts and webflow/src/msl-embed.ts) ----

const APP = "https://app.my-store-locator.com"
const WIDGET = `${APP}/widget.js`
const TOKEN_RE = /^[A-Za-z0-9_-]{6,64}$/

export function extractToken(input: unknown): string | null {
    const s = String(input ?? "").trim()
    if (!s) return null
    const m =
        s.match(/data-token\s*=\s*["']?([A-Za-z0-9_-]{6,64})/) ||
        s.match(/#\/m\/([A-Za-z0-9_-]{6,64})/) ||
        s.match(/[?&]msl_token=([A-Za-z0-9_-]{6,64})/)
    const t = m ? m[1] : s
    return TOKEN_RE.test(t) ? t : null
}

interface EmbedOptions {
    token: string
    height?: string // "auto" | "640px" | "80vh" | "100%"
    lang?: string // "de" | "en" | "" (map default)
    consent?: boolean // strict click-to-load (default true)
    lazy?: boolean
    layout?: string // "split" (with height auto)
    offset?: number // sticky header px (with height auto)
}

/** Placeholder texts – identical to widget.js. */
const CONSENT_TEXT = {
    de: [
        "Diese Karte wird von my-store-locator.com geladen (eigener Kartenserver in Deutschland). Dabei wird Ihre IP-Adresse an diesen Server übertragen.",
        "Karte laden",
    ],
    en: [
        "This map is loaded from my-store-locator.com (own map server in Germany). Your IP address is transferred to this server.",
        "Load map",
    ],
}

/** de when data-lang is de, en when en, otherwise the page's <html lang> (de… → German, everything else English) – like widget.js. */
function consentLang(lang?: string, doc: Document = document): "de" | "en" {
    if (lang === "de" || lang === "en") return lang
    return /^de/i.test(doc.documentElement.lang || "") ? "de" : "en"
}

let seq = 0

/** The widget container (no data-consent – consent is handled here before widget.js is loaded). */
function createContainer(
    o: EmbedOptions,
    idPrefix: string,
    doc: Document = document
): HTMLDivElement {
    const el = doc.createElement("div")
    el.id = `${idPrefix}-${++seq}`
    el.className = "msl-map"
    el.setAttribute("data-mystorelocator", "")
    el.setAttribute("data-token", o.token)
    const height = o.height || "640px"
    el.setAttribute("data-height", height)
    if (o.lang === "de" || o.lang === "en") el.setAttribute("data-lang", o.lang)
    if (o.lazy !== false) el.setAttribute("data-lazy", "true")
    if (height === "auto" && o.layout === "split")
        el.setAttribute("data-layout", "split")
    if (height === "auto" && o.offset && o.offset > 0)
        el.setAttribute("data-offset", String(Math.round(o.offset)))
    if (height === "100%") el.style.height = "100%"
    return el
}

interface MslApi {
    mount(el: Element): void
    mountAll(root?: Element): void
}

/** Loads widget.js once and mounts `el` (new widget: mount API + MutationObserver; old widget: one script per container). */
function loadWidget(el: HTMLElement, doc: Document = document): void {
    const win = doc.defaultView as (Window & { MyStoreLocator?: MslApi }) | null
    if (
        win &&
        win.MyStoreLocator &&
        typeof win.MyStoreLocator.mount === "function"
    ) {
        win.MyStoreLocator.mount(el)
        return
    }
    const pending = doc.querySelector(
        "script[data-msl-widget]:not([data-loaded])"
    )
    if (pending) return // still loading: its first scan finds `el`
    const s = doc.createElement("script")
    s.src = WIDGET
    s.async = true
    s.setAttribute("data-msl-widget", "")
    s.addEventListener("load", () => s.setAttribute("data-loaded", ""))
    doc.body.appendChild(s)
}

/** Renders the map into `host`: placeholder first when consent is on, widget.js only after the click. */
function renderEmbed(
    host: HTMLElement,
    o: EmbedOptions,
    idPrefix: string
): void {
    const doc = host.ownerDocument
    const el = createContainer(o, idPrefix, doc)
    const start = () => {
        host.replaceChildren(el)
        loadWidget(el, doc)
    }
    if (o.consent === false) return start()
    const height =
        !o.height || o.height === "auto"
            ? o.height === "auto"
                ? "760px"
                : "640px"
            : o.height
    const [text, label] = CONSENT_TEXT[consentLang(o.lang, doc)]
    const box = doc.createElement("div")
    box.setAttribute("data-msl-consent-placeholder", "")
    box.setAttribute(
        "style",
        `height:${height};display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;background:#f6f7f9;border-radius:12px;font:14px system-ui;text-align:center;padding:24px;box-sizing:border-box`
    )
    const p = doc.createElement("p")
    p.setAttribute("style", "max-width:420px;margin:0;color:#475467")
    p.textContent = text
    const b = doc.createElement("button")
    b.type = "button"
    b.setAttribute(
        "style",
        "background:#5b55d9;color:#fff;border:0;border-radius:10px;padding:10px 18px;font-weight:600;cursor:pointer"
    )
    b.textContent = label
    b.addEventListener("click", start)
    box.append(p, b)
    host.replaceChildren(box)
}

interface Connected {
    token: string
    map: string
}

/**
 * Opens the connect flow in a popup (return_mode=postmessage). Resolves with the chosen map when the app posts
 * { type: 'msl:connected', token, map, state } from https://app.my-store-locator.com with our state; null if the popup is closed.
 */
function connectPopup(
    platform: string,
    win: Window = window
): Promise<Connected | null> {
    const state = Array.from(
        win.crypto.getRandomValues(new Uint8Array(16)),
        (x) => x.toString(16).padStart(2, "0")
    ).join("")
    const origin = win.location.origin
    const url = `${APP}/connect?platform=${encodeURIComponent(platform)}&return_mode=postmessage&origin=${encodeURIComponent(origin)}&state=${state}`
    const popup = win.open(url, "msl-connect", "popup,width=520,height=760")
    return new Promise((resolve) => {
        let timer: ReturnType<typeof setInterval> | undefined
        let finished = false
        const done = (v: Connected | null) => {
            if (finished) return
            finished = true
            win.removeEventListener("message", onMessage)
            if (timer) clearInterval(timer)
            resolve(v)
        }
        function onMessage(e: MessageEvent) {
            if (e.origin !== APP) return
            const d = e.data as {
                type?: string
                token?: string
                map?: string
                state?: string
            } | null
            if (!d || d.type !== "msl:connected" || d.state !== state) return
            const token = extractToken(d.token)
            if (token) done({ token, map: String(d.map || "") })
        }
        win.addEventListener("message", onMessage)
        if (!popup) return done(null)
        // the app closes the popup right after posting – give the message a moment before treating "closed" as cancelled
        timer = setInterval(() => {
            if (!popup.closed) return
            if (timer) clearInterval(timer)
            timer = undefined
            setTimeout(() => done(null), 1500)
        }, 800)
    })
}

// ---- component ----
const UTM =
    "utm_source=framer&utm_medium=integration&utm_campaign=framer-plugin"

type HeightMode = "fill" | "auto" | "fixed"

interface Props {
    token?: string
    heightMode?: HeightMode
    fixedHeight?: number
    language?: "auto" | "de" | "en"
    consent?: boolean
    lazy?: boolean
    layout?: "standard" | "split"
    offset?: number
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 900
 * @framerIntrinsicHeight 640
 * @framerDisableUnlink
 */
export default function MyStoreLocator(props: Props) {
    const {
        token: rawToken = "",
        heightMode = "fixed",
        fixedHeight = 640,
        language = "auto",
        consent = true,
        lazy = true,
        layout = "standard",
        offset = 0,
        style,
    } = props
    const host = useRef<HTMLDivElement>(null)
    const token = extractToken(rawToken)
    const onCanvas = RenderTarget.current() === RenderTarget.canvas
    const [connected, setConnected] = useState<Connected | null>(null)

    useEffect(() => {
        const box = host.current
        if (!box || !token) return
        const height =
            heightMode === "auto"
                ? "auto"
                : heightMode === "fill"
                  ? "100%"
                  : `${Math.max(200, fixedHeight || 640)}px`
        renderEmbed(
            box,
            {
                token,
                height,
                lang: language === "auto" ? "" : language,
                consent: consent && !onCanvas, // the canvas shows the map directly
                lazy,
                layout: heightMode === "auto" ? layout : "",
                offset: heightMode === "auto" ? offset : 0,
            },
            "msl-framer"
        )
        return () => box.replaceChildren()
    }, [
        token,
        heightMode,
        fixedHeight,
        language,
        consent,
        lazy,
        layout,
        offset,
        onCanvas,
    ])

    const outer: CSSProperties = {
        width: "100%",
        height: heightMode === "fill" ? "100%" : undefined,
        minHeight: heightMode === "fill" ? 200 : undefined,
        ...style,
    }

    if (!token) {
        return (
            <div style={{ ...outer, ...placeholder }}>
                <strong style={{ fontSize: 16, color: "#101B30" }}>
                    My Store Locator
                </strong>
                {connected ? (
                    <span style={{ maxWidth: 440 }}>
                        Connected to <b>{connected.map || "your map"}</b>. Paste
                        this token into the <b>Map token</b> property:{" "}
                        <code
                            style={{
                                userSelect: "all",
                                background: "#fff",
                                padding: "2px 6px",
                                borderRadius: 6,
                            }}
                        >
                            {connected.token}
                        </code>
                    </span>
                ) : (
                    <span style={{ maxWidth: 420 }}>
                        {rawToken
                            ? "This does not look like a map token. Paste the token, the embed code or the map link from My Store Locator → Embed."
                            : "Paste your map token (or the embed code / map link) in the properties panel – or get it with Connect (in the preview)."}
                    </span>
                )}
                <button
                    type="button"
                    onClick={() =>
                        connectPopup("framer").then((r) => r && setConnected(r))
                    }
                    style={{
                        background: "#5B2FF7",
                        color: "#fff",
                        border: 0,
                        borderRadius: 10,
                        padding: "8px 16px",
                        fontWeight: 600,
                        cursor: "pointer",
                    }}
                >
                    Connect My Store Locator
                </button>
                <a
                    href={`${APP}/#/register?${UTM}`}
                    target="_blank"
                    rel="noopener"
                    style={{ color: "#5B2FF7", fontWeight: 600 }}
                >
                    No map yet? Create one for free →
                </a>
            </div>
        )
    }
    return <div ref={host} style={outer} />
}

const placeholder: CSSProperties = {
    boxSizing: "border-box",
    minHeight: 240,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 24,
    textAlign: "center",
    font: "14px/1.5 system-ui, sans-serif",
    color: "#475467",
    background:
        "linear-gradient(135deg, rgba(91,47,247,0.08), rgba(247,44,179,0.08))",
    borderRadius: 16,
}

addPropertyControls(MyStoreLocator, {
    token: {
        type: ControlType.String,
        title: "Map token",
        defaultValue: "",
        placeholder: "Token, embed code or map link",
        description:
            "From My Store Locator → Embed. [Create a free map](https://app.my-store-locator.com/#/register?utm_source=framer)",
    },
    heightMode: {
        type: ControlType.Enum,
        title: "Height",
        defaultValue: "fixed",
        options: ["fixed", "fill", "auto"],
        optionTitles: ["Fixed", "Fill frame", "Auto (grow with list)"],
        displaySegmentedControl: true,
    },
    fixedHeight: {
        type: ControlType.Number,
        title: "Pixels",
        defaultValue: 640,
        min: 200,
        max: 2000,
        step: 10,
        unit: "px",
        hidden: (p: Props) => p.heightMode !== "fixed",
    },
    layout: {
        type: ControlType.Enum,
        title: "Layout",
        defaultValue: "standard",
        options: ["standard", "split"],
        optionTitles: ["Standard", "Split (list + sticky map)"],
        hidden: (p: Props) => p.heightMode !== "auto",
    },
    offset: {
        type: ControlType.Number,
        title: "Header offset",
        defaultValue: 0,
        min: 0,
        max: 300,
        unit: "px",
        description: "Height of a sticky site header.",
        hidden: (p: Props) => p.heightMode !== "auto",
    },
    language: {
        type: ControlType.Enum,
        title: "Language",
        defaultValue: "auto",
        options: ["auto", "de", "en"],
        optionTitles: ["Map default", "Deutsch", "English"],
    },
    consent: {
        type: ControlType.Boolean,
        title: "Click to load",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        description:
            "GDPR: nothing is loaded from My Store Locator before the visitor clicks (recommended in the EU).",
    },
    lazy: {
        type: ControlType.Boolean,
        title: "Lazy load",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
})
