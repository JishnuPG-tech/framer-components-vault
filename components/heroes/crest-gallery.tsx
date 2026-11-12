// @ts-nocheck
// Crest — Framer code component. Generated file: edit the sources, not this.
// Install: Framer → Assets → Code → New file → paste this whole file.

// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useEffect, useRef } from "react"
//#region ../core/src/disposer.ts
/**
 * Collects cleanup callbacks and runs them once, in reverse order of
 * registration (last acquired, first released).
 */
var Disposer = class {
    cleanups = []
    add(cleanup) {
        this.cleanups.push(cleanup)
    }
    /** `addEventListener` that is automatically removed on dispose. */
    listen(target, type, listener, options) {
        target.addEventListener(type, listener, options)
        this.add(() => target.removeEventListener(type, listener, options))
    }
    dispose() {
        const cleanups = this.cleanups.splice(0).reverse()
        for (const cleanup of cleanups)
            try {
                cleanup()
            } catch (error) {
                console.error("[webgl-effects] Cleanup failed:", error)
            }
    }
}
//#endregion
//#region ../core/src/schema.ts
/**
 * Identity helper that preserves literal types (select choices, keys) so
 * `OptionValues<typeof schema>` is precise.
 */
function defineOptions(schema) {
    return schema
}
var HEX_COLOR = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i
var RGB_COLOR =
    /^rgba?\(\s*(\d+(?:\.\d+)?)[\s,]+(\d+(?:\.\d+)?)[\s,]+(\d+(?:\.\d+)?)(?:\s*[,/]\s*(\d*\.?\d+)(%?))?\s*\)$/i
/**
 * Normalizes a hex or rgb()/rgba() color to lowercase hex (#rrggbb, or
 * #rrggbbaa when translucent). Returns `undefined` for anything else.
 */
function normalizeColor(value) {
    if (typeof value !== "string") return void 0
    const s = value.trim()
    if (HEX_COLOR.test(s)) return s.toLowerCase()
    const m = RGB_COLOR.exec(s)
    if (!m) return void 0
    const hex = (n) =>
        Math.round(Math.min(255, Math.max(0, n)))
            .toString(16)
            .padStart(2, "0")
    const rgb = `#${hex(Number(m[1]))}${hex(Number(m[2]))}${hex(Number(m[3]))}`
    if (m[4] === void 0) return rgb
    const alpha = Number(m[4]) / (m[5] ? 100 : 1)
    return alpha >= 1 ? rgb : rgb + hex(alpha * 255)
}
/**
 * Converts a raw value (typed, or a string coming from a data-attribute or a
 * CMS field) into a valid value for `def`. Returns `undefined` when the value
 * cannot be used.
 */
function coerceOption(def, raw) {
    switch (def.type) {
        case "number": {
            const n =
                typeof raw === "number"
                    ? raw
                    : typeof raw === "string" && raw.trim() !== ""
                      ? Number(raw)
                      : NaN
            return Number.isFinite(n)
                ? Math.min(def.max, Math.max(def.min, n))
                : void 0
        }
        case "boolean": {
            if (typeof raw === "boolean") return raw
            if (typeof raw !== "string") return void 0
            const s = raw.trim().toLowerCase()
            if (s === "" || s === "true" || s === "1") return true
            if (s === "false" || s === "0") return false
            return
        }
        case "color":
            return normalizeColor(raw)
        case "colors": {
            const list = Array.isArray(raw)
                ? raw
                : typeof raw === "string"
                  ? raw.split(",")
                  : null
            if (!list) return void 0
            const colors = list.map(normalizeColor).filter((c) => c !== void 0)
            if (colors.length < (def.minItems ?? 1)) return void 0
            return def.maxItems === void 0
                ? colors
                : colors.slice(0, def.maxItems)
        }
        case "select":
            return typeof raw === "string" && def.choices.includes(raw)
                ? raw
                : void 0
        case "image":
            return typeof raw === "string" ? raw.trim() : void 0
    }
}
function cloneValue(value) {
    return Array.isArray(value) ? [...value] : value
}
/**
 * Resolves the full set of values for `schema`: valid entries from `input`
 * win, then `base` (the current values, when updating), then defaults.
 * Invalid input is reported with a console warning and ignored. Keys not in
 * the schema are ignored.
 */
function resolveOptions(schema, input, base) {
    const out = {}
    for (const [key, def] of Object.entries(schema)) {
        const raw = input?.[key]
        let value
        if (raw !== void 0) {
            value = coerceOption(def, raw)
            if (value === void 0)
                console.warn(
                    `[webgl-effects] Ignoring invalid value for "${key}" (${def.type}):`,
                    raw
                )
        }
        out[key] =
            value !== void 0
                ? value
                : cloneValue(base ? base[key] : def.default)
    }
    return out
}
function sameValue(a, b) {
    if (Array.isArray(a) && Array.isArray(b))
        return a.length === b.length && a.every((v, i) => v === b[i])
    return Object.is(a, b)
}
/** Keys whose values differ between two resolved value sets. */
function changedKeys(prev, next) {
    return Object.keys(next).filter((key) => !sameValue(prev[key], next[key]))
}
//#endregion
//#region ../core/src/webgl.ts
var cachedSupport
/** Whether this browser can create a WebGL (2 or 1) context. Cached. */
function isWebGLAvailable() {
    if (cachedSupport !== void 0) return cachedSupport
    try {
        const canvas = document.createElement("canvas")
        const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl")
        cachedSupport = gl !== null
        gl?.getExtension("WEBGL_lose_context")?.loseContext()
    } catch {
        cachedSupport = false
    }
    return cachedSupport
}
//#endregion
//#region ../core/src/pin.ts
/** Marks the element to pin, overriding `findPinTarget()`'s guess. */
var PIN_ATTRIBUTE = "data-fx-pin"
/**
 * The element to hold on screen: the closest `[data-fx-pin]`, or else the
 * largest ancestor that still fits on screen (the Framer or Webflow section
 * around the anchor), moving further up while a fixed-height parent would
 * swallow the extra scroll distance instead of pushing the next section down.
 */
function findPinTarget(anchor) {
    const marked = anchor.closest(`[${PIN_ATTRIBUTE}]`)
    if (marked) return marked
    const fits = Math.max(window.innerHeight, anchor.offsetHeight) * 1.25
    let target = anchor
    for (
        let el = anchor.parentElement;
        el && el !== document.body;
        el = el.parentElement
    ) {
        if (boxless(el)) continue
        if (el.offsetHeight > fits) break
        target = el
    }
    for (let el = target; el && el !== document.body; el = el.parentElement)
        if (!boxless(el) && pushesPage(el)) return el
    return target
}
/**
 * `display: contents` wrappers (Framer's Preview has them around the page)
 * have no box: zero height, and neither margins nor sticky apply to them.
 */
function boxless(el) {
    return getComputedStyle(el).display === "contents"
}
/** Whether a bottom margin on `el` makes the page taller (no fixed-height ancestor absorbs it). */
function pushesPage(el) {
    const page = document.scrollingElement ?? document.documentElement
    const { marginBottom } = el.style
    const margin = parseFloat(getComputedStyle(el).marginBottom) || 0
    el.style.marginBottom = `${margin + 1e3}px`
    const before = page.scrollHeight
    el.style.marginBottom = `${margin + 2e3}px`
    const grown = page.scrollHeight - before
    el.style.marginBottom = marginBottom
    return grown > 900
}
/**
 * Holds a section on screen while the page scrolls a given distance past it,
 * like GSAP's pin. A spacer as tall as the distance goes right after the
 * section, so the content after it waits. While pinned the section is `position: sticky`,
 * which the browser moves in step with the scroll; afterwards it stays at the
 * end of the distance, offset with `position: relative` (or `translate` when
 * its stylesheet already offsets it). Parents with
 * `overflow: hidden` would stop sticky, so they get `overflow: clip`, which
 * looks the same. Where that is not possible the section follows the scroll
 * with `translate` alone, which can lag a frame behind it.
 */
