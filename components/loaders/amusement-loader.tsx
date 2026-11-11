import * as React from "react"
import { createPortal } from "react-dom"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


type ZLReadyMode = "Page" | "Ready" | "Event" | "Progress"
type ZLExitReason =
    | "ready"
    | "timeout"
    | "skipped"
    | "resource-error"
    | "render-error"
type ZLPhase = "waiting" | "finishing" | "fading"
interface ZLExitInfo {
    reason: ZLExitReason
    elapsedMs: number
    mode: ZLReadyMode
    resourceErrors: number
}
interface ZlandLoadingProps {
    enabled?: boolean
    readyMode?: ZLReadyMode
    ready?: boolean

    loadProgress?: number
    readyEvent?: string
    resetKey?: string
    waitForFonts?: boolean
    waitForImages?: boolean
    criticalImages?: string[]
    maxWait?: number
    allowSkip?: boolean
    skipAfter?: number
    skipLabel?: string
    loadingLabel?: string
    dayBackground?: string
    nightBackground?: string
    dayRideColor?: string
    nightRideColor?: string
    lightColor?: string
    /** @deprecated Kept for old instances; time no longer drives progress. */
    duskDuration?: number
    minDisplay?: number
    finishDuration?: number
    fadeDuration?: number
    sceneWidth?: number
    previewMode?: boolean
    previewProgress?: number
    onComplete?: () => void
    onTimeout?: () => void
    onExit?: (info: ZLExitInfo) => void
    style?: React.CSSProperties
}
interface ZLRuntimeProps extends ZlandLoadingProps {
    host: HTMLDivElement
    finish: (info: ZLExitInfo) => void
}

type ZLWindow = Window & {
    __zlandReady?: Record<string, boolean>
    __zlandProgress?: Record<string, number>
}
const ZL_HOST_ATTRIBUTE = "data-zland-fullscreen-host"

function zlClamp01(value: number): number {
    return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0
}
function zlSeconds(value: number | undefined, fallback: number): number {
    return typeof value === "number" && Number.isFinite(value)
        ? Math.max(0, value)
        : fallback
}
function zlEase(value: number): number {
    const t = zlClamp01(value)
    return t * t * (3 - 2 * t)
}
type ZLColor = { r: number; g: number; b: number; a: number }
function zlParseColor(input: string): ZLColor | null {
    const color = input.trim()
    const hex = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec(color)
    if (hex) {
        let value = hex[1]
        if (value.length <= 4)
            value = value
                .split("")
                .map((c) => c + c)
                .join("")
        return {
            r: parseInt(value.slice(0, 2), 16),
            g: parseInt(value.slice(2, 4), 16),
            b: parseInt(value.slice(4, 6), 16),
            a: value.length === 8 ? parseInt(value.slice(6, 8), 16) / 255 : 1,
        }
    }
    const match = /^rgba?\(([^)]+)\)$/i.exec(color)
    if (!match) return null
    const values = match[1].trim().split(/[\s,/]+/)
    if (values.length !== 3 && values.length !== 4) return null
    const channel = (v: string) => parseFloat(v) * (v.endsWith("%") ? 2.55 : 1)
    const alpha = values[3] ?? "1"
    const result = {
        r: channel(values[0]),
        g: channel(values[1]),
        b: channel(values[2]),
        a: parseFloat(alpha) / (alpha.endsWith("%") ? 100 : 1),
    }
    return Object.values(result).every(Number.isFinite) ? result : null
}
function zlMixColor(from: string, to: string, amount: number): string {
    const t = zlClamp01(amount)
    if (t === 0) return from
    if (t === 1) return to
    const a = zlParseColor(from),
        b = zlParseColor(to)
    if (!a || !b) return `color-mix(in srgb, ${from} ${(1 - t) * 100}%, ${to})`
    const lerp = (x: number, y: number) => x + (y - x) * t
    return `rgba(${Math.round(lerp(a.r, b.r))}, ${Math.round(lerp(a.g, b.g))}, ${Math.round(lerp(a.b, b.b))}, ${lerp(a.a, b.a)})`
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 1400
 * @framerIntrinsicHeight 520
 */
export default function ZlandLoading(props: ZlandLoadingProps) {
    const {
        enabled = true,
        previewMode = false,
        previewProgress = 1,
        resetKey = "",
        readyMode = "Page",
        readyEvent = "zland:ready",
        style,
    } = props
    const isStatic = useIsStaticRenderer()
    const inline = isStatic || previewMode
    const anchor = React.useRef<HTMLSpanElement>(null)
    const [host, setHost] = React.useState<HTMLDivElement | null>(null)
    const closeRef = React.useRef<(() => void) | null>(null)
    const latest = React.useRef(props)
    latest.current = props

    React.useEffect(() => {
        if (
            inline ||
            !enabled ||
            typeof document === "undefined" ||
            !document.body
        )
            return
        let disposed = false
        let attempted = false
        let ownHost: HTMLDivElement | null = null
        const visible = () => {
            const node = anchor.current
            if (!node || node.getClientRects().length === 0) return false
            for (
                let element: HTMLElement | null = node;
                element;
                element = element.parentElement
            ) {
                const css = window.getComputedStyle(element)
                if (css.display === "none" || css.visibility === "hidden")
                    return false
            }
            return true
        }
        const release = () => {
            if (ownHost) {
                ownHost.remove()
                ownHost = null
            }
            if (!disposed) setHost(null)
        }
        closeRef.current = release
        const mount = () => {
            if (disposed || attempted || !visible()) return

            if (document.querySelector(`[${ZL_HOST_ATTRIBUTE}]`)) {
                attempted = true
                return
            }
            attempted = true
            ownHost = document.createElement("div")
            ownHost.setAttribute(ZL_HOST_ATTRIBUTE, "")
            ownHost.style.cssText =
                "position:fixed!important;inset:0!important;margin:0!important;padding:0!important;border:0!important;z-index:2147483000!important;isolation:isolate;pointer-events:auto;display:block;"
            document.body.appendChild(ownHost)
            setHost(ownHost)
        }
        mount()

        window.addEventListener("resize", mount, { passive: true })
        const observer =
            typeof ResizeObserver !== "undefined"
                ? new ResizeObserver(mount)
                : null
        if (anchor.current) observer?.observe(anchor.current)
        return () => {
            disposed = true
            observer?.disconnect()
            window.removeEventListener("resize", mount)
            release()
            closeRef.current = null
        }
    }, [inline, enabled, resetKey, readyMode, readyEvent])

    const finish = React.useCallback((info: ZLExitInfo) => {
        closeRef.current?.()
        const current = latest.current

        const safe = (action?: () => void) => {
            try {
                action?.()
            } catch (error) {
                console.error("ZlandLoading callback:", error)
            }
        }
        safe(() => current.onExit?.(info))
        if (info.reason === "ready") safe(current.onComplete)
        if (info.reason === "timeout") safe(current.onTimeout)
        window.dispatchEvent(new CustomEvent("zland:exit", { detail: info }))
    }, [])

    if (!enabled) return null
    if (inline) {
        const p = previewMode ? zlClamp01(previewProgress) : 1
        return <ZLScene {...props} progress={p} style={style} />
    }

    return (
        <>
            <span
                ref={anchor}
                aria-hidden="true"
                data-zland-anchor=""
                style={{
                    position: "absolute",
                    width: 0,
                    height: 0,
                    overflow: "hidden",
                    pointerEvents: "none",
                }}
            />
            {host &&
                createPortal(
                    <ZLRenderBoundary
                        onFailure={() =>
                            finish({
                                reason: "render-error",
                                elapsedMs: 0,
                                mode: readyMode,
                                resourceErrors: 1,
                            })
                        }
                    >
                        <ZLRuntime {...props} host={host} finish={finish} />
                    </ZLRenderBoundary>,
                    host
                )}
        </>
    )
}

class ZLRenderBoundary extends React.Component<
    {
        children: React.ReactNode
        onFailure: () => void
    },
    { failed: boolean }
> {
    state = { failed: false }
    static getDerivedStateFromError() {
        return { failed: true }
    }
    componentDidCatch(error: Error) {
        console.error("ZlandLoading render failed; releasing page:", error)
        this.props.onFailure()
    }
    render() {
        return this.state.failed ? null : this.props.children
    }
}

function zlTemporaryStyles(
    element: HTMLElement,
    values: Record<string, string>
) {
    const previous = Object.entries(values).map(([name, value]) => ({
        name,
        value: element.style.getPropertyValue(name),
        priority: element.style.getPropertyPriority(name),
        applied: value,
    }))
    Object.entries(values).forEach(([name, value]) =>
        element.style.setProperty(name, value, "important")
    )
    return () =>
        previous.forEach(({ name, value, priority, applied }) => {
            if (element.style.getPropertyValue(name) !== applied) return
            if (value) element.style.setProperty(name, value, priority)
            else element.style.removeProperty(name)
        })
}

function zlLockPage(
    host: HTMLElement,
    dialog: HTMLElement,
    escape: () => void
): () => void {
    const body = document.body,
        html = document.documentElement
    const focusBefore =
        document.activeElement instanceof HTMLElement
            ? document.activeElement
            : null
    const x = window.scrollX,
        y = window.scrollY,
        url = location.href
    const scrollbar = Math.max(0, window.innerWidth - html.clientWidth)
    const originalPadding = parseFloat(getComputedStyle(body).paddingRight) || 0
    const restoreHtml = zlTemporaryStyles(html, {
        overflow: "hidden",
        "overscroll-behavior": "none",
    })
    const restoreBody = zlTemporaryStyles(body, {
        position: "fixed",
        top: `${-y}px`,
        left: `${-x}px`,
        width: "100%",
        overflow: "hidden",
        "overscroll-behavior": "none",
        "box-sizing": "border-box",
        "padding-right": `${originalPadding + scrollbar}px`,
    })
    dialog.focus({ preventScroll: true })
    const madeInert = new Map<HTMLElement, boolean>()
    const shield = (element: Element) => {
        if (
            !(element instanceof HTMLElement) ||
            element === host ||
            element.contains(host) ||
            /^(SCRIPT|STYLE|LINK|META)$/.test(element.tagName)
        )
            return
        if (madeInert.has(element)) return
        madeInert.set(element, element.hasAttribute("inert"))
        element.setAttribute("inert", "")
    }
    Array.from(body.children).forEach(shield)
    const observer = new MutationObserver((records) => {
        records.forEach((record) =>
            record.addedNodes.forEach((node) => {
                if (node instanceof Element) shield(node)
            })
        )
    })
    observer.observe(body, { childList: true })
    const focusables = () =>
        Array.from(
            dialog.querySelectorAll<HTMLElement>(
                "button:not([disabled]), a[href], [tabindex]:not([tabindex='-1'])"
            )
        ).filter((node) => node.getClientRects().length > 0)
    const onKey = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
            event.preventDefault()
            event.stopPropagation()
            escape()
            return
        }
        if (event.key !== "Tab") return
        const targets = focusables(),
            first = targets[0],
            last = targets[targets.length - 1]
        if (!first) {
            event.preventDefault()
            dialog.focus({ preventScroll: true })
            return
        }
        const current = document.activeElement
        if (
            event.shiftKey &&
            (current === first ||
                current === dialog ||
                !dialog.contains(current))
        ) {
            event.preventDefault()
            last.focus()
        } else if (
            !event.shiftKey &&
            (current === last ||
                current === dialog ||
                !dialog.contains(current))
        ) {
            event.preventDefault()
            first.focus()
        }
    }
    const onFocus = (event: FocusEvent) => {
        if (!dialog.contains(event.target as Node))
            dialog.focus({ preventScroll: true })
    }
    document.addEventListener("keydown", onKey, true)
    document.addEventListener("focusin", onFocus, true)
    let restored = false
    return () => {
        if (restored) return
        restored = true
        observer.disconnect()
        document.removeEventListener("keydown", onKey, true)
        document.removeEventListener("focusin", onFocus, true)
        madeInert.forEach((alreadyInert, element) => {
            if (!alreadyInert) element.removeAttribute("inert")
        })
        restoreBody()
        restoreHtml()
        if (location.href === url) {
            const restoreBehavior = zlTemporaryStyles(html, {
                "scroll-behavior": "auto",
            })
            window.scrollTo(x, y)
            restoreBehavior()
            if (
                focusBefore?.isConnected &&
                focusBefore !== body &&
                !focusBefore.closest("[inert]")
            )
                focusBefore.focus({ preventScroll: true })
        }
    }
}

