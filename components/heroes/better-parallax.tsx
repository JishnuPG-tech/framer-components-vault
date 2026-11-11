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


// Types

type Mode = "image" | "video"
type SourceMode = "file" | "url"
type Direction = "up" | "down"
type LoadingMode = "lazy" | "eager"
type MotionMode = "static" | "native" | "javascript"
type ScrollRoot = Window | HTMLElement

interface ResponsiveImageValue {
    src?: string
    srcSet?: string
    sizes?: string
    alt?: string
    positionX?: string | number
    positionY?: string | number
}

interface BetterParallaxProps {
    mode?: Mode
    image?: ResponsiveImageValue
    source?: SourceMode
    file?: string
    url?: string
    autoplay?: boolean
    parallax?: number
    direction?: Direction
    loading?: LoadingMode
    radius?: number
    style?: React.CSSProperties
}

interface ResolvedConfig {
    mode: Mode
    image: ResponsiveImageValue
    source: SourceMode
    file: string
    url: string
    autoplay: boolean
    parallax: number
    direction: Direction
    loading: LoadingMode
    radius: number
}

interface VideoSource {
    key: string
    url: string
}

interface MotionDecision {
    mode: MotionMode
    scrollRoot: ScrollRoot | null
    reason:
        | "disabled"
        | "native"
        | "javascript"
        | "no-scroll-range"
        | "unsupported-context"
        | "unsupported-runtime"
}

interface ViewportSnapshot {
    left: number
    top: number
    width: number
    height: number
}

interface EngineItem {
    root: HTMLElement
    media: HTMLElement
    scrollRoot: ScrollRoot
    parallax: number
    direction: Direction
    active: boolean
    lastOffset: number | null
    visibilityCleanup: (() => void) | null
    visibilityRefresh: (() => void) | null
}

interface ObserverTarget {
    callbacks: Set<(isIntersecting: boolean) => void>
    lastValue: boolean
}

interface ObserverRecord {
    observer: IntersectionObserver
    targets: Map<Element, ObserverTarget>
}

interface EffectiveObservation {
    cleanup: () => void
    refresh: () => void
    observed: boolean
}

interface NativeTimelineStyle extends React.CSSProperties {
    viewTimelineName?: string
    viewTimelineAxis?: "block"
    animationTimeline?: string
    animationRange?: string
}

interface ResolvedComponentState {
    isLiveRuntime: boolean
    hasImage: boolean
    canAutoplayVideo: boolean
    shouldResolveEnvironment: boolean
}

type MediaStatus = "idle" | "loading" | "ready" | "error"
type PageLifecycleSubscriber = (visible: boolean, revision: number) => void

// Constants

const DEFAULT_MODE: Mode = "image"
const DEFAULT_SOURCE: SourceMode = "file"
const DEFAULT_AUTOPLAY = true
const DEFAULT_PARALLAX = 24
const DEFAULT_DIRECTION: Direction = "down"
const DEFAULT_LOADING: LoadingMode = "lazy"
const DEFAULT_RADIUS = 0
const DEFAULT_INTRINSIC_WIDTH = 400
const DEFAULT_IMAGE_ASPECT_RATIO = 4 / 3
const DEFAULT_IMAGE_POSITION = "50%"

const VISUAL_RESERVE_RATIO = 0.2
const MAX_VISUAL_RESERVE_PERCENT = 4
const ENGINE_MARGIN_PX = 240
const VIDEO_LOAD_MARGIN_PX = 650
const ENGINE_KEEP_ALIVE_MS = 120
const OFFSET_EPSILON_PX = 0.14
const SCROLL_EPSILON_PX = 1
const POSITIVE_INTERSECTION_THRESHOLD = 0.000001

const TIMELINE_NAME = "--mash-better-parallax-v3"
const NATIVE_UP_ANIMATION = "mash-better-parallax-v3-up"
const NATIVE_DOWN_ANIMATION = "mash-better-parallax-v3-down"
const NATIVE_STYLE_ID = "mash-better-parallax-v3-native-styles"

const RUNTIME_AUDIT_EVENTS = [
    "transitionrun",
    "transitionstart",
    "transitioncancel",
    "transitionend",
    "animationstart",
    "animationcancel",
    "animationend",
] as const

const ALLOWED_FILE_EXTENSIONS = ["mp4", "webm"]
const DIRECT_VIDEO_EXTENSION_PATTERN = /\.(?:mp4|webm)$/i
const TRUSTED_VIDEO_HOSTS = [
    "framerusercontent.com",
    "res.cloudinary.com",
    "stream.mux.com",
    "supabase.co",
] as const

const EMPTY_IMAGE: ResponsiveImageValue = Object.freeze({})
const MASH_COMPONENT_CREDIT = "Made by [MASH](https://framer.link/mash)."

// Runtime State

const environmentSubscribers = new Set<() => void>()
const pendingRangeSubscribers = new Set<() => void>()
const visibilitySubscribers = new Set<() => void>()
const pageLifecycleSubscribers = new Set<PageLifecycleSubscriber>()
const managedVideoElements = new Set<HTMLVideoElement>()

const engineItems = new Set<EngineItem>()
const activeEngineItems = new Set<EngineItem>()
const fallbackActivityItems = new Set<EngineItem>()
const itemsByScrollRoot = new WeakMap<HTMLElement, Set<EngineItem>>()
const auditedScrollTargets = new WeakSet<EventTarget>()

const observerPool = new Map<string, ObserverRecord>()
const observerRootIds = new WeakMap<HTMLElement, number>()

let nextObserverRootId = 1
let resizeObserver: ResizeObserver | null = null
let layoutShiftObserver: PerformanceObserver | null = null
let runtimeListenersAttached = false
let runtimeAuditFrame = 0
let engineFrame = 0
let engineActiveUntil = 0
let nativeSupport: boolean | null = null
let pageLifecycleRevision = 0

let reducedMotionQuery: MediaQueryList | null = null
let reducedMotionHandler: (() => void) | null = null
const reducedMotionSubscribers = new Set<() => void>()

const useBrowserLayoutEffect =
    typeof window === "undefined" ? React.useEffect : React.useLayoutEffect

// Utilities

function clamp(value: number, minimum: number, maximum: number) {
    if (!Number.isFinite(value)) return minimum
    return Math.min(maximum, Math.max(minimum, value))
}

function usesIntrinsicSize(
    value: React.CSSProperties["width"] | React.CSSProperties["height"]
) {
    return value == null || value === "auto" || value === "fit-content"
}

function roundOffset(value: number) {
    return Math.round(value * 1000) / 1000
}

function isBrowser() {
    return typeof window !== "undefined" && typeof document !== "undefined"
}

function isPageVisible() {
    return !isBrowser() || document.visibilityState !== "hidden"
}

function isWindowRoot(root: ScrollRoot): root is Window {
    return typeof window !== "undefined" && root === window
}

function getWindowViewport(): ViewportSnapshot {
    const viewport = window.visualViewport
    if (viewport) {
        return {
            left: viewport.offsetLeft,
            top: viewport.offsetTop,
            width: Math.max(1, viewport.width),
            height: Math.max(1, viewport.height),
        }
    }

    return {
        left: 0,
        top: 0,
        width: Math.max(1, window.innerWidth),
        height: Math.max(1, window.innerHeight),
    }
}

function getViewportSnapshot(scrollRoot: ScrollRoot): ViewportSnapshot {
    if (isWindowRoot(scrollRoot)) return getWindowViewport()

    const rect = scrollRoot.getBoundingClientRect()
    const scaleX =
        scrollRoot.offsetWidth > 0 ? rect.width / scrollRoot.offsetWidth : 1
    const scaleY =
        scrollRoot.offsetHeight > 0 ? rect.height / scrollRoot.offsetHeight : 1
    return {
        left: rect.left + scrollRoot.clientLeft * scaleX,
        top: rect.top + scrollRoot.clientTop * scaleY,
        width: Math.max(1, scrollRoot.clientWidth * scaleX),
        height: Math.max(1, scrollRoot.clientHeight * scaleY),
    }
}

function isElementRenderable(element: HTMLElement) {
    if (!element.isConnected || !isPageVisible()) return false

    if (typeof element.checkVisibility === "function") {
        try {
            return element.checkVisibility({
                opacityProperty: true,
                visibilityProperty: true,
                contentVisibilityAuto: true,
            })
        } catch {
            // A geometry fallback is still safe if the optional API rejects.
        }
    }

    let current: HTMLElement | null = element
    while (current) {
        const style = safeComputedStyle(current)
        if (!style) return false

        const opacity = Number.parseFloat(style.opacity || "1")
        if (
            style.display === "none" ||
            style.visibility === "hidden" ||
            style.visibility === "collapse" ||
            style.contentVisibility === "hidden" ||
            (Number.isFinite(opacity) && opacity <= 0)
        ) {
            return false
        }

        current = current.parentElement
    }

    return true
}