var ScrollPin = class {
    anchor
    onLayout
    target
    probe = document.createElement("div")
    spacer = document.createElement("div")
    /** A flex or grid parent adds its gap once more around the spacer. */
    gap
    original
    cleanups = []
    sticky
    /**
     * Whether the end of the pin can use `top`. A `translate` there draws the section as its own
     * layer; on a scaled screen (Framer's Preview, 125% zoom) its edge can then miss the next
     * section's by a fraction of a pixel and let the page background show through as a line.
     */
    endWithTop
    distance = -1
    measured = false
    /** Scroll position where the pin starts. */
    start = 0
    /** Viewport top of the section while pinned. */
    pinnedTop = 0
    applied = ""
    /**
     * Scrolling back up past the end, the switch back to sticky lands a frame
     * after the browser has scrolled, which would show a gap above the section
     * (GSAP's anticipatePin). It re-pins this far early, then settles.
     */
    lead = 0
    lastScroll = 0
    settle = 0
    /**
     * CSS px the section sits off its pinned place on screen: negative while it
     * is still coming up (before the pin), positive once it has scrolled on
     * past it, 0 while held.
     */
    outside = 0
    /**
     * `anchor` is centered on screen while pinned (top-aligned when taller than
     * the screen). `onLayout` is called when the page layout changes.
     */
    constructor(anchor, onLayout) {
        this.anchor = anchor
        this.onLayout = onLayout
        const target = findPinTarget(anchor)
        this.target = target
        const { position, top, translate } = target.style
        this.original = {
            position,
            top,
            translate,
        }
        this.sticky = this.unclipAncestors()
        const computed = getComputedStyle(target)
        this.endWithTop =
            !top &&
            (computed.position === "static" ||
                computed.top === "auto" ||
                computed.top === "0px")
        const parent = target.parentElement
        this.gap = parent ? parseFloat(getComputedStyle(parent).rowGap) || 0 : 0
        this.spacer.setAttribute("aria-hidden", "true")
        Object.assign(this.spacer.style, {
            flex: "none",
            width: "0",
            margin: "0",
            padding: "0",
        })
        target.after(this.spacer)
        Object.assign(this.probe.style, {
            position: "absolute",
            top: "0",
            width: "0",
            height: "100vh",
            visibility: "hidden",
        })
        this.probe.style.height = "100lvh"
        this.probe.setAttribute("aria-hidden", "true")
        document.body.append(this.probe)
        const relayout = () => {
            this.measured = false
            onLayout()
        }
        const observer = new ResizeObserver(relayout)
        observer.observe(document.documentElement)
        window.addEventListener("resize", relayout)
        this.cleanups.push(() => {
            clearTimeout(this.settle)
            observer.disconnect()
            window.removeEventListener("resize", relayout)
            Object.assign(target.style, this.original)
            this.spacer.remove()
            this.probe.remove()
        })
    }
    /** Applies the pin for the current scroll position; returns the progress through it, 0..1. */
    update(screens) {
        const distance = Math.round(screens * this.probe.offsetHeight)
        if (distance !== this.distance) {
            this.distance = distance
            this.spacer.style.height = `${Math.max(0, distance - this.gap)}px`
            this.measured = false
        }
        if (!this.measured) this.measure()
        const scrollY = window.scrollY
        if (scrollY !== this.lastScroll) {
            this.lead =
                scrollY < this.lastScroll
                    ? Math.min(
                          this.probe.offsetHeight,
                          (this.lastScroll - scrollY) * 2
                      )
                    : 0
            this.lastScroll = scrollY
            clearTimeout(this.settle)
            this.settle = window.setTimeout(() => {
                this.lead = 0
                this.onLayout()
            }, 150)
        }
        const into = scrollY - this.start
        const shift = Math.min(distance, Math.max(0, into))
        if (this.sticky) {
            const held = into <= distance + this.lead
            if (held)
                this.apply(
                    "sticky",
                    `${this.pinnedTop}px`,
                    this.original.translate
                )
            else if (this.endWithTop)
                this.apply("relative", `${distance}px`, this.original.translate)
            else
                this.apply(
                    this.original.position,
                    this.original.top,
                    `0 ${distance}px`
                )
            this.outside = into < 0 ? into : held ? 0 : into - distance
        } else {
            this.apply(
                this.original.position,
                this.original.top,
                `0 ${shift}px`
            )
            this.outside = into - shift
        }
        return distance > 0 ? shift / distance : 0
    }
    /** CSS px of scrolling the section stays pinned for. */
    get length() {
        return Math.max(0, this.distance)
    }
    scrollTo(progress) {
        window.scrollTo({
            top: this.start + progress * Math.max(0, this.distance),
            behavior: "smooth",
        })
    }
    dispose() {
        for (const cleanup of this.cleanups.splice(0).reverse()) cleanup()
    }
    /** Where the pin starts, measured with the section in its normal place. */
    measure() {
        const style = this.target.style
        const { position, top, translate } = style
        Object.assign(style, {
            position: this.original.position,
            top: this.original.top,
            translate: this.original.translate,
        })
        const sectionTop =
            this.target.getBoundingClientRect().top + window.scrollY
        const anchor = this.anchor.getBoundingClientRect()
        const offset = anchor.top + window.scrollY - sectionTop
        const centered = Math.max(0, (window.innerHeight - anchor.height) / 2)
        this.start = Math.max(0, sectionTop - (centered - offset))
        this.pinnedTop = sectionTop - this.start
        Object.assign(style, {
            position,
            top,
            translate,
        })
        this.measured = true
        this.applied = ""
    }
    apply(position, top, translate) {
        const key = `${position}|${top}|${translate}`
        if (key === this.applied) return
        this.applied = key
        Object.assign(this.target.style, {
            position,
            top,
            translate,
        })
    }
    /** Switches parents from `overflow: hidden` to `clip`; false when sticky cannot work anyway. */
    unclipAncestors() {
        const position = getComputedStyle(this.target).position
        if (
            position === "absolute" ||
            position === "fixed" ||
            !CSS.supports("overflow", "clip")
        )
            return false
        const changes = []
        for (
            let el = this.target.parentElement;
            el && el !== document.body;
            el = el.parentElement
        ) {
            const { overflowX, overflowY } = getComputedStyle(el)
            if (overflowX === "visible" && overflowY === "visible") continue
            const next = (own, other, scrolls) =>
                own === "hidden"
                    ? "clip"
                    : own === "auto" && other === "hidden" && !scrolls
                      ? "visible"
                      : own
            const x = next(
                overflowX,
                overflowY,
                el.scrollWidth > el.clientWidth + 1
            )
            const y = next(
                overflowY,
                overflowX,
                el.scrollHeight > el.clientHeight + 1
            )
            if (
                x === "auto" ||
                x === "scroll" ||
                y === "auto" ||
                y === "scroll"
            )
                return false
            changes.push([el, x, y])
        }
        for (const [el, x, y] of changes) {
            const { overflowX, overflowY } = el.style
            Object.assign(el.style, {
                overflowX: x,
                overflowY: y,
            })
            this.cleanups.push(() =>
                Object.assign(el.style, {
                    overflowX,
                    overflowY,
                })
            )
        }
        return true
    }
}
//#endregion
//#region ../core/src/effect.ts
/** Options every effect gets for free, merged into its own schema. */
var commonOptions = defineOptions({
    maxDpr: {
        type: "number",
        label: "Max pixel ratio",
        description:
            "Caps devicePixelRatio. Lower it to trade sharpness for speed.",
        default: 2,
        min: 0.5,
        max: 2,
        step: 0.25,
        group: "Performance",
    },
    reducedMotion: {
        type: "select",
        label: "Reduced motion",
        description:
            '"auto" follows the visitor\'s prefers-reduced-motion setting.',
        default: "auto",
        choices: ["auto", "always", "never"],
        group: "Accessibility",
    },
    fallbackImage: {
        type: "image",
        label: "Fallback image",
        description: "Shown when WebGL is unavailable.",
        default: "",
        group: "Fallback",
    },
})
var MAX_DELTA = 0.1
/** Window placement: canvas height as a share of the viewport. The extra covers fast scrolling between frames. */
var WINDOW_HEIGHT = 130
/**
 * Base class for every effect. Owns the canvas and everything that is the
 * same across effects: render loop, sizing (ResizeObserver, DPR cap),
 * pausing when off-screen or in a hidden tab, prefers-reduced-motion,
 * WebGL fallback, context loss and cleanup.
 *
 * Subclasses are renderer-agnostic (three.js, OGL or raw WebGL) and
 * implement:
 * - `setup()`  create the renderer/scene on `ctx.canvas`. Register every
 *              cleanup with `this.scope` so it is released on destroy (and
 *              on context loss, after which `setup()` runs again).
 * - `render()` draw one frame from `this.options` and `frame`.
 * - `resize()` (optional) react to a new size. The canvas buffer is already
 *              resized when it is called.
 * - `optionsChanged()` (optional) push changed options into uniforms etc.
 *              A redraw is requested automatically afterwards.
 */