function zlWaitForDocument(signal: AbortSignal): Promise<boolean> {
    if (signal.aborted) return Promise.resolve(false)
    if (document.readyState === "complete") return Promise.resolve(true)
    return new Promise((resolve) => {
        const done = (ok: boolean) => {
            window.removeEventListener("load", onLoad)
            signal.removeEventListener("abort", onAbort)
            resolve(ok)
        }
        const onLoad = () => done(true),
            onAbort = () => done(false)
        window.addEventListener("load", onLoad, { once: true })
        signal.addEventListener("abort", onAbort, { once: true })
        // Check again after subscribing to avoid a missed transition.
        if (document.readyState === "complete") done(true)
    })
}
function zlAbortable(
    promise: Promise<unknown>,
    signal: AbortSignal
): Promise<boolean> {
    if (signal.aborted) return Promise.resolve(false)
    return new Promise((resolve) => {
        let done = false
        const finish = (ok: boolean) => {
            if (done) return
            done = true
            signal.removeEventListener("abort", abort)
            resolve(ok)
        }
        const abort = () => finish(false)
        signal.addEventListener("abort", abort, { once: true })
        promise.then(
            () => finish(true),
            () => finish(false)
        )
    })
}
function zlWaitForImage(
    image: HTMLImageElement,
    signal: AbortSignal
): Promise<boolean> {
    if (signal.aborted) return Promise.resolve(false)
    return new Promise((resolve) => {
        let settled = false,
            decoding = false
        const finish = (ok: boolean) => {
            if (settled) return
            settled = true
            image.removeEventListener("load", loaded)
            image.removeEventListener("error", failed)
            signal.removeEventListener("abort", aborted)
            resolve(ok)
        }
        const failed = () => finish(false),
            aborted = () => finish(false)
        const loaded = () => {
            if (settled || decoding) return
            if (!image.naturalWidth) {
                finish(false)
                return
            }
            decoding = true
            if (typeof image.decode !== "function") {
                finish(true)
                return
            }

            image.decode().then(
                () => finish(true),
                () => finish(image.complete && image.naturalWidth > 0)
            )
        }
        image.addEventListener("load", loaded)
        image.addEventListener("error", failed)
        signal.addEventListener("abort", aborted, { once: true })
        if (image.complete) loaded()
    })
}
function zlRelevantImages(host: HTMLElement): HTMLImageElement[] {
    return Array.from(document.images).filter((image) => {
        if (
            host.contains(image) ||
            (!image.currentSrc && !image.getAttribute("src"))
        )
            return false
        const rect = image.getBoundingClientRect()
        const visible =
            rect.width > 0 &&
            rect.height > 0 &&
            rect.bottom > 0 &&
            rect.right > 0 &&
            rect.top < window.innerHeight &&
            rect.left < window.innerWidth
        return image.loading !== "lazy" || visible
    })
}

async function zlPageGate(
    host: HTMLElement,
    signal: AbortSignal,
    waitFonts: boolean,
    waitImages: boolean,
    extraImages: string[],
    report: (progress: number) => void
): Promise<number> {
    if (signal.aborted) return 0
    const initialImages = waitImages ? zlRelevantImages(host) : []
    const additional = extraImages
        .filter((url) => typeof url === "string" && url.trim())
        .map((url) => {
            const image = new Image()
            image.decoding = "async"
            image.src = url
            return image
        })
    const hasFontTask = waitFonts && Boolean(document.fonts)
    const total =
        1 +
        (hasFontTask ? 1 : 0) +
        initialImages.length +
        additional.length +
        (waitImages ? 1 : 0)
    let settled = 0
    let errors = 0
    report(0)
    const track = async (task: Promise<boolean>): Promise<boolean> => {
        let ok = false
        try {
            ok = await task
        } catch {
            ok = false
        }
        if (!signal.aborted) {
            settled += 1
            if (!ok) errors += 1
            report(settled / total)
        }
        return ok
    }
    const documentTask = zlWaitForDocument(signal)
    const fontTask = (async () => {
        const loaded = await documentTask
        if (!loaded || signal.aborted) return false
        return hasFontTask ? zlAbortable(document.fonts.ready, signal) : true
    })()
    const jobs: Promise<boolean>[] = [track(documentTask)]
    if (hasFontTask) jobs.push(track(fontTask))
    for (const image of [...initialImages, ...additional]) {
        jobs.push(track(zlWaitForImage(image, signal)))
    }
    if (waitImages) {
        jobs.push(
            track(
                (async () => {
                    const loaded = await documentTask
                    await fontTask
                    if (!loaded || signal.aborted) return false
                    const known = new Set(initialImages)
                    const lateImages = zlRelevantImages(host).filter(
                        (image) => !known.has(image)
                    )
                    const results = await Promise.all(
                        lateImages.map((image) => zlWaitForImage(image, signal))
                    )
                    const failed = results.filter((ok) => !ok).length

                    if (!signal.aborted && failed > 1) errors += failed - 1
                    return failed === 0
                })()
            )
        )
    }
    await Promise.all(jobs)
    return errors
}

function ZLRuntime(props: ZLRuntimeProps) {
    const {
        host,
        readyMode = "Page",
        ready = false,
        loadProgress = 0,
        readyEvent = "zland:ready",
        waitForFonts = true,
        waitForImages = true,
        criticalImages = [],
        maxWait = 15,
        allowSkip = true,
        skipAfter = 5,
        skipLabel = "Continue",
        loadingLabel = "Loading page",
        minDisplay = 0,
        finishDuration = 0.35,
        fadeDuration = 0.3,
    } = props
    const dialog = React.useRef<HTMLDivElement>(null)
    const unlock = React.useRef<(() => void) | null>(null)
    const notifyReady = React.useRef<(() => void) | null>(null)
    const skip = React.useRef<(() => void) | null>(null)
    const latest = React.useRef(props)
    latest.current = props
    const [view, setView] = React.useState<{
        progress: number
        phase: ZLPhase
        canSkip: boolean
    }>({ progress: 0, phase: "waiting", canSkip: false })
    const [reduceMotion, setReduceMotion] = React.useState(false)
    const imageKey = JSON.stringify(criticalImages)

    React.useEffect(() => {
        const node = dialog.current
        if (!node) return
        unlock.current = zlLockPage(host, node, () => {
            if (latest.current.allowSkip !== false) skip.current?.()
        })
        return () => {
            unlock.current?.()
            unlock.current = null
        }
    }, [host])

    React.useEffect(() => {
        let disposed = false,
            ended = false,
            gatePrepared = false
        let eventReady = false,
            eventProgress = 0,
            pageProgress = 0
        let errors = 0,
            visual = 0
        let phase: ZLPhase = "waiting",
            canSkip = false
        let frame: number | null = null
        let minimumTimer: number | null = null
        const start = performance.now()
        const timers = new Set<number>()
        const abort = new AbortController()
        const mode = readyMode
        const limitMs = Math.max(
            500,
            Math.min(120000, zlSeconds(maxWait, 15) * 1000)
        )
        const minMs = Math.min(limitMs, zlSeconds(minDisplay, 0) * 1000)
        const finishMs = Math.min(2000, zlSeconds(finishDuration, 0.35) * 1000)
        const fadeMs = Math.min(2000, zlSeconds(fadeDuration, 0.3) * 1000)
        const query = window.matchMedia("(prefers-reduced-motion: reduce)")
        let reduced = query.matches
        setReduceMotion(reduced)
        const after = (ms: number, action: () => void) => {
            const id = window.setTimeout(() => {
                timers.delete(id)
                if (!disposed && !ended) action()
            }, ms)
            timers.add(id)
            return id
        }
        const clear = (id: number) => {
            window.clearTimeout(id)
            timers.delete(id)
        }
        const paint = () => {
            if (!disposed && !ended)
                setView({ progress: visual, phase, canSkip })
        }
        const schedule = () => {
            if (
                !disposed &&
                !ended &&
                phase === "waiting" &&
                frame === null &&
                !document.hidden
            ) {
                frame = requestAnimationFrame(tick)
            }
        }
        const propertyProgress = () =>
            zlClamp01(latest.current.loadProgress ?? 0)
        const gateReady = () =>
            gatePrepared &&
            (mode === "Page" ||
                (mode === "Ready"
                    ? latest.current.ready === true
                    : mode === "Progress"
                      ? propertyProgress() >= 1
                      : eventReady))
        const measuredProgress = () => {
            if (gateReady()) return 1
            const source =
                mode === "Page"
                    ? pageProgress
                    : mode === "Event"
                      ? eventProgress
                      : propertyProgress()

            return Math.min(0.99, source)
        }
        const finish = (reason: ZLExitReason) => {
            if (disposed || ended) return
            ended = true
            abort.abort()
            if (frame !== null) cancelAnimationFrame(frame)
            frame = null
            timers.forEach((id) => window.clearTimeout(id))
            timers.clear()

            unlock.current?.()
            unlock.current = null
            latest.current.finish({
                reason,
                mode,
                elapsedMs: Math.round(performance.now() - start),
                resourceErrors: errors,
            })
        }
        const fade = (reason: ZLExitReason) => {
            if (disposed || ended || phase === "fading") return
            phase = "fading"
            abort.abort()
            timers.forEach((id) => window.clearTimeout(id))
            timers.clear()
            if (frame !== null) cancelAnimationFrame(frame)
            frame = null
            paint()
            after(reduced ? 0 : fadeMs, () => finish(reason))
        }
        const deadline = after(limitMs, () => fade("timeout"))
        const beginFinish = () => {
            if (phase !== "waiting") return
            clear(deadline)
            phase = "finishing"
            visual = 1
            paint()

            after(reduced ? 0 : finishMs, () =>
                fade(errors ? "resource-error" : "ready")
            )
        }
        function tick(now: number) {
            frame = null
            if (disposed || ended || document.hidden || phase !== "waiting")
                return

            visual = Math.max(visual, measuredProgress())
            paint()
            const elapsed = now - start
            if (gateReady()) {
                if (elapsed >= minMs) beginFinish()
                else if (minimumTimer === null) {
                    minimumTimer = after(minMs - elapsed, () => {
                        minimumTimer = null
                        schedule()
                    })
                }
            }
        }
        const readyUpdate = () => schedule()
        const onEvent = (event: Event) => {
            const detail: unknown = (event as CustomEvent<unknown>).detail

            if (detail == null) {
                eventProgress = 1
                eventReady = true
            } else if (typeof detail === "object") {
                const data = detail as { progress?: unknown; ready?: unknown }
                if (
                    typeof data.progress === "number" &&
                    Number.isFinite(data.progress)
                ) {
                    eventProgress = Math.max(
                        eventProgress,
                        zlClamp01(data.progress)
                    )
                    if (eventProgress >= 1) eventReady = true
                }
                if (data.ready === true) {
                    eventProgress = 1
                    eventReady = true
                }
            }
            readyUpdate()
        }
        const onVisibility = () => {
            if (document.hidden) {
                if (frame !== null) cancelAnimationFrame(frame)
                frame = null
            } else schedule()
        }
        const onMotion = () => {
            reduced = query.matches
            setReduceMotion(reduced)
            schedule()
        }
        const onPageHide = () => finish("skipped")
        notifyReady.current = readyUpdate
        skip.current = () => fade("skipped")
        if (mode === "Event") {
            window.addEventListener(readyEvent, onEvent)
            const cached = (window as ZLWindow).__zlandProgress?.[readyEvent]
            eventProgress = zlClamp01(cached ?? 0)
            eventReady =
                eventProgress >= 1 ||
                (window as ZLWindow).__zlandReady?.[readyEvent] === true
            if (eventReady) eventProgress = 1
        }
        document.addEventListener("visibilitychange", onVisibility)
        window.addEventListener("pagehide", onPageHide)
        query.addEventListener("change", onMotion)
        if (allowSkip)
            after(zlSeconds(skipAfter, 5) * 1000, () => {
                canSkip = true
                paint()
            })
        setView({ progress: 0, phase: "waiting", canSkip: false })
        zlPageGate(
            host,
            abort.signal,
            waitForFonts,
            waitForImages,
            criticalImages,
            (value) => {
                if (disposed || ended || abort.signal.aborted) return
                pageProgress = Math.max(pageProgress, zlClamp01(value))
                readyUpdate()
            }
        ).then(
            (count) => {
                if (disposed || ended || abort.signal.aborted) return
                errors = count
                gatePrepared = true
                readyUpdate()
            },
            () => {
                if (disposed || ended || abort.signal.aborted) return
                errors += 1
                gatePrepared = true
                readyUpdate()
            }
        )
        schedule()
        return () => {
            disposed = true
            abort.abort()
            if (frame !== null) cancelAnimationFrame(frame)
            timers.forEach((id) => window.clearTimeout(id))
            timers.clear()
            if (mode === "Event")
                window.removeEventListener(readyEvent, onEvent)
            document.removeEventListener("visibilitychange", onVisibility)
            window.removeEventListener("pagehide", onPageHide)
            query.removeEventListener("change", onMotion)
            notifyReady.current = null
            skip.current = null
        }
    }, [
        host,
        readyMode,
        readyEvent,
        waitForFonts,
        waitForImages,
        imageKey,
        maxWait,
        allowSkip,
        skipAfter,
        minDisplay,
        finishDuration,
        fadeDuration,
    ])

    React.useEffect(() => {
        notifyReady.current?.()
    }, [ready, loadProgress])
    const stopBubble = (event: React.SyntheticEvent) => event.stopPropagation()
    return (
        <div
            ref={dialog}
            data-zland-loader=""
            data-zland-phase={view.phase}
            data-zland-progress={view.progress.toFixed(4)}
            role="dialog"
            aria-modal="true"
            aria-label={loadingLabel}
            tabIndex={-1}
            onClick={stopBubble}
            onPointerDown={stopBubble}
            onPointerUp={stopBubble}
            style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                overflow: "hidden",
                outline: "none",
                touchAction: "none",
                overscrollBehavior: "none",
                background: props.nightBackground ?? "#242424",
                opacity: view.phase === "fading" ? 0 : 1,
                transition: reduceMotion
                    ? "none"
                    : `opacity ${zlSeconds(fadeDuration, 0.3)}s ease`,
                pointerEvents: "auto",
            }}
        >
            <ZLScene {...props} style={undefined} progress={view.progress} />
            <span
                role="progressbar"
                aria-label={loadingLabel}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.floor(view.progress * 100)}
                aria-valuetext={`${Math.floor(view.progress * 100)}% of ${readyMode === "Page" ? "tracked tasks processed" : "reported loading progress"}`}
                style={{
                    position: "absolute",
                    width: 1,
                    height: 1,
                    padding: 0,
                    margin: -1,
                    overflow: "hidden",
                    clip: "rect(0,0,0,0)",
                    whiteSpace: "nowrap",
                }}
            >
                {loadingLabel}
            </span>
            {allowSkip && view.canSkip && (
                <button
                    type="button"
                    onClick={() => skip.current?.()}
                    aria-label={`${skipLabel} without waiting`}
                    style={{
                        position: "absolute",
                        right: "max(24px, env(safe-area-inset-right))",
                        bottom: "max(24px, env(safe-area-inset-bottom))",
                        padding: "12px 18px",
                        minHeight: 44,
                        border: "1px solid currentColor",
                        borderRadius: 999,
                        background: "transparent",
                        color:
                            view.progress < 0.5
                                ? (props.nightRideColor ?? "#787878")
                                : (props.dayRideColor ?? "#111111"),
                        font: "500 14px/1.3 system-ui, sans-serif",
                        cursor: "pointer",
                        touchAction: "manipulation",
                    }}
                >
                    {skipLabel}
                </button>
            )}
        </div>
    )
}