function intersectsViewport(
    element: HTMLElement,
    scrollRoot: ScrollRoot,
    margin: number
) {
    if (!isElementRenderable(element)) return false

    const rect = element.getBoundingClientRect()
    if (rect.width <= 0 || rect.height <= 0) return false

    const rootViewport = getViewportSnapshot(scrollRoot)
    const intersectsRoot =
        rect.right > rootViewport.left &&
        rect.left < rootViewport.left + rootViewport.width &&
        rect.bottom > rootViewport.top - margin &&
        rect.top < rootViewport.top + rootViewport.height + margin

    if (!intersectsRoot || isWindowRoot(scrollRoot)) return intersectsRoot

    if (!isElementRenderable(scrollRoot)) return false
    const windowViewport = getWindowViewport()
    const rootRect = scrollRoot.getBoundingClientRect()
    return (
        rootRect.width > 0 &&
        rootRect.height > 0 &&
        rootRect.right > windowViewport.left &&
        rootRect.left < windowViewport.left + windowViewport.width &&
        rootRect.bottom > windowViewport.top - margin &&
        rootRect.top < windowViewport.top + windowViewport.height + margin
    )
}

function safeComputedStyle(element: Element) {
    try {
        return window.getComputedStyle(element)
    } catch {
        return null
    }
}

const MOTION_HAZARD_PROPERTIES = [
    ["transform", "transform"],
    ["translate", "translate"],
    ["rotate", "rotate"],
    ["scale", "scale"],
    ["perspective", "perspective"],
    ["filter", "filter"],
    ["offsetPath", "offset-path"],
] as const

function hasActiveStyleValue(value: unknown) {
    if (value === undefined || value === null) return false
    const normalized = String(value).trim().toLowerCase()
    return normalized !== "" && normalized !== "none"
}

function hasTransformHazard(style: CSSStyleDeclaration) {
    const willChange = style.willChange
        .split(",")
        .map((value) => value.trim().toLowerCase())

    return (
        MOTION_HAZARD_PROPERTIES.some(([property]) =>
            hasActiveStyleValue(style[property])
        ) ||
        MOTION_HAZARD_PROPERTIES.some(([, willChangeToken]) =>
            willChange.includes(willChangeToken)
        )
    )
}

function getMotionHazardKey(style: React.CSSProperties | undefined) {
    const transformIsActive = MOTION_HAZARD_PROPERTIES.some(([property]) =>
        hasActiveStyleValue(style?.[property])
    )
    const willChange = String(style?.willChange ?? "")
        .split(",")
        .map((value) => value.trim().toLowerCase())
    const transformMayChange = MOTION_HAZARD_PROPERTIES.some(
        ([, willChangeToken]) => willChange.includes(willChangeToken)
    )

    return `${transformIsActive ? 1 : 0}:${transformMayChange ? 1 : 0}:${String(
        style?.writingMode ?? ""
    )}`
}

function getMotionGeometryKey(style: React.CSSProperties | undefined) {
    return JSON.stringify([
        style?.transform ?? "",
        style?.translate ?? "",
        style?.rotate ?? "",
        style?.scale ?? "",
        style?.transformOrigin ?? "",
        style?.perspective ?? "",
        style?.perspectiveOrigin ?? "",
        style?.filter ?? "",
        style?.offsetPath ?? "",
        style?.offsetDistance ?? "",
        style?.offsetPosition ?? "",
        style?.offsetAnchor ?? "",
        style?.offsetRotate ?? "",
        style?.transformBox ?? "",
        style?.opacity ?? "",
        style?.visibility ?? "",
        style?.display ?? "",
        style?.contentVisibility ?? "",
    ])
}

function hasScrollableRange(scrollRoot: ScrollRoot) {
    if (isWindowRoot(scrollRoot)) {
        const scrollingElement = document.scrollingElement
        if (!scrollingElement) return false
        return (
            scrollingElement.scrollHeight >
            Math.max(window.innerHeight, scrollingElement.clientHeight) +
                SCROLL_EPSILON_PX
        )
    }

    return scrollRoot.scrollHeight > scrollRoot.clientHeight + SCROLL_EPSILON_PX
}

function usesHorizontalWritingMode(element: Element) {
    const style = safeComputedStyle(element)
    return !style || style.writingMode === "horizontal-tb"
}

function getScrollRoot(element: HTMLElement): ScrollRoot {
    let ancestor = element.parentElement

    while (ancestor) {
        const style = safeComputedStyle(ancestor)
        const overflowY = style?.overflowY
        const canScroll = overflowY === "auto" || overflowY === "scroll"

        if (
            canScroll &&
            ancestor.scrollHeight > ancestor.clientHeight + SCROLL_EPSILON_PX
        ) {
            return ancestor
        }

        ancestor = ancestor.parentElement
    }

    return window
}

function hasUnsupportedPositionContext(element: HTMLElement) {
    let ancestor: HTMLElement | null = element

    while (ancestor && ancestor !== document.documentElement) {
        const style = safeComputedStyle(ancestor)
        if (!style) return true
        if (style.position === "fixed" || style.position === "sticky") {
            return true
        }
        ancestor = ancestor.parentElement
    }

    return false
}

function hasNativeTimelineHazard(element: HTMLElement, scrollRoot: ScrollRoot) {
    let current: HTMLElement | null = element

    while (current && current !== document.documentElement) {
        const style = safeComputedStyle(current)
        if (!style) return true

        // A non-overflowing auto/scroll ancestor still owns the CSS timeline.
        // Use JavaScript when it differs from the root driving our geometry.
        const interceptsTimeline =
            current !== element &&
            current !== scrollRoot &&
            ["auto", "scroll", "hidden", "clip"].includes(style.overflowY)

        if (hasTransformHazard(style) || interceptsTimeline) return true
        if (current === scrollRoot) break
        current = current.parentElement
    }

    if (isWindowRoot(scrollRoot)) {
        for (const rootElement of [document.documentElement, document.body]) {
            const style = safeComputedStyle(rootElement)
            if (style && hasTransformHazard(style)) {
                return true
            }
        }
    }

    return false
}

function supportsNativeScrollTimeline() {
    if (nativeSupport !== null) return nativeSupport
    if (!isBrowser() || typeof CSS === "undefined") {
        nativeSupport = false
        return nativeSupport
    }

    try {
        nativeSupport =
            CSS.supports("animation-timeline: --mash-probe") &&
            CSS.supports("view-timeline-name: --mash-probe") &&
            CSS.supports("animation-range: entry 0% exit 100%")
    } catch {
        nativeSupport = false
    }

    return nativeSupport
}

function supportsSharedRuntime() {
    return (
        isBrowser() &&
        typeof window.requestAnimationFrame === "function" &&
        typeof window.IntersectionObserver === "function" &&
        typeof window.ResizeObserver === "function"
    )
}

function resolveMotionDecision(
    root: HTMLElement | null,
    enabled: boolean
): MotionDecision {
    if (!enabled || !root || !isBrowser()) {
        return { mode: "static", scrollRoot: null, reason: "disabled" }
    }

    const scrollRoot = getScrollRoot(root)
    if (!hasScrollableRange(scrollRoot)) {
        return { mode: "static", scrollRoot, reason: "no-scroll-range" }
    }

    if (
        hasUnsupportedPositionContext(root) ||
        !usesHorizontalWritingMode(root) ||
        (!isWindowRoot(scrollRoot) && !usesHorizontalWritingMode(scrollRoot))
    ) {
        return {
            mode: "static",
            scrollRoot,
            reason: "unsupported-context",
        }
    }

    if (
        supportsNativeScrollTimeline() &&
        !hasNativeTimelineHazard(root, scrollRoot)
    ) {
        return { mode: "native", scrollRoot, reason: "native" }
    }

    if (supportsSharedRuntime()) {
        return { mode: "javascript", scrollRoot, reason: "javascript" }
    }

    return {
        mode: "static",
        scrollRoot,
        reason: "unsupported-runtime",
    }
}

function ensureNativeStyles() {
    if (!isBrowser() || document.getElementById(NATIVE_STYLE_ID)) return

    const style = document.createElement("style")
    style.id = NATIVE_STYLE_ID
    style.textContent = `
@keyframes ${NATIVE_UP_ANIMATION} {
    from { transform: var(--mash-parallax-positive); }
    to { transform: var(--mash-parallax-negative); }
}
@keyframes ${NATIVE_DOWN_ANIMATION} {
    from { transform: var(--mash-parallax-negative); }
    to { transform: var(--mash-parallax-positive); }
}`
    document.head.appendChild(style)
}

// Normalizers

function normalizeMode(value: unknown): Mode {
    return value === "video" ? "video" : DEFAULT_MODE
}

function normalizeSource(value: unknown): SourceMode {
    return value === "url" ? "url" : DEFAULT_SOURCE
}