var Effect = class {
    schema
    options
    container = null
    canvas = null
    size = {
        width: 0,
        height: 0,
        dpr: 1,
    }
    /**
     * Cleanups for whatever `setup()` created. Disposed on destroy and on
     * context loss.
     */
    scope = new Disposer()
    /**
     * What reduced motion means for this effect:
     * - 'static':  render a still frame, only redraw on resize/option changes.
     * - 'animate': keep the loop running; `frame.reducedMotion` is true and the
     *              effect must tone movement down itself.
     */
    reducedMotionStrategy = "static"
    /** How the canvas sits in the container. Called once, on mount, after options are resolved. */
    canvasPlacement() {
        return "fill"
    }
    placement = "fill"
    /** 'pin' placement: screen heights of scrolling the section stays pinned for. */
    pinLength() {
        return 1
    }
    pin = null
    pinned = 0
    /**
     * Viewport position (CSS px) of the canvas' top-left corner, updated before
     * every `render()` in 'window' placement.
     */
    viewportOrigin = {
        x: 0,
        y: 0,
    }
    /**
     * 'window' placement: viewport px per canvas CSS px. Not 1 when an ancestor
     * is scaled with a transform (zooming Framer's canvas): divide viewport
     * measurements by it to draw them.
     */
    viewportScale = 1
    state = "idle"
    /** Mount-lifetime listeners and observers. */
    lifetime = new Disposer()
    fallbackEl = null
    restoreContainerStyle = null
    rafId = 0
    lastTimestamp = null
    elapsed = 0
    frames = 0
    needsRender = false
    inView = true
    pageVisible = true
    userPaused = false
    prefersReducedMotion = false
    /** Between webglcontextlost and webglcontextrestored. */
    contextLost = false
    constructor(schema) {
        const full = { ...schema }
        for (const [key, def] of Object.entries(commonOptions))
            if (!(key in full)) full[key] = def
        this.schema = full
        this.options = resolveOptions(this.schema)
    }
    resize(_size) {}
    optionsChanged(_changed, _previous) {}
    /**
     * Fallback element shown when WebGL is unavailable or setup fails.
     * Default: `fallbackImage` as a cover background, or nothing. Override
     * to provide a CSS approximation of the effect.
     */
    createFallback() {
        const url = this.common.fallbackImage
        if (!url) return null
        const el = document.createElement("div")
        el.style.backgroundImage = `url(${JSON.stringify(url)})`
        el.style.backgroundSize = "cover"
        el.style.backgroundPosition = "center"
        return el
    }
    get status() {
        return this.state
    }
    /** Number of frames rendered so far. */
    get frameCount() {
        return this.frames
    }
    /** Whether the loop is currently animating (vs. idle / on-demand only). */
    get isAnimating() {
        return this.shouldAnimate()
    }
    getOptions() {
        return resolveOptions(this.schema, void 0, this.options)
    }
    /**
     * Attaches the effect to `container` and starts it. The canvas fills the
     * container and sits behind its content. Resolves once setup finished (or
     * the fallback is showing). An instance can be mounted only once.
     */
    async mount(container, options = {}) {
        if (this.state !== "idle")
            throw new Error(
                `[webgl-effects] mount() called on a ${this.state} effect`
            )
        this.state = "mounting"
        this.container = container
        this.options = resolveOptions(this.schema, options, this.options)
        this.prepareContainer(container)
        if (!isWebGLAvailable()) {
            this.showFallback()
            return this
        }
        const canvas = document.createElement("canvas")
        canvas.setAttribute("aria-hidden", "true")
        Object.assign(canvas.style, {
            position: "absolute",
            left: "0",
            top: "0",
            width: "100%",
            height: "100%",
            display: "block",
            zIndex: "-1",
            pointerEvents: "none",
        })
        this.placement = this.canvasPlacement()
        if (this.placement === "window") {
            this.viewportScale = 1
            this.sizeWindow(canvas)
            canvas.style.maxHeight = "100%"
            canvas.style.willChange = "transform"
        }
        container.prepend(canvas)
        this.canvas = canvas
        this.measure()
        this.watch(container, canvas)
        await this.runSetup()
        return this
    }
    /** Merges `options` into the current values and redraws. */
    update(options) {
        if (this.state === "destroyed") return
        const previous = this.options
        const next = resolveOptions(this.schema, options, previous)
        const changed = new Set(changedKeys(previous, next))
        if (changed.size === 0) return
        this.options = next
        if (this.state === "fallback") {
            this.showFallback()
            return
        }
        if (this.state !== "running") return
        if (changed.has("maxDpr")) this.handleResize()
        this.optionsChanged(changed, previous)
        this.invalidate()
    }
    /** Stops animating (still redraws on resize/option changes). */
    pause() {
        this.userPaused = true
    }
    play() {
        this.userPaused = false
        this.schedule()
    }
    /** Stops everything, releases GPU resources and listeners, removes the canvas. */
    destroy() {
        if (this.state === "destroyed") return
        const wasMounting = this.state === "mounting"
        this.state = "destroyed"
        this.cancelFrame()
        this.lifetime.dispose()
        if (!wasMounting) this.scope.dispose()
        this.canvas?.remove()
        this.fallbackEl?.remove()
        this.restoreContainerStyle?.()
        this.canvas = null
        this.fallbackEl = null
        this.container = null
    }
    /** 'pin' placement: progress through the pinned scroll distance, 0..1. */
    get pinProgress() {
        return this.pinned
    }
    /**
     * 'pin' placement: CSS px the section sits off its pinned place on screen,
     * negative while it is still coming up before the pin, positive once it has
     * scrolled on past the end, 0 while pinned. A scene can keep moving with it.
     */
    get pinOutside() {
        return this.pin?.outside ?? 0
    }
    /** 'pin' placement: CSS px of scrolling the section stays pinned for (`pinProgress` 1 is this far in). */
    get pinDistance() {
        return this.pin?.length ?? 0
    }
    /** 'pin' placement: smoothly scrolls the page to `progress` (0..1) through the pin. */
    scrollToPin(progress) {
        this.pin?.scrollTo(progress)
    }
    /** Requests a redraw on the next frame (no-op while off-screen). */
    invalidate() {
        this.needsRender = true
        this.schedule()
    }
    get reducedMotion() {
        const mode = this.common.reducedMotion
        return (
            mode === "always" || (mode === "auto" && this.prefersReducedMotion)
        )
    }
    /**
     * Typed view of the common options. Needed because TS cannot narrow
     * `OptionValues<S & CommonOptions>` while `S` is generic. Effects that
     * override a common option must keep its type.
     */
    get common() {
        return this.options
    }
    async runSetup() {
        const { canvas, container } = this
        if (!canvas || !container) return
        try {
            await this.setup({
                canvas,
                container,
                size: { ...this.size },
            })
        } catch (error) {
            console.error(
                "[webgl-effects] Setup failed, showing fallback:",
                error
            )
            this.scope.dispose()
            if (this.state !== "destroyed") this.showFallback()
            return
        }
        if (this.state === "destroyed") {
            this.scope.dispose()
            return
        }
        this.state = "running"
        this.resize({ ...this.size })
        this.invalidate()
    }
    prepareContainer(container) {
        const { position, isolation } = container.style
        if (getComputedStyle(container).position === "static")
            container.style.position = "relative"
        container.style.isolation = "isolate"
        this.restoreContainerStyle = () => {
            container.style.position = position
            container.style.isolation = isolation
        }
    }
    watch(container, canvas) {
        const resizeObserver = new ResizeObserver(() => this.handleResize())
        resizeObserver.observe(canvas)
        this.lifetime.add(() => resizeObserver.disconnect())
        if (this.placement !== "fill") {
            const onScroll = () => {
                this.updatePin()
                this.invalidate()
            }
            this.lifetime.listen(window, "scroll", onScroll, { passive: true })
            if (this.placement === "pin")
                this.lifetime.listen(window, "resize", onScroll)
        }
        const intersectionObserver = new IntersectionObserver(
            ([entry]) => {
                this.inView = entry?.isIntersecting ?? true
                this.schedule()
            },
            { rootMargin: "100px" }
        )
        intersectionObserver.observe(container)
        this.lifetime.add(() => intersectionObserver.disconnect())
        this.pageVisible = document.visibilityState === "visible"
        this.lifetime.listen(document, "visibilitychange", () => {
            this.pageVisible = document.visibilityState === "visible"
            this.schedule()
        })
        const motionQuery = matchMedia("(prefers-reduced-motion: reduce)")
        this.prefersReducedMotion = motionQuery.matches
        this.lifetime.listen(motionQuery, "change", () => {
            this.prefersReducedMotion = motionQuery.matches
            this.invalidate()
        })
        this.lifetime.listen(canvas, "webglcontextlost", (event) => {
            if (this.state !== "running") return
            event.preventDefault()
            this.contextLost = true
            this.cancelFrame()
            this.scope.dispose()
            this.state = "mounting"
        })
        this.lifetime.listen(canvas, "webglcontextrestored", () => {
            if (!this.contextLost) return
            this.contextLost = false
            if (this.state === "mounting") this.runSetup()
        })
    }
    measure() {
        const { canvas, container } = this
        if (!canvas || !container) return
        const dpr = Math.min(
            (window.devicePixelRatio || 1) * this.viewportScale,
            this.common.maxDpr
        )
        const width = canvas.clientWidth
        const height = canvas.clientHeight
        this.size = {
            width,
            height,
            dpr,
        }
        canvas.width = Math.max(1, Math.floor(width * dpr))
        canvas.height = Math.max(1, Math.floor(height * dpr))
    }
    handleResize() {
        this.measure()
        if (this.state !== "running") return
        this.resize({ ...this.size })
        if (this.size.width > 0 && this.size.height > 0) this.draw(0)
    }
    shouldAnimate() {
        return (
            this.state === "running" &&
            this.inView &&
            this.pageVisible &&
            !this.userPaused &&
            !(this.reducedMotion && this.reducedMotionStrategy === "static")
        )
    }
    schedule() {
        if (this.rafId || this.state !== "running") return
        if (
            !this.inView ||
            !this.pageVisible ||
            this.size.width === 0 ||
            this.size.height === 0
        )
            return
        if (this.needsRender || this.shouldAnimate())
            this.rafId = requestAnimationFrame(this.tick)
    }
    cancelFrame() {
        if (this.rafId) cancelAnimationFrame(this.rafId)
        this.rafId = 0
        this.lastTimestamp = null
    }
    tick = (timestamp) => {
        this.rafId = 0
        if (this.state !== "running") return
        const animate = this.shouldAnimate()
        if (animate && timestamp === this.lastTimestamp && !this.needsRender) {
            this.schedule()
            return
        }
        const delta =
            animate && this.lastTimestamp !== null
                ? Math.min((timestamp - this.lastTimestamp) / 1e3, MAX_DELTA)
                : 0
        this.lastTimestamp = animate ? timestamp : null
        this.draw(delta)
        this.schedule()
    }
    draw(delta) {
        this.elapsed += delta
        this.needsRender = false
        if (this.placement === "window") this.positionWindow()
        this.updatePin()
        this.render({
            time: this.elapsed,
            delta,
            frame: this.frames,
            reducedMotion: this.reducedMotion,
            animating: this.shouldAnimate(),
        })
        this.frames++
    }
    updatePin() {
        if (
            this.placement !== "pin" ||
            this.state !== "running" ||
            !this.container
        )
            return
        if (!this.pin) {
            if (this.container.getClientRects().length === 0) return
            const pin = new ScrollPin(this.container, () => this.invalidate())
            this.pin = pin
            this.lifetime.add(() => {
                pin.dispose()
                this.pin = null
            })
        }
        this.pinned = this.pin.update(this.pinLength())
    }
    /** Slides the canvas over the visible part of the container. */
    positionWindow() {
        const { canvas, container } = this
        if (!canvas || !container) return
        const rect = container.getBoundingClientRect()
        const scale =
            container.offsetWidth > 0 ? rect.width / container.offsetWidth : 1
        const next = Math.abs(scale - 1) < 0.01 ? 1 : scale
        if (Math.abs(next - this.viewportScale) > this.viewportScale * 0.005) {
            this.viewportScale = next
            this.sizeWindow(canvas)
            this.measure()
            if (this.state === "running") this.resize({ ...this.size })
        }
        const s = this.viewportScale
        const extra = (this.size.height - window.innerHeight / s) / 2
        const maxTop = Math.max(0, container.clientHeight - this.size.height)
        const top = Math.round(
            Math.min(
                maxTop,
                Math.max(0, -rect.top / s - container.clientTop - extra)
            )
        )
        canvas.style.transform = `translate3d(0, ${top}px, 0)`
        this.viewportOrigin = {
            x: rect.left + container.clientLeft * s,
            y: rect.top + (container.clientTop + top) * s,
        }
    }
    /** 'window' placement: tall enough to cover the viewport at the current scale. */
    sizeWindow(canvas) {
        const height = WINDOW_HEIGHT / Math.min(1, this.viewportScale)
        canvas.style.height = `${height}vh`
        canvas.style.height = `${height}lvh`
    }
    showFallback() {
        this.state = "fallback"
        this.cancelFrame()
        if (this.canvas) this.canvas.style.display = "none"
        this.fallbackEl?.remove()
        this.fallbackEl = this.createFallback()
        if (this.fallbackEl && this.container) {
            Object.assign(this.fallbackEl.style, {
                position: "absolute",
                inset: "0",
                zIndex: "-1",
                pointerEvents: "none",
            })
            this.fallbackEl.setAttribute("aria-hidden", "true")
            this.container.prepend(this.fallbackEl)
        }
    }
}
//#endregion
//#region ../core/src/color.ts
/**
 * Parses a hex color (#rgb, #rgba, #rrggbb, #rrggbbaa) into sRGB components
 * in the 0..1 range. Alpha is ignored. Invalid input returns black.
 *
 * Note: these are sRGB values. three.js materials expect linear colors, so
 * go through `THREE.Color` there instead of feeding these directly.
 */
