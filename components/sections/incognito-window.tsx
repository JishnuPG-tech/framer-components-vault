import * as React from "react"
import { useEffect, useState } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


/*!
 *
 * detectIncognito v1.8.1 — bundled here to keep this code component
 * self-contained (Framer code components can't pull from npm). Logic
 * copied verbatim from the MIT-licensed upstream library. Any update
 * means re-pulling from the repo and re-pasting below.
 *
 * https://github.com/Joe12387/detectIncognito
 *
 * MIT License
 *
 * Copyright (c) 2021 - 2026 Joe Rutkowski <Joe@dreggle.com>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 **/
async function detectIncognito(): Promise<{ isPrivate: boolean; browserName: string }> {
    return await new Promise(function (resolve, reject) {
        let browserName = "Unknown"

        let callbackSettled = false
        function __callback(isPrivate: boolean): void {
            if (callbackSettled) return
            callbackSettled = true
            resolve({ isPrivate, browserName })
        }

        function identifyChromium(): string {
            const ua = navigator.userAgent
            if (ua.match(/Chrome/)) {
                if ((navigator as unknown as { brave?: unknown }).brave !== undefined) return "Brave"
                else if (ua.match(/Edg/)) return "Edge"
                else if (ua.match(/OPR/)) return "Opera"
                return "Chrome"
            } else {
                return "Chromium"
            }
        }

        function feid(): number {
            let toFixedEngineID = 0
            const neg = parseInt("-1")
            try {
                neg.toFixed(neg)
            } catch (e) {
                toFixedEngineID = (e as Error).message.length
            }
            return toFixedEngineID
        }

        function isSafari(): boolean { return feid() === 44 || feid() === 43 }
        function isChrome(): boolean { return feid() === 51 }
        function isFirefox(): boolean { return feid() === 25 }
        function isMSIE(): boolean { return (navigator as unknown as { msSaveBlob?: unknown }).msSaveBlob !== undefined }

        async function currentSafariTest() {
            try {
                await navigator.storage.getDirectory()
                __callback(false)
            } catch (e) {
                const message = e instanceof Error && typeof e.message === "string" ? e.message : String(e)
                __callback(message.includes("unknown transient reason"))
            }
        }

        function safari13to18Test(): void {
            const tmp = String(Math.random())
            try {
                const dbReq = indexedDB.open(tmp, 1)
                dbReq.onupgradeneeded = (ev) => {
                    const db = (ev.target as IDBOpenDBRequest).result
                    const finish = (priv: boolean) => __callback(priv)
                    try {
                        db.createObjectStore("t", { autoIncrement: true }).put(new Blob())
                        finish(false)
                    } catch (err) {
                        const message = err instanceof Error && typeof err.message === "string" ? err.message : String(err)
                        if (message.includes("are not yet supported")) finish(true)
                        else finish(false)
                    } finally {
                        db.close()
                        indexedDB.deleteDatabase(tmp)
                    }
                }
                dbReq.onerror = () => __callback(false)
            } catch {
                __callback(false)
            }
        }

        function oldSafariTest(): void {
            const openDB = (window as unknown as { openDatabase?: (...a: unknown[]) => unknown }).openDatabase
            const storage = window.localStorage
            try {
                if (openDB) openDB(null, null, null, null)
            } catch {
                __callback(true); return
            }
            try {
                storage.setItem("test", "1")
                storage.removeItem("test")
            } catch {
                __callback(true); return
            }
            __callback(false)
        }

        async function safariPrivateTest(): Promise<void> {
            if (typeof navigator.storage?.getDirectory === "function") await currentSafariTest()
            else if (navigator.maxTouchPoints !== undefined) safari13to18Test()
            else oldSafariTest()
        }

        function chromePrivateTest(): void {
            const PAYLOAD = 16384
            const WRITES = 15
            const ROUNDS = 15
            const MIN_ROUNDS = 7
            const CAP_MS = 1000
            const THRESHOLD = 1.30

            const dbName = "__di_" + Math.random().toString(36).slice(2)
            const payload = new Uint8Array(PAYLOAD)
            const req = indexedDB.open(dbName, 1)
            req.onupgradeneeded = () => { req.result.createObjectStore("s") }
            req.onerror = () => { indexedDB.deleteDatabase(dbName); __callback(false) }
            req.onsuccess = () => {
                const db = req.result
                let honored = false
                try {
                    const t = db.transaction("s", "readwrite", { durability: "strict" })
                    honored = t.durability === "strict"
                    t.abort()
                } catch { /* durability option unsupported */ }
                if (!honored) { db.close(); indexedDB.deleteDatabase(dbName); __callback(false); return }

                const block = (durability: "strict" | "relaxed"): Promise<number> =>
                    new Promise((resolve2, reject2) => {
                        const t0 = performance.now()
                        let i = 0
                        const step = (): void => {
                            if (i === WRITES) { resolve2(performance.now() - t0); return }
                            const tx = db.transaction("s", "readwrite", { durability })
                            tx.objectStore("s").put(payload, i)
                            i++
                            tx.oncomplete = step
                            tx.onerror = tx.onabort = () => reject2(tx.error)
                        }
                        step()
                    })

                void (async () => {
                    const start = performance.now()
                    await block("relaxed"); await block("strict")
                    const ratios: number[] = []
                    for (let r = 0; r < ROUNDS; r++) {
                        const rel = await block("relaxed")
                        const str = await block("strict")
                        ratios.push(rel > 0 ? str / rel : Infinity)
                        if (ratios.length >= MIN_ROUNDS && performance.now() - start >= CAP_MS) break
                    }
                    ratios.sort((a, b) => a - b)
                    db.close(); indexedDB.deleteDatabase(dbName)
                    const median = ratios[ratios.length >> 1] ?? Infinity
                    __callback(median < THRESHOLD)
                })().catch(() => { db.close(); indexedDB.deleteDatabase(dbName); __callback(false) })
            }
        }

        async function firefoxPrivateTest(): Promise<void> {
            if (typeof navigator.storage?.getDirectory === "function") {
                try {
                    await navigator.storage.getDirectory()
                    __callback(false)
                } catch (e) {
                    const message = e instanceof Error && typeof e.message === "string" ? e.message : String(e)
                    __callback(message.includes("Security error")); return
                }
            } else {
                const request = indexedDB.open("inPrivate")
                request.onerror = (event) => {
                    if (request.error && request.error.name === "InvalidStateError") {
                        event.preventDefault()
                        __callback(true)
                        return
                    }
                    __callback(false)
                }
                request.onsuccess = () => {
                    indexedDB.deleteDatabase("inPrivate")
                    __callback(false)
                }
            }
        }

        function msiePrivateTest(): void {
            __callback(window.indexedDB === undefined)
        }

        async function main(): Promise<void> {
            if (isSafari()) { browserName = "Safari"; await safariPrivateTest() }
            else if (isChrome()) { browserName = identifyChromium(); chromePrivateTest() }
            else if (isFirefox()) { browserName = "Firefox"; await firefoxPrivateTest() }
            else if (isMSIE()) { browserName = "Internet Explorer"; msiePrivateTest() }
            else { reject(new Error("detectIncognito cannot determine the browser")) }
        }

        main().catch(reject)
    })
}