function normalizeDirection(value: unknown): Direction {
    return value === "up" ? "up" : DEFAULT_DIRECTION
}

function normalizeLoading(value: unknown): LoadingMode {
    return value === "eager" ? "eager" : DEFAULT_LOADING
}

function normalizeString(value: unknown) {
    return typeof value === "string" ? value.trim() : ""
}

function normalizeImagePosition(value: unknown) {
    if (typeof value === "number" && Number.isFinite(value)) {
        const percentage = value >= 0 && value <= 1 ? value * 100 : value
        return `${clamp(percentage, 0, 100)}%`
    }

    return normalizeString(value) || DEFAULT_IMAGE_POSITION
}

function normalizeImage(value: unknown): ResponsiveImageValue {
    if (!value || typeof value !== "object") return EMPTY_IMAGE
    const image = value as ResponsiveImageValue
    return {
        src: normalizeString(image.src),
        srcSet: normalizeString(image.srcSet),
        sizes: normalizeString(image.sizes),
        alt: normalizeString(image.alt),
        positionX: normalizeImagePosition(image.positionX),
        positionY: normalizeImagePosition(image.positionY),
    }
}

// Resolvers

function resolveConfig(props: BetterParallaxProps): ResolvedConfig {
    return {
        mode: normalizeMode(props.mode),
        image: normalizeImage(props.image),
        source: normalizeSource(props.source),
        file: normalizeString(props.file),
        url: typeof props.url === "string" ? props.url : "",
        autoplay: props.autoplay !== false,
        parallax: clamp(
            typeof props.parallax === "number"
                ? props.parallax
                : DEFAULT_PARALLAX,
            0,
            100
        ),
        direction: normalizeDirection(props.direction),
        loading: normalizeLoading(props.loading),
        radius:
            typeof props.radius === "number" && Number.isFinite(props.radius)
                ? Math.max(0, props.radius)
                : DEFAULT_RADIUS,
    }
}

function isTrustedVideoHost(hostname: string) {
    const normalized = hostname.toLowerCase().replace(/\.$/, "")

    return TRUSTED_VIDEO_HOSTS.some(
        (host) => normalized === host || normalized.endsWith(`.${host}`)
    )
}

function resolveExternalVideoUrl(value: string) {
    const raw = value.trim()
    if (!raw) return ""

    try {
        const url = new URL(raw)
        if (
            url.protocol !== "https:" ||
            url.username ||
            url.password ||
            !isTrustedVideoHost(url.hostname) ||
            !DIRECT_VIDEO_EXTENSION_PATTERN.test(url.pathname)
        ) {
            return ""
        }

        return url.href
    } catch {
        return ""
    }
}

function resolveVideoSource(config: ResolvedConfig): VideoSource | null {
    const url =
        config.source === "file"
            ? config.file
            : resolveExternalVideoUrl(config.url)
    if (!url) return null
    return { key: `${config.source}:${url}`, url }
}

function getImageKey(image: ResponsiveImageValue) {
    if (!image.src) return ""
    return JSON.stringify([image.src, image.srcSet || "", image.sizes || ""])
}

function getVisualReservePercent(parallax: number) {
    return roundOffset(
        Math.min(
            MAX_VISUAL_RESERVE_PERCENT,
            Math.max(0, parallax * VISUAL_RESERVE_RATIO)
        )
    )
}

function getNativeShift(
    parallax: number,
    visualReserve: number,
    positive: boolean
) {
    // Translate percentages resolve against the oversized media box, so the
    // denominator must include the visual reserve to preserve exact travel.
    const denominator = 100 + 2 * (parallax + visualReserve)
    const percentage = denominator > 0 ? (parallax * 100) / denominator : 0
    return `translate3d(0, ${positive ? percentage : -percentage}%, 0)`
}

function resolveComponentState(
    config: ResolvedConfig,
    isStaticRenderer: boolean,
    isCanvas: boolean,
    reducedMotion: boolean,
    imageKey: string,
    videoSource: VideoSource | null
): ResolvedComponentState {
    const isLiveRuntime = !isStaticRenderer && !isCanvas && !reducedMotion
    const hasImage = imageKey !== ""
    const canAutoplayVideo =
        isLiveRuntime &&
        hasImage &&
        config.mode === "video" &&
        config.autoplay &&
        videoSource !== null

    return {
        isLiveRuntime,
        hasImage,
        canAutoplayVideo,
        shouldResolveEnvironment:
            isLiveRuntime &&
            hasImage &&
            (config.parallax > 0 || canAutoplayVideo),
    }
}

// Engine

// Shared observer pool

function getObserverRootId(root: HTMLElement | null) {
    if (!root) return "window"

    const current = observerRootIds.get(root)
    if (current !== undefined) return String(current)

    const next = nextObserverRootId++
    observerRootIds.set(root, next)
    return String(next)
}

function getObserverRecord(
    root: HTMLElement | null,
    margin: number
): ObserverRecord | null {
    if (!isBrowser() || typeof IntersectionObserver === "undefined") {
        return null
    }

    const key = `${getObserverRootId(root)}:${margin}`
    const existing = observerPool.get(key)
    if (existing) return existing

    let record: ObserverRecord
    try {
        const targets = new Map<Element, ObserverTarget>()
        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    const target = targets.get(entry.target)
                    if (!target) continue

                    const next =
                        entry.isIntersecting &&
                        entry.intersectionRect.width > 0 &&
                        entry.intersectionRect.height > 0
                    if (target.lastValue === next) continue
                    target.lastValue = next
                    for (const callback of target.callbacks) callback(next)
                }
            },
            {
                root,
                rootMargin: `${margin}px 0px`,
                threshold: [0, POSITIVE_INTERSECTION_THRESHOLD],
            }
        )
        record = { observer, targets }
    } catch {
        return null
    }

    observerPool.set(key, record)
    return record
}

function observePooledIntersection(
    element: HTMLElement,
    root: HTMLElement | null,
    margin: number,
    callback: (isIntersecting: boolean) => void
) {
    const key = `${getObserverRootId(root)}:${margin}`
    const record = getObserverRecord(root, margin)
    if (!record) return null

    let target = record.targets.get(element)
    if (!target) {
        target = { callbacks: new Set(), lastValue: false }
        record.targets.set(element, target)
        try {
            record.observer.observe(element)
        } catch {
            record.targets.delete(element)
            if (record.targets.size === 0) {
                record.observer.disconnect()
                observerPool.delete(key)
            }
            return null
        }
    }

    target.callbacks.add(callback)
    callback(target.lastValue)

    return () => {
        const current = record.targets.get(element)
        if (!current) return
        current.callbacks.delete(callback)

        if (current.callbacks.size === 0) {
            record.observer.unobserve(element)
            record.targets.delete(element)
        }

        if (record.targets.size === 0) {
            record.observer.disconnect()
            observerPool.delete(key)
        }
    }
}

function observeEffectiveIntersection(
    element: HTMLElement,
    scrollRoot: ScrollRoot,
    margin: number,
    callback: (isIntersecting: boolean) => void
): EffectiveObservation {
    const createFallback = (): EffectiveObservation => {
        const refresh = () => {
            callback(intersectsViewport(element, scrollRoot, margin))
        }
        refresh()
        return { cleanup: () => {}, refresh, observed: false }
    }

    if (isWindowRoot(scrollRoot)) {
        let ready = false
        let targetIntersects = false
        const publish = () => {
            if (!ready) return
            callback(targetIntersects && isElementRenderable(element))
        }
        const cleanup = observePooledIntersection(
            element,
            null,
            margin,
            (next) => {
                targetIntersects = next
                publish()
            }
        )

        if (!cleanup) return createFallback()
        ready = true
        publish()
        return {
            cleanup,
            refresh: publish,
            observed: true,
        }
    }

    let ready = false
    let targetIntersects = false
    let rootIntersects = false
    const publish = () => {
        if (!ready) return
        callback(
            targetIntersects &&
                rootIntersects &&
                isElementRenderable(element) &&
                isElementRenderable(scrollRoot)
        )
    }

    const targetCleanup = observePooledIntersection(
        element,
        scrollRoot,
        margin,
        (next) => {
            targetIntersects = next
            publish()
        }
    )
    const rootCleanup = observePooledIntersection(
        scrollRoot,
        null,
        margin,
        (next) => {
            rootIntersects = next
            publish()
        }
    )

    if (!targetCleanup || !rootCleanup) {
        targetCleanup?.()
        rootCleanup?.()
        return createFallback()
    }

    ready = true
    publish()
    return {
        cleanup: () => {
            targetCleanup()
            rootCleanup()
        },
        refresh: publish,
        observed: true,
    }
}

// Shared runtime hub

function subscribeEnvironment(callback: () => void) {
    environmentSubscribers.add(callback)
    updateRuntimeInfrastructure()
    return () => {
        environmentSubscribers.delete(callback)
        updateRuntimeInfrastructure()
    }
}