function ZLScene({
    progress,
    dayBackground = "#F5F5F3",
    nightBackground = "#242424",
    dayRideColor = "#111111",
    nightRideColor = "#111111",
    lightColor = "#FFB800",
    sceneWidth = 1400,
    style,
}: ZlandLoadingProps & { progress: number }) {
    const p = zlClamp01(progress)
    const daylight = zlEase(p)
    const bg = zlMixColor(nightBackground, dayBackground, daylight)
    const ride = zlMixColor(nightRideColor, dayRideColor, daylight)

    const dayComplete = p >= 1

    const on = dayComplete
        ? [false, false, false, false, false]
        : [p > 0, p >= 0.2, p >= 0.4, p >= 0.6, p >= 0.8]

    const running = [p >= 0.2, p >= 0.4, p >= 0.6, p >= 0.8, p >= 1]
    const maxWidth = Number.isFinite(sceneWidth)
        ? Math.max(240, sceneWidth)
        : 1400
    return (
        <div
            data-zland-scene=""
            data-zland-lights={on.filter(Boolean).length}
            data-zland-active-rides={running.filter(Boolean).length}
            data-zland-ride-states={running
                .map((value) => (value ? "1" : "0"))
                .join("")}
            style={{
                ...style,
                position: "relative",
                inset: "auto",
                width: "100%",
                height: "100%",
                minWidth: 0,
                minHeight: 0,
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: bg,
            }}
        >
            <div
                aria-hidden="true"
                style={{
                    width: "100%",
                    maxWidth,
                    height: "100%",
                    minHeight: 0,
                    maxHeight: 560,
                    display: "flex",
                    alignItems: "flex-end",
                    justifyContent: "center",
                    gap: "clamp(0px,1vw,14px)",
                    padding: "clamp(8px,2vw,24px)",
                    boxSizing: "border-box",
                }}
            >
                <RideSlot width="12%">
                    <ZLDropTower
                        motionEnabled={running[0]}
                        state="Open"
                        color={ride}
                        lightColor={lightColor}
                        strokeWidth={5}
                        speed={0.5}
                        lights={on[0] ? "On" : "Off"}
                        playOnHover={false}
                        style={{ width: "100%", height: "100%" }}
                    />
                </RideSlot>
                <RideSlot width="14%">
                    <ZLFerrisWheel
                        motionEnabled={running[1]}
                        state="Open"
                        color={ride}
                        lightColor={lightColor}
                        strokeWidth={5}
                        speed={0.4}
                        lights={on[1] ? "On" : "Off"}
                        playOnHover={false}
                    />
                </RideSlot>
                <RideSlot width="14%">
                    <ZLPirateShip
                        motionEnabled={running[2]}
                        state="Open"
                        color={ride}
                        lightColor={lightColor}
                        strokeWidth={5}
                        speed={0.5}
                        lights={on[2] ? "On" : "Off"}
                        playOnHover={false}
                    />
                </RideSlot>
                <RideSlot width="14%">
                    <ZLCarousel
                        motionEnabled={running[3]}
                        state="Open"
                        color={ride}
                        lightColor={lightColor}
                        strokeWidth={5}
                        speed={0.3}
                        lights={on[3] ? "On" : "Off"}
                        playOnHover={false}
                    />
                </RideSlot>
                <RideSlot width="46%">
                    <ZLRollerCoaster
                        motionEnabled={running[4]}
                        state="Open"
                        color={ride}
                        lightColor={lightColor}
                        strokeWidth={6}
                        speed={0.5}
                        lights={on[4] ? "On" : "Off"}
                        playOnHover={false}
                        style={{ width: "100%", height: "100%" }}
                    />
                </RideSlot>
            </div>
        </div>
    )
}
function RideSlot({
    width,
    children,
}: {
    width: string
    children: React.ReactNode
}) {
    return (
        <div
            style={{
                width,
                height: "100%",
                minWidth: 0,
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "center",
            }}
        >
            {children}
        </div>
    )
}

//  DropTower
type ZL_DropTowerRide_RideState = "Open" | "Active" | "Closed"
type ZL_DropTowerRide_LightMode = "Auto" | "On" | "Off"
interface ZL_DropTowerRide_DropTowerProps {
    motionEnabled?: boolean
    state?: ZL_DropTowerRide_RideState
    color?: string
    lightColor?: string
    strokeWidth?: number
    speed?: number
    playOnHover?: boolean
    lights?: ZL_DropTowerRide_LightMode
    style?: React.CSSProperties
}
interface ZL_DropTowerRide_LightProps {
    lightsOn: boolean
    lightColor: string
}
interface ZL_DropTowerRide_GondolaProps extends ZL_DropTowerRide_LightProps {
    strokeWidth: number
}
const ZL_DropTowerRide_CX = 120
const ZL_DropTowerRide_TOP_Y = 82
const ZL_DropTowerRide_BOTTOM_Y = 280
const ZL_DropTowerRide_TRAVEL =
    ZL_DropTowerRide_BOTTOM_Y - ZL_DropTowerRide_TOP_Y