type Mode = "overlay" | "bar" | "custom"

const DISMISS_KEY = "incognito-gate-dismissed"

/**
 * IncognitoGate — shows a notice when the visitor is in a private /
 * incognito window.
 *
 * Three modes:
 *   • overlay (default) — full-screen dark overlay with a centered
 *     message. Zero design work, works out of the box.
 *   • bar — fixed bottom bar with the same message. Less intrusive.
 *   • custom — pick your own Design Component (right-click a Frame →
 *     Create Component → select here).
 *
 * On the Framer canvas the notice always renders so you can keep
 * editing. On the published site, detection runs on mount and the
 * notice appears only when the visitor is in private mode.
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function IncognitoGate(props: {
    mode: Mode
    content?: React.ReactNode
    children?: React.ReactNode
    message: string
    buttonLabel: string
    dismissible: boolean
    bgColor: string
    textColor: string
    accentColor: string
    invert: boolean
    delay: number
    showWhileDetecting: boolean
    previewOnCanvas: boolean
}) {
    const inCanvas = RenderTarget.current() === RenderTarget.canvas

    // On the canvas, by default we render a small placeholder badge
    // instead of the full overlay/bar so the designer can keep editing
    // the page underneath. Flip Preview on to see the real notice.
    if (inCanvas && !props.previewOnCanvas) {
        return (
            <div
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "6px 10px",
                    background: "#1a1a1a",
                    color: "#f5f5f5",
                    borderRadius: 6,
                    fontFamily: "ui-sans-serif, system-ui, sans-serif",
                    fontSize: 11,
                    fontWeight: 500,
                    boxSizing: "border-box",
                    whiteSpace: "nowrap",
                }}
                title="Toggle 'Preview on canvas' in Properties to see the notice"
            >
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M6 11 Q6 7 12 7 Q18 7 18 11" />
                    <path d="M4 11 L20 11" />
                    <circle cx="9" cy="15" r="2.2" />
                    <circle cx="15" cy="15" r="2.2" />
                    <path d="M11.2 15 L12.8 15" />
                </svg>
                Incognito Gate
            </div>
        )
    }

    const [decided, setDecided] = useState<null | boolean>(null)
    const [dismissed, setDismissed] = useState(false)

    useEffect(() => {
        if (inCanvas) return
        try {
            if (sessionStorage.getItem(DISMISS_KEY) === "1") setDismissed(true)
        } catch { /* storage blocked */ }
    }, [inCanvas])

    useEffect(() => {
        if (inCanvas) return
        let cancelled = false

        const run = () => {
            detectIncognito()
                .then((r) => {
                    if (cancelled) return
                    const show = props.invert ? !r.isPrivate : r.isPrivate
                    setDecided(show)
                })
                .catch(() => {
                    if (cancelled) return
                    setDecided(false)
                })
        }

        if (props.delay > 0) {
            const t = window.setTimeout(run, props.delay)
            return () => {
                cancelled = true
                window.clearTimeout(t)
            }
        }
        run()
        return () => {
            cancelled = true
        }
    }, [props.invert, props.delay, inCanvas])

    const handleDismiss = () => {
        setDismissed(true)
        try { sessionStorage.setItem(DISMISS_KEY, "1") } catch { /* blocked */ }
    }

    const shouldRender = inCanvas
        ? true
        : decided === null
            ? props.showWhileDetecting
            : decided && !dismissed

    if (!shouldRender) return null

    if (props.mode === "custom") {
        const inner = props.content ?? props.children
        if (inner) return <>{inner}</>
        if (inCanvas) {
            return (
                <div
                    style={{
                        minWidth: 220,
                        minHeight: 64,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 12,
                        border: "1px dashed #999",
                        borderRadius: 8,
                        color: "#666",
                        fontFamily: "ui-sans-serif, system-ui, sans-serif",
                        fontSize: 12,
                        textAlign: "center",
                        boxSizing: "border-box",
                    }}
                >
                    Pick a notice design in the Properties panel →
                </div>
            )
        }
        return null
    }

    if (props.mode === "bar") {
        return (
            <div
                style={{
                    position: "fixed",
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: props.bgColor,
                    color: props.textColor,
                    padding: "14px 20px",
                    display: "flex",
                    gap: 16,
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif",
                    fontSize: 14,
                    lineHeight: 1.4,
                    zIndex: 2147483647,
                    boxShadow: "0 -4px 16px rgba(0,0,0,0.15)",
                    boxSizing: "border-box",
                }}
            >
                <span style={{ flex: 1, maxWidth: 720 }}>{props.message}</span>
                {props.dismissible && (
                    <button
                        onClick={handleDismiss}
                        style={{
                            background: props.accentColor,
                            color: props.bgColor,
                            border: "none",
                            padding: "8px 16px",
                            borderRadius: 6,
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: "pointer",
                            fontFamily: "inherit",
                            flexShrink: 0,
                        }}
                    >
                        {props.buttonLabel}
                    </button>
                )}
            </div>
        )
    }

    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.85)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 24,
                zIndex: 2147483647,
                fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif",
                boxSizing: "border-box",
            }}
        >
            <div
                style={{
                    background: props.bgColor,
                    color: props.textColor,
                    maxWidth: 440,
                    width: "100%",
                    padding: "32px 28px",
                    borderRadius: 12,
                    textAlign: "center",
                    boxSizing: "border-box",
                }}
            >
                <div
                    style={{
                        margin: "0 auto 16px",
                        width: 48,
                        height: 48,
                        borderRadius: "50%",
                        background: props.accentColor,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                    aria-hidden
                >
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke={props.bgColor} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 11 Q6 7 12 7 Q18 7 18 11" />
                        <path d="M4 11 L20 11" />
                        <circle cx="9" cy="15" r="2.2" />
                        <circle cx="15" cy="15" r="2.2" />
                        <path d="M11.2 15 L12.8 15" />
                    </svg>
                </div>
                <p
                    style={{
                        margin: 0,
                        fontSize: 15,
                        lineHeight: 1.5,
                        marginBottom: props.dismissible ? 24 : 0,
                    }}
                >
                    {props.message}
                </p>
                {props.dismissible && (
                    <button
                        onClick={handleDismiss}
                        style={{
                            background: props.accentColor,
                            color: props.bgColor,
                            border: "none",
                            padding: "10px 24px",
                            borderRadius: 8,
                            fontSize: 14,
                            fontWeight: 600,
                            cursor: "pointer",
                            fontFamily: "inherit",
                        }}
                    >
                        {props.buttonLabel}
                    </button>
                )}
            </div>
        </div>
    )
}