function setPendingRange(callback: () => void, pending: boolean) {
    const changed = pending
        ? !pendingRangeSubscribers.has(callback)
        : pendingRangeSubscribers.has(callback)

    if (!changed) return
    if (pending) pendingRangeSubscribers.add(callback)
    else pendingRangeSubscribers.delete(callback)
    updateRuntimeInfrastructure()
}

function subscribeVisibilityRefresh(callback: () => void) {
    visibilitySubscribers.add(callback)
    updateRuntimeInfrastructure()
    return () => {
        visibilitySubscribers.delete(callback)
        updateRuntimeInfrastructure()
    }
}

function subscribePageLifecycle(callback: PageLifecycleSubscriber) {
    pageLifecycleSubscribers.add(callback)
    updateRuntimeInfrastructure()
    return () => {
        pageLifecycleSubscribers.delete(callback)
        updateRuntimeInfrastructure()
    }
}

function notifyPageLifecycle(visible = isPageVisible()) {
    pageLifecycleRevision += 1
    for (const callback of pageLifecycleSubscribers) {
        callback(visible, pageLifecycleRevision)
    }
}

function pauseManagedVideos() {
    for (const video of managedVideoElements) {
        try {
            video.pause()
        } catch {
            // The element may be detaching while the page lifecycle changes.
        }
    }
}

function deactivateEngineItems() {
    for (const item of engineItems) {
        item.active = false
        item.media.style.willChange = ""
    }
    activeEngineItems.clear()
}

function isInternalRuntimeEvent(event: Event) {
    if (
        typeof AnimationEvent !== "undefined" &&
        event instanceof AnimationEvent &&
        (event.animationName === NATIVE_UP_ANIMATION ||
            event.animationName === NATIVE_DOWN_ANIMATION)
    ) {
        return true
    }

    return (
        typeof TransitionEvent !== "undefined" &&
        event instanceof TransitionEvent &&
        event.propertyName === "opacity" &&
        typeof HTMLVideoElement !== "undefined" &&
        event.target instanceof HTMLVideoElement &&
        managedVideoElements.has(event.target)
    )
}

function scheduleRuntimeAudit(event?: Event) {
    if (!isBrowser() || !isPageVisible()) return
    if (event && isInternalRuntimeEvent(event)) return
    if (runtimeAuditFrame !== 0) return

    runtimeAuditFrame = window.requestAnimationFrame(() => {
        runtimeAuditFrame = 0

        for (const callback of environmentSubscribers) callback()
        for (const callback of visibilitySubscribers) callback()

        refreshAllItemActivity()
        for (const item of engineItems) item.lastOffset = null
        wakeEngine()
    })
}

function handleCapturedScroll(event: Event) {
    const target = event.target
    if (target && !auditedScrollTargets.has(target)) {
        auditedScrollTargets.add(target)
        scheduleRuntimeAudit()
    }

    for (const callback of pendingRangeSubscribers) callback()
    for (const item of fallbackActivityItems) refreshItemActivity(item)
    wakeEngine()
}

function handleViewportChange() {
    scheduleRuntimeAudit()
}

function handleLayoutResourceChange() {
    if (engineItems.size > 0 || pendingRangeSubscribers.size > 0) {
        scheduleRuntimeAudit()
    }
}

function handleVisibilityChange() {
    notifyPageLifecycle()

    if (!isPageVisible()) {
        pauseManagedVideos()
        if (runtimeAuditFrame !== 0) {
            window.cancelAnimationFrame(runtimeAuditFrame)
            runtimeAuditFrame = 0
        }
        if (engineFrame !== 0) {
            window.cancelAnimationFrame(engineFrame)
            engineFrame = 0
        }
        deactivateEngineItems()
        return
    }

    scheduleRuntimeAudit()
}

function handlePageHide() {
    notifyPageLifecycle(false)
    pauseManagedVideos()
    if (runtimeAuditFrame !== 0) {
        window.cancelAnimationFrame(runtimeAuditFrame)
        runtimeAuditFrame = 0
    }
    if (engineFrame !== 0) {
        window.cancelAnimationFrame(engineFrame)
        engineFrame = 0
    }
    deactivateEngineItems()
}

function handlePageShow() {
    notifyPageLifecycle()
    scheduleRuntimeAudit()
}

function installLayoutShiftObserver() {
    if (
        layoutShiftObserver ||
        !isBrowser() ||
        typeof PerformanceObserver === "undefined"
    ) {
        return
    }

    try {
        const supported = PerformanceObserver.supportedEntryTypes || []
        if (!supported.includes("layout-shift")) return

        layoutShiftObserver = new PerformanceObserver(() => {
            scheduleRuntimeAudit()
        })
        layoutShiftObserver.observe({ type: "layout-shift", buffered: true })
    } catch {
        layoutShiftObserver = null
    }
}

function uninstallLayoutShiftObserver() {
    layoutShiftObserver?.disconnect()
    layoutShiftObserver = null
}

function attachRuntimeListeners() {
    if (runtimeListenersAttached || !isBrowser()) return
    runtimeListenersAttached = true

    document.addEventListener("scroll", handleCapturedScroll, {
        capture: true,
        passive: true,
    })
    window.addEventListener("resize", handleViewportChange, { passive: true })
    window.visualViewport?.addEventListener("resize", handleViewportChange, {
        passive: true,
    })
    window.visualViewport?.addEventListener("scroll", handleViewportChange, {
        passive: true,
    })
    document.addEventListener("visibilitychange", handleVisibilityChange)
    document.addEventListener("load", handleLayoutResourceChange, true)
    document.fonts?.addEventListener("loadingdone", handleLayoutResourceChange)
    window.addEventListener("pagehide", handlePageHide)
    window.addEventListener("pageshow", handlePageShow)

    for (const eventName of RUNTIME_AUDIT_EVENTS) {
        document.addEventListener(eventName, scheduleRuntimeAudit, true)
    }
}

function detachRuntimeListeners() {
    if (!runtimeListenersAttached || !isBrowser()) return
    runtimeListenersAttached = false

    document.removeEventListener("scroll", handleCapturedScroll, true)
    window.removeEventListener("resize", handleViewportChange)
    window.visualViewport?.removeEventListener("resize", handleViewportChange)
    window.visualViewport?.removeEventListener("scroll", handleViewportChange)
    document.removeEventListener("visibilitychange", handleVisibilityChange)
    document.removeEventListener("load", handleLayoutResourceChange, true)
    document.fonts?.removeEventListener(
        "loadingdone",
        handleLayoutResourceChange
    )
    window.removeEventListener("pagehide", handlePageHide)
    window.removeEventListener("pageshow", handlePageShow)

    for (const eventName of RUNTIME_AUDIT_EVENTS) {
        document.removeEventListener(eventName, scheduleRuntimeAudit, true)
    }

    if (runtimeAuditFrame !== 0) {
        window.cancelAnimationFrame(runtimeAuditFrame)
        runtimeAuditFrame = 0
    }
}

function updateRuntimeInfrastructure() {
    const needsStructuralRuntime =
        environmentSubscribers.size > 0 ||
        pendingRangeSubscribers.size > 0 ||
        visibilitySubscribers.size > 0 ||
        engineItems.size > 0
    const needsAnyRuntime =
        needsStructuralRuntime || pageLifecycleSubscribers.size > 0

    if (needsAnyRuntime) attachRuntimeListeners()
    else detachRuntimeListeners()

    if (engineItems.size > 0 || pendingRangeSubscribers.size > 0) {
        installLayoutShiftObserver()
    } else {
        uninstallLayoutShiftObserver()
    }
}

// Shared JavaScript engine

function getResizeObserver() {
    if (
        resizeObserver ||
        !isBrowser() ||
        typeof ResizeObserver === "undefined"
    ) {
        return resizeObserver
    }

    try {
        resizeObserver = new ResizeObserver(() => {
            scheduleRuntimeAudit()
        })
    } catch {
        resizeObserver = null
    }

    return resizeObserver
}

function observeEngineGeometry(item: EngineItem) {
    const observer = getResizeObserver()
    if (!observer) return

    try {
        observer.observe(item.root)
    } catch {
        // Geometry is still updated by viewport and scroll events.
    }

    if (!isWindowRoot(item.scrollRoot)) {
        let items = itemsByScrollRoot.get(item.scrollRoot)
        if (!items) {
            items = new Set()
            itemsByScrollRoot.set(item.scrollRoot, items)
            try {
                observer.observe(item.scrollRoot)
            } catch {
                // Geometry is still updated by viewport and scroll events.
            }
        }
        items.add(item)
    }
}