const ZL_DropTowerRide_CYCLE = {
    liftStart: 0.1,
    liftEnd: 0.58,
    release: 0.7,
    brakeStart: 0.775,
    brakeEnd: 0.825,
}
const ZL_DropTowerRide_WINDOWS = [-36, -12, 12, 36]
const ZL_DropTowerRide_TOWER_LIGHTS = [
    70, 94, 118, 142, 166, 190, 214, 238, 262, 286,
]
const ZL_DropTowerRide_CAP_LIGHTS = [100, 110, 120, 130, 140]
const ZL_DropTowerRide_BASE_LIGHTS = [78, 92, 106, 120, 134, 148, 162]
function ZL_DropTowerRide_gondolaY(phase: number) {
    const t = ((phase % 1) + 1) % 1
    if (t < ZL_DropTowerRide_CYCLE.liftStart) return ZL_DropTowerRide_BOTTOM_Y
    if (t < ZL_DropTowerRide_CYCLE.liftEnd) {
        const u =
            (t - ZL_DropTowerRide_CYCLE.liftStart) /
            (ZL_DropTowerRide_CYCLE.liftEnd - ZL_DropTowerRide_CYCLE.liftStart)
        const eased = u * u * u * (u * (6 * u - 15) + 10)
        return ZL_DropTowerRide_BOTTOM_Y - ZL_DropTowerRide_TRAVEL * eased
    }
    if (t < ZL_DropTowerRide_CYCLE.release) return ZL_DropTowerRide_TOP_Y
    const fallTime =
        ZL_DropTowerRide_CYCLE.brakeStart - ZL_DropTowerRide_CYCLE.release
    const brakeTime =
        ZL_DropTowerRide_CYCLE.brakeEnd - ZL_DropTowerRide_CYCLE.brakeStart
    const peakVelocity =
        ZL_DropTowerRide_TRAVEL / (fallTime / 2 + brakeTime / 3)
    if (t < ZL_DropTowerRide_CYCLE.brakeStart) {
        const elapsed = t - ZL_DropTowerRide_CYCLE.release
        return (
            ZL_DropTowerRide_TOP_Y +
            (peakVelocity / (2 * fallTime)) * elapsed ** 2
        )
    }
    if (t < ZL_DropTowerRide_CYCLE.brakeEnd) {
        const u = (t - ZL_DropTowerRide_CYCLE.brakeStart) / brakeTime
        const fallDistance = (peakVelocity * fallTime) / 2
        // Braking starts at the same velocity and ends at rest.
        const brakeDistance =
            peakVelocity * brakeTime * (u - u * u + (u * u * u) / 3)
        return ZL_DropTowerRide_TOP_Y + fallDistance + brakeDistance
    }
    return ZL_DropTowerRide_BOTTOM_Y
}
function ZLDropTower({
    motionEnabled = true,
    state = "Open",
    color = "#111111",
    lightColor = "#FFB800",
    strokeWidth = 5,
    speed = 0.5,
    playOnHover = true,
    lights = "Auto",
    style,
}: ZL_DropTowerRide_DropTowerProps) {
    const isStatic = useIsStaticRenderer()
    const [hovered, setHovered] = React.useState(false)
    const closed = state === "Closed"
    const running = !isStatic && !closed && motionEnabled
    const interactive = !isStatic && !closed && playOnHover
    const autoLights =
        !closed && (state === "Active" || (interactive && hovered))
    const lightsOn =
        lights === "On" ? !closed : lights === "Off" ? false : autoLights
    const baseLightsOn = lights === "Off" ? false : closed || lightsOn
    const safeSpeed = Number.isFinite(speed)
        ? Math.max(0.25, Math.min(2, speed))
        : 0.5
    const duration = 6 / safeSpeed
    return (
        <div
            style={{
                width: 240,
                height: 360,
                ...style,
                minWidth: 0,
                minHeight: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color,
            }}
            onPointerEnter={
                interactive
                    ? (event) => {
                          if (event.pointerType !== "touch") {
                              setHovered(true)
                          }
                      }
                    : undefined
            }
            onPointerLeave={!isStatic ? () => setHovered(false) : undefined}
            onPointerCancel={!isStatic ? () => setHovered(false) : undefined}
        >
            <svg
                width="100%"
                height="100%"
                viewBox={`0 0 240 ${336 + strokeWidth / 2}`}
                preserveAspectRatio="xMidYMax meet"
                fill="none"
                stroke="currentColor"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                focusable="false"
                style={{
                    display: "block",
                    opacity: closed ? 0.65 : 1,
                }}
            >
                <ZL_DropTowerRide_Tower
                    lightsOn={lightsOn}
                    lightColor={lightColor}
                />

                {running ? (
                    <ZL_DropTowerRide_MovingGondola
                        duration={duration}
                        lightsOn={lightsOn}
                        lightColor={lightColor}
                        strokeWidth={strokeWidth}
                    />
                ) : (
                    <g
                        transform={`translate(${ZL_DropTowerRide_CX} ${ZL_DropTowerRide_BOTTOM_Y})`}
                    >
                        <ZL_DropTowerRide_Gondola
                            lightsOn={lightsOn}
                            lightColor={lightColor}
                            strokeWidth={strokeWidth}
                        />
                    </g>
                )}

                <ZL_DropTowerRide_Base
                    lightsOn={baseLightsOn}
                    lightColor={lightColor}
                />

                <ZL_DropTowerRide_Crown
                    lightsOn={lightsOn}
                    lightColor={lightColor}
                />
            </svg>
        </div>
    )
}
interface ZL_DropTowerRide_MovingGondolaProps
    extends ZL_DropTowerRide_GondolaProps {
    duration: number
}
function ZL_DropTowerRide_MovingGondola({
    duration,
    lightsOn,
    lightColor,
    strokeWidth,
}: ZL_DropTowerRide_MovingGondolaProps) {
    const carriageRef = React.useRef<SVGGElement | null>(null)
    const phaseRef = React.useRef(ZL_DropTowerRide_CYCLE.liftStart)
    React.useEffect(() => {
        const carriage = carriageRef.current
        if (!carriage) return
        const reducedMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        )
        let frame = 0
        let lastTime: number | null = null
        let visible = true
        let disposed = false
        const paint = () => {
            const y = ZL_DropTowerRide_gondolaY(phaseRef.current)
            carriage.setAttribute(
                "transform",
                `translate(${ZL_DropTowerRide_CX} ${y.toFixed(3)})`
            )
        }
        const stop = () => {
            cancelAnimationFrame(frame)
            frame = 0
            lastTime = null
        }
        const tick = (time: number) => {
            if (
                disposed ||
                document.hidden ||
                !visible ||
                reducedMotion.matches
            ) {
                return
            }
            if (lastTime !== null) {
                const dt = Math.max(0, Math.min((time - lastTime) / 1000, 0.05))
                phaseRef.current = (phaseRef.current + dt / duration) % 1
            }
            lastTime = time
            paint()
            frame = requestAnimationFrame(tick)
        }
        const syncPlayback = () => {
            stop()
            if (
                !disposed &&
                !document.hidden &&
                visible &&
                !reducedMotion.matches
            ) {
                frame = requestAnimationFrame(tick)
            }
        }
        const observer =
            typeof IntersectionObserver === "undefined"
                ? null
                : new IntersectionObserver(([entry]) => {
                      if (!entry || entry.isIntersecting === visible) {
                          return
                      }
                      visible = entry.isIntersecting
                      syncPlayback()
                  })
        if (carriage.ownerSVGElement) {
            observer?.observe(carriage.ownerSVGElement)
        }
        paint()
        syncPlayback()
        reducedMotion.addEventListener("change", syncPlayback)
        document.addEventListener("visibilitychange", syncPlayback)
        return () => {
            disposed = true
            stop()
            observer?.disconnect()
            reducedMotion.removeEventListener("change", syncPlayback)
            document.removeEventListener("visibilitychange", syncPlayback)
        }
    }, [duration])
    return (
        <g
            ref={carriageRef}
            transform={`translate(${ZL_DropTowerRide_CX} ${ZL_DropTowerRide_BOTTOM_Y})`}
        >
            <ZL_DropTowerRide_Gondola
                lightsOn={lightsOn}
                lightColor={lightColor}
                strokeWidth={strokeWidth}
            />
        </g>
    )
}
function ZL_DropTowerRide_Tower({
    lightsOn,
    lightColor,
}: ZL_DropTowerRide_LightProps) {
    return (
        <g>
            <path d="M98 48 H142 V325 H98 Z" fill="white" />

            {ZL_DropTowerRide_TOWER_LIGHTS.map((y) => (
                <circle
                    key={y}
                    cx={ZL_DropTowerRide_CX}
                    cy={y}
                    r="2.2"
                    fill={lightsOn ? lightColor : "currentColor"}
                    stroke="none"
                    opacity={lightsOn ? 1 : 0.3}
                />
            ))}
        </g>
    )
}
function ZL_DropTowerRide_Gondola({
    lightsOn,
    lightColor,
    strokeWidth,
}: ZL_DropTowerRide_GondolaProps) {
    const trimWeight = Math.max(1.5, Math.min(3, strokeWidth * 0.5))
    return (
        <g>
            <path d="M-43 23 V32 M43 23 V32 M-49 32 H49" />

            <path
                d="
                    M-57 -12
                    Q0 -23 57 -12
                    L51 23
                    Q0 32 -51 23
                    Z
                "
                fill="currentColor"
            />

            {ZL_DropTowerRide_WINDOWS.map((x) => (
                <g key={x} transform={`translate(${x} 0)`} stroke="none">
                    <rect
                        x="-8"
                        y="-7"
                        width="16"
                        height="12"
                        rx="2"
                        fill={lightsOn ? lightColor : "white"}
                    />

                    <circle cx="-3" cy="-1" r="1.4" fill="currentColor" />

                    <circle cx="3" cy="-1" r="1.4" fill="currentColor" />
                </g>
            ))}

            <path
                d="M-42 17 Q0 23 42 17"
                stroke="white"
                strokeWidth={trimWeight}
            />
        </g>
    )
}
function ZL_DropTowerRide_Base({
    lightsOn,
    lightColor,
}: ZL_DropTowerRide_LightProps) {
    return (
        <g>
            <path d="M54 314 H186 L177 336 H63 Z" fill="white" />

            {ZL_DropTowerRide_BASE_LIGHTS.map((x) => (
                <circle
                    key={x}
                    cx={x}
                    cy="325"
                    r="2.6"
                    fill={lightsOn ? lightColor : "currentColor"}
                    stroke="none"
                    opacity={lightsOn ? 1 : 0.35}
                />
            ))}
        </g>
    )
}
function ZL_DropTowerRide_Crown({
    lightsOn,
    lightColor,
}: ZL_DropTowerRide_LightProps) {
    return (
        <g>
            <path d="M120 20 V32" />

            <circle
                cx={ZL_DropTowerRide_CX}
                cy="20"
                r="4"
                fill="currentColor"
                stroke="none"
            />

            <path
                d="
                    M88 45
                    L101 32
                    H139
                    L152 45
                    V55
                    H88
                    Z
                "
                fill="white"
            />

            {ZL_DropTowerRide_CAP_LIGHTS.map((x) => (
                <circle
                    key={x}
                    cx={x}
                    cy="45"
                    r="2.3"
                    fill={lightsOn ? lightColor : "currentColor"}
                    stroke="none"
                    opacity={lightsOn ? 1 : 0.35}
                />
            ))}
        </g>
    )
}
// Carousel
type ZL_CarouselRide_RideState = "Open" | "Active" | "Closed"
type ZL_CarouselRide_LightMode = "Auto" | "On" | "Off"
interface ZL_CarouselRide_CarouselProps {
    motionEnabled?: boolean
    state: ZL_CarouselRide_RideState
    color: string
    lightColor: string
    strokeWidth?: number
    speed?: number
    playOnHover: boolean
    lights: ZL_CarouselRide_LightMode
}
interface ZL_CarouselRide_CabinConfig {
    delay: number
}
const ZL_CarouselRide_CX = 120
const ZL_CarouselRide_CY = 153
const ZL_CarouselRide_CABINS: ZL_CarouselRide_CabinConfig[] = [
    { delay: 0 },
    { delay: -0.25 },
    { delay: -0.5 },
    { delay: -0.75 },
]
const ZL_CarouselRide_LIGHTS = [
    { x: 59, y: 91 },
    { x: 74, y: 87 },
    { x: 89, y: 84 },
    { x: 105, y: 82 },
    { x: 120, y: 81 },
    { x: 135, y: 82 },
    { x: 151, y: 84 },
    { x: 166, y: 87 },
    { x: 181, y: 91 },
]
function ZLCarousel({
    motionEnabled = true,
    state = "Open",
    color = "#111111",
    lightColor = "#FFB800",
    strokeWidth = 5,
    speed = 0.3,
    playOnHover = true,
    lights = "Auto",
}: ZL_CarouselRide_CarouselProps) {
    const clipId = "zll-carousel-" + React.useId().replace(/:/g, "")
    const isStatic = useIsStaticRenderer()
    const [hovered, setHovered] = React.useState(false)
    const closed = state === "Closed"
    const running = !isStatic && !closed && motionEnabled
    const activeMode = !isStatic && !closed && state === "Active"
    const autoLights =
        !isStatic && !closed && (activeMode || (playOnHover && hovered))
    const lightsOn =
        lights === "On" ? !closed : lights === "Off" ? false : autoLights
    const duration = 6 / Math.max(speed, 0.01)
    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color,
                opacity: closed ? 0.3 : 1,
                transition: "opacity 200ms ease",
            }}
            onPointerEnter={
                !isStatic && playOnHover ? () => setHovered(true) : undefined
            }
            onPointerLeave={!isStatic ? () => setHovered(false) : undefined}
        >
            <svg
                width="100%"
                height="100%"
                viewBox={`0 0 240 ${220 + strokeWidth / 2}`}
                preserveAspectRatio="xMidYMax meet"
                fill="none"
                stroke="currentColor"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
            >
                <ZL_CarouselRide_TopDecoration />

                <ZL_CarouselRide_CarouselRide
                    clipId={clipId}
                    running={running}
                    duration={duration}
                    lightsOn={lightsOn}
                    lightColor={lightColor}
                />

                <ZL_CarouselRide_TopDecoration />

                <ZL_CarouselRide_FlatBase
                    lightsOn={lightsOn}
                    lightColor={lightColor}
                />

                <ZL_CarouselRide_Canopy
                    lightsOn={lightsOn}
                    lightColor={lightColor}
                />

                <ZL_CarouselRide_FlatBase
                    lightsOn={lightsOn}
                    lightColor={lightColor}
                />

                <style>{`

                    @keyframes zll-carousel-orbit {
                        0% {
                            transform:
                                translate(0px, -18px)
                                scale(0.70);
                        }

                        12.5% {
                            transform:
                                translate(42px, -11px)
                                scale(0.78);
                        }

                        25% {
                            transform:
                                translate(58px, 0px)
                                scale(0.86);
                        }

                        37.5% {
                            transform:
                                translate(42px, 12px)
                                scale(0.94);
                        }

                        50% {
                            transform:
                                translate(0px, 19px)
                                scale(1);
                        }

                        62.5% {
                            transform:
                                translate(-42px, 12px)
                                scale(0.94);
                        }

                        75% {
                            transform:
                                translate(-58px, 0px)
                                scale(0.86);
                        }

                        87.5% {
                            transform:
                                translate(-42px, -11px)
                                scale(0.78);
                        }

                        100% {
                            transform:
                                translate(0px, -18px)
                                scale(0.70);
                        }
                    }

                    @keyframes zll-carousel-bob {
                        0%,
                        100% {
                            transform: translateY(-3px);
                        }

                        50% {
                            transform: translateY(3px);
                        }
                    }

                    @media (prefers-reduced-motion: reduce) {
                        .zll-carousel-orbit,
                        .zll-carousel-bob {
                            animation: none !important;
                        }
                    }
                `}</style>
            </svg>
        </div>
    )
}
function ZL_CarouselRide_TopDecoration() {
    return (
        <g transform="translate(0 8)">
            <circle
                cx={ZL_CarouselRide_CX}
                cy="38"
                r="4"
                fill="currentColor"
                stroke="none"
            />

            <line
                x1={ZL_CarouselRide_CX}
                y1="42"
                x2={ZL_CarouselRide_CX}
                y2="52"
            />
        </g>
    )
}
interface ZL_CarouselRide_LightProps {
    lightsOn: boolean
    lightColor: string
}
function ZL_CarouselRide_Canopy({
    lightsOn,
    lightColor,
}: ZL_CarouselRide_LightProps) {
    return (
        <g>
            <path
                d="
                    M45 94
                    Q120 28 195 94
                    Q120 108 45 94
                    Z
                "
                fill="white"
            />

            <path d="M45 94 Q120 108 195 94" />

            {ZL_CarouselRide_LIGHTS.map((light, index) => (
                <circle
                    key={index}
                    cx={light.x}
                    cy={light.y}
                    r={lightsOn ? 2.7 : 2.1}
                    fill={lightsOn ? lightColor : "currentColor"}
                    stroke="none"
                    opacity={lightsOn ? 1 : 0.4}
                />
            ))}
        </g>
    )
}
interface ZL_CarouselRide_CarouselRideProps {
    clipId: string
    running: boolean
    duration: number
    lightsOn: boolean
    lightColor: string
}
function ZL_CarouselRide_CarouselRide({
    clipId,
    running,
    duration,
    lightsOn,
    lightColor,
}: ZL_CarouselRide_CarouselRideProps) {
    return (
        <g>
            <g>
                {ZL_CarouselRide_CABINS.map((cabin, index) => (
                    <ZL_CarouselRide_OrbitCabin
                        clipId={clipId}
                        key={`rear-${index}`}
                        index={index}
                        delay={cabin.delay}
                        running={running}
                        duration={duration}
                        lightsOn={lightsOn}
                        lightColor={lightColor}
                        layer="rear"
                    />
                ))}
            </g>

            <ZL_CarouselRide_CenterPole clipId={clipId} />
            <g>
                {ZL_CarouselRide_CABINS.map((cabin, index) => (
                    <ZL_CarouselRide_OrbitCabin
                        clipId={clipId}
                        key={`front-${index}`}
                        index={index}
                        delay={cabin.delay}
                        running={running}
                        duration={duration}
                        lightsOn={lightsOn}
                        lightColor={lightColor}
                        layer="front"
                    />
                ))}
            </g>
        </g>
    )
}
interface ZL_CarouselRide_OrbitCabinProps {
    clipId: string
    index: number
    delay: number
    running: boolean
    duration: number
    lightsOn: boolean
    lightColor: string
    layer: "rear" | "front"
}
function ZL_CarouselRide_OrbitCabin({
    clipId,
    index,
    delay,
    running,
    duration,
    lightsOn,
    lightColor,
    layer,
}: ZL_CarouselRide_OrbitCabinProps) {
    const animationDelay = delay * duration
    return (
        <g
            clipPath={
                layer === "rear"
                    ? `url(#${clipId}-rear)`
                    : `url(#${clipId}-front)`
            }
        >
            <g
                transform={`translate(${ZL_CarouselRide_CX} ${ZL_CarouselRide_CY})`}
            >
                <g
                    className="zll-carousel-orbit"
                    style={{
                        transformOrigin: "0px 0px",
                        animation: running
                            ? `zll-carousel-orbit ${duration}s linear infinite`
                            : "none",
                        animationDelay: running
                            ? `${animationDelay}s`
                            : undefined,
                        transform: !running
                            ? ZL_CarouselRide_staticTransform(index)
                            : undefined,
                        willChange: running ? "transform" : "auto",
                    }}
                >
                    <ZL_CarouselRide_SuspensionPole />

                    <g
                        className="zll-carousel-bob"
                        style={{
                            animation: running
                                ? `zll-carousel-bob 2.2s ease-in-out ${-index * 0.45}s infinite`
                                : "none",
                        }}
                    >
                        <ZL_CarouselRide_Cabin
                            lightsOn={lightsOn}
                            lightColor={lightColor}
                        />
                    </g>
                </g>
            </g>
        </g>
    )
}
function ZL_CarouselRide_staticTransform(index: number) {
    const positions = [
        "translate(0px, -18px) scale(.70)",
        "translate(58px, 0px) scale(.86)",
        "translate(0px, 19px) scale(1)",
        "translate(-58px, 0px) scale(.86)",
    ]
    return positions[index]
}
function ZL_CarouselRide_CenterPole({ clipId }: { clipId: string }) {
    return (
        <>
            <defs>
                <clipPath id={`${clipId}-rear`}>
                    <rect x="30" y="96" width="180" height="61" />
                </clipPath>

                <clipPath id={`${clipId}-front`}>
                    <rect x="30" y="151" width="180" height="70" />
                </clipPath>
            </defs>

            <line
                x1={ZL_CarouselRide_CX}
                y1="102"
                x2={ZL_CarouselRide_CX}
                y2="220"
            />

            <circle
                cx={ZL_CarouselRide_CX}
                cy="103"
                r="4"
                fill="currentColor"
                stroke="none"
            />
        </>
    )
}
function ZL_CarouselRide_SuspensionPole() {
    return <line x1="0" y1="-78" x2="0" y2="12" />
}
function ZL_CarouselRide_Cabin({
    lightsOn,
    lightColor,
}: ZL_CarouselRide_LightProps) {
    return (
        <g transform="translate(0 7)">
            <path d="M-12 0 Q0 -7 12 0" fill="white" />

            <path
                d="
                    M-12 0
                    L-10 16
                    Q0 21 10 16
                    L12 0
                    Z
                "
                fill="white"
            />

            <rect
                x="-6"
                y="3"
                width="12"
                height="8"
                rx="2"
                fill={lightsOn ? lightColor : "white"}
            />

            <circle cx="-2.3" cy="7" r="1" fill="currentColor" stroke="none" />

            <circle cx="2.3" cy="7" r="1" fill="currentColor" stroke="none" />
        </g>
    )
}
function ZL_CarouselRide_FlatBase({
    lightsOn,
    lightColor,
}: ZL_CarouselRide_LightProps) {
    return (
        <g>
            <path
                d="
                    M48 202
                    H192
                    L182 220
                    H58
                    Z
                "
                fill="white"
            />

            <circle
                cx={ZL_CarouselRide_CX}
                cy="211"
                r={lightsOn ? 2.8 : 2.2}
                fill={lightsOn ? lightColor : "currentColor"}
                stroke="none"
            />
        </g>
    )
}
// RollerCoaster
type ZL_RollerCoasterRide_RideState = "Open" | "Active" | "Closed"
type ZL_RollerCoasterRide_LightMode = "Auto" | "On" | "Off"
interface ZL_RollerCoasterRide_RollerCoasterProps {
    motionEnabled?: boolean
    state?: ZL_RollerCoasterRide_RideState
    color?: string
    lightColor?: string
    strokeWidth?: number
    speed?: number
    playOnHover?: boolean
    lights: ZL_RollerCoasterRide_LightMode
    style?: React.CSSProperties
}
interface ZL_RollerCoasterRide_LightProps {
    lightsOn: boolean
    lightColor: string
}
interface ZL_RollerCoasterRide_Point {
    x: number
    y: number
}
interface ZL_RollerCoasterRide_Pose extends ZL_RollerCoasterRide_Point {
    angle: number
}
interface ZL_RollerCoasterRide_MotionTable {
    points: ZL_RollerCoasterRide_Point[]
    times: number[]
    length: number
    lapTime: number
}
const ZL_RollerCoasterRide_TRACK = `
    M 25 350

    C 55 350, 75 348, 92 338

    C 125 320, 132 245, 150 185

    C 168 128, 195 108, 245 110

    C 355 105, 350 345, 445 345

    C 520 345, 535 225, 625 220

    C 655 220, 665 235, 665 265

    C 665 325, 625 390, 555 405

    L 195 405

    C 125 405, 70 390, 25 350

    Z
`
const ZL_RollerCoasterRide_SECOND_RAIL = `
    M25 363
    C55 363 76 361 96 350
    C132 330 141 255 160 195
    C177 142 202 123 245 125
    C340 122 350 360 445 360
    C525 360 545 242 625 236
`
const ZL_RollerCoasterRide_STATION_X = 270
const ZL_RollerCoasterRide_STATION_Y = 405
const ZL_RollerCoasterRide_STATION_WIDTH = 170
const ZL_RollerCoasterRide_TRAIN_GAP = 44
const ZL_RollerCoasterRide_CAR_INDEXES = [0, 1, 2]
const ZL_RollerCoasterRide_SAMPLE_COUNT = 800
const ZL_RollerCoasterRide_LIFT_SPEED = 28
const ZL_RollerCoasterRide_GRAVITY = 90
const ZL_RollerCoasterRide_TRACK_LIGHTS = [
    [92, 327],
    [112, 270],
    [137, 196],
    [176, 137],
    [224, 113],
    [278, 123],
    [324, 182],
    [357, 264],
    [397, 332],
    [454, 341],
    [505, 299],
    [548, 247],
    [601, 222],
]
const ZL_RollerCoasterRide_SUPPORTS = [
    [70, 346],
    [100, 330],
    [125, 275],
    [150, 185],
    [180, 130],
    [225, 112],
    [270, 120],
    [315, 170],
    [350, 265],
    [390, 330],
    [445, 345],
    [500, 305],
    [550, 250],
    [600, 224],
]
const ZL_RollerCoasterRide_STATIC_CARS: ZL_RollerCoasterRide_Pose[] = [
    { x: 123.598, y: 287.306, angle: -72.303 },
    { x: 104.791, y: 326.829, angle: -51.364 },
    { x: 66.84, y: 347.133, angle: -10.954 },
]
function ZL_RollerCoasterRide_wrap(value: number, length: number) {
    return ((value % length) + length) % length
}
function ZL_RollerCoasterRide_smoothstep(value: number) {
    const t = Math.max(0, Math.min(1, value))
    return t * t * (3 - 2 * t)
}
function ZL_RollerCoasterRide_nearestIndex(
    points: ZL_RollerCoasterRide_Point[],
    x: number,
    y: number,
    start: number
) {
    let result = start
    let best = Infinity
    for (let i = start; i < points.length; i++) {
        const distance = (points[i].x - x) ** 2 + (points[i].y - y) ** 2
        if (distance < best) {
            best = distance
            result = i
        }
    }
    return result
}
function ZL_RollerCoasterRide_buildMotionTable(
    path: SVGPathElement
): ZL_RollerCoasterRide_MotionTable | null {
    const length = path.getTotalLength()
    if (!Number.isFinite(length) || length <= 0) {
        return null
    }
    const points = Array.from(
        { length: ZL_RollerCoasterRide_SAMPLE_COUNT + 1 },
        (_, i) => {
            const point = path.getPointAtLength(
                (i / ZL_RollerCoasterRide_SAMPLE_COUNT) * length
            )
            return {
                x: point.x,
                y: point.y,
            }
        }
    )
    let crest = 0
    for (let i = 1; i < points.length; i++) {
        if (points[i].y < points[crest].y) {
            crest = i
        }
    }
    const brakeStart = ZL_RollerCoasterRide_nearestIndex(
        points,
        595,
        385,
        crest
    )
    const brakeEnd = Math.max(
        brakeStart + 1,
        ZL_RollerCoasterRide_nearestIndex(
            points,
            ZL_RollerCoasterRide_STATION_X +
                ZL_RollerCoasterRide_STATION_WIDTH +
                35,
            ZL_RollerCoasterRide_STATION_Y,
            brakeStart
        )
    )
    const velocities = points.map((point, i) => {
        if (i <= crest) {
            return ZL_RollerCoasterRide_LIFT_SPEED
        }
        const drop = Math.max(0, point.y - points[crest].y)
        const coasting = Math.sqrt(
            ZL_RollerCoasterRide_LIFT_SPEED ** 2 +
                2 * ZL_RollerCoasterRide_GRAVITY * drop
        )
        const brake = ZL_RollerCoasterRide_smoothstep(
            (i - brakeStart) / (brakeEnd - brakeStart)
        )
        return coasting + (ZL_RollerCoasterRide_LIFT_SPEED - coasting) * brake
    })
    const times = [0]
    const step = length / ZL_RollerCoasterRide_SAMPLE_COUNT
    for (let i = 1; i <= ZL_RollerCoasterRide_SAMPLE_COUNT; i++) {
        const dt = (step / 2) * (1 / velocities[i - 1] + 1 / velocities[i])
        times.push(times[i - 1] + dt)
    }
    return {
        points,
        times,
        length,
        lapTime: times[ZL_RollerCoasterRide_SAMPLE_COUNT],
    }
}
function ZL_RollerCoasterRide_phaseAtDistance(
    table: ZL_RollerCoasterRide_MotionTable,
    distance: number
) {
    const position =
        (ZL_RollerCoasterRide_wrap(distance, table.length) / table.length) *
        ZL_RollerCoasterRide_SAMPLE_COUNT
    const index = Math.min(
        Math.floor(position),
        ZL_RollerCoasterRide_SAMPLE_COUNT - 1
    )
    const fraction = position - index
    const time =
        table.times[index] +
        (table.times[index + 1] - table.times[index]) * fraction
    return time / table.lapTime
}
function ZL_RollerCoasterRide_distanceAtPhase(
    table: ZL_RollerCoasterRide_MotionTable,
    phase: number
) {
    const time = ZL_RollerCoasterRide_wrap(phase, 1) * table.lapTime
    let low = 0
    let high = ZL_RollerCoasterRide_SAMPLE_COUNT
    while (high - low > 1) {
        const middle = Math.floor((low + high) / 2)
        if (table.times[middle] <= time) {
            low = middle
        } else {
            high = middle
        }
    }
    const fraction =
        (time - table.times[low]) / (table.times[high] - table.times[low])
    return ((low + fraction) / ZL_RollerCoasterRide_SAMPLE_COUNT) * table.length
}
function ZL_RollerCoasterRide_pointAtDistance(
    table: ZL_RollerCoasterRide_MotionTable,
    distance: number
): ZL_RollerCoasterRide_Point {
    const position =
        (ZL_RollerCoasterRide_wrap(distance, table.length) / table.length) *
        ZL_RollerCoasterRide_SAMPLE_COUNT
    const index = Math.min(
        Math.floor(position),
        ZL_RollerCoasterRide_SAMPLE_COUNT - 1
    )
    const fraction = position - index
    const a = table.points[index]
    const b = table.points[index + 1]
    return {
        x: a.x + (b.x - a.x) * fraction,
        y: a.y + (b.y - a.y) * fraction,
    }
}
function ZL_RollerCoasterRide_poseAtDistance(
    table: ZL_RollerCoasterRide_MotionTable,
    distance: number
): ZL_RollerCoasterRide_Pose {
    const point = ZL_RollerCoasterRide_pointAtDistance(table, distance)
    const before = ZL_RollerCoasterRide_pointAtDistance(table, distance - 3)
    const after = ZL_RollerCoasterRide_pointAtDistance(table, distance + 3)
    return {
        ...point,
        angle:
            Math.atan2(after.y - before.y, after.x - before.x) *
            (180 / Math.PI),
    }
}
function ZL_RollerCoasterRide_poseTransform(pose: ZL_RollerCoasterRide_Pose) {
    return (
        `translate(${pose.x.toFixed(3)} ${pose.y.toFixed(3)}) ` +
        `rotate(${pose.angle.toFixed(3)})`
    )
}
function ZLRollerCoaster({
    motionEnabled = true,
    state = "Open",
    color = "#111111",
    lightColor = "#FFB800",
    strokeWidth = 6,
    speed = 0.5,
    playOnHover = true,
    lights = "Auto",
    style,
}: ZL_RollerCoasterRide_RollerCoasterProps) {
    const isStatic = useIsStaticRenderer()
    const [hovered, setHovered] = React.useState(false)
    const closed = state === "Closed"
    const interactive = !isStatic && !closed && playOnHover
    const autoLights =
        !closed && (state === "Active" || (interactive && hovered))
    const lightsOn =
        lights === "On" ? !closed : lights === "Off" ? false : autoLights
    const stationOn = lights === "Off" ? false : closed || lightsOn
    const safeSpeed = Number.isFinite(speed)
        ? Math.max(0.25, Math.min(2, speed))
        : 0.5
    const duration = 11 / safeSpeed
    return (
        <div
            style={{
                width: 700,
                height: 500,
                ...style,
                minWidth: 0,
                minHeight: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color,
            }}
            onPointerEnter={interactive ? () => setHovered(true) : undefined}
            onPointerLeave={!isStatic ? () => setHovered(false) : undefined}
            onPointerCancel={!isStatic ? () => setHovered(false) : undefined}
        >
            <svg
                width="100%"
                height="100%"
                viewBox={`0 45 700 ${ZL_RollerCoasterRide_STATION_Y + 28 + strokeWidth / 2 - 45}`}
                preserveAspectRatio="xMidYMax meet"
                fill="none"
                stroke="currentColor"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                focusable="false"
                style={{
                    display: "block",
                    opacity: closed ? 0.65 : 1,
                }}
            >
                <ZL_RollerCoasterRide_Supports />

                <ZL_RollerCoasterRide_Track />

                <ZL_RollerCoasterRide_TrackLights
                    lightsOn={lightsOn}
                    lightColor={lightColor}
                />

                <ZL_RollerCoasterRide_StationBack />

                {closed ? (
                    <ZL_RollerCoasterRide_ParkedTrain
                        lightsOn={stationOn}
                        lightColor={lightColor}
                    />
                ) : isStatic || !motionEnabled ? (
                    <ZL_RollerCoasterRide_StaticTrain
                        lightsOn={lightsOn}
                        lightColor={lightColor}
                    />
                ) : (
                    <ZL_RollerCoasterRide_RunningTrain
                        duration={duration}
                        lightsOn={lightsOn}
                        lightColor={lightColor}
                    />
                )}

                <ZL_RollerCoasterRide_StationFront
                    stationOn={stationOn}
                    lightColor={lightColor}
                />
            </svg>
        </div>
    )
}
function ZL_RollerCoasterRide_Track() {
    return (
        <g>
            <path d={ZL_RollerCoasterRide_TRACK} />

            <path d={ZL_RollerCoasterRide_SECOND_RAIL} opacity="0.42" />

            <line x1="75" y1="405" x2="665" y2="405" opacity="0.72" />
        </g>
    )
}
function ZL_RollerCoasterRide_Supports() {
    return (
        <g opacity="0.55">
            {ZL_RollerCoasterRide_SUPPORTS.map(([x, y], index) => (
                <line
                    key={index}
                    x1={x}
                    y1={y}
                    x2={x}
                    y2={ZL_RollerCoasterRide_STATION_Y}
                />
            ))}
        </g>
    )
}
function ZL_RollerCoasterRide_TrackLights({
    lightsOn,
    lightColor,
}: ZL_RollerCoasterRide_LightProps) {
    return (
        <g>
            {ZL_RollerCoasterRide_TRACK_LIGHTS.map(([x, y], index) => (
                <circle
                    key={index}
                    cx={x}
                    cy={y}
                    r={lightsOn ? 4 : 3}
                    fill={lightsOn ? lightColor : "currentColor"}
                    stroke="none"
                    opacity={lightsOn ? 1 : 0.35}
                />
            ))}
        </g>
    )
}
interface ZL_RollerCoasterRide_RunningTrainProps
    extends ZL_RollerCoasterRide_LightProps {
    duration: number
}
function ZL_RollerCoasterRide_RunningTrain({
    duration,
    lightsOn,
    lightColor,
}: ZL_RollerCoasterRide_RunningTrainProps) {
    const pathRef = React.useRef<SVGPathElement | null>(null)
    const carRefs = React.useRef<(SVGGElement | null)[]>([])
    const tableRef = React.useRef<ZL_RollerCoasterRide_MotionTable | null>(null)
    const phaseRef = React.useRef<number | null>(null)
    React.useEffect(() => {
        const path = pathRef.current
        if (!path) return
        const table =
            tableRef.current ?? ZL_RollerCoasterRide_buildMotionTable(path)
        if (!table) return
        tableRef.current = table
        if (phaseRef.current === null) {
            phaseRef.current = ZL_RollerCoasterRide_phaseAtDistance(
                table,
                ZL_RollerCoasterRide_TRAIN_GAP * 2 + 42
            )
        }
        const reducedMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        )
        let frame = 0
        let lastTime: number | null = null
        let disposed = false
        const paint = () => {
            const distance = ZL_RollerCoasterRide_distanceAtPhase(
                table,
                phaseRef.current ?? 0
            )
            ZL_RollerCoasterRide_CAR_INDEXES.forEach((index) => {
                const pose = ZL_RollerCoasterRide_poseAtDistance(
                    table,
                    distance - index * ZL_RollerCoasterRide_TRAIN_GAP
                )
                carRefs.current[index]?.setAttribute(
                    "transform",
                    ZL_RollerCoasterRide_poseTransform(pose)
                )
            })
        }
        const stop = () => {
            cancelAnimationFrame(frame)
            frame = 0
            lastTime = null
        }
        const tick = (time: number) => {
            if (disposed || document.hidden || reducedMotion.matches) {
                return
            }
            if (lastTime !== null) {
                const dt = Math.max(
                    0,
                    Math.min((time - lastTime) / 1000, 0.064)
                )
                phaseRef.current = ZL_RollerCoasterRide_wrap(
                    (phaseRef.current ?? 0) + dt / duration,
                    1
                )
            }
            lastTime = time
            paint()
            frame = requestAnimationFrame(tick)
        }
        const syncPlayback = () => {
            stop()
            if (!disposed && !document.hidden && !reducedMotion.matches) {
                frame = requestAnimationFrame(tick)
            }
        }
        paint()
        syncPlayback()
        reducedMotion.addEventListener("change", syncPlayback)
        document.addEventListener("visibilitychange", syncPlayback)
        return () => {
            disposed = true
            stop()
            reducedMotion.removeEventListener("change", syncPlayback)
            document.removeEventListener("visibilitychange", syncPlayback)
        }
    }, [duration])
    // Lighting is deliberately excluded from the motion effect.
    return (
        <g className="zll-coaster-train">
            <path
                ref={pathRef}
                d={ZL_RollerCoasterRide_TRACK}
                fill="none"
                stroke="none"
                pointerEvents="none"
            />

            {ZL_RollerCoasterRide_CAR_INDEXES.map((index) => (
                <g
                    key={index}
                    ref={(node) => {
                        carRefs.current[index] = node
                    }}
                    transform={ZL_RollerCoasterRide_poseTransform(
                        ZL_RollerCoasterRide_STATIC_CARS[index]
                    )}
                >
                    <ZL_RollerCoasterRide_Car
                        lightsOn={lightsOn}
                        lightColor={lightColor}
                    />
                </g>
            ))}
        </g>
    )
}
function ZL_RollerCoasterRide_StaticTrain({
    lightsOn,
    lightColor,
}: ZL_RollerCoasterRide_LightProps) {
    return (
        <g>
            {ZL_RollerCoasterRide_STATIC_CARS.map((pose, index) => (
                <g
                    key={index}
                    transform={ZL_RollerCoasterRide_poseTransform(pose)}
                >
                    <ZL_RollerCoasterRide_Car
                        lightsOn={lightsOn}
                        lightColor={lightColor}
                    />
                </g>
            ))}
        </g>
    )
}
function ZL_RollerCoasterRide_Car({
    lightsOn,
    lightColor,
}: ZL_RollerCoasterRide_LightProps) {
    return (
        <g transform="translate(-18 -26.5)">
            <path d="M2 3 H32 L36 20 H0 Z" fill="white" />

            <circle cx="8" cy="23" r="3.5" fill="currentColor" stroke="none" />

            <circle cx="28" cy="23" r="3.5" fill="currentColor" stroke="none" />

            <rect
                x="8"
                y="7"
                width="20"
                height="9"
                rx="2"
                fill={lightsOn ? lightColor : "white"}
            />

            <circle
                cx="13"
                cy="11.5"
                r="1.6"
                fill="currentColor"
                stroke="none"
            />

            <circle
                cx="23"
                cy="11.5"
                r="1.6"
                fill="currentColor"
                stroke="none"
            />
        </g>
    )
}
function ZL_RollerCoasterRide_StationBack() {
    return (
        <g>
            <rect
                x={ZL_RollerCoasterRide_STATION_X}
                y={ZL_RollerCoasterRide_STATION_Y - 28}
                width={ZL_RollerCoasterRide_STATION_WIDTH}
                height="56"
                rx="4"
                fill="white"
            />

            <path
                d={`
                    M${ZL_RollerCoasterRide_STATION_X} ${ZL_RollerCoasterRide_STATION_Y - 28}
                    L${ZL_RollerCoasterRide_STATION_X + 12} ${ZL_RollerCoasterRide_STATION_Y - 36}
                    H${ZL_RollerCoasterRide_STATION_X + ZL_RollerCoasterRide_STATION_WIDTH - 12}
                    L${ZL_RollerCoasterRide_STATION_X + ZL_RollerCoasterRide_STATION_WIDTH} ${ZL_RollerCoasterRide_STATION_Y - 28}
                `}
            />
        </g>
    )
}
interface ZL_RollerCoasterRide_StationFrontProps {
    stationOn: boolean
    lightColor: string
}
function ZL_RollerCoasterRide_StationFront({
    stationOn,
    lightColor,
}: ZL_RollerCoasterRide_StationFrontProps) {
    return (
        <g>
            <rect
                x={ZL_RollerCoasterRide_STATION_X}
                y={ZL_RollerCoasterRide_STATION_Y - 28}
                width={ZL_RollerCoasterRide_STATION_WIDTH}
                height="56"
                rx="4"
                fill="white"
            />

            <line
                x1={ZL_RollerCoasterRide_STATION_X}
                y1={ZL_RollerCoasterRide_STATION_Y}
                x2={
                    ZL_RollerCoasterRide_STATION_X +
                    ZL_RollerCoasterRide_STATION_WIDTH
                }
                y2={ZL_RollerCoasterRide_STATION_Y}
            />

            {Array.from({ length: 9 }, (_, index) => (
                <circle
                    key={index}
                    cx={ZL_RollerCoasterRide_STATION_X + 13 + index * 18}
                    cy={ZL_RollerCoasterRide_STATION_Y + 7}
                    r={stationOn ? 3.2 : 2.4}
                    fill={stationOn ? lightColor : "currentColor"}
                    stroke="none"
                    opacity={stationOn ? 1 : 0.35}
                />
            ))}
        </g>
    )
}
function ZL_RollerCoasterRide_ParkedTrain({
    lightsOn,
    lightColor,
}: ZL_RollerCoasterRide_LightProps) {
    return (
        <g>
            {ZL_RollerCoasterRide_CAR_INDEXES.map((index) => (
                <g
                    key={index}
                    transform={`
                        translate(
                            ${ZL_RollerCoasterRide_STATION_X + 41 + index * ZL_RollerCoasterRide_TRAIN_GAP}
                            ${ZL_RollerCoasterRide_STATION_Y}
                        )
                    `}
                >
                    <ZL_RollerCoasterRide_Car
                        lightsOn={lightsOn}
                        lightColor={lightColor}
                    />
                </g>
            ))}
        </g>
    )
}
//  FerrisWheel
type ZL_FerrisWheelRide_WheelState = "Open" | "Active" | "Closed"
type ZL_FerrisWheelRide_LightMode = "Auto" | "On" | "Off"
interface ZL_FerrisWheelRide_Props {
    motionEnabled?: boolean
    state?: ZL_FerrisWheelRide_WheelState
    color?: string
    lightColor?: string
    strokeWidth?: number
    speed?: number
    playOnHover?: boolean
    lights?: ZL_FerrisWheelRide_LightMode
}
interface ZL_FerrisWheelRide_Point {
    x: number
    y: number
}
const ZL_FerrisWheelRide_CX = 120,
    ZL_FerrisWheelRide_CY = 120,
    ZL_FerrisWheelRide_RADIUS = 72,
    ZL_FerrisWheelRide_CABIN_COUNT = 8,
    ZL_FerrisWheelRide_LIGHT_COUNT = 24