addPropertyControls(IncognitoGate, {
    previewOnCanvas: {
        type: ControlType.Boolean,
        title: "Preview on canvas",
        defaultValue: false,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        description: "On = render the real notice in the editor. Off = tiny placeholder so you can keep editing the page.",
    },
    mode: {
        type: ControlType.Enum,
        title: "Style",
        defaultValue: "overlay",
        options: ["overlay", "bar", "custom"],
        optionTitles: ["Overlay", "Bottom bar", "Custom design"],
        displaySegmentedControl: true,
    },
    content: {
        type: ControlType.ComponentInstance,
        title: "Notice design",
        description: "Right-click a Frame → Create Component → pick it here.",
        hidden: (props) => props.mode !== "custom",
    },
    message: {
        type: ControlType.String,
        title: "Message",
        defaultValue:
            "For the full experience on this site, please disable incognito mode. Some features rely on local storage that private windows block.",
        displayTextArea: true,
        hidden: (props) => props.mode === "custom",
    },
    dismissible: {
        type: ControlType.Boolean,
        title: "Dismissible",
        defaultValue: true,
        enabledTitle: "Yes",
        disabledTitle: "No",
        hidden: (props) => props.mode === "custom",
    },
    buttonLabel: {
        type: ControlType.String,
        title: "Button",
        defaultValue: "Got it",
        hidden: (props) => props.mode === "custom" || !props.dismissible,
    },
    bgColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#111111",
        hidden: (props) => props.mode === "custom",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#ffffff",
        hidden: (props) => props.mode === "custom",
    },
    accentColor: {
        type: ControlType.Color,
        title: "Accent",
        defaultValue: "#ffffff",
        hidden: (props) => props.mode === "custom",
    },
    invert: {
        type: ControlType.Boolean,
        title: "Show when",
        defaultValue: false,
        enabledTitle: "Not incognito",
        disabledTitle: "Incognito",
    },
    delay: {
        type: ControlType.Number,
        title: "Delay",
        defaultValue: 300,
        min: 0,
        max: 5000,
        step: 50,
        unit: "ms",
        description: "Wait before running detection. Smooths any flash on first paint.",
    },
    showWhileDetecting: {
        type: ControlType.Boolean,
        title: "Flash-safe",
        defaultValue: false,
        enabledTitle: "Show first",
        disabledTitle: "Hide first",
        description: "Show first → may flash to normal visitors. Hide first → no flash.",
    },
})