function unobserveEngineGeometry(item: EngineItem) {
    const observer = resizeObserver
    if (!observer) return

    try {
        observer.unobserve(item.root)
    } catch {
        // The node may already be detached.
    }

    if (!isWindowRoot(item.scrollRoot)) {
        const items = itemsByScrollRoot.get(item.scrollRoot)
        if (items) {
            items.delete(item)
            if (items.size === 0) {
                try {
                    observer.unobserve(item.scrollRoot)
                } catch {
                    // The node may already be detached.
                }
                itemsByScrollRoot.delete(item.scrollRoot)
            }
        }
    }

    if (engineItems.size === 0) {
        observer.disconnect()
        resizeObserver = null
    }
}

function setItemActive(item: EngineItem, active: boolean) {
    if (item.active === active) return
    item.active = active

    if (active) {
        activeEngineItems.add(item)
        item.lastOffset = null
        item.media.style.willChange = "transform"
        wakeEngine()
    } else {
        activeEngineItems.delete(item)
        item.media.style.willChange = ""
    }
}

function refreshItemActivity(item: EngineItem) {
    item.visibilityRefresh?.()
}

function refreshAllItemActivity() {
    for (const item of engineItems) refreshItemActivity(item)
}

function computeItemOffset(item: EngineItem, viewport: ViewportSnapshot) {
    const rect = item.root.getBoundingClientRect()
    const distance = viewport.height + rect.height
    const progress =
        distance > 0
            ? clamp(
                  (viewport.top + viewport.height - rect.top) / distance,
                  0,
                  1
              )
            : 0.5
    const travel = (Math.max(1, item.root.clientHeight) * item.parallax) / 100
    const from = item.direction === "up" ? travel : -travel
    const to = -from
    return from + (to - from) * progress
}

function synchronizeEngineItem(item: EngineItem) {
    if (!item.root.isConnected || !item.media.isConnected) return

    const offset = roundOffset(
        computeItemOffset(item, getViewportSnapshot(item.scrollRoot))
    )
    const changed =
        item.lastOffset === null ||
        Math.abs(offset - item.lastOffset) > OFFSET_EPSILON_PX

    if (changed) {
        item.lastOffset = offset
        item.media.style.transform = `translate3d(0, ${offset}px, 0)`
    }
}

function runEngineFrame(timestamp: number) {
    engineFrame = 0
    if (!isPageVisible() || activeEngineItems.size === 0) return

    const snapshots = new Map<ScrollRoot, ViewportSnapshot>()
    const reads: Array<{ item: EngineItem; offset: number }> = []
    const disconnected: EngineItem[] = []

    for (const item of activeEngineItems) {
        if (!item.root.isConnected || !item.media.isConnected) {
            disconnected.push(item)
            continue
        }

        let viewport = snapshots.get(item.scrollRoot)
        if (!viewport) {
            viewport = getViewportSnapshot(item.scrollRoot)
            snapshots.set(item.scrollRoot, viewport)
        }

        reads.push({ item, offset: computeItemOffset(item, viewport) })
    }

    for (const item of disconnected) unregisterEngineItem(item)

    let changed = false
    for (const read of reads) {
        const offset = roundOffset(read.offset)
        if (
            read.item.lastOffset !== null &&
            Math.abs(offset - read.item.lastOffset) <= OFFSET_EPSILON_PX
        ) {
            continue
        }

        read.item.lastOffset = offset
        read.item.media.style.transform = `translate3d(0, ${offset}px, 0)`
        changed = true
    }

    if (changed) engineActiveUntil = timestamp + ENGINE_KEEP_ALIVE_MS
    if (timestamp < engineActiveUntil && activeEngineItems.size > 0) {
        engineFrame = window.requestAnimationFrame(runEngineFrame)
    }
}

function wakeEngine() {
    if (!isBrowser() || !isPageVisible() || activeEngineItems.size === 0) {
        return
    }

    engineActiveUntil = Math.max(
        engineActiveUntil,
        performance.now() + ENGINE_KEEP_ALIVE_MS
    )
    if (engineFrame === 0) {
        engineFrame = window.requestAnimationFrame(runEngineFrame)
    }
}

function registerEngineItem(item: EngineItem) {
    engineItems.add(item)
    observeEngineGeometry(item)

    const observation = observeEffectiveIntersection(
        item.root,
        item.scrollRoot,
        ENGINE_MARGIN_PX,
        (active) => setItemActive(item, active)
    )
    item.visibilityCleanup = observation.cleanup
    item.visibilityRefresh = observation.refresh
    if (!observation.observed) fallbackActivityItems.add(item)

    updateRuntimeInfrastructure()
    synchronizeEngineItem(item)
}

function unregisterEngineItem(item: EngineItem) {
    if (!engineItems.has(item)) return

    item.visibilityCleanup?.()
    item.visibilityCleanup = null
    item.visibilityRefresh = null
    fallbackActivityItems.delete(item)
    activeEngineItems.delete(item)
    engineItems.delete(item)
    unobserveEngineGeometry(item)

    item.media.style.transform = ""
    item.media.style.willChange = ""

    if (activeEngineItems.size === 0 && engineFrame !== 0) {
        window.cancelAnimationFrame(engineFrame)
        engineFrame = 0
    }

    updateRuntimeInfrastructure()
}

// Hooks

function readReducedMotionPreference() {
    if (!isBrowser() || typeof window.matchMedia !== "function") return false
    if (!reducedMotionQuery) {
        reducedMotionQuery = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        )
    }
    return reducedMotionQuery.matches
}

function readReducedMotionDisabled() {
    return false
}

function readReducedMotionServerFallback() {
    // Static is the only hydration-safe default until the client subscribes.
    return true
}

function subscribeReducedMotionDisabled() {
    return () => {}
}

function subscribeReducedMotion(callback: () => void) {
    if (!isBrowser() || typeof window.matchMedia !== "function") {
        return () => {}
    }

    if (!reducedMotionQuery) {
        reducedMotionQuery = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        )
    }

    reducedMotionSubscribers.add(callback)
    if (reducedMotionSubscribers.size === 1) {
        reducedMotionHandler = () => {
            for (const subscriber of reducedMotionSubscribers) subscriber()
        }
        reducedMotionQuery.addEventListener("change", reducedMotionHandler)
    }

    return () => {
        reducedMotionSubscribers.delete(callback)
        if (reducedMotionSubscribers.size === 0 && reducedMotionHandler) {
            reducedMotionQuery?.removeEventListener(
                "change",
                reducedMotionHandler
            )
            reducedMotionHandler = null
        }
    }
}

function useReducedMotion(enabled: boolean) {
    const reduced = React.useSyncExternalStore(
        enabled ? subscribeReducedMotion : subscribeReducedMotionDisabled,
        enabled ? readReducedMotionPreference : readReducedMotionDisabled,
        enabled ? readReducedMotionServerFallback : readReducedMotionDisabled
    )

    return enabled && reduced
}

function decisionsEqual(a: MotionDecision, b: MotionDecision) {
    return (
        a.mode === b.mode &&
        a.scrollRoot === b.scrollRoot &&
        a.reason === b.reason
    )
}

function useMotionDecision(
    rootRef: React.RefObject<HTMLDivElement | null>,
    enabled: boolean,
    motionHazardKey: string
) {
    const [decision, setDecision] = React.useState<MotionDecision>({
        mode: "static",
        scrollRoot: null,
        reason: "disabled",
    })

    useBrowserLayoutEffect(() => {
        const update = () => {
            const next = resolveMotionDecision(rootRef.current, enabled)
            setPendingRange(update, next.reason === "no-scroll-range")
            setDecision((current) =>
                decisionsEqual(current, next) ? current : next
            )
        }

        update()
        if (!enabled) {
            setPendingRange(update, false)
            return
        }

        const unsubscribe = subscribeEnvironment(update)
        return () => {
            setPendingRange(update, false)
            unsubscribe()
        }
    }, [enabled, motionHazardKey])

    return decision
}

function useMotionGeometryWake(enabled: boolean, geometryKey: string) {
    useBrowserLayoutEffect(() => {
        // Incoming styles can change visibility without a resize or scroll.
        if (enabled) scheduleRuntimeAudit()
    }, [enabled, geometryKey])
}

function useParallaxEngine(
    rootRef: React.RefObject<HTMLDivElement | null>,
    mediaRef: React.RefObject<HTMLDivElement | null>,
    decision: MotionDecision,
    parallax: number,
    direction: Direction
) {
    useBrowserLayoutEffect(() => {
        const root = rootRef.current
        const media = mediaRef.current
        const scrollRoot = decision.scrollRoot

        if (
            decision.mode !== "javascript" ||
            !root ||
            !media ||
            !scrollRoot ||
            parallax <= 0
        ) {
            if (media) {
                media.style.transform = ""
                media.style.willChange = ""
            }
            return
        }

        const item: EngineItem = {
            root,
            media,
            scrollRoot,
            parallax,
            direction,
            active: false,
            lastOffset: null,
            visibilityCleanup: null,
            visibilityRefresh: null,
        }

        registerEngineItem(item)
        return () => unregisterEngineItem(item)
    }, [decision.mode, decision.scrollRoot, direction, parallax])
}