function ZL_FerrisWheelRide_points(
    count: number,
    r: number
): ZL_FerrisWheelRide_Point[] {
    return Array.from({ length: count }, (_, i) => {
        const a = (i / count) * Math.PI * 2 - Math.PI / 2
        return {
            x: ZL_FerrisWheelRide_CX + Math.cos(a) * r,
            y: ZL_FerrisWheelRide_CY + Math.sin(a) * r,
        }
    })
}
const ZL_FerrisWheelRide_cabins = ZL_FerrisWheelRide_points(
        ZL_FerrisWheelRide_CABIN_COUNT,
        ZL_FerrisWheelRide_RADIUS
    ),
    ZL_FerrisWheelRide_bulbs = ZL_FerrisWheelRide_points(
        ZL_FerrisWheelRide_LIGHT_COUNT,
        ZL_FerrisWheelRide_RADIUS
    )
function ZLFerrisWheel({
    motionEnabled = true,
    state = "Open",
    color = "#111111",
    lightColor = "#FFB800",
    strokeWidth = 5,
    speed = 0.4,
    playOnHover = true,
    lights = "Auto",
}: ZL_FerrisWheelRide_Props) {
    const isStatic = useIsStaticRenderer(),
        [hovered, setHovered] = React.useState(false),
        closed = state === "Closed",
        running = !isStatic && !closed && motionEnabled,
        auto =
            !isStatic &&
            !closed &&
            (state === "Active" || (playOnHover && hovered)),
        lightsOn = lights === "On" ? !closed : lights === "Off" ? false : auto,
        duration = 8 / Math.max(speed, 0.01)
    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color,
                opacity: closed ? 0.3 : 1,
            }}
            onPointerEnter={
                !isStatic && playOnHover ? () => setHovered(true) : undefined
            }
            onPointerLeave={!isStatic ? () => setHovered(false) : undefined}
        >
            <svg
                width="100%"
                height="100%"
                viewBox={`0 0 240 ${232 + strokeWidth / 2}`}
                preserveAspectRatio="xMidYMax meet"
                fill="none"
                stroke="currentColor"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <g
                    className="zll-wheel"
                    style={{
                        transformOrigin: `${ZL_FerrisWheelRide_CX}px ${ZL_FerrisWheelRide_CY}px`,
                        animation: running
                            ? `zll-wheel ${duration}s linear infinite`
                            : "none",
                    }}
                >
                    <circle
                        cx={ZL_FerrisWheelRide_CX}
                        cy={ZL_FerrisWheelRide_CY}
                        r={ZL_FerrisWheelRide_RADIUS}
                    />
                    {ZL_FerrisWheelRide_cabins.map((p, i) => (
                        <line
                            key={i}
                            x1={ZL_FerrisWheelRide_CX}
                            y1={ZL_FerrisWheelRide_CY}
                            x2={p.x}
                            y2={p.y}
                        />
                    ))}
                    {ZL_FerrisWheelRide_bulbs.map((p, i) => (
                        <circle
                            key={`l${i}`}
                            cx={p.x}
                            cy={p.y}
                            r="2.2"
                            fill={lightsOn ? lightColor : "currentColor"}
                            stroke="none"
                            opacity={lightsOn ? 1 : 0.4}
                        />
                    ))}
                    {ZL_FerrisWheelRide_cabins.map((p, i) => (
                        <ZL_FerrisWheelRide_Cabin
                            key={`c${i}`}
                            {...p}
                            running={running}
                            lightsOn={lightsOn}
                            duration={duration}
                            lightColor={lightColor}
                        />
                    ))}
                </g>
                <line
                    x1={ZL_FerrisWheelRide_CX}
                    y1={ZL_FerrisWheelRide_CY}
                    x2="72"
                    y2="232"
                />
                <line
                    x1={ZL_FerrisWheelRide_CX}
                    y1={ZL_FerrisWheelRide_CY}
                    x2="168"
                    y2="232"
                />
                <line x1="55" y1="232" x2="185" y2="232" />
                <circle
                    cx={ZL_FerrisWheelRide_CX}
                    cy={ZL_FerrisWheelRide_CY}
                    r="7"
                    fill="currentColor"
                    stroke="none"
                />
                <circle
                    cx={ZL_FerrisWheelRide_CX}
                    cy={ZL_FerrisWheelRide_CY}
                    r="3"
                    fill={lightsOn ? lightColor : "currentColor"}
                    stroke="none"
                />
                <style>{`@keyframes zll-wheel{to{transform:rotate(360deg)}}@keyframes zll-cabin{to{transform:rotate(-360deg)}}@media(prefers-reduced-motion:reduce){.zll-wheel,.zll-cabin{animation:none!important}}`}</style>
            </svg>
        </div>
    )
}
function ZL_FerrisWheelRide_Cabin({
    x,
    y,
    running,
    lightsOn,
    duration,
    lightColor,
}: {
    x: number
    y: number
    running: boolean
    lightsOn: boolean
    duration: number
    lightColor: string
}) {
    return (
        <g transform={`translate(${x} ${y})`}>
            <g
                className="zll-cabin"
                style={{
                    transformOrigin: "0 0",
                    animation: running
                        ? `zll-cabin ${duration}s linear infinite`
                        : "none",
                }}
            >
                <line x1="0" y1="0" x2="0" y2="7" />
                <path d="M-10 9 Q0 5 10 9" />
                <path d="M-10 9 L-8 23 Q0 27 8 23 L10 9 Z" fill="white" />
                <path
                    d="M-5 12 H5 V18 H-5 Z"
                    fill={lightsOn ? lightColor : "white"}
                />
                <circle
                    cx="-2.5"
                    cy="15"
                    r="1"
                    fill="currentColor"
                    stroke="none"
                />
                <circle
                    cx="2.5"
                    cy="15"
                    r="1"
                    fill="currentColor"
                    stroke="none"
                />
            </g>
        </g>
    )
}
//  PirateShip
type ZL_PirateShipRide_RideState = "Open" | "Active" | "Closed"
type ZL_PirateShipRide_LightMode = "Auto" | "On" | "Off"
interface ZL_PirateShipRide_Props {
    motionEnabled?: boolean
    state?: ZL_PirateShipRide_RideState
    color?: string
    lightColor?: string
    strokeWidth?: number
    speed?: number
    playOnHover?: boolean
    lights?: ZL_PirateShipRide_LightMode
}
const ZL_PirateShipRide_CX = 120,
    ZL_PirateShipRide_PY = 52,
    ZL_PirateShipRide_LIGHTS = [
        [-43, 84],
        [-30, 88],
        [-16, 91],
        [0, 92],
        [16, 91],
        [30, 88],
        [43, 84],
    ]