function hexToRgb(hex) {
    let h = hex.trim().replace(/^#/, "")
    if (h.length === 3 || h.length === 4)
        h = [...h.slice(0, 3)].map((c) => c + c).join("")
    const n = Number.parseInt(h.slice(0, 6), 16)
    if (h.length < 6 || Number.isNaN(n)) return [0, 0, 0]
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}
//#endregion
//#region ../core/src/fullscreen.ts
/** `canvas.getContext('webgl')`, throwing if it is unavailable (setup() then falls back). */
function getWebGLContext(canvas, attributes) {
    const gl = canvas.getContext("webgl", attributes)
    if (!gl) throw new Error("WebGL context unavailable")
    return gl
}
/**
 * Compiles and links a program; throws with the info log on failure.
 * `attributes` pins attribute names to locations (bound before linking).
 */
function createProgram(gl, vertexSource, fragmentSource, attributes = {}) {
    const program = gl.createProgram()
    const vs = compileShader(gl, gl.VERTEX_SHADER, vertexSource)
    const fs = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource)
    gl.attachShader(program, vs)
    gl.attachShader(program, fs)
    for (const [name, location] of Object.entries(attributes))
        gl.bindAttribLocation(program, location, name)
    gl.linkProgram(program)
    gl.detachShader(program, vs)
    gl.detachShader(program, fs)
    gl.deleteShader(vs)
    gl.deleteShader(fs)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        const log = gl.getProgramInfoLog(program)
        gl.deleteProgram(program)
        throw new Error(`Program link failed: ${log}`)
    }
    return program
}
function compileShader(gl, type, source) {
    const shader = gl.createShader(type)
    if (!shader) throw new Error("createShader failed")
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const log = gl.getShaderInfoLog(shader)
        gl.deleteShader(shader)
        const kind = type === gl.VERTEX_SHADER ? "Vertex" : "Fragment"
        throw new Error(`${kind} shader compile failed: ${log}`)
    }
    return shader
}
//#endregion
//#region ../core/src/textures.ts
/** Largest texture side we upload, regardless of what the GPU allows. */
var MAX_TEXTURE = 2048
/**
 * Decodes an image for WebGL use, downscaled so it is no larger than it will
 * be displayed (`displayWidth` × `displayHeight` device pixels; never
 * upscaled). Uses a CORS request: WebGL refuses pixels from other origins
 * without it. Rejects when the server does not allow that.
 */
async function decodeForTexture(
    src,
    displayWidth,
    gpuMax,
    displayHeight = Infinity
) {
    const image = new Image()
    image.crossOrigin = "anonymous"
    image.src = src
    await image.decode()
    const { naturalWidth: w, naturalHeight: h } = image
    const limit = Math.min(MAX_TEXTURE, gpuMax)
    const scale = Math.min(
        1,
        displayWidth / w,
        displayHeight / h,
        limit / w,
        limit / h
    )
    if (scale === 1) return image
    const canvas = document.createElement("canvas")
    canvas.width = Math.max(1, Math.round(w * scale))
    canvas.height = Math.max(1, Math.round(h * scale))
    canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height)
    return canvas
}
function createTexture(gl, source) {
    const texture = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    return texture
}
//#endregion
//#region ../core/src/fit.ts
/**
 * UV scale/offset that reproduces CSS `object-fit` (centered) for an image of
 * `imageAspect` drawn in a box of `boxAspect`: textureUv = uv * scale + offset.
 * Values outside 0..1 (contain) are empty bands.
 */
function objectFitTransform(fit, imageAspect, boxAspect) {
    let sx = 1
    let sy = 1
    const wider = imageAspect > boxAspect
    if (fit === "cover") {
        if (wider) sx = boxAspect / imageAspect
        else sy = imageAspect / boxAspect
    } else if (fit === "contain" || fit === "scale-down") {
        if (wider) sy = imageAspect / boxAspect
        else sx = boxAspect / imageAspect
    }
    return [sx, sy, (1 - sx) / 2, (1 - sy) / 2]
}
//#endregion
//#region ../core/src/math.ts
var mat4 = {
    create() {
        return mat4.identity(/* @__PURE__ */ new Float32Array(16))
    },
    identity(out) {
        out.fill(0)
        out[0] = out[5] = out[10] = out[15] = 1
        return out
    },
    /** Perspective projection; `fovY` in radians. */
    perspective(out, fovY, aspect, near, far) {
        const f = 1 / Math.tan(fovY / 2)
        out.fill(0)
        out[0] = f / aspect
        out[5] = f
        out[10] = (far + near) / (near - far)
        out[11] = -1
        out[14] = (2 * far * near) / (near - far)
        return out
    },
    /** View matrix of a camera at `eye` looking at `target`. */
    lookAt(out, eye, target, up = [0, 1, 0]) {
        let zx = eye[0] - target[0]
        let zy = eye[1] - target[1]
        let zz = eye[2] - target[2]
        let len = Math.hypot(zx, zy, zz) || 1
        zx /= len
        zy /= len
        zz /= len
        let xx = up[1] * zz - up[2] * zy
        let xy = up[2] * zx - up[0] * zz
        let xz = up[0] * zy - up[1] * zx
        len = Math.hypot(xx, xy, xz) || 1
        xx /= len
        xy /= len
        xz /= len
        const yx = zy * xz - zz * xy
        const yy = zz * xx - zx * xz
        const yz = zx * xy - zy * xx
        out[0] = xx
        out[1] = yx
        out[2] = zx
        out[3] = 0
        out[4] = xy
        out[5] = yy
        out[6] = zy
        out[7] = 0
        out[8] = xz
        out[9] = yz
        out[10] = zz
        out[11] = 0
        out[12] = -(xx * eye[0] + xy * eye[1] + xz * eye[2])
        out[13] = -(yx * eye[0] + yy * eye[1] + yz * eye[2])
        out[14] = -(zx * eye[0] + zy * eye[1] + zz * eye[2])
        out[15] = 1
        return out
    },
    /** out = a × b */
    multiply(out, a, b) {
        const r = /* @__PURE__ */ new Float32Array(16)
        for (let col = 0; col < 4; col++)
            for (let row = 0; row < 4; row++) {
                let sum = 0
                for (let k = 0; k < 4; k++)
                    sum += a[k * 4 + row] * b[col * 4 + k]
                r[col * 4 + row] = sum
            }
        out.set(r)
        return out
    },
    /** Translation, then rotation of `yaw` radians around Y, then uniform `scale`. */
    fromTranslationYaw(out, position, yaw, scale = 1) {
        const c = Math.cos(yaw) * scale
        const s = Math.sin(yaw) * scale
        out.fill(0)
        out[0] = c
        out[2] = -s
        out[5] = scale
        out[8] = s
        out[10] = c
        out[12] = position[0]
        out[13] = position[1]
        out[14] = position[2]
        out[15] = 1
        return out
    },
    /** Model matrix from a position and orthonormal axes: local +X → right, +Y → up, +Z → forward. */
    fromBasis(out, position, right, up, forward) {
        out.set([...right, 0, ...up, 0, ...forward, 0, ...position, 1])
        return out
    },
    /** Projects a point by `m` into normalized device coordinates; `w` is depth (≤ 0 means behind the camera). */
    project(m, p) {
        const x = m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12]
        const y = m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13]
        const w = m[3] * p[0] + m[7] * p[1] + m[11] * p[2] + m[15]
        return [x / w, y / w, w]
    },
}
//#endregion
//#region ../core/src/grid.ts
function createGrid(gl, segmentsX, segmentsY, attribute = 0) {
    const vertices = new Float32Array((segmentsX + 1) * (segmentsY + 1) * 2)
    let v = 0
    for (let y = 0; y <= segmentsY; y++)
        for (let x = 0; x <= segmentsX; x++) {
            vertices[v++] = x / segmentsX
            vertices[v++] = y / segmentsY
        }
    const indices = new Uint16Array(segmentsX * segmentsY * 6)
    let i = 0
    for (let y = 0; y < segmentsY; y++)
        for (let x = 0; x < segmentsX; x++) {
            const a = y * (segmentsX + 1) + x
            const b = a + 1
            const c = a + segmentsX + 1
            const d = c + 1
            indices.set([a, b, c, b, d, c], i)
            i += 6
        }
    const vertexBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW)
    const indexBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW)
    return {
        draw() {
            gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
            gl.enableVertexAttribArray(attribute)
            gl.vertexAttribPointer(attribute, 2, gl.FLOAT, false, 0, 0)
            gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0)
        },
        dispose() {
            gl.deleteBuffer(vertexBuffer)
            gl.deleteBuffer(indexBuffer)
        },
    }
}
//#endregion
//#region ../effects/crest/src/layouts.ts
/** Share of the screen width the columns span. */
var SPAN = 0.84
/** World units kept clear at the screen edges. */
var MARGIN = 0.03
/** Widest column, in world units (the screen is 2 tall): few columns stay a centered stream, not a wall of huge images. */
var MAX_COLUMN = 1.1
/** Least share of its column a single image fills on portrait screens. */
var NARROW_FILL = 0.92
/** Columns start staggered by these shares of a column width, so rows never line up. */
var STAGGER = [0, 0.55, 0.22, 0.75, 0.4]
/** Masonry columns: each image goes to the column that ends first. */
function createStream({
    aspects,
    columns,
    narrowColumns,
    viewportAspect,
    size,
    slant,
}) {
    const count = columnCount(columns, narrowColumns, viewportAspect)
    const drift = Math.abs(Math.tan(slant))
    const span = Math.min(
        2 * viewportAspect * SPAN,
        2 * (viewportAspect - drift - MARGIN)
    )
    const column = Math.min(MAX_COLUMN, Math.max(0.1, span) / count)
    const width =
        column *
        (count === 1 && viewportAspect < 1 ? Math.max(size, NARROW_FILL) : size)
    const gap = Math.max(column - width, width * 0.15)
    const ends = Array.from(
        { length: count },
        (_, c) => (STAGGER[c % STAGGER.length] ?? 0) * column
    )
    const slots = aspects.map((aspect) => {
        let c = 0
        for (let i = 1; i < count; i++) if (ends[i] < ends[c]) c = i
        const height = width / Math.max(0.2, aspect)
        const slot = {
            across: (c - (count - 1) / 2) * column,
            behind: ends[c] + height / 2,
            width,
            height,
        }
        ends[c] = ends[c] + height + gap
        return slot
    })
    return {
        slots,
        length: slots.length ? Math.max(...ends) : 0,
    }
}
/** Columns for the screen: `narrow` on portrait screens, never more than on wide ones. */
function columnCount(columns, narrow, viewportAspect) {
    const wide = Math.max(1, Math.round(columns))
    return viewportAspect < 1
        ? Math.min(wide, Math.max(1, Math.round(narrow)))
        : wide
}
/**
 * How far along the stream frame (tilted by `slant` radians) the screen
 * reaches from its center: images whose center is farther than this plus
 * half their size are off screen.
 */