function usePosterStatus(imageKey: string, enabled: boolean) {
    const ref = React.useRef<HTMLImageElement>(null)
    const [state, setState] = React.useState<{
        key: string
        status: MediaStatus
    }>({ key: "", status: "idle" })

    useBrowserLayoutEffect(() => {
        if (!enabled || !imageKey) {
            setState((current) =>
                current.key === "" && current.status === "idle"
                    ? current
                    : { key: "", status: "idle" }
            )
            return
        }

        // Observe the rendered image instead of creating a second network probe.
        const image = ref.current
        setState((current) =>
            current.key === imageKey && current.status === "loading"
                ? current
                : { key: imageKey, status: "loading" }
        )
        if (!image) return

        let cancelled = false
        let settled = false
        let readinessStarted = false

        const publish = (status: MediaStatus) => {
            if (cancelled || settled) return
            settled = true
            setState({ key: imageKey, status })
        }

        const markReady = () => {
            if (readinessStarted || settled) return
            readinessStarted = true
            if (typeof image.decode === "function") {
                image.decode().then(
                    () => publish("ready"),
                    () => publish(image.naturalWidth > 0 ? "ready" : "error")
                )
            } else {
                publish(image.naturalWidth > 0 ? "ready" : "error")
            }
        }

        const markError = () => publish("error")
        image.addEventListener("load", markReady)
        image.addEventListener("error", markError)

        if (image.complete) {
            if (image.naturalWidth > 0) markReady()
            else publish("error")
        }

        return () => {
            cancelled = true
            image.removeEventListener("load", markReady)
            image.removeEventListener("error", markError)
        }
    }, [enabled, imageKey])

    const status: MediaStatus =
        enabled && imageKey
            ? state.key === imageKey
                ? state.status
                : "loading"
            : "idle"

    return { ref, status }
}

function useImageAspectRatio(
    ref: React.RefObject<HTMLImageElement | null>,
    imageKey: string,
    enabled: boolean
) {
    const [state, setState] = React.useState({
        key: "",
        ratio: DEFAULT_IMAGE_ASPECT_RATIO,
    })

    // Reuse the rendered poster so Fit Content adds no probe or request.
    useBrowserLayoutEffect(() => {
        const image = ref.current
        if (!enabled || !imageKey || !image) return

        let cancelled = false
        const publish = () => {
            if (
                cancelled ||
                image.naturalWidth <= 0 ||
                image.naturalHeight <= 0
            ) {
                return
            }

            const ratio = image.naturalWidth / image.naturalHeight
            if (!Number.isFinite(ratio) || ratio <= 0) return

            setState((current) =>
                current.key === imageKey && current.ratio === ratio
                    ? current
                    : { key: imageKey, ratio }
            )
        }

        image.addEventListener("load", publish)
        if (image.complete) publish()

        return () => {
            cancelled = true
            image.removeEventListener("load", publish)
        }
    }, [enabled, imageKey])

    return enabled && imageKey && state.key === imageKey
        ? state.ratio
        : DEFAULT_IMAGE_ASPECT_RATIO
}

function useViewportFlag(
    rootRef: React.RefObject<HTMLDivElement | null>,
    scrollRoot: ScrollRoot | null,
    enabled: boolean,
    margin: number
) {
    const [visible, setVisible] = React.useState(false)

    React.useEffect(() => {
        const root = rootRef.current
        if (!enabled || !root || !scrollRoot) {
            setVisible(false)
            return
        }

        const publish = (next: boolean) => setVisible(next)
        const observation = observeEffectiveIntersection(
            root,
            scrollRoot,
            margin,
            publish
        )

        if (!observation.observed) {
            setVisible(false)
            return observation.cleanup
        }

        const unsubscribe = subscribeVisibilityRefresh(observation.refresh)

        return () => {
            observation.cleanup()
            unsubscribe()
        }
    }, [enabled, margin, scrollRoot])

    return visible
}

function usePageLifecycle(enabled: boolean) {
    const [state, setState] = React.useState(() => ({
        visible: enabled && isPageVisible(),
        revision: pageLifecycleRevision,
    }))

    React.useEffect(() => {
        if (!enabled) {
            setState((current) =>
                current.visible
                    ? {
                          visible: false,
                          revision: current.revision,
                      }
                    : current
            )
            return
        }

        const update: PageLifecycleSubscriber = (visible, revision) => {
            setState({ visible, revision })
        }
        const visible = isPageVisible()
        const revision = pageLifecycleRevision
        setState((current) =>
            current.visible === visible && current.revision === revision
                ? current
                : { visible, revision }
        )
        return subscribePageLifecycle(update)
    }, [enabled])

    return {
        visible: enabled && state.visible,
        revision: state.revision,
    }
}

function releaseVideoResource(video: HTMLVideoElement) {
    try {
        video.pause()
        video.removeAttribute("src")
        video.load()
    } catch {
        // Resource release is best-effort during unmount.
    }
}

function useManagedVideoRef(sourceUrl: string) {
    const [video, setVideo] = React.useState<HTMLVideoElement | null>(null)
    const currentRef = React.useRef<HTMLVideoElement | null>(null)

    const ref = React.useCallback(
        (next: HTMLVideoElement | null) => {
            const current = currentRef.current
            if (current !== next) {
                if (current) {
                    managedVideoElements.delete(current)
                    releaseVideoResource(current)
                }

                currentRef.current = next
                if (next) managedVideoElements.add(next)
                setVideo(next)
            }

            if (next && sourceUrl && next.getAttribute("src") !== sourceUrl) {
                // Ref callbacks are replayed in modern Strict Mode. Restore
                // the declarative source after a simulated detachment.
                next.setAttribute("src", sourceUrl)
            }
        },
        [sourceUrl]
    )

    return { ref, video }
}

function useVideoStatus(videoKey: string, mounted: boolean) {
    const [state, setState] = React.useState<{
        key: string
        status: MediaStatus
    }>({ key: "", status: "idle" })

    useBrowserLayoutEffect(() => {
        const status = mounted && videoKey ? "loading" : "idle"
        setState((current) => {
            // An error is terminal for its source. Keep the latch while Lazy
            // unmounts the element so re-entering the load margin cannot retry
            // a failing URL. A different source key starts a fresh attempt.
            if (current.key === videoKey && current.status === "error") {
                return current
            }

            return current.key === videoKey && current.status === status
                ? current
                : { key: videoKey, status }
        })
    }, [mounted, videoKey])

    const publish = React.useCallback(
        (status: MediaStatus) => {
            if (!videoKey) return
            setState((current) => {
                if (current.key !== videoKey) return current
                if (current.status === "error") return current
                return current.status === status
                    ? current
                    : { key: videoKey, status }
            })
        },
        [videoKey]
    )

    let status: MediaStatus = "idle"
    if (videoKey) {
        if (state.key !== videoKey) {
            status = mounted ? "loading" : "idle"
        } else if (state.status === "error") {
            status = "error"
        } else if (mounted) {
            status = state.status
        }
    }

    return { status, publish }
}

function useVideoPlayback(
    video: HTMLVideoElement | null,
    shouldPlay: boolean,
    videoKey: string,
    lifecycleRevision: number,
    publishVideoStatus: (status: MediaStatus) => void
) {
    React.useEffect(() => {
        if (!video || !videoKey) return

        video.muted = true
        video.defaultMuted = true

        if (!shouldPlay || !isPageVisible()) {
            video.pause()
            return
        }

        let cancelled = false
        const reportBlockedPlayback = () => {
            if (!cancelled) publishVideoStatus("loading")
        }

        try {
            const result = video.play()
            if (result && typeof result.catch === "function") {
                result.catch(reportBlockedPlayback)
            }
        } catch {
            reportBlockedPlayback()
        }

        return () => {
            cancelled = true
            video.pause()
        }
    }, [lifecycleRevision, publishVideoStatus, shouldPlay, video, videoKey])
}

// Empty State

interface CanvasDiagnostic {
    title: string
    description: string
    tone: "plain" | "media"
}

type EmptyStateTextStyle = React.CSSProperties & { textWrap?: string }