function ZLPirateShip({
    motionEnabled = true,
    state = "Open",
    color = "#111111",
    lightColor = "#FFB800",
    strokeWidth = 5,
    speed = 0.5,
    playOnHover = true,
    lights = "Auto",
}: ZL_PirateShipRide_Props) {
    const isStatic = useIsStaticRenderer(),
        [hovered, setHovered] = React.useState(false),
        closed = state === "Closed",
        running = !isStatic && !closed && motionEnabled,
        active = !isStatic && !closed && state === "Active",
        auto =
            !isStatic &&
            !closed &&
            (state === "Active" || (playOnHover && hovered)),
        lightsOn = lights === "On" ? !closed : lights === "Off" ? false : auto,
        duration = 3 / Math.max(speed, 0.01),
        animation = !running
            ? "none"
            : active
              ? `zll-ship-start-active ${duration / 4}s ease-in-out both, zll-ship-active ${duration}s ease-in-out ${duration / 4}s infinite`
              : `zll-ship-start-open ${duration / 4}s ease-in-out both, zll-ship-open ${duration}s ease-in-out ${duration / 4}s infinite`
    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color,
                opacity: closed ? 0.3 : 1,
            }}
            onPointerEnter={
                !isStatic && playOnHover ? () => setHovered(true) : undefined
            }
            onPointerLeave={!isStatic ? () => setHovered(false) : undefined}
        >
            <svg
                width="100%"
                height="100%"
                viewBox={`0 0 240 ${226 + strokeWidth / 2}`}
                preserveAspectRatio="xMidYMax meet"
                fill="none"
                stroke="currentColor"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <line
                    x1={ZL_PirateShipRide_CX}
                    y1={ZL_PirateShipRide_PY}
                    x2="61"
                    y2="226"
                />
                <line
                    x1={ZL_PirateShipRide_CX}
                    y1={ZL_PirateShipRide_PY}
                    x2="179"
                    y2="226"
                />
                <line x1="48" y1="226" x2="192" y2="226" />
                <line x1="78" y1="176" x2="162" y2="176" />
                <g
                    className="zll-pirate-ship"
                    style={{
                        transformOrigin: `${ZL_PirateShipRide_CX}px ${ZL_PirateShipRide_PY}px`,
                        animation,
                        willChange: running ? "transform" : "auto",
                    }}
                >
                    <line
                        x1={ZL_PirateShipRide_CX}
                        y1={ZL_PirateShipRide_PY}
                        x2={ZL_PirateShipRide_CX}
                        y2="139"
                    />
                    <line
                        x1={ZL_PirateShipRide_CX}
                        y1="82"
                        x2={ZL_PirateShipRide_CX}
                        y2="151"
                    />
                    <path d="M120 82 L148 91 L120 101 Z" fill="currentColor" />
                    <line x1="72" y1="139" x2="168" y2="139" />
                    <path
                        d="M58 139 Q120 158 182 139 Q171 184 120 191 Q69 184 58 139 Z"
                        fill="white"
                    />
                    <path d="M58 139 L48 128" />
                    <path d="M182 139 L192 128" />
                    {[91, 120, 149].map((x, i) => (
                        <circle
                            key={x}
                            cx={x}
                            cy={[158, 163, 158][i]}
                            r="5"
                            fill={lightsOn ? lightColor : "white"}
                        />
                    ))}
                    {ZL_PirateShipRide_LIGHTS.map(([x, y], i) => (
                        <circle
                            key={i}
                            cx={ZL_PirateShipRide_CX + x}
                            cy={y}
                            r={lightsOn ? 2.8 : 2.2}
                            fill={lightsOn ? lightColor : "currentColor"}
                            stroke="none"
                            opacity={lightsOn ? 1 : 0.4}
                        />
                    ))}
                </g>
                <circle
                    cx={ZL_PirateShipRide_CX}
                    cy={ZL_PirateShipRide_PY}
                    r="7"
                    fill="currentColor"
                    stroke="none"
                />
                <circle
                    cx={ZL_PirateShipRide_CX}
                    cy={ZL_PirateShipRide_PY}
                    r="3"
                    fill={lightsOn ? lightColor : "currentColor"}
                    stroke="none"
                />
                <style>{`@keyframes zll-ship-start-open{from{transform:rotate(0deg)}to{transform:rotate(-14deg)}}@keyframes zll-ship-start-active{from{transform:rotate(0deg)}to{transform:rotate(-38deg)}}@keyframes zll-ship-open{0%,100%{transform:rotate(-14deg)}50%{transform:rotate(14deg)}}@keyframes zll-ship-active{0%,100%{transform:rotate(-38deg)}50%{transform:rotate(38deg)}}@media(prefers-reduced-motion:reduce){.zll-pirate-ship{animation:none!important}}`}</style>
            </svg>
        </div>
    )
}