function screenReach(viewportAspect, slant) {
    return Math.cos(slant) + viewportAspect * Math.abs(Math.sin(slant))
}
/**
 * Where the stream's front travels. `startFill` is the share of the screen
 * (along the travel) the first images already cover when the pin starts: 0
 * starts on an empty screen, 1 on a full one. `endFill` is the share the last
 * images still cover when it ends: 0 lets every image leave at the top.
 */
function travelRange(stream, viewportAspect, slant, startFill, endFill) {
    const reach = screenReach(viewportAspect, slant)
    const start = -reach + 2 * reach * clamp01(startFill)
    const end = reach + stream.length - 2 * reach * clamp01(endFill)
    return [start, Math.max(end, start + 0.1)]
}
/** Position of the stream's front for a scroll progress 0..1. */
function frontAt(progress, stream, viewportAspect, slant, startFill, endFill) {
    const [start, end] = travelRange(
        stream,
        viewportAspect,
        slant,
        startFill,
        endFill
    )
    return start + (end - start) * progress
}
/**
 * Screen heights of scrolling for the whole travel at `speed`: at 1 the
 * images move as far as the page scrolls (the screen is 2 world units tall).
 */
function pinScreens(stream, viewportAspect, slant, startFill, endFill, speed) {
    const [start, end] = travelRange(
        stream,
        viewportAspect,
        slant,
        startFill,
        endFill
    )
    return (end - start) / 2 / Math.max(0.05, speed)
}
var clamp01 = (value) => Math.min(1, Math.max(0, value))
//#endregion
//#region ../effects/crest/src/options.ts
/** Images with this attribute are left out of the gallery. */
var SKIP_ATTRIBUTE = "data-fx-skip"
var crestOptions = defineOptions({
    speed: {
        type: "number",
        label: "Scroll speed",
        description:
            "How fast images rise as the page scrolls. At 1 they move with the scroll; the section stays pinned as long as it takes for every image to pass, whatever the columns or the number of images.",
        default: 1,
        min: 0.3,
        max: 2,
        step: 0.05,
        group: "Layout",
    },
    startFill: {
        type: "number",
        label: "Start fill",
        description:
            "How much of the section the first images already cover when it pins: 0 starts empty, with them rising from the bottom edge; 1 starts full.",
        default: 0.15,
        min: 0,
        max: 1,
        step: 0.01,
        group: "Layout",
    },
    endFill: {
        type: "number",
        label: "End fill",
        description:
            "How much of the section the last images still cover when it unpins: 0 lets every image leave at the top first; higher values scroll on with them in view.",
        default: 0,
        min: 0,
        max: 1,
        step: 0.01,
        group: "Layout",
    },
    columns: {
        type: "number",
        label: "Columns",
        description: "Columns on wide screens.",
        default: 3,
        min: 1,
        max: 5,
        step: 1,
        group: "Layout",
    },
    narrowColumns: {
        type: "number",
        label: "Narrow columns",
        description:
            "Columns on portrait screens (phones, tall windows). With one, images fill most of the width.",
        default: 1,
        min: 1,
        max: 2,
        step: 1,
        group: "Layout",
    },
    imageSize: {
        type: "number",
        label: "Image size",
        description: "Image width relative to its column.",
        default: 0.7,
        min: 0.4,
        max: 1,
        step: 0.01,
        group: "Layout",
    },
    slant: {
        type: "number",
        label: "Slant",
        description:
            "Degrees the stream of images leans to the left as it rises.",
        default: 8,
        min: 0,
        max: 20,
        step: 0.5,
        group: "Layout",
    },
    crestHeight: {
        type: "number",
        label: "Crest height",
        description:
            "How far images lift as they pass over the hidden arch. 0 keeps them flat.",
        default: 0.5,
        min: 0,
        max: 1,
        step: 0.01,
        group: "Crest",
    },
    crestWidth: {
        type: "number",
        label: "Crest width",
        description:
            "How broad the arch is: low values make a sharp ridge, high values a gentle swell.",
        default: 0.45,
        min: 0.4,
        max: 1,
        step: 0.01,
        group: "Crest",
    },
    swell: {
        type: "number",
        label: "Speed swell",
        description:
            "How much the arch rises while scrolling fast, settling back when the scroll slows. 0 keeps it fixed.",
        default: 0.5,
        min: 0,
        max: 1,
        step: 0.01,
        group: "Crest",
    },
    crestCurve: {
        type: "number",
        label: "Arch curve",
        description:
            "How tightly the hidden arch bends: low values make an open, almost straight sweep across the screen; high values a narrow, closed arch.",
        default: 0.5,
        min: 0,
        max: 1,
        step: 0.01,
        group: "Crest",
    },
    light: {
        type: "number",
        label: "Light",
        description:
            "Highlights and shade on the images as they bend over the arch.",
        default: 0.6,
        min: 0,
        max: 1,
        step: 0.01,
        group: "Look",
    },
    shadow: {
        type: "number",
        label: "Shadow",
        description:
            "Soft shadow the images cast on the background, lighter and blurrier the higher they lift. Best on light backgrounds.",
        default: 0.6,
        min: 0,
        max: 1,
        step: 0.01,
        group: "Look",
    },
    radius: {
        type: "number",
        label: "Corner radius",
        description: "Rounded corners, relative to image width.",
        default: 0.02,
        min: 0,
        max: 0.15,
        step: 0.005,
        group: "Look",
    },
    background: {
        type: "color",
        label: "Background",
        description: "Section color behind the images.",
        default: "#e9ecf1",
        group: "Look",
    },
    smoothing: {
        type: "number",
        label: "Inertia",
        description:
            "How long the images keep gliding after you stop scrolling.",
        default: 0.5,
        min: 0,
        max: 1,
        step: 0.01,
        group: "Motion",
    },
})
//#endregion
//#region ../effects/crest/src/shaders/plane.frag?raw
var plane_default$1 =
    "#ifdef GL_FRAGMENT_PRECISION_HIGH\nprecision highp float;\n#else\nprecision mediump float;\n#endif\n\nuniform sampler2D uTexture;\nuniform vec4 uUvTransform; // object-fit: cover\nuniform float uAspect;     // width / height\nuniform float uRadius;     // corner radius, relative to width\nuniform float uLoaded;     // 0..1: placeholder → image\nuniform vec3 uBackground;\n\nvarying vec2 vUv;\nvarying float vShade;\n\nvoid main() {\n  vec2 half_ = vec2(1.0, 1.0 / uAspect) * 0.5;\n  vec2 p = (vUv - 0.5) * vec2(1.0, 1.0 / uAspect);\n  vec2 q = abs(p) - (half_ - uRadius);\n  float d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - uRadius;\n  float mask = 1.0 - smoothstep(-0.002, 0.002, d);\n\n  vec3 image = texture2D(uTexture, vUv * uUvTransform.xy + uUvTransform.zw).rgb;\n  vec3 placeholder = mix(uBackground, vec3(0.5), 0.12);\n  vec3 color = mix(placeholder, image, uLoaded) * vShade;\n  // Premultiplied: blendFunc(ONE, ONE_MINUS_SRC_ALPHA).\n  gl_FragColor = vec4(color * mask, mask);\n}\n"
//#endregion
//#region ../effects/crest/src/shaders/plane.vert?raw
var plane_default =
    "attribute vec2 position; // 0..1 grid, origin bottom-left\n\nuniform mat4 uViewProjection;\nuniform float uLight;\n\nvarying vec2 vUv;\nvarying float vShade;\n\nvoid main() {\n  vUv = position;\n  vec2 p = drape((position - 0.5) * uSize);\n  float z = crest(p);\n\n  // Matte light from the upper left plus a soft sheen on the crest; flat stays at exactly 1.\n  vec3 normal = normalize(vec3(-crestSlope(p), 1.0));\n  vec3 light = normalize(vec3(-0.45, 0.6, 0.65));\n  vec3 halfway = normalize(light + vec3(0.0, 0.0, 1.0));\n  float diffuse = dot(normal, light) / light.z - 1.0;\n  float sheen = max(0.0, pow(max(dot(normal, halfway), 0.0), 40.0) - pow(halfway.z, 40.0));\n  vShade = 1.0 + (diffuse * 0.9 + sheen * 0.6) * uLight;\n\n  gl_Position = uViewProjection * vec4(p + steady(), z, 1.0);\n}\n"