const EMPTY_STATE_MARK_PATH =
    "M 3.692371 144.822939 C 3.014371 145.436939 2.607371 146.293939 2.561371 147.206939 L 0.004371 198.372939 C -0.090629 200.274939 1.374371 201.893939 3.275371 201.988939 L 168.985371 210.276939 C 169.173371 210.284939 169.361371 210.295939 169.548371 210.310939 C 169.924371 210.337939 170.297371 210.392939 170.664371 210.474939 C 174.339371 211.293939 176.686371 214.899939 175.945371 218.590939 C 175.907371 218.787939 175.864371 218.970939 175.820371 219.140939 C 175.769371 219.336939 175.717371 219.516939 175.666371 219.683939 L 128.141371 381.447939 C 127.605371 383.274939 128.650371 385.189939 130.476371 385.726939 L 179.629371 400.166939 C 181.455371 400.703939 183.371371 399.658939 183.908371 397.832939 L 233.332371 229.607939 C 233.386371 229.425939 233.443371 229.230939 233.510371 229.021939 C 233.635371 228.633939 233.783371 228.253939 233.954371 227.883939 C 235.469371 224.641939 238.864371 222.708939 242.425371 223.060939 C 242.830371 223.100939 243.232371 223.170939 243.628371 223.266939 C 243.840371 223.316939 244.036371 223.371939 244.219371 223.426939 C 244.428371 223.490939 244.620371 223.555939 244.800371 223.614939 L 363.814371 263.328939 C 369.266371 265.148939 373.675371 269.220939 375.920371 274.510939 L 401.012371 333.640939 C 401.369371 334.482939 402.046371 335.148939 402.894371 335.491939 C 403.742371 335.834939 404.691371 335.826939 405.533371 335.468939 L 452.692371 315.455939 C 453.534371 315.098939 454.200371 314.421939 454.542371 313.574939 C 454.885371 312.726939 454.877371 311.777939 454.519371 310.935939 L 429.426371 251.804939 C 420.670371 231.169939 403.477371 215.286939 382.213371 208.190939 L 275.927371 172.724939 C 275.775371 172.674939 275.610371 172.619939 275.434371 172.554939 C 275.107371 172.435939 274.790371 172.291939 274.486371 172.122939 C 271.772371 170.616939 270.694371 167.260939 272.025371 164.455939 C 272.251371 163.984939 272.534371 163.543939 272.867371 163.141939 C 272.984371 162.996939 273.098371 162.866939 273.205371 162.744939 L 359.224371 63.887939 C 360.474371 62.451939 360.323371 60.274939 358.886371 59.024939 L 320.238371 25.394939 C 318.802371 24.145939 316.624371 24.296939 315.374371 25.732939 L 231.281371 122.376939 C 231.178371 122.494939 231.069371 122.620939 230.946371 122.752939 C 230.717371 122.999939 230.470371 123.227939 230.206371 123.436939 C 227.837371 125.294939 224.415371 124.910939 222.516371 122.573939 C 222.199371 122.180939 221.934371 121.749939 221.725371 121.289939 C 221.655371 121.136939 221.587371 120.982939 221.522371 120.826939 L 171.139371 2.100939 C 170.395371 0.348939 168.372371 -0.468061 166.619371 0.273939 L 119.459371 20.287939 C 117.707371 21.032939 116.890371 23.055939 117.632371 24.807939 L 168.058371 143.633939 C 168.119371 143.777939 168.184371 143.931939 168.249371 144.100939 C 168.372371 144.414939 168.469371 144.736939 168.540371 145.065939 C 169.175371 148.012939 167.333371 150.925939 164.398371 151.614939 C 164.070371 151.690939 163.736371 151.738939 163.399371 151.757939 C 163.220371 151.767939 163.051371 151.769939 162.895371 151.767939 C 162.727371 151.763939 162.559371 151.756939 162.390371 151.747939 L 6.177371 143.934939 C 5.264371 143.888939 4.370371 144.207939 3.692371 144.821939 Z"

const EMPTY_STATE_ROOT_STYLE: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    zIndex: 2,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxSizing: "border-box",
    padding: 24,
    background: "rgba(127, 84, 255, 0.1)",
    fontFamily:
        "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    textAlign: "center",
    pointerEvents: "none",
}

const EMPTY_STATE_INNER_STYLE: React.CSSProperties = {
    width: "100%",
    maxWidth: 245,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
}

const EMPTY_STATE_LOGO_STYLE: React.CSSProperties = {
    display: "block",
    width: 44,
    height: 39,
    margin: "0 0 14px",
    filter: "drop-shadow(0 8px 14px rgba(0, 0, 0, 0.18))",
}

const EMPTY_STATE_TITLE_STYLE: EmptyStateTextStyle = {
    margin: "0 0 10px",
    fontSize: 11,
    lineHeight: "1em",
    letterSpacing: "-0.015em",
    fontWeight: 650,
    color: "#946AF8",
    textWrap: "balance",
}

const EMPTY_STATE_TEXT_STYLE: EmptyStateTextStyle = {
    margin: 0,
    fontSize: 11,
    lineHeight: "1.55em",
    letterSpacing: "-0.02em",
    fontWeight: 450,
    color: "#7253BB",
    textWrap: "balance",
}

const EMPTY_STATE_MEDIA_OVERLAY_STYLE: React.CSSProperties = {
    background: "rgba(242, 238, 255, 0.88)",
}

function resolveCanvasDiagnostic(
    config: ResolvedConfig,
    posterStatus: MediaStatus
): CanvasDiagnostic | null {
    if (!config.image.src) {
        return {
            title: "Add an Image",
            description:
                config.mode === "video"
                    ? "Choose an image in the Image field to use as the poster."
                    : "Choose an image in the Image field.",
            tone: "plain",
        }
    }

    if (posterStatus === "error") {
        return {
            title: "Image Couldn’t Load",
            description: "Choose another image in the Image field.",
            tone: "plain",
        }
    }

    if (config.mode !== "video" || !config.autoplay) return null

    const rawSource = config.source === "file" ? config.file : config.url
    if (!rawSource.trim()) {
        return {
            title: config.source === "file" ? "Add a Video" : "Add a Video URL",
            description:
                config.source === "file"
                    ? "Upload an MP4 or WebM in the Video field."
                    : "Paste a video source into the Video URL field.",
            tone: "media",
        }
    }

    if (config.source === "url" && !resolveExternalVideoUrl(config.url)) {
        return {
            title: "Check the Video URL",
            description:
                "Use a direct HTTPS MP4 or WebM from Framer, Cloudinary, Mux, or Supabase.",
            tone: "media",
        }
    }

    return null
}

function SetupEmptyState({ diagnostic }: { diagnostic: CanvasDiagnostic }) {
    const overMedia = diagnostic.tone === "media"

    return (
        <div
            aria-hidden="true"
            style={
                overMedia
                    ? {
                          ...EMPTY_STATE_ROOT_STYLE,
                          ...EMPTY_STATE_MEDIA_OVERLAY_STYLE,
                      }
                    : EMPTY_STATE_ROOT_STYLE
            }
        >
            <div style={EMPTY_STATE_INNER_STYLE}>
                <svg
                    width="44"
                    height="39"
                    viewBox="0 0 454.794 400.308"
                    fill="none"
                    overflow="visible"
                    focusable="false"
                    preserveAspectRatio="xMidYMid meet"
                    style={EMPTY_STATE_LOGO_STYLE}
                >
                    <path d={EMPTY_STATE_MARK_PATH} fill="#FFFFFF" />
                </svg>
                <div style={EMPTY_STATE_TITLE_STYLE}>{diagnostic.title}</div>
                <div style={EMPTY_STATE_TEXT_STYLE}>
                    {diagnostic.description}
                </div>
            </div>
        </div>
    )
}

// Component

/**
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 300
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerDisableUnlink
 */