addPropertyControls(ZlandLoading, {
    enabled: {
        type: ControlType.Boolean,
        title: "Enabled",
        defaultValue: true,
    },
    previewMode: {
        type: ControlType.Boolean,
        title: "Preview",
        defaultValue: false,
        description: "Preview the loading sequence.",
    },
    previewProgress: {
        type: ControlType.Number,
        title: "Progress",
        min: 0,
        max: 1,
        step: 0.01,
        defaultValue: 1,
        hidden: (p: ZlandLoadingProps) => !p.previewMode,
    },
    readyMode: {
        type: ControlType.Enum,
        title: "Ready Mode",
        options: ["Page", "Ready", "Event", "Progress"],
        optionTitles: [
            "Page Tasks",
            "Ready Property",
            "Ready Event",
            "Progress Property",
        ],
        defaultValue: "Page",
        description: "Choose what completes the loader.",
    },
    loadProgress: {
        type: ControlType.Number,
        title: "Load Progress",
        min: 0,
        max: 1,
        step: 0.01,
        defaultValue: 0,
        hidden: (p: ZlandLoadingProps) =>
            p.readyMode !== "Progress" && p.readyMode !== "Ready",
        description: "Progress from 0 to 1.",
    },
    ready: {
        type: ControlType.Boolean,
        title: "Ready",
        defaultValue: false,
        hidden: (p: ZlandLoadingProps) => p.readyMode !== "Ready",
    },
    readyEvent: {
        type: ControlType.String,
        title: "Ready Event",
        defaultValue: "zland:ready",
        hidden: (p: ZlandLoadingProps) => p.readyMode !== "Event",
        description: "Choose what completes the loader.",
    },
    resetKey: {
        type: ControlType.String,
        title: "Reset Key",
        defaultValue: "",
        description: "Change to restart the loader.",
    },
    waitForFonts: {
        type: ControlType.Boolean,
        title: "Wait Fonts",
        defaultValue: true,
    },
    waitForImages: {
        type: ControlType.Boolean,
        title: "Wait Images",
        defaultValue: true,
        description: "Wait for visible page images.",
    },
    criticalImages: {
        type: ControlType.Array,
        title: "Extra Images",
        maxCount: 20,
        control: {
            type: ControlType.File,
            allowedFileTypes: [
                "png",
                "jpg",
                "jpeg",
                "webp",
                "avif",
                "gif",
                "svg",
            ],
        },
        description: "Add images that must finish loading.",
    },
    maxWait: {
        type: ControlType.Number,
        title: "Max Wait",
        min: 1,
        max: 60,
        step: 1,
        defaultValue: 15,
        unit: "s",
        description: "Maximum wait before exiting.",
    },
    allowSkip: {
        type: ControlType.Boolean,
        title: "Allow Skip",
        defaultValue: true,
    },
    skipAfter: {
        type: ControlType.Number,
        title: "Skip After",
        min: 0,
        max: 30,
        step: 0.5,
        defaultValue: 5,
        unit: "s",
        hidden: (p: ZlandLoadingProps) => p.allowSkip === false,
    },
    skipLabel: {
        type: ControlType.String,
        title: "Skip Text",
        defaultValue: "Continue",
        hidden: (p: ZlandLoadingProps) => p.allowSkip === false,
    },
    loadingLabel: {
        type: ControlType.String,
        title: "A11y Label",
        defaultValue: "Loading page",
        description: "Label for screen readers.",
    },
    dayBackground: {
        type: ControlType.Color,
        title: "Day",
        defaultValue: "#F5F5F3",
    },
    nightBackground: {
        type: ControlType.Color,
        title: "Night",
        defaultValue: "#242424",
    },
    dayRideColor: {
        type: ControlType.Color,
        title: "Day Rides",
        defaultValue: "#111111",
    },
    nightRideColor: {
        type: ControlType.Color,
        title: "Night Rides",
        defaultValue: "#111111",
    },
    lightColor: {
        type: ControlType.Color,
        title: "Lights",
        defaultValue: "#FFB800",
    },
    sceneWidth: {
        type: ControlType.Number,
        title: "Scene Max",
        min: 320,
        max: 2400,
        step: 20,
        defaultValue: 1400,
        unit: "px",
    },
    minDisplay: {
        type: ControlType.Number,
        title: "Min Time",
        min: 0,
        max: 3,
        step: 0.05,
        defaultValue: 0,
        unit: "s",
    },
    finishDuration: {
        type: ControlType.Number,
        title: "Finish",
        min: 0,
        max: 2,
        step: 0.05,
        defaultValue: 0.35,
        unit: "s",
        description: "Hold briefly before fading out.",
    },
    fadeDuration: {
        type: ControlType.Number,
        title: "Fade",
        min: 0,
        max: 2,
        step: 0.05,
        defaultValue: 0.3,
        unit: "s",
    },
    onComplete: { type: ControlType.EventHandler, title: "On Ready" },
    onTimeout: { type: ControlType.EventHandler, title: "On Timeout" },
})