//#endregion
//#region ../effects/crest/src/shaders/shadow.frag?raw
var shadow_default$1 =
    "#ifdef GL_FRAGMENT_PRECISION_HIGH\nprecision highp float;\n#else\nprecision mediump float;\n#endif\n\nuniform float uRadius;   // corner radius, relative to width\nuniform float uStrength; // 0..1\nuniform float uLoaded;\n\nvarying vec2 vLocal;\nvarying vec2 vHalf;\nvarying float vHeight;\n\nvoid main() {\n  // A soft contact shadow where the image lies flat; higher up it grows lighter and blurrier.\n  float soft = 0.006 + vHeight * 0.45;\n  float radius = uRadius * vHalf.x * 2.0;\n  vec2 q = abs(vLocal) - (vHalf - radius);\n  float d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - radius;\n  float coverage = 1.0 - smoothstep(-soft, soft, d);\n  float darkness = mix(0.1, 0.32, smoothstep(0.0, 0.08, vHeight)) / (1.0 + vHeight * 4.0);\n  float alpha = coverage * darkness * uStrength * uLoaded;\n  // Premultiplied black.\n  gl_FragColor = vec4(0.0, 0.0, 0.0, alpha);\n}\n"
//#endregion
//#region ../effects/crest/src/shaders/shadow.vert?raw
var shadow_default =
    "attribute vec2 position; // 0..1 grid, origin bottom-left\n\nuniform mat4 uViewProjection;\nuniform float uMargin; // world units the quad reaches past the image, room for the blur\n\nvarying vec2 vLocal;   // world units from the image center, in the image's frame\nvarying vec2 vHalf;    // half the image size (a varying: uniforms shared with the fragment shader must match precision)\nvarying float vHeight; // how high the sheet is above the background here\n\n// Light from the upper left (as in plane.vert): shadows fall down and to the right.\nconst vec2 FALL = vec2(0.69, -0.92) * 0.55;\n\nvoid main() {\n  vLocal = (position - 0.5) * (uSize + 2.0 * uMargin);\n  vHalf = uSize * 0.5;\n  // The part beyond the image follows its edge, so the blur hugs the outline.\n  vec2 edge = clamp(vLocal, -uSize * 0.5, uSize * 0.5);\n  vec2 p = drape(edge);\n  float h = crest(p);\n  vHeight = h;\n  vec2 beyond = vLocal - edge;\n  vec2 offset = vec2(beyond.x * uRotation.x - beyond.y * uRotation.y, beyond.x * uRotation.y + beyond.y * uRotation.x);\n  // Seen from above, the image covers its draped outline: the shadow keeps that shape, cast away from the light.\n  gl_Position = uViewProjection * vec4(p + offset + FALL * h + steady(), 0.0, 1.0);\n}\n"
//#endregion
//#region ../effects/crest/src/shaders/surface.glsl?raw
var surface_default =
    "// Prepended to the image and shadow vertex shaders: the surface the images\n// slide over, and how a sheet lies on it.\n\nuniform vec2 uCenter;   // world xy of the image center\nuniform vec2 uRotation; // cos, sin of the slant\nuniform vec2 uSize;     // world width, height\nuniform vec4 uCrest;    // arch: center xy, radii xy\nuniform vec2 uLift;     // crest height, half width (world units)\nuniform float uDistance; // camera distance from the z = 0 plane\n\n// Height of the surface: a ridge along the upper half of an ellipse, like a\n// half ring lying under a sheet.\nfloat crest(vec2 p) {\n  vec2 q = (p - uCrest.xy) / uCrest.zw;\n  float r = length(q);\n  // f / |grad f| for f = r - 1: roughly the distance to the ellipse, in world units.\n  float d = (r - 1.0) * r / max(length(q / uCrest.zw), 1e-4);\n  float t = d / uLift.y;\n  // Only the upper half: the lower one passes below the screen, where it\n  // lifted and shifted the images just as they came in at the bottom.\n  float upper = smoothstep(-0.3, 0.0, q.y);\n  return uLift.x * exp(-t * t) * upper;\n}\n\n// Shift for the whole image so its center stays where it would be flat. Lifted\n// toward the camera, perspective pushes the center away from the middle of the\n// screen (the left column drifts left, the right one right), and the swell\n// would make it sway with the scroll speed; the sheet still grows and bends.\nvec2 steady() {\n  return -uCenter * crest(uCenter) / uDistance;\n}\n\nvec2 crestSlope(vec2 p) {\n  const float e = 0.01;\n  return vec2(crest(p + vec2(e, 0.0)) - crest(p - vec2(e, 0.0)), crest(p + vec2(0.0, e)) - crest(p - vec2(0.0, e))) / (2.0 * e);\n}\n\n// Where a point `local` (world units from the image center, in the image's\n// frame) of a sheet lying on the surface ends up, seen from above. The sheet\n// slides up through the arch and keeps its length along the way it travels:\n// walking up or down a slope covers less ground, so it bunches up as it climbs\n// instead of swelling like a lens. Across, nothing pulls it, so its sides stay\n// straight (walking out from the center in every direction pinched them in,\n// as if over several bumps).\nvec2 drape(vec2 local) {\n  vec2 up = vec2(-uRotation.y, uRotation.x);\n  vec2 p = uCenter + vec2(uRotation.x, uRotation.y) * local.x;\n  const int STEPS = 10;\n  float ds = local.y / float(STEPS);\n  for (int i = 0; i < STEPS; i++) {\n    // Midpoint step: the slope halfway along keeps the walk from drifting.\n    vec2 mid = p + up * ds * 0.5 / sqrt(1.0 + pow(dot(crestSlope(p), up), 2.0));\n    p += up * ds / sqrt(1.0 + pow(dot(crestSlope(mid), up), 2.0));\n  }\n  return p;\n}\n"
//#endregion
//#region ../effects/crest/src/crest.ts
/** Seconds to wait for every image before laying out with those loaded. */
var LOAD_TIMEOUT = 2.5
var DEFAULT_ASPECT = 4 / 5
var FOV = (40 * Math.PI) / 180
/** Screens pinned until the images have loaded and the stream is laid out. */
var PIN_BEFORE_LAYOUT = 3
/** World units a shadow's quad reaches past its image: room for the widest blur and the fall. */
var SHADOW_MARGIN = 0.25
/** World units per second (the screen is 2 tall) that count as scrolling fast: the arch swells fully. */
var FAST_SCROLL = 4
/** Extra crest height at full swell, relative to its height at rest. */
var SWELL = 0.8
/** Pointer travel (px) below which a press is a click. */
var CLICK_SLOP = 6
/**
 * Scroll-driven gallery: the section pins and the images inside the container
 * rise through it in slanted columns, swelling as they slide over a hidden
 * arch. The originals stay in the DOM, visually hidden, for keyboard, screen
 * readers and the no-WebGL fallback.
 */