export default function BetterParallaxV3(props: BetterParallaxProps) {
    const config = resolveConfig(props)
    const rootRef = React.useRef<HTMLDivElement>(null)
    const mediaRef = React.useRef<HTMLDivElement>(null)

    const isStaticRenderer = useIsStaticRenderer()
    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const canRunLive = !isStaticRenderer && !isCanvas
    const reducedMotion = useReducedMotion(canRunLive)

    const imageKey = getImageKey(config.image)
    const poster = usePosterStatus(imageKey, isCanvas)
    const fitsImageWidth = usesIntrinsicSize(props.style?.width)
    const fitsImageHeight = usesIntrinsicSize(props.style?.height)
    const imageAspectRatio = useImageAspectRatio(
        poster.ref,
        imageKey,
        fitsImageHeight
    )
    const videoSource = React.useMemo(
        () => resolveVideoSource(config),
        [config.file, config.source, config.url]
    )
    const componentState = resolveComponentState(
        config,
        isStaticRenderer,
        isCanvas,
        reducedMotion,
        imageKey,
        videoSource
    )
    const intrinsicGeometryKey = fitsImageHeight
        ? `|intrinsic-ratio:${imageAspectRatio}`
        : ""
    const motionHazardKey =
        getMotionHazardKey(props.style) + intrinsicGeometryKey
    const motionGeometryKey =
        getMotionGeometryKey(props.style) + intrinsicGeometryKey

    const decision = useMotionDecision(
        rootRef,
        componentState.shouldResolveEnvironment,
        motionHazardKey
    )
    useMotionGeometryWake(
        componentState.shouldResolveEnvironment,
        motionGeometryKey
    )
    const hasMotion =
        componentState.isLiveRuntime &&
        config.parallax > 0 &&
        decision.mode !== "static"
    const usesNativeMotion = hasMotion && decision.mode === "native"

    useBrowserLayoutEffect(() => {
        if (usesNativeMotion) ensureNativeStyles()
    }, [usesNativeMotion])

    useParallaxEngine(
        rootRef,
        mediaRef,
        decision,
        hasMotion ? config.parallax : 0,
        config.direction
    )

    // Lazy mounting stays reversible: the near-viewport metadata hint stages
    // only nearby sources, while leaving the margin releases the video resource.
    const lazyNearViewport = useViewportFlag(
        rootRef,
        decision.scrollRoot,
        componentState.canAutoplayVideo && config.loading === "lazy",
        VIDEO_LOAD_MARGIN_PX
    )
    const shouldMountVideo =
        componentState.canAutoplayVideo &&
        (config.loading === "eager" || lazyNearViewport)
    const videoInViewport = useViewportFlag(
        rootRef,
        decision.scrollRoot,
        shouldMountVideo,
        0
    )
    const pageLifecycle = usePageLifecycle(componentState.canAutoplayVideo)
    const managedVideo = useManagedVideoRef(videoSource?.url || "")
    const videoState = useVideoStatus(videoSource?.key || "", shouldMountVideo)

    useVideoPlayback(
        managedVideo.video,
        shouldMountVideo &&
            videoInViewport &&
            pageLifecycle.visible &&
            videoState.status !== "error",
        videoSource?.key || "",
        pageLifecycle.revision,
        videoState.publish
    )

    const visualReserve = hasMotion
        ? getVisualReservePercent(config.parallax)
        : 0
    const overscan = hasMotion ? config.parallax + visualReserve : 0
    const mediaTop = `${-overscan}%`
    const mediaHeight = `${100 + 2 * overscan}%`

    const nativeRootStyle: NativeTimelineStyle = usesNativeMotion
        ? {
              viewTimelineName: TIMELINE_NAME,
              viewTimelineAxis: "block",
          }
        : {}
    const nativeMediaStyle: NativeTimelineStyle = usesNativeMotion
        ? {
              animationName:
                  config.direction === "up"
                      ? NATIVE_UP_ANIMATION
                      : NATIVE_DOWN_ANIMATION,
              animationDuration: "1ms",
              animationTimingFunction: "linear",
              animationFillMode: "both",
              animationTimeline: TIMELINE_NAME,
              animationRange: "entry 0% exit 100%",
          }
        : {}
    const nativeVariables = usesNativeMotion
        ? ({
              "--mash-parallax-positive": getNativeShift(
                  config.parallax,
                  visualReserve,
                  true
              ),
              "--mash-parallax-negative": getNativeShift(
                  config.parallax,
                  visualReserve,
                  false
              ),
          } as React.CSSProperties)
        : {}

    const alt = config.image.alt || ""
    const imagePosition = [
        config.image.positionX || DEFAULT_IMAGE_POSITION,
        config.image.positionY || DEFAULT_IMAGE_POSITION,
    ].join(" ")
    const rootAccessibility:
        | Pick<React.HTMLAttributes<HTMLDivElement>, "role" | "aria-label">
        | Record<string, never> =
        config.mode === "video" && alt ? { role: "img", "aria-label": alt } : {}

    const diagnostic = isCanvas
        ? resolveCanvasDiagnostic(config, poster.status)
        : null

    return (
        <div
            ref={rootRef}
            {...rootAccessibility}
            data-mash-parallax="v3"
            data-motion={hasMotion ? decision.mode : "static"}
            style={{
                ...props.style,
                ...nativeRootStyle,
                position: "relative",
                width: fitsImageWidth
                    ? DEFAULT_INTRINSIC_WIDTH
                    : props.style?.width,
                height: fitsImageHeight ? "auto" : props.style?.height,
                ...(fitsImageHeight ? { aspectRatio: imageAspectRatio } : {}),
                minWidth: 0,
                minHeight: 0,
                overflow: "hidden",
                boxSizing: "border-box",
                contain: "paint",
                pointerEvents: "none",
                ...(config.radius > 0 ? { borderRadius: config.radius } : {}),
            }}
        >
            {componentState.hasImage && (
                <div
                    ref={mediaRef}
                    aria-hidden={config.mode === "video" || undefined}
                    style={{
                        position: "absolute",
                        zIndex: 0,
                        left: 0,
                        top: mediaTop,
                        width: "100%",
                        height: mediaHeight,
                        backfaceVisibility: "hidden",
                        ...nativeVariables,
                        ...nativeMediaStyle,
                    }}
                >
                    <img
                        key={imageKey}
                        ref={poster.ref}
                        src={config.image.src}
                        srcSet={config.image.srcSet || undefined}
                        sizes={config.image.sizes || undefined}
                        alt={config.mode === "image" ? alt : ""}
                        aria-hidden={config.mode === "video" || undefined}
                        loading={config.loading}
                        decoding="async"
                        draggable={false}
                        style={{
                            position: "absolute",
                            inset: 0,
                            width: "100%",
                            height: "100%",
                            display: "block",
                            objectFit: "cover",
                            objectPosition: imagePosition,
                            userSelect: "none",
                        }}
                    />

                    {shouldMountVideo &&
                        videoSource &&
                        videoState.status !== "error" && (
                            <video
                                key={videoSource.key}
                                ref={managedVideo.ref}
                                src={videoSource.url}
                                muted
                                loop
                                playsInline
                                autoPlay={false}
                                preload={
                                    config.loading === "eager"
                                        ? "auto"
                                        : "metadata"
                                }
                                controls={false}
                                controlsList="nodownload noplaybackrate nofullscreen"
                                disablePictureInPicture
                                disableRemotePlayback
                                aria-hidden="true"
                                tabIndex={-1}
                                onPlaying={() => videoState.publish("ready")}
                                onError={() => videoState.publish("error")}
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    width: "100%",
                                    height: "100%",
                                    display: "block",
                                    objectFit: "cover",
                                    objectPosition: imagePosition,
                                    opacity:
                                        videoState.status === "ready" ? 1 : 0,
                                    transition: "opacity 120ms linear",
                                }}
                            />
                        )}
                </div>
            )}

            {diagnostic && <SetupEmptyState diagnostic={diagnostic} />}
        </div>
    )
}

// Controls

BetterParallaxV3.displayName = "Better Parallax"

addPropertyControls(BetterParallaxV3, {
    mode: {
        type: ControlType.Enum,
        title: "Mode",
        options: ["image", "video"],
        optionTitles: ["Image", "Video"],
        displaySegmentedControl: true,
        defaultValue: DEFAULT_MODE,
    },
    image: {
        type: ControlType.ResponsiveImage,
        title: "Image",
    },
    source: {
        type: ControlType.Enum,
        title: "Source",
        options: ["file", "url"],
        optionTitles: ["File", "URL"],
        displaySegmentedControl: true,
        defaultValue: DEFAULT_SOURCE,
        hidden: (props: BetterParallaxProps) =>
            normalizeMode(props.mode) !== "video",
    },
    file: {
        type: ControlType.File,
        title: "Video",
        allowedFileTypes: ALLOWED_FILE_EXTENSIONS,
        hidden: (props: BetterParallaxProps) =>
            normalizeMode(props.mode) !== "video" ||
            normalizeSource(props.source) !== "file",
    },
    url: {
        type: ControlType.String,
        title: "Video URL",
        defaultValue: "",
        placeholder: "https://…/video.mp4",
        preventLocalization: true,
        description:
            "Direct HTTPS MP4/WebM from Framer, Cloudinary, Mux, or Supabase.",
        hidden: (props: BetterParallaxProps) =>
            normalizeMode(props.mode) !== "video" ||
            normalizeSource(props.source) !== "url",
    },
    autoplay: {
        type: ControlType.Boolean,
        title: "Autoplay",
        defaultValue: DEFAULT_AUTOPLAY,
        description: "Off shows the Image poster only.",
        hidden: (props: BetterParallaxProps) =>
            normalizeMode(props.mode) !== "video",
    },
    parallax: {
        type: ControlType.Number,
        title: "Parallax",
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
        defaultValue: DEFAULT_PARALLAX,
    },
    direction: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["down", "up"],
        optionTitles: ["Down", "Up"],
        displaySegmentedControl: true,
        defaultValue: DEFAULT_DIRECTION,
        hidden: (props: BetterParallaxProps) =>
            clamp(
                typeof props.parallax === "number"
                    ? props.parallax
                    : DEFAULT_PARALLAX,
                0,
                100
            ) === 0,
    },
    loading: {
        type: ControlType.Enum,
        title: "Loading",
        options: ["lazy", "eager"],
        optionTitles: ["Lazy", "Eager"],
        displaySegmentedControl: true,
        defaultValue: DEFAULT_LOADING,
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        step: 1,
        unit: "px",
        displayStepper: true,
        defaultValue: DEFAULT_RADIUS,
        description: MASH_COMPONENT_CREDIT,
    },
})