var Crest$1 = class extends Effect {
    gl = null
    program = null
    shadowProgram = null
    grid = null
    blank = null
    uniforms = /* @__PURE__ */ new Map()
    items = []
    shown = []
    stream = null
    hidden = /* @__PURE__ */ new WeakSet()
    containerTaken = false
    generation = 0
    /** Progress through the pin, 0..1, eased from `scroll`. */
    travel = 0
    /**
     * CSS px into the pin, eased for the inertia. Outside the pin the page
     * carries the section, so the images have no inertia there; it fades in over
     * the first screen of the pin and out over the last, so they never start
     * from rest where the section pins (they stalled for a moment).
     */
    scroll = 0
    /** The eased scroll jumps to the page's (first frame, new layout). */
    snapScroll = true
    /** Where the stream's front was last frame, and how much the arch swells with the speed (0..1). */
    lastFront = null
    lastOutside = 0
    swelling = 0
    press = {
        active: false,
        x: 0,
        y: 0,
        moved: false,
    }
    pointer = {
        x: 0,
        y: 0,
        inside: false,
    }
    dirty = true
    view = mat4.create()
    projection = mat4.create()
    viewProjection = mat4.create()
    constructor() {
        super(crestOptions)
    }
    canvasPlacement() {
        return "pin"
    }
    /** As long as the images take to pass at `speed`, so more images or fewer columns scroll longer, not faster. */
    pinLength() {
        if (!this.stream) return PIN_BEFORE_LAYOUT
        return pinScreens(
            this.stream,
            this.viewportAspect,
            this.slant,
            this.options.startFill,
            this.options.endFill,
            this.options.speed
        )
    }
    setup({ canvas, container }) {
        const gl = getWebGLContext(canvas, {
            alpha: false,
            antialias: true,
            depth: false,
            stencil: false,
        })
        const program = createProgram(
            gl,
            `${surface_default}\n${plane_default}`,
            plane_default$1,
            { position: 0 }
        )
        const shadowProgram = createProgram(
            gl,
            `${surface_default}\n${shadow_default}`,
            shadow_default$1,
            { position: 0 }
        )
        const grid = createGrid(gl, 40, 40)
        const blank = createTexture(gl, new ImageData(1, 1))
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true)
        gl.enable(gl.BLEND)
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
        Object.assign(this, {
            gl,
            program,
            shadowProgram,
            grid,
            blank,
        })
        this.uniforms.clear()
        const generation = ++this.generation
        this.items = []
        this.stream = null
        const initialLoads = this.syncItems(container, canvas, generation)
        this.sizeContainer(container)
        this.listen(container, canvas)
        const start = () => {
            if (generation !== this.generation || this.stream) return
            this.buildStream()
            this.invalidate()
        }
        Promise.allSettled(initialLoads).then(start)
        const timer = setTimeout(start, LOAD_TIMEOUT * 1e3)
        this.scope.add(() => clearTimeout(timer))
        const observer = new MutationObserver(() =>
            this.syncItems(container, canvas, generation)
        )
        observer.observe(container, {
            childList: true,
            subtree: true,
        })
        this.scope.add(() => observer.disconnect())
        this.scope.add(() => {
            this.generation++
            for (const item of this.items)
                if (item.texture) gl.deleteTexture(item.texture)
            this.items = []
            this.shown = []
            gl.deleteTexture(blank)
            grid.dispose()
            gl.deleteProgram(program)
            gl.deleteProgram(shadowProgram)
            this.gl =
                this.program =
                this.shadowProgram =
                this.grid =
                this.blank =
                    null
        })
    }
    hideOriginals(container, canvas) {
        if (this.items.length === 0) return
        if (!this.containerTaken) {
            this.containerTaken = true
            const { display, backgroundColor } = container.style
            container.style.display = "block"
            container.style.backgroundColor = this.options.background
            this.scope.add(() => {
                Object.assign(container.style, {
                    display,
                    backgroundColor,
                })
                this.containerTaken = false
            })
        }
        for (const child of [...container.children]) {
            if (child === canvas || this.hidden.has(child)) continue
            this.hidden.add(child)
            const previous = child.style.cssText
            Object.assign(child.style, {
                position: "absolute",
                width: "1px",
                height: "1px",
                margin: "-1px",
                padding: "0",
                overflow: "hidden",
                clipPath: "inset(50%)",
                whiteSpace: "nowrap",
                border: "0",
            })
            this.scope.add(() => {
                child.style.cssText = previous
                this.hidden.delete(child)
            })
        }
    }
    sizeContainer(container) {
        const previous = container.style.height
        if (container.clientHeight < 160) {
            container.style.height = "100vh"
            container.style.height = "100lvh"
        }
        this.scope.add(() => (container.style.height = previous))
    }
    /** Tracks the container's current images; returns the loads it started. */
    syncItems(container, canvas, generation) {
        const images = [
            ...container.querySelectorAll(`img:not([${SKIP_ATTRIBUTE}])`),
        ]
        const present = new Set(images)
        const known = new Map(this.items.map((item) => [item.img, item]))
        for (const item of this.items)
            if (!present.has(item.img) && item.texture)
                this.gl?.deleteTexture(item.texture)
        const loads = []
        this.items = images.map((img) => {
            const existing = known.get(img)
            if (existing) return existing
            const item = {
                img,
                link: img.closest("a[href]"),
                aspect:
                    img.naturalWidth > 0
                        ? img.naturalWidth / img.naturalHeight
                        : DEFAULT_ASPECT,
                textureAspect: DEFAULT_ASPECT,
                texture: null,
                state: "loading",
                loaded: 0,
            }
            loads.push(this.loadItem(item, generation))
            return item
        })
        this.hideOriginals(container, canvas)
        if (
            this.stream &&
            (loads.length > 0 || known.size !== this.items.length)
        ) {
            this.buildStream()
            this.invalidate()
        }
        return loads
    }
    async loadItem(item, generation) {
        const gl = this.gl
        const maxTexture = gl.getParameter(gl.MAX_TEXTURE_SIZE)
        const dpr = Math.min(this.size.dpr, 1.5)
        const displayHeight = window.innerHeight * dpr * 0.75
        const src = item.img.currentSrc || item.img.src
        try {
            const source = await decodeForTexture(
                src,
                Infinity,
                maxTexture,
                displayHeight
            )
            if (
                generation !== this.generation ||
                !this.gl ||
                !this.items.includes(item)
            )
                return
            item.texture = createTexture(this.gl, source)
            item.textureAspect = source.width / source.height
            if (!this.stream) item.aspect = item.textureAspect
            item.state = "ready"
        } catch {
            if (generation !== this.generation) return
            item.state = "failed"
            console.warn(
                `[webgl-effects] Cannot use "${src}" in WebGL (the server does not allow cross-origin use). It is left out of the gallery.`
            )
            if (this.stream) this.buildStream()
        }
        this.dirty = true
        this.invalidate()
    }
    buildStream() {
        this.shown = this.items.filter((item) => item.state !== "failed")
        this.stream = createStream({
            aspects: this.shown.map((item) => item.aspect),
            columns: this.options.columns,
            narrowColumns: this.options.narrowColumns,
            viewportAspect: this.viewportAspect,
            size: this.options.imageSize,
            slant: this.slant,
        })
        this.lastFront = null
        this.snapScroll = true
        this.dirty = true
    }
    get viewportAspect() {
        return this.size.width / Math.max(1, this.size.height)
    }
    get slant() {
        return (this.options.slant * Math.PI) / 180
    }
    render({ delta, animating }) {
        const { gl, program, shadowProgram, grid, options, stream } = this
        if (!gl || !program || !shadowProgram || !grid) return
        const ease = (rate) => (animating ? 1 - Math.exp(-delta * rate) : 1)
        let settled = true
        const length = this.pinDistance
        const target = this.pinProgress * length
        if (this.snapScroll) {
            this.scroll = target
            this.snapScroll = false
        }
        const ramp = Math.min(length / 2, Math.max(1, this.size.height))
        const lag =
            (smoothstep(0, ramp, target) *
                smoothstep(0, ramp, length - target)) /
            (14 - options.smoothing * 11.5)
        this.scroll +=
            (target - this.scroll) *
            (animating && lag > 1e-4 ? 1 - Math.exp(-delta / lag) : 1)
        if (Math.abs(target - this.scroll) < 0.05) this.scroll = target
        else settled = false
        this.travel = length > 0 ? this.scroll / length : this.pinProgress
        if (this.updateSwell(delta, animating, ease)) settled = false
        if (this.pinOutside !== this.lastOutside) {
            this.lastOutside = this.pinOutside
            this.dirty = true
        }
        for (const item of this.shown) {
            const loaded = item.state === "ready" ? 1 : 0
            item.loaded += (loaded - item.loaded) * ease(4)
            if (Math.abs(item.loaded - loaded) > 0.001) settled = false
            else item.loaded = loaded
        }
        const hovered =
            stream && this.pointer.inside && !this.press.active
                ? this.pick()
                : -1
        this.setCursor(this.shown[hovered]?.link ? "pointer" : "")
        if (animating && settled && !this.dirty) return
        this.dirty = false
        const [r, g, b] = hexToRgb(options.background)
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight)
        gl.clearColor(r, g, b, 1)
        gl.clear(gl.COLOR_BUFFER_BIT)
        if (!stream || this.shown.length === 0) return
        const aspect = this.viewportAspect
        const distance = 1 / Math.tan(FOV / 2)
        mat4.perspective(this.projection, FOV, aspect, 0.05, 50)
        mat4.lookAt(this.view, [0, 0, distance], [0, 0, 0])
        mat4.multiply(this.viewProjection, this.projection, this.view)
        const halfWidth =
            1.25 * Math.max(aspect, 0.6) * 2 ** ((0.5 - options.crestCurve) * 3)
        const scale = Math.min(1, aspect)
        const shared = (target) => {
            gl.useProgram(target)
            gl.uniformMatrix4fv(
                this.uniform(target, "uViewProjection"),
                false,
                this.viewProjection
            )
            gl.uniform2f(
                this.uniform(target, "uRotation"),
                Math.cos(this.slant),
                Math.sin(this.slant)
            )
            gl.uniform4f(
                this.uniform(target, "uCrest"),
                0.05 * aspect,
                -0.55,
                halfWidth,
                1.15
            )
            gl.uniform2f(
                this.uniform(target, "uLift"),
                options.crestHeight *
                    0.6 *
                    scale *
                    (1 + SWELL * options.swell * this.swelling),
                options.crestWidth * 0.5 * scale
            )
            gl.uniform1f(this.uniform(target, "uRadius"), options.radius)
            gl.uniform1f(this.uniform(target, "uDistance"), distance)
        }
        const place = (target, x, y, width, height, item) => {
            gl.uniform2f(this.uniform(target, "uCenter"), x, y)
            gl.uniform2f(this.uniform(target, "uSize"), width, height)
            gl.uniform1f(this.uniform(target, "uLoaded"), item.loaded)
        }
        if (options.shadow > 0) {
            shared(shadowProgram)
            gl.uniform1f(
                this.uniform(shadowProgram, "uMargin"),
                SHADOW_MARGIN * scale
            )
            gl.uniform1f(
                this.uniform(shadowProgram, "uStrength"),
                options.shadow
            )
            this.eachOnScreen((item, x, y, width, height) => {
                place(shadowProgram, x, y, width, height, item)
                grid.draw()
            })
        }
        shared(program)
        gl.uniform1f(this.uniform(program, "uLight"), options.light)
        gl.uniform3f(this.uniform(program, "uBackground"), r, g, b)
        gl.uniform1i(this.uniform(program, "uTexture"), 0)
        gl.activeTexture(gl.TEXTURE0)
        this.eachOnScreen((item, x, y, width, height) => {
            place(program, x, y, width, height, item)
            gl.uniform1f(this.uniform(program, "uAspect"), width / height)
            gl.uniform4fv(
                this.uniform(program, "uUvTransform"),
                objectFitTransform("cover", item.textureAspect, width / height)
            )
            gl.bindTexture(gl.TEXTURE_2D, item.texture ?? this.blank)
            grid.draw()
        })
    }
    /** Follows the scroll speed; returns true while the swell still changes. */
    updateSwell(delta, animating, ease) {
        const stream = this.stream
        const front = stream
            ? frontAt(
                  this.travel,
                  stream,
                  this.viewportAspect,
                  this.slant,
                  this.options.startFill,
                  this.options.endFill
              )
            : null
        const last = this.lastFront
        this.lastFront = front
        if (
            !animating ||
            this.reducedMotion ||
            front === null ||
            last === null
        ) {
            this.swelling = 0
            return false
        }
        if (delta <= 0) return this.swelling > 0.001
        const speed = Math.abs(front - last) / delta
        const target = Math.min(1, speed / FAST_SCROLL)
        this.swelling +=
            (target - this.swelling) * ease(target > this.swelling ? 8 : 2.5)
        if (this.swelling < 0.001 && target === 0) this.swelling = 0
        return this.swelling > 0
    }
    /**
     * World units the images slide sideways while the page carries the section
     * up to the pin and on past it: the page moves them straight up, and this
     * turns that into the slant they travel along while pinned, so they never
     * change direction where the pin starts or ends. Never up or down: the
     * browser scrolls the page ahead of the canvas, and countering the page's
     * motion in the canvas made the images jump back and forth.
     */
    diagonalDrift() {
        return (
            (-Math.tan(this.slant) * (this.pinOutside * 2)) /
            Math.max(1, this.size.height)
        )
    }
    /** Calls `draw` with each visible image's world center and size. */
    eachOnScreen(draw) {
        const stream = this.stream
        if (!stream) return
        const aspect = this.viewportAspect
        const slant = this.slant
        const cos = Math.cos(slant)
        const sin = Math.sin(slant)
        const reach = screenReach(aspect, slant)
        const front = frontAt(
            this.travel,
            stream,
            aspect,
            slant,
            this.options.startFill,
            this.options.endFill
        )
        const drift = this.diagonalDrift()
        stream.slots.forEach((slot, index) => {
            const item = this.shown[index]
            const along = front - slot.behind
            if (
                !item ||
                Math.abs(along) >
                    reach + Math.max(slot.width, slot.height) * 0.7
            )
                return
            draw(
                item,
                slot.across * cos - along * sin + drift,
                slot.across * sin + along * cos,
                slot.width,
                slot.height,
                index
            )
        })
    }
    /** The image under the pointer, flat (ignoring the lift), or -1. */
    pick() {
        const aspect = this.viewportAspect
        const x = this.pointer.x * aspect
        const y = this.pointer.y
        const cos = Math.cos(this.slant)
        const sin = Math.sin(this.slant)
        let found = -1
        this.eachOnScreen((_, cx, cy, width, height, index) => {
            const dx = x - cx
            const dy = y - cy
            const u = dx * cos + dy * sin
            const v = -dx * sin + dy * cos
            if (Math.abs(u) <= width / 2 && Math.abs(v) <= height / 2)
                found = index
        })
        return found
    }
    setCursor(cursor) {
        if (this.container && this.container.style.cursor !== cursor)
            this.container.style.cursor = cursor
    }
    listen(container, canvas) {
        this.scope.add(() => (container.style.cursor = ""))
        const toNdc = (e) => {
            const rect = canvas.getBoundingClientRect()
            this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
            this.pointer.y = 1 - ((e.clientY - rect.top) / rect.height) * 2
            this.pointer.inside =
                Math.abs(this.pointer.x) <= 1 &&
                Math.abs(this.pointer.y) <= 1 &&
                e.pointerType !== "touch"
        }
        this.scope.listen(
            window,
            "pointermove",
            (event) => {
                const e = event
                toNdc(e)
                if (
                    this.press.active &&
                    Math.abs(e.clientX - this.press.x) +
                        Math.abs(e.clientY - this.press.y) >
                        CLICK_SLOP
                )
                    this.press.moved = true
                this.invalidate()
            },
            { passive: true }
        )
        this.scope.listen(container, "pointerdown", (event) => {
            const e = event
            toNdc(e)
            this.pointer.inside = true
            Object.assign(this.press, {
                active: true,
                x: e.clientX,
                y: e.clientY,
                moved: false,
            })
        })
        this.scope.listen(window, "pointerup", () => {
            if (!this.press.active) return
            this.press.active = false
            if (!this.press.moved) this.shown[this.pick()]?.link?.click()
            this.invalidate()
        })
        this.scope.listen(
            window,
            "pointercancel",
            () => (this.press.active = false)
        )
    }
    optionsChanged(changed) {
        if (
            this.stream &&
            (changed.has("columns") ||
                changed.has("narrowColumns") ||
                changed.has("imageSize") ||
                changed.has("slant"))
        )
            this.buildStream()
        if (changed.has("background") && this.containerTaken && this.container)
            this.container.style.backgroundColor = this.options.background
        this.dirty = true
    }
    resize() {
        if (this.stream) this.buildStream()
        this.dirty = true
    }
    uniform(program, name) {
        let locations = this.uniforms.get(program)
        if (!locations) {
            locations = /* @__PURE__ */ new Map()
            this.uniforms.set(program, locations)
        }
        let location = locations.get(name)
        if (location === void 0) {
            location = this.gl.getUniformLocation(program, name)
            locations.set(name, location)
        }
        return location
    }
}
var smoothstep = (edge0, edge1, x) => {
    const t = Math.min(
        1,
        Math.max(0, (x - edge0) / Math.max(1e-6, edge1 - edge0))
    )
    return t * t * (3 - 2 * t)
}
//#endregion
//#region src/controls.ts
function framerControls(schema) {
    const controls = {}
    for (const [key, def] of Object.entries(schema))
        controls[key] = framerControl(def)
    return controls
}
function framerControl(def) {
    const base = {
        title: def.label,
        ...(def.description ? { description: def.description } : {}),
    }
    switch (def.type) {
        case "number":
            return {
                ...base,
                type: "number",
                defaultValue: def.default,
                min: def.min,
                max: def.max,
                step: def.step,
            }
        case "color":
            return {
                ...base,
                type: "color",
                defaultValue: def.default,
            }
        case "colors":
            return {
                ...base,
                type: "array",
                control: { type: "color" },
                defaultValue: [...def.default],
                ...(def.maxItems !== void 0 ? { maxCount: def.maxItems } : {}),
            }
        case "boolean":
            return {
                ...base,
                type: "boolean",
                defaultValue: def.default,
            }
        case "select":
            return {
                ...base,
                type: "enum",
                options: [...def.choices],
                optionTitles: def.choices.map(
                    (c) => c.charAt(0).toUpperCase() + c.slice(1)
                ),
                defaultValue: def.default,
            }
        case "image":
            return {
                ...base,
                type: "responsiveimage",
            }
    }
}
/**
 * Converts Framer prop values into option input: unwraps color tokens
 * (`var(--token-…, rgb(…))`) and responsive images (`{ src, srcSet }`).
 * Core then validates and normalizes everything (rgb() → hex, ranges, ...).
 */
function fromFramerProps(schema, props) {
    const out = {}
    for (const [key, def] of Object.entries(schema)) {
        const value = props[key]
        if (value === void 0 || value === null) continue
        switch (def.type) {
            case "color":
                out[key] = unwrapToken(value)
                break
            case "colors":
                out[key] = Array.isArray(value) ? value.map(unwrapToken) : value
                break
            case "image":
                out[key] = typeof value === "object" ? (value.src ?? "") : value
                break
            default:
                out[key] = value
        }
    }
    return out
}
/** `var(--token-x, rgb(1, 2, 3))` → `rgb(1, 2, 3)`; anything else unchanged. */
function unwrapToken(value) {
    if (typeof value !== "string") return value
    const match = /^var\(\s*--[^,]+,\s*(.+)\)$/.exec(value.trim())
    return match ? unwrapToken(match[1]) : value
}
//#endregion
//#region ../react/src/use-effect-instance.ts
/**
 * Mounts an effect on `containerRef` for the lifetime of the component and
 * keeps its options in sync with `options` on every render.
 *
 * Options are resolved against the schema defaults first, so removing a prop
 * resets that option instead of keeping its last value.
 */
function useEffectInstance(containerRef, create, options, externalRef) {
    const effectRef = useRef(null)
    const latest = useRef(options)
    latest.current = options
    useEffect(() => {
        const container = containerRef.current
        if (!container) return
        const effect = create()
        effectRef.current = effect
        if (externalRef) externalRef.current = effect
        effect.mount(container, resolveOptions(effect.schema, latest.current))
        return () => {
            effect.destroy()
            effectRef.current = null
            if (externalRef) externalRef.current = null
        }
    }, [])
    useEffect(() => {
        const effect = effectRef.current
        if (effect) effect.update(resolveOptions(effect.schema, options))
    })
    return effectRef
}
//#endregion
//#region src/use-framer-effect.ts
/**
 * Mounts the effect on the element the returned ref is attached to. The
 * components render that element themselves, in JSX: Framer only inserts
 * code components whose default export returns JSX.
 */
function useFramerEffect(create, schema, props) {
    const ref = useRef(null)
    const options = fromFramerProps(schema, props)
    const target = RenderTarget.current()
    if (target === RenderTarget.thumbnail || target === RenderTarget.export)
        options.reducedMotion = "always"
    useEffectInstance(ref, create, options)
    return ref
}
//#endregion
//#region src/components/Crest.tsx
var create = () => new Crest$1()
var schema = create().schema
/** Shown until the first image is added, so the component explains itself the moment it is dropped in. */
var SAMPLES = [
    "1524504388940-b1c1722653e1",
    "1534528741775-53994a69daeb",
    "1438761681033-6461ffad8d80",
    "1506794778202-cad84cf45f1d",
    "1531746020798-e6953c6e8e04",
    "1539571696357-5a69c17a67c6",
    "1494790108377-be9c29b29330",
    "1507003211169-0a1dd7228f2d",
    "1517841905240-472988babdf9",
    "1500648767791-00dcc994a43e",
    "1529626455594-4ff0802cfb7e",
    "1488426862026-3ee34a7d66df",
].map((id, i) => ({
    image: {
        src: `https://images.unsplash.com/photo-${id}?w=1200&q=80&auto=format`,
        alt: `Sample portrait ${i + 1}`,
    },
}))
/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 800
 */
export default function Crest(props) {
    const added = (props.slides ?? []).filter((slide) => slide?.image?.src)
    const slides = added.length ? added : SAMPLES
    const ref = useFramerEffect(create, schema, props)
    return (
        <div
            ref={ref}
            style={{
                width: "100%",
                height: "100%",
                ...props.style,
            }}
        >
            {slides.map((slide, i) => {
                const img = (
                    <img
                        src={slide.image.src}
                        srcSet={slide.image.srcSet}
                        alt={slide.image.alt ?? ""}
                    />
                )
                return slide.link ? (
                    <a key={i} href={slide.link}>
                        {img}
                    </a>
                ) : (
                    <div key={i}>{img}</div>
                )
            })}
        </div>
    )
}
addPropertyControls(Crest, {
    slides: {
        type: "array",
        title: "Images",
        description: "Sample portraits show until you add your first image.",
        maxCount: 40,
        control: {
            type: "object",
            controls: {
                image: {
                    type: "responsiveimage",
                    title: "Image",
                },
                link: {
                    type: "link",
                    title: "Link",
                },
            },
        },
    },
    ...framerControls(schema),
})
//#endregion
