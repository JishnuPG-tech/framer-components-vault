import {
    useCallback,
    useEffect,
    useId,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from "react"
import type { CSSProperties, ReactNode } from "react"
// @ts-ignore – useRouter ships with the Framer runtime
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

// @ts-ignore – Framer resolves URL imports at runtime
import * as SplideModule from "https://framer.com/m/splide-FUtrTp.js@9xyMzTuwVik6Rrl7kV7p"

const Splide: any =
    (SplideModule as any).Splide ?? (SplideModule as any).default

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

type Slide = {
    src?: string
    srcSet?: string
    alt?: string
    eyebrow?: string
    heading?: string
    description?: string
    descriptionHtml?: string
    linkLabel?: string
    link?: string
}

/* -------------------------------------------------------------------------- */
/*  Defaults (merged with props so partially-filled Object controls are safe)  */
/* -------------------------------------------------------------------------- */

const D = {
    layout: {
        imagePosition: "right",
        textWidth: 34,
        gap: 32,
        padding: 24,
        align: "left",
        vertical: "start",
        navPlacement: "bottom",
        textGap: 16,
        mobileEnabled: true,
        mobileBreakpoint: 720,
        mobileImagePosition: "top",
        mobileGap: 24,
        mobilePadding: 20,
    },
    image: {
        ratio: "fill",
        mobileRatio: "4 / 3",
        fit: "cover",
        position: "50% 50%",
        radius: 0,
        background: "#0F0F0F",
    },
    counter: {
        show: false,
        format: "index",
        separator: "/",
        pad: true,
        font: {},
        color: "#9094B8",
        spacing: 0,
    },
    eyebrow: {
        show: false,
        font: {},
        color: "#9094B8",
        spacing: 0,
    },
    heading: {
        font: {},
        color: "#FFFFFF",
        tag: "h2",
    },
    description: {
        font: {},
        color: "#9094B8",
        maxLines: 0,
    },
    link: {
        show: true,
        clickTarget: "none",
        label: "See project",
        font: {},
        color: "#FFFFFF",
        hoverColor: "#FFFFFF",
        spacing: 16,
        arrow: "",
        arrowGap: 6,
        arrowNudge: 4,
        underlineThickness: 2,
        underlineOffset: 4,
        underlineColor: "#9094B8",
        underlineHoverColor: "#FFFFFF",
        underlineEffect: "none",
        newTab: false,
        hideEmpty: true,
    },
    nav: {
        show: true,
        arrows: true,
        indicator: "dots",
        arrowLayout: "split",
        arrowPlacement: "nav",
        indicatorPlacement: "nav",
        indicatorPosition: "bottom-center",
        indicatorInset: 16,
        indicatorBackground: "rgba(0,0,0,0)",
        imageArrowInset: 16,
        imageArrowBackground: "rgba(0,0,0,0)",
        imageArrowRadius: 999,
        arrowSource: "icon",
        svgRecolor: true,
        disabledOpacity: 0.4,
        arrowIcon: "chevron",
        arrowSize: 16,
        arrowStroke: 2,
        activeColor: "#FFFFFF",
        inactiveColor: "#9094B8",
        hoverColor: "#FFFFFF",
        counterColor: "#9094B8",
        counterFont: {},
        counterSeparator: "/",
        counterPad: false,
        gap: 14,
        dotSize: 8,
        dotActiveWidth: 24,
        dotGap: 8,
        textSpacing: 24,
        marginTop: 24,
    },
    slider: {
        transition: "slide",
        loop: false,
        motion: { type: "tween", duration: 0.6, ease: [0.25, 1, 0.5, 1] },
        drag: true,
        grabCursor: true,
        dragTarget: "image",
        keyboard: true,
        wheel: false,
        autoplay: false,
        interval: 5,
        pauseOnHover: true,
        startIndex: 0,
        label: "Project slider",
    },
    panel: {
        mode: "column",
        background: "rgba(0,0,0,0)",
        padding: "0px",
        radius: 0,
        width: "fill",
    },
    motion: {
        textAnimation: "rise",
        motion: { type: "tween", duration: 0.6, ease: [0.25, 1, 0.5, 1] },
        distance: 14,
        stagger: 70,
    },
} as const

/* -------------------------------------------------------------------------- */
/*  Splide core CSS (inlined so no stylesheet import is needed)                */
/* -------------------------------------------------------------------------- */

const SPLIDE_CORE = `
.splide__container{box-sizing:border-box;position:relative}
.splide__list{backface-visibility:hidden;display:flex;height:100%;margin:0!important;padding:0!important}
.splide.is-initialized:not(.is-active) .splide__list{display:block}
.splide{position:relative}
.splide__slide{backface-visibility:hidden;box-sizing:border-box;flex-shrink:0;list-style-type:none!important;margin:0;position:relative}
.splide__slide img{vertical-align:bottom}
.splide__track{overflow:hidden;position:relative;z-index:0}
.splide--fade>.splide__track>.splide__list{display:block}
.splide--fade>.splide__track>.splide__list>.splide__slide{left:0;opacity:0;position:absolute;top:0}
.splide--fade>.splide__track>.splide__list>.splide__slide.is-active{opacity:1;position:relative;z-index:1}
.splide--draggable>.splide__track>.splide__list>.splide__slide{-webkit-user-select:none;user-select:none}
.splide__sr{clip:rect(0 0 0 0);border:0;height:1px;margin:-1px;overflow:hidden;padding:0;position:absolute;width:1px}
`

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const pad2 = (n: number, on: boolean) => (on && n < 10 ? `0${n}` : `${n}`)

const px = (v: any) => (typeof v === "number" ? `${v}px` : v)

/* ---------------------------- page link helpers --------------------------- */

/** Absolute URL or a non-page scheme (http:, mailto:, data:, …). */
const isAbsoluteHref = (href: string) =>
    /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(href)

/** Links that leave the site. */
const isExternalHref = (href: string) =>
    /^(?:https?:\/\/|\/\/|mailto:|tel:)/i.test(href)

/**
 * CMS link fields store page paths relative to the site root ("./blog/slug"),
 * which the browser would resolve against the current page. Framer's own
 * <Link> emits root-relative paths, so normalise to the same shape.
 */
function normalizeHref(href: string): string {
    const raw = href.trim()
    if (!raw || isAbsoluteHref(raw) || raw.startsWith("#")) return raw
    try {
        const base =
            typeof window !== "undefined" && window.location?.origin
                ? `${window.location.origin}/`
                : "https://framer.local/"
        const url = new URL(raw, base)
        return url.pathname + url.search + url.hash
    } catch {
        return raw.startsWith("/") ? raw : `/${raw}`
    }
}

/**
 * Rewrite links inside cloned CMS markup so they keep working outside the
 * source Collection List (root-relative, same shape Framer's <Link> emits).
 */
function normalizeHtmlLinks(html: string): string {
    if (!html || typeof document === "undefined") return html
    const tpl = document.createElement("template")
    tpl.innerHTML = html
    tpl.content.querySelectorAll("a[href]").forEach((a) => {
        const href = a.getAttribute("href") || ""
        if (!href || href.startsWith("#") || isAbsoluteHref(href)) return
        a.setAttribute("href", normalizeHref(href))
    })
    return tpl.innerHTML
}

/** Match a pathname against a Framer route path such as "/blog/:HgQam63Fx". */
function matchRoutePath(
    pattern: any,
    pathname: string
): Record<string, string> | null {
    if (typeof pattern !== "string" || !pattern) return null
    const pat = pattern.replace(/\/+$/, "") || "/"
    const path = pathname.replace(/\/+$/, "") || "/"
    if (pat === path) return {}
    if (!pat.includes(":")) return null
    const patSegs = pat.split("/").filter(Boolean)
    const pathSegs = path.split("/").filter(Boolean)
    if (patSegs.length !== pathSegs.length) return null
    const vars: Record<string, string> = {}
    for (let i = 0; i < patSegs.length; i++) {
        const seg = patSegs[i]
        if (seg.startsWith(":")) {
            try {
                vars[seg.slice(1)] = decodeURIComponent(pathSegs[i])
            } catch {
                vars[seg.slice(1)] = pathSegs[i]
            }
        } else if (seg !== pathSegs[i]) {
            return null
        }
    }
    return vars
}

/** Resolve a site path to { routeId, pathVariables } through router.routes. */
function resolveRoutePath(
    routes: any,
    pathname: string
): { routeId: string; pathVariables: Record<string, string> } | null {
    if (!routes || typeof routes !== "object") return null
    const ids = Object.keys(routes)
    if (!ids.length) return null
    const path = pathname.replace(/\/+$/, "") || "/"

    // Exact (static) paths win over dynamic patterns.
    for (const id of ids) {
        const p = routes[id]?.path
        if (typeof p === "string" && (p.replace(/\/+$/, "") || "/") === path) {
            return { routeId: id, pathVariables: {} }
        }
    }

    // Dynamic paths ("/blog/:HgQam63Fx"), optionally behind a locale prefix.
    const segs = path.split("/").filter(Boolean)
    const targets = [path]
    if (segs.length > 1) targets.push(`/${segs.slice(1).join("/")}`)
    for (const target of targets) {
        for (const id of ids) {
            const vars = matchRoutePath(routes[id]?.path, target)
            if (vars) return { routeId: id, pathVariables: vars }
        }
    }
    return null
}

/* ---------------- Framer transition → CSS duration + easing ---------------- */

const NAMED_EASE: Record<string, number[] | "linear"> = {
    linear: "linear",
    easeIn: [0.42, 0, 1, 1],
    easeOut: [0, 0, 0.58, 1],
    easeInOut: [0.42, 0, 0.58, 1],
    circIn: [0.55, 0, 1, 0.45],
    circOut: [0, 0.55, 0.45, 1],
    circInOut: [0.85, 0, 0.15, 1],
    backIn: [0.36, 0, 0.66, -0.56],
    backOut: [0.34, 1.56, 0.64, 1],
    backInOut: [0.68, -0.6, 0.32, 1.6],
    anticipate: [0.68, -0.6, 0.32, 1.6],
}

/** Sample a damped spring (0→1) into a CSS linear() easing. */
function springToCss(t: any): { ms: number; easing: string } {
    let mass = t.mass ?? 1
    let stiffness: number
    let damping: number
    if (t.stiffness != null || t.damping != null) {
        stiffness = t.stiffness ?? 100
        damping = t.damping ?? 10
    } else {
        const dur = Math.max(0.05, t.duration ?? 0.5)
        const bounce = Math.min(0.95, Math.max(0, t.bounce ?? 0.2))
        stiffness = Math.pow((2 * Math.PI) / dur, 2) * mass
        damping = 2 * (1 - bounce) * Math.sqrt(stiffness * mass)
    }
    const w0 = Math.sqrt(stiffness / mass)
    const zeta = damping / (2 * Math.sqrt(stiffness * mass))
    const pos = (time: number) => {
        if (zeta < 1) {
            const wd = w0 * Math.sqrt(1 - zeta * zeta)
            return (
                1 -
                Math.exp(-zeta * w0 * time) *
                    (Math.cos(wd * time) +
                        ((zeta * w0) / wd) * Math.sin(wd * time))
            )
        }
        if (zeta === 1) return 1 - Math.exp(-w0 * time) * (1 + w0 * time)
        const s = Math.sqrt(zeta * zeta - 1)
        const r1 = -w0 * (zeta - s)
        const r2 = -w0 * (zeta + s)
        return (
            1 -
            (r2 * Math.exp(r1 * time) - r1 * Math.exp(r2 * time)) / (r2 - r1)
        )
    }
    // find settle time
    let settle = 0.1
    for (let time = 0; time < 4; time += 0.01) {
        if (Math.abs(pos(time) - 1) > 0.002) settle = time + 0.01
    }
    settle = Math.min(4, Math.max(0.15, settle))
    const pts: string[] = []
    const steps = 48
    for (let i = 0; i <= steps; i++) {
        const v = i === steps ? 1 : pos((i / steps) * settle)
        pts.push(String(Math.round(v * 1000) / 1000))
    }
    return { ms: Math.round(settle * 1000), easing: `linear(${pts.join(",")})` }
}

function resolveTransition(t: any): { ms: number; easing: string } {
    const fallback = { ms: 600, easing: "cubic-bezier(0.25, 1, 0.5, 1)" }
    if (!t || typeof t !== "object") return fallback
    if (t.type === false) return { ms: 0, easing: "linear" }
    if (t.type === "spring") return springToCss(t)
    const ms = Math.round((t.duration ?? 0.6) * 1000)
    let e: any = t.ease
    if (typeof e === "string") e = NAMED_EASE[e] ?? NAMED_EASE.easeOut
    if (e === "linear") return { ms, easing: "linear" }
    if (Array.isArray(e) && e.length === 4)
        return { ms, easing: `cubic-bezier(${e.join(",")})` }
    return { ms, easing: fallback.easing }
}

/** Live CMS layers per slide, kept outside React state (DOM is circular). */
type CmsLiveEls = {
    heading: (HTMLElement | undefined)[]
    eyebrow: (HTMLElement | undefined)[]
    desc: (HTMLElement | undefined)[]
    buttons: (HTMLElement | undefined)[]
}

const PLACEHOLDER_ATTR = "data-fsl-live-placeholder"

const TEXT_SEL = "h1,h2,h3,h4,h5,h6,p"
const EMBED_SEL = "img,video,iframe,svg,canvas,picture,object,embed"

/**
 * A CMS layer called “Title” is often a stack that wraps the whole card. Moving
 * such a wrapper into the text column would drag half the card along (and the
 * height sizer would copy it for every slide), so only accept layers that hold
 * at most one text block and no media.
 */
function textLeafOf(
    el: HTMLElement | null | undefined
): HTMLElement | undefined {
    if (!el) return undefined
    if (el.querySelector(EMBED_SEL)) return undefined
    const blocks = el.querySelectorAll(TEXT_SEL)
    return blocks.length <= 1 ? el : undefined
}

/** Which kind of live layer a placeholder clone stands in for. */
const placeholderKind = (el: Element | null | undefined): string | null =>
    el?.closest(`[${PLACEHOLDER_ATTR}]`)?.getAttribute(PLACEHOLDER_ATTR) ?? null

/**
 * Mount a live CMS layer inside the slider so its own markup, styling and
 * interactions are used as-is. A hidden clone holds its place in the
 * Collection List and is swapped back when the host element goes away.
 */
function useLiveCmsNode(el: HTMLElement | undefined, kind: string) {
    const hostRef = useRef<HTMLElement | null>(null)
    const elRef = useRef<HTMLElement | undefined>(el)
    const restoreRef = useRef<(() => void) | null>(null)

    const detach = useCallback(() => {
        const restore = restoreRef.current
        restoreRef.current = null
        if (!restore) return
        try {
            restore()
        } catch {
            /* Framer may have re-rendered the list first – nothing to undo */
        }
    }, [])

    const attach = useCallback(
        (host: HTMLElement | null) => {
            if (hostRef.current === host && elRef.current === el) return
            detach()
            hostRef.current = host
            elRef.current = el
            if (!host || !el || el === host) return
            const parent = el.parentNode
            if (!parent) return
            const placeholder = el.cloneNode(true) as HTMLElement
            placeholder.setAttribute(PLACEHOLDER_ATTR, kind)
            placeholder.setAttribute("aria-hidden", "true")
            try {
                parent.insertBefore(placeholder, el)
                host.appendChild(el)
            } catch {
                if (placeholder.parentNode)
                    placeholder.parentNode.removeChild(placeholder)
                return
            }
            restoreRef.current = () => {
                try {
                    if (placeholder.parentNode === parent)
                        parent.insertBefore(el, placeholder)
                    else if (el.parentNode === host) parent.appendChild(el)
                    if (placeholder.parentNode)
                        placeholder.parentNode.removeChild(placeholder)
                } catch {
                    /* Framer may have re-rendered the list first – nothing to undo */
                }
            }
        },
        [detach, el, kind]
    )

    return attach
}

/**
 * Read slides out of a Framer Collection List dropped into the CMS slot.
 */
function readCmsRows(root: HTMLElement | null, liveOut?: CmsLiveEls): Slide[] {
    if (!root) return []
    const kids = (el: HTMLElement) =>
        Array.from(el.children).filter(
            (c) => !/^(STYLE|SCRIPT|TEMPLATE|LINK|NOSCRIPT)$/.test(c.tagName)
        ) as HTMLElement[]

    const TEXT = "h1,h2,h3,h4,h5,h6,p"
    const hasImg = (e: Element) =>
        e.tagName === "IMG" || !!e.querySelector("img")
    const hasText = (e: Element) => !!e.querySelector(TEXT)
    const imagesExist = !!root.querySelector("img")
    const isRow = imagesExist
        ? (e: Element) => hasImg(e) && hasText(e)
        : (e: Element) => hasText(e)

    let rows: HTMLElement[] = []
    const queue: HTMLElement[] = [root]
    while (queue.length) {
        const el = queue.shift()!
        const k = kids(el)
        const cand = k.filter(isRow)
        if (cand.length >= 2) {
            rows = cand
            break
        }
        queue.push(...k)
    }
    if (!rows.length && (imagesExist || root.querySelector(TEXT))) {
        rows = [root]
    }

    const named = (row: HTMLElement, keys: string[]) =>
        row.querySelector(
            keys.map((k) => `[data-framer-name*="${k}" i]`).join(",")
        ) as HTMLElement | null
    const txt = (el: Element | null | undefined) =>
        (el?.textContent || "").replace(/\s+/g, " ").trim()

    const entries = rows
        .map((row) => {
            const imgHost = named(row, [
                "image",
                "img",
                "cover",
                "thumb",
                "photo",
                "picture",
                "media",
            ])
            const img = (
                imgHost?.tagName === "IMG"
                    ? imgHost
                    : imgHost?.querySelector("img") || row.querySelector("img")
            ) as HTMLImageElement | null

            const eyebrowEl = named(row, [
                "eyebrow",
                "category",
                "kicker",
                "tag",
            ])
            function eyebrowLayerOf(
                el: HTMLElement | null | undefined
            ): HTMLElement | undefined {
                if (!el) return undefined
                const blocks = el.querySelectorAll(TEXT_SEL)
                return blocks.length <= 1 ? el : undefined
            }
            const eyebrowBlock = eyebrowLayerOf(eyebrowEl)

            const btnCandidate = named(row, ["buttons", "button", "cta"])
            const btnEl =
                btnCandidate &&
                !btnCandidate.querySelector("h1,h2,h3,h4,h5,h6") &&
                !(img && btnCandidate.contains(img)) &&
                !(eyebrowEl && btnCandidate.contains(eyebrowEl)) &&
                !eyebrowEl?.contains(btnCandidate)
                    ? btnCandidate
                    : undefined

            const blocks = Array.from(row.querySelectorAll(TEXT_SEL)).filter(
                (b) => txt(b) && !eyebrowEl?.contains(b) && !btnEl?.contains(b)
            )
            const firstHeading = (blocks.find((b) =>
                /^H[1-6]$/.test(b.tagName)
            ) || blocks[0]) as HTMLElement | undefined

            const headEl = named(row, ["heading", "title", "name"])
            const headBlock = textLeafOf(headEl) || firstHeading
            const descEl = named(row, [
                "description",
                "desc",
                "summary",
                "excerpt",
                "subtitle",
                "body",
            ])
            const heading = txt(headBlock)

            const wrapsOther = (el: HTMLElement) =>
                (headBlock && el.contains(headBlock)) ||
                (eyebrowEl && el.contains(eyebrowEl)) ||
                (btnEl && el.contains(btnEl)) ||
                (img && el.contains(img))
            let descBlock: HTMLElement | undefined =
                descEl && !wrapsOther(descEl) ? descEl : undefined
            if (
                !descBlock ||
                descBlock === headBlock ||
                descBlock === eyebrowBlock ||
                (btnEl &&
                    (btnEl.contains(descBlock) || descBlock.contains(btnEl)))
            )
                descBlock = blocks.find(
                    (b) =>
                        b !== firstHeading &&
                        b !== headBlock &&
                        b !== eyebrowBlock
                ) as HTMLElement | undefined
            if (descBlock === headBlock || descBlock === eyebrowBlock)
                descBlock = undefined

            if (!descBlock && !descEl && headBlock) {
                const excluded = [
                    eyebrowEl,
                    btnCandidate,
                    btnEl,
                    imgHost,
                    img,
                    headBlock,
                ]
                let node: HTMLElement | null = headBlock
                while (node && node !== row && !descBlock) {
                    const parent: HTMLElement | null = node.parentElement
                    if (!parent) break
                    descBlock = Array.from(parent.children).find((c) => {
                        if (
                            c === node ||
                            /^(STYLE|SCRIPT|TEMPLATE|LINK|NOSCRIPT)$/.test(
                                c.tagName
                            )
                        )
                            return false
                        if (
                            excluded.some(
                                (x) =>
                                    x &&
                                    (c === x || c.contains(x) || x.contains(c))
                            )
                        )
                            return false
                        return !!txt(c) || !!c.querySelector(EMBED_SEL)
                    }) as HTMLElement | undefined
                    node = parent
                }
            }

            const liveHead = placeholderKind(headBlock) ? undefined : headBlock
            const liveEyebrow = placeholderKind(eyebrowBlock)
                ? undefined
                : eyebrowBlock
            const liveDesc = placeholderKind(descBlock) ? undefined : descBlock
            const liveButtons =
                btnEl && !placeholderKind(btnEl) ? btnEl : undefined
            const description = txt(descBlock)
            const descriptionHtml = descBlock?.querySelector("*")
                ? normalizeHtmlLinks(descBlock.innerHTML.trim())
                : undefined

            const validHref = (h?: string | null) =>
                !!h &&
                h.trim() !== "" &&
                h.trim() !== "#" &&
                !/^javascript:/i.test(h)
            const urlLike = (t: string) =>
                /^(https?:\/\/|mailto:|tel:|\/|\.\/|\.\.\/|#.+)/i.test(t)
            let href: string | undefined

            const linkHost =
                btnEl ||
                named(row, ["link", "cta", "button"]) ||
                (row.querySelector(
                    '[data-framer-name="url" i]'
                ) as HTMLElement | null)
            if (linkHost) {
                const la = (linkHost.closest("a") ||
                    linkHost.querySelector(
                        "a[href]"
                    )) as HTMLAnchorElement | null
                const h = la?.getAttribute("href")
                if (validHref(h)) href = h!
                const t = txt(linkHost)
                if (!href && urlLike(t)) href = t
            }
            if (!href) {
                const any = Array.from(row.querySelectorAll("a[href]")).find(
                    (x) =>
                        validHref(x.getAttribute("href")) &&
                        !eyebrowEl?.contains(x)
                )
                if (any) href = any.getAttribute("href")!
            }
            if (!href) {
                const wrap = row.matches("a") ? row : row.closest("a")
                const h = wrap?.getAttribute("href")
                if (validHref(h)) href = h!
            }

            return {
                slide: {
                    src:
                        img?.currentSrc ||
                        img?.getAttribute("src") ||
                        undefined,
                    srcSet: img?.getAttribute("srcset") || undefined,
                    alt: img?.alt || heading,
                    eyebrow: txt(eyebrowEl),
                    heading,
                    description,
                    descriptionHtml,
                    link: href,
                } as Slide,
                heading: liveHead,
                eyebrow: liveEyebrow,
                desc: liveDesc,
                buttons: liveButtons,
            }
        })
        .filter((s) => s.slide.src || s.slide.heading)

    if (liveOut) {
        entries.forEach((e, i) => {
            if (e.heading) liveOut.heading[i] = e.heading
            if (e.eyebrow) liveOut.eyebrow[i] = e.eyebrow
            if (e.desc) liveOut.desc[i] = e.desc
            if (e.buttons) liveOut.buttons[i] = e.buttons
        })
        liveOut.heading.length = entries.length
        liveOut.eyebrow.length = entries.length
        liveOut.desc.length = entries.length
        liveOut.buttons.length = entries.length
    }
    return entries.map((e) => e.slide)
}

const cleanSvg = (str: string) =>
    (str || "")
        .replace(/<\?xml[\s\S]*?\?>/gi, "")
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/\son[a-z]+\s*=\s*"[^"]*"/gi, "")
        .replace(/\son[a-z]+\s*=\s*'[^']*'/gi, "")
        .replace(/javascript:/gi, "")
        .trim()

const Chevron = ({ size, stroke, icon }: any) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
    >
        {icon === "arrow" ? (
            <path d="M19 12H5M11 6l-6 6 6 6" />
        ) : (
            <path d="M15 5l-7 7 7 7" />
        )}
    </svg>
)

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/*                                                                             */
/*  @framerIntrinsicWidth 1200                                                 */
/*  @framerIntrinsicHeight 560                                                 */
/*  @framerSupportedLayoutWidth any                                            */
/*  @framerSupportedLayoutHeight auto                                          */
/* -------------------------------------------------------------------------- */

export default function CMSTwoColumnSlider(props: any) {
    const {
        source = "manual",
        items = [],
        cmsSlot,
        editSlot = false,
        prevComponent,
        nextComponent,
        prevCode = "",
        nextCode = "",
        prevFile = "",
        nextFile = "",
    } = props
    const background = props.background ?? "#000000"
    const L = { ...D.layout, ...props.layout }
    if (L.vertical === "split" || L.vertical === "indexMiddle")
        L.vertical = "textCenter"
    const I = { ...D.image, ...props.image }
    const H = { ...D.heading, ...props.heading }
    const Cn = { ...D.counter, ...props.counter }
    const Ey = { ...D.eyebrow, ...props.eyebrow }
    const Ds = { ...D.description, ...props.description }
    const K = { ...D.link, ...props.link }
    const N = { ...D.nav, ...props.nav }
    const navTextSpacing =
        props.nav?.textSpacing ?? props.nav?.marginTop ?? D.nav.textSpacing
    const S = { ...D.slider, ...props.slider }
    const M = { ...D.motion, ...props.motion }
    const P = { ...D.panel, ...props.panel }

    const prevSvgCode = (props.nav?.prevCode ?? prevCode) || ""
    const nextSvgCode = (props.nav?.nextCode ?? nextCode) || ""

    const clickTarget: string =
        props.link?.clickTarget ??
        (props.image?.clickToOpen || props.image?.imageLinks ? "image" : "none")
    const clickOnImage = clickTarget === "image" || clickTarget === "both"
    const clickOnText = clickTarget === "text" || clickTarget === "both"

    const scope = "fsl" + useId().replace(/[^a-zA-Z0-9]/g, "")
    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const isPreview = RenderTarget.current() === RenderTarget.preview

    const router: any = typeof useRouter === "function" ? useRouter() : null
    const isFramerPreview =
        isPreview &&
        typeof window !== "undefined" &&
        window.location.hostname.includes("framercanvas.com")

    const navigatePreview = (href: string) => {
        if (isExternalHref(href)) {
            window.open(href, "_blank")
            return
        }
        const path = normalizeHref(href).split(/[?#]/)[0]
        const match = resolveRoutePath(router?.routes, path)
        if (match && typeof router?.navigate === "function") {
            router.navigate(match.routeId, "", match.pathVariables)
            return
        }
        console.warn(
            "[ProjectSlider] No Framer route matches",
            path,
            "– available routes:",
            Object.keys(router?.routes ?? {})
        )
    }

    const linkProps = (href?: string, newTab?: boolean) => {
        const raw = (href || "").trim()
        const external = isExternalHref(raw)
        const native = !raw || raw.startsWith("#") || isAbsoluteHref(raw)
        return {
            href: raw ? normalizeHref(raw) : undefined,
            target: newTab ? "_blank" : undefined,
            rel: newTab ? "noopener noreferrer" : undefined,
            onClick: (e: any) => {
                if (!raw || !isFramerPreview || (native && !external)) return
                e.preventDefault()
                activateLink(raw, newTab)
            },
        }
    }

    const activateLink = (href: string, newTab?: boolean) => {
        if (isFramerPreview) {
            navigatePreview(href)
            return
        }
        const target = normalizeHref(href)
        if (newTab) {
            window.open(target, "_blank", "noopener,noreferrer")
            return
        }
        window.location.assign(target)
    }

    const onRichLinkCapture = (e: any) => {
        if (!isFramerPreview) return
        const a = (e.target as HTMLElement | null)?.closest?.("a[href]")
        if (!a) return
        const href = a.getAttribute("href") || ""
        if (!href || href.startsWith("#") || isExternalHref(href)) return
        e.preventDefault()
        e.stopPropagation()
        activateLink(href, K.newTab || a.getAttribute("target") === "_blank")
    }

    /* ------------------------------ slide data ------------------------------ */
    const cmsRef = useRef<HTMLDivElement>(null)
    const [cmsSlides, setCmsSlides] = useState<Slide[]>([])
    const cmsLive = useRef<CmsLiveEls>({
        heading: [],
        eyebrow: [],
        desc: [],
        buttons: [],
    })

    useEffect(() => {
        if (source !== "cms") return
        const el = cmsRef.current
        if (!el) return
        let raf = 0
        let last = ""
        const read = () => {
            const next = readCmsRows(el, cmsLive.current)
            const sig = JSON.stringify(next)
            if (sig !== last) {
                last = sig
                setCmsSlides(next)
            }
        }
        const schedule = () => {
            cancelAnimationFrame(raf)
            raf = requestAnimationFrame(read)
        }
        read()
        const t1 = setTimeout(read, 400)
        const t2 = setTimeout(read, 1500)
        const mo = new MutationObserver(schedule)
        mo.observe(el, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ["src", "srcset", "href"],
            characterData: true,
        })
        return () => {
            mo.disconnect()
            cancelAnimationFrame(raf)
            clearTimeout(t1)
            clearTimeout(t2)
        }
    }, [source, cmsSlot])

    const manualSlides: Slide[] = useMemo(
        () =>
            (items as any[]).map((it) => ({
                src: it?.image?.src,
                srcSet: it?.image?.srcSet,
                alt: it?.image?.alt || it?.heading,
                eyebrow: it?.eyebrow,
                heading: it?.heading,
                description: it?.description,
                linkLabel: it?.linkLabel,
                link: it?.link,
            })),
        [items]
    )

    const slides = source === "cms" ? cmsSlides : manualSlides
    const n = slides.length

    /* ------------------------------- slider -------------------------------- */
    const splideEl = useRef<HTMLDivElement>(null)
    const splideRef = useRef<any>(null)
    const activeRef = useRef(Math.max(0, (S.startIndex || 1) - 1))
    const dirRef = useRef(1)
    const changedRef = useRef(false)
    const [active, setActive] = useState(activeRef.current)

    const rootRef = useRef<HTMLDivElement>(null)
    const [hostMin, setHostMin] = useState(0)
    useLayoutEffect(() => {
        const start = rootRef.current?.parentElement
        if (!start) return
        const chain: HTMLElement[] = []
        for (
            let el: HTMLElement | null = start, i = 0;
            el && i < 4;
            i++, el = el.parentElement
        )
            chain.push(el)
        const measure = () => {
            for (const el of chain) {
                const raw = getComputedStyle(el).minHeight
                const px = /px$/.test(raw) ? parseFloat(raw) : 0
                if (px > 0) {
                    setHostMin(px)
                    return
                }
            }
            setHostMin(0)
        }
        measure()
        const ro =
            typeof ResizeObserver !== "undefined"
                ? new ResizeObserver(measure)
                : null
        const mo =
            typeof MutationObserver !== "undefined"
                ? new MutationObserver(measure)
                : null
        chain.forEach((el) => {
            ro?.observe(el)
            mo?.observe(el, {
                attributes: true,
                attributeFilter: ["style", "class"],
            })
        })
        return () => {
            ro?.disconnect()
            mo?.disconnect()
        }
    }, [])

    const slideT = useMemo(
        () => resolveTransition(S.motion),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [JSON.stringify(S.motion)]
    )
    const textT = resolveTransition(M.motion)

    const options = useMemo(
        () => ({
            type: S.transition === "fade" ? "fade" : S.loop ? "loop" : "slide",
            rewind: S.transition === "fade" ? !!S.loop : false,
            speed: slideT.ms,
            easing: slideT.easing,
            drag: !!S.drag,
            keyboard: S.keyboard ? "focused" : false,
            wheel: !!S.wheel,
            releaseWheel: true,
            autoplay: !!S.autoplay && !isCanvas,
            interval: (S.interval || 5) * 1000,
            pauseOnHover: !!S.pauseOnHover,
            pauseOnFocus: true,
            arrows: false,
            pagination: false,
            perPage: 1,
            label: S.label,
        }),
        [
            S.transition,
            S.loop,
            slideT.ms,
            slideT.easing,
            S.drag,
            S.keyboard,
            S.wheel,
            S.autoplay,
            S.interval,
            S.pauseOnHover,
            S.label,
            isCanvas,
        ]
    )

    const startIdx = Math.max(0, Math.round(S.startIndex || 1) - 1)
    const lastStart = useRef(startIdx)
    if (lastStart.current !== startIdx) {
        lastStart.current = startIdx
        activeRef.current = startIdx
        changedRef.current = false
    }
    const rebuildKey =
        slides.map((s) => s.src || s.heading).join("|") +
        JSON.stringify(options) +
        `|start${startIdx}`

    const layoutKey = [
        L.textWidth,
        L.gap,
        L.padding,
        L.imagePosition,
        L.mobileEnabled,
        L.mobileBreakpoint,
        L.mobileGap,
        L.mobilePadding,
        L.mobileImagePosition,
        I.ratio,
        I.fit,
        I.mobileRatio,
        P.mode,
        P.width,
        P.padding,
        P.radius,
    ].join("|")

    useEffect(() => {
        const el = splideEl.current
        if (!el || n === 0 || !Splide) return
        const start = Math.min(activeRef.current, n - 1)
        const instance = new Splide(el, { ...options, start })
        instance.on("move", (newIndex: number, prevIndex: number) => {
            let dir = newIndex >= prevIndex ? 1 : -1
            if (n > 2 && Math.abs(newIndex - prevIndex) === n - 1) dir = -dir
            dirRef.current = dir
            changedRef.current = true
            activeRef.current = newIndex
            setActive(newIndex)
        })
        instance.mount()
        splideRef.current = instance
        setActive(start)
        return () => {
            instance.destroy()
            splideRef.current = null
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rebuildKey])

    useLayoutEffect(() => {
        const el = splideEl.current
        if (!el) return
        let raf = 0
        let sig = ""
        const sync = () => {
            const r = el.getBoundingClientRect()
            if (!r.width || !r.height) return
            const next = `${Math.round(r.width)}x${Math.round(r.height)}`
            if (next === sig) return
            sig = next
            if (raf) cancelAnimationFrame(raf)
            raf = requestAnimationFrame(() => {
                raf = 0
                const inst = splideRef.current
                if (!inst) return
                const at = inst.index
                try {
                    inst.refresh()
                    if (typeof at === "number" && inst.index !== at)
                        inst.go(at, false)
                } catch {
                    /* instance was replaced by the mount effect */
                }
            })
        }
        sync()
        const ro =
            typeof ResizeObserver !== "undefined"
                ? new ResizeObserver(sync)
                : null
        ro?.observe(el)
        return () => {
            if (raf) cancelAnimationFrame(raf)
            ro?.disconnect()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [layoutKey, rebuildKey])

    const [fileSvgs, setFileSvgs] = useState<Record<string, string>>({})
    useEffect(() => {
        if (N.arrowSource !== "svg") return
        let alive = true
        ;[prevFile, nextFile]
            .filter((u: string) => u && !fileSvgs[u])
            .forEach((u: string) => {
                fetch(u)
                    .then((r) => r.text())
                    .then((txt) => {
                        if (alive) setFileSvgs((m) => ({ ...m, [u]: txt }))
                    })
                    .catch(() => {})
            })
        return () => {
            alive = false
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [N.arrowSource, prevFile, nextFile])

    const go = (c: string | number) => splideRef.current?.go(c)

    /* ------------------------------ derived UI ------------------------------ */
    const idx = Math.min(active, Math.max(n - 1, 0))
    const cur: Slide = slides[idx] || {}
    const looping = !!S.loop
    const prevDisabled = !looping && idx <= 0
    const nextDisabled = !looping && idx >= n - 1

    const showSlot = source === "cms" && isCanvas && (editSlot || !cmsSlot)

    /* --------- live CMS layers (title / eyebrow / description / buttons) ----- */
    const liveCms = source === "cms" && !showSlot
    const liveHeadEl = liveCms ? cmsLive.current.heading[idx] : undefined
    let liveEyebrowEl = liveCms ? cmsLive.current.eyebrow[idx] : undefined
    let liveDescEl = liveCms ? cmsLive.current.desc[idx] : undefined
    let liveButtonsEl = liveCms ? cmsLive.current.buttons[idx] : undefined

    if (liveHeadEl && liveDescEl && liveHeadEl.contains(liveDescEl))
        liveDescEl = undefined
    if (liveEyebrowEl && liveEyebrowEl === liveHeadEl) liveEyebrowEl = undefined
    if (
        liveDescEl &&
        (liveDescEl === liveHeadEl || liveDescEl === liveEyebrowEl)
    )
        liveDescEl = undefined
    if (
        liveEyebrowEl &&
        ((liveHeadEl && liveEyebrowEl.contains(liveHeadEl)) ||
            (liveDescEl && liveEyebrowEl.contains(liveDescEl)))
    )
        liveEyebrowEl = undefined
    if (
        liveButtonsEl &&
        [liveHeadEl, liveEyebrowEl, liveDescEl].some(
            (e) =>
                e &&
                (e === liveButtonsEl ||
                    e.contains(liveButtonsEl!) ||
                    liveButtonsEl!.contains(e))
        )
    )
        liveButtonsEl = undefined
    const headHostRef = useLiveCmsNode(liveHeadEl, "heading")
    const eyebrowHostRef = useLiveCmsNode(liveEyebrowEl, "eyebrow")
    const descHostRef = useLiveCmsNode(liveDescEl, "desc")
    const buttonsHostRef = useLiveCmsNode(liveButtonsEl, "buttons")

    const linkUrl = cur.link
    const linkLabel = cur.linkLabel || K.label
    const linkAllowed = K.show && (linkUrl || isCanvas || !K.hideEmpty)
    const showLink = source !== "cms" && linkAllowed && !!linkLabel
    const showButtons = K.show && !!liveButtonsEl

    const hitDown = useRef<{ x: number; y: number } | null>(null)
    const mediaLink = clickOnImage ? cur.link : undefined
    const copyLink = clickOnText ? cur.link : undefined

    const hitProps = (href?: string) => {
        if (!href) return {}
        return {
            onPointerDown: (e: any) => {
                hitDown.current = { x: e.clientX, y: e.clientY }
            },
            onClick: (e: any) => {
                if (e.defaultPrevented) return
                const start = hitDown.current
                hitDown.current = null
                if (
                    start &&
                    Math.hypot(e.clientX - start.x, e.clientY - start.y) > 8
                )
                    return
                const el = e.target as HTMLElement | null
                if (el?.closest?.('a[href], button, [role="button"]')) return
                e.preventDefault()
                activateLink(href, K.newTab)
            },
        }
    }

    const HeadingTag = (H.tag || "h2") as any
    const headingEm =
        (
            { h1: 2, h2: 1.5, h3: 1.17, h4: 1, h5: 0.83, h6: 0.67 } as Record<
                string,
                number
            >
        )[HeadingTag as string] || 1
    const headingFont: CSSProperties = {
        fontSize: `${headingEm}em`,
        ...(H.font as CSSProperties),
    }
    const animate = M.textAnimation !== "none" && changedRef.current

    /* --------------------------------- CSS ---------------------------------- */
    const reversed = L.imagePosition === "left"
    const t = Math.min(80, Math.max(15, L.textWidth))
    const cols = reversed
        ? `minmax(0,${100 - t}fr) minmax(0,${t}fr)`
        : `minmax(0,${t}fr) minmax(0,${100 - t}fr)`
    const areas = reversed ? `"media text"` : `"text media"`
    const mAreas =
        L.mobileImagePosition === "bottom" ? `"text" "media"` : `"media" "text"`
    const flex =
        L.align === "center"
            ? "center"
            : L.align === "right"
              ? "flex-end"
              : "flex-start"
    const vj =
        L.vertical === "center"
            ? "center"
            : L.vertical === "end"
              ? "flex-end"
              : "flex-start"
    const spreadMode = L.vertical === "spread" || L.vertical === "textCenter"
    const linkBottom = L.vertical === "spread"
    const centeredText = L.vertical === "textCenter"
    const fill = I.ratio === "fill"

    const css = `
${SPLIDE_CORE}
.${scope}{container-type:inline-size;width:100%;height:100%;min-height:inherit;position:relative;display:flex;flex-direction:column}
.${scope} .fsl-grid{display:grid;flex:1 1 auto;min-height:0;grid-template-columns:${cols};grid-template-areas:${areas};grid-template-rows:minmax(0,1fr);gap:${L.gap}px;padding:${L.padding}px;height:100%;box-sizing:border-box;background:${background}}
.${scope} .fsl-text{grid-area:text;display:flex;flex-direction:column;align-items:${flex};text-align:${L.align};min-width:0;min-height:0;box-sizing:border-box;${P.mode === "column" ? `background:${P.background};padding:${P.padding};border-radius:${P.radius}px;` : ""}}
.${scope} .fsl-copy{display:grid;grid-template-columns:minmax(0,1fr);grid-template-areas:"stack";grid-template-rows:${spreadMode ? "minmax(0,1fr)" : "auto"};align-content:${vj};align-self:stretch;${L.navPlacement === "bottom" || spreadMode ? "flex:1;" : ""}}
${L.vertical === "center" ? `.${scope} .fsl-copy{margin-top:auto}.${scope} .fsl-text>*:last-child{margin-bottom:auto}` : ""}
${L.vertical === "end" ? `.${scope} .fsl-copy{margin-top:auto}` : ""}
.${scope} .fsl-copy>*{grid-area:stack;min-width:0;max-width:100%}
.${scope} .fsl-ghost{display:grid;grid-template-columns:minmax(0,1fr);grid-template-areas:"stack";visibility:hidden!important;opacity:0!important;pointer-events:none!important;user-select:none!important}
.${scope} .fsl-ghost, .${scope} .fsl-ghost *{visibility:hidden!important;opacity:0!important;pointer-events:none!important}
.${scope} .fsl-box{display:flex;flex-direction:column;align-items:${flex};gap:${L.textGap}px;box-sizing:border-box;min-width:0;max-width:100%;justify-self:${P.width === "hug" ? flex : "stretch"};align-self:${L.navPlacement === "bottom" || spreadMode ? vj : "start"};${spreadMode ? "height:100%;" : ""}${P.mode === "content" ? `background:${P.background};padding:${P.padding};border-radius:${P.radius}px;` : ""}}
.${scope} .fsl-ghost>*{grid-area:stack;align-self:start;height:auto}
.${scope} .fsl-body{display:contents}
${centeredText ? `.${scope} .fsl-body{display:flex;flex-direction:column;align-items:${flex};gap:${L.textGap}px;min-width:0;max-width:100%;margin:auto 0}` : ""}
.${scope} .fsl-media{grid-area:media;position:relative;min-width:0;min-height:0;overflow:hidden;box-sizing:border-box;border-radius:${I.radius}px;background:${I.background};${fill ? "" : `aspect-ratio:${I.ratio};align-self:center;`}}
.${scope} .splide{position:absolute;inset:0}
.${scope} .splide__track,.${scope} .splide__list,.${scope} .splide__slide{height:100%}
.${scope} .splide__slide{width:100%}
.${scope} .fsl-img{display:block;width:100%;height:100%;object-fit:${I.fit};object-position:${I.position};-webkit-user-drag:none;user-select:none}
.${scope} .fsl-ph{display:flex;width:100%;height:100%;align-items:center;justify-content:center;color:${H.color};font:600 16px/1 sans-serif}
.${scope} .fsl-slide-link{display:block;width:100%;height:100%}
.${scope} .fsl-media[data-click="true"]{cursor:pointer}
.${scope} .fsl-click{cursor:pointer}
.${scope} .fsl-h,.${scope} .fsl-d,.${scope} .fsl-top{margin:0;max-width:100%}
.${scope} .fsl-live{display:block;width:100%;max-width:100%;min-width:0;white-space:normal;overflow-wrap:break-word}
.${scope} .fsl-live img,.${scope} .fsl-live video,.${scope} .fsl-live iframe{max-width:100%;height:auto}
.${scope} .fsl-d{white-space:pre-line;${Ds.maxLines > 0 ? `display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:${Ds.maxLines};overflow:hidden;` : ""}}
.${scope} .fsl-d.fsl-rich{white-space:normal;width:100%;max-width:100%;box-sizing:border-box;overflow-wrap:anywhere}
.${scope} .fsl-d.fsl-rich:not(.fsl-live)>*{margin:0;width:100%;max-width:100%;box-sizing:border-box;text-align:inherit;align-self:stretch}
.${scope} .fsl-d.fsl-rich:not(.fsl-live)>*+*{margin-top:.5em}
.${scope} .fsl-d.fsl-rich a{color:inherit;text-decoration:underline;text-underline-offset:.15em}
.${scope} .fsl-d.fsl-live{display:block;overflow:visible;white-space:normal}

.${scope} .fsl-linkrow{margin-top:${linkBottom ? "auto" : `${K.spacing}px`}}
.${scope} .fsl-grab{cursor:grab}
.${scope} .fsl-grab:active{cursor:grabbing}
.${scope} .fsl-grab .fsl-btn,.${scope} .fsl-grab .fsl-link,.${scope} .fsl-grab .fsl-dot,.${scope} .fsl-grab .fsl-linkrow[data-url="true"]{cursor:pointer}
.${scope} .fsl-grab .fsl-btn:disabled{cursor:default}
.${scope} .fsl-drag{touch-action:pan-y}
.${scope} .fsl-link{display:inline-flex;align-items:baseline;gap:${K.arrowGap}px;color:${K.color};text-decoration:none;cursor:pointer;transition:color .25s}
.${scope} .fsl-link:hover{color:${K.hoverColor}}
.${scope} .fsl-link-label{position:relative;display:inline-block}
.${scope} .fsl-link-label::after{content:"";position:absolute;left:0;right:0;bottom:-${K.underlineOffset}px;height:${K.underlineThickness}px;border-radius:999px;background:${K.underlineColor};transform-origin:left center;transition:background .25s,transform .35s cubic-bezier(.22,1,.36,1)}
.${scope} .fsl-link[data-ul="color"]:hover .fsl-link-label::after{background:${K.underlineHoverColor}}
.${scope} .fsl-link[data-ul="grow"] .fsl-link-label::after{transform:scaleX(.4)}
.${scope} .fsl-link[data-ul="grow"]:hover .fsl-link-label::after{transform:scaleX(1);background:${K.underlineHoverColor}}
.${scope} .fsl-link[data-ul="none"] .fsl-link-label::after{display:none}
.${scope} .fsl-link-arrow{display:inline-block;transition:transform .3s cubic-bezier(.22,1,.36,1)}
.${scope} .fsl-link:hover .fsl-link-arrow{transform:translateX(${K.arrowNudge}px)}

.${scope} .fsl-nav{display:flex;align-items:center;gap:${N.gap}px;margin-top:${navTextSpacing}px;color:${N.activeColor}}
.${scope} .fsl-btn{appearance:none;background:none;border:0;padding:6px;margin:-6px;display:inline-flex;align-items:center;justify-content:center;color:${N.activeColor};cursor:pointer;transition:color .2s,opacity .2s}
.${scope} .fsl-btn:hover:not(:disabled){color:${N.hoverColor}}
.${scope} .fsl-btn:disabled{color:${N.inactiveColor};cursor:default}
.${scope} .fsl-arrow-inner{display:inline-flex;align-items:center;justify-content:center}
.${scope} .fsl-btn[data-mirror="true"] .fsl-arrow-inner{transform:scaleX(-1)}
.${scope} .fsl-btn[data-custom="true"]{padding:0;margin:0}
.${scope} .fsl-btn-overlay{position:absolute;top:50%;transform:translateY(-50%);z-index:2;margin:0;padding:8px;box-sizing:content-box;border-radius:${N.imageArrowRadius}px;background:${N.imageArrowBackground}}
.${scope} .fsl-btn-overlay.prev{left:${N.imageArrowInset}px}
.${scope} .fsl-btn-overlay.next{right:${N.imageArrowInset}px}
.${scope} .fsl-btn-overlay[data-custom="true"]{padding:8px}
.${scope} .fsl-btn[aria-disabled="true"]{cursor:default}
.${scope} .fsl-svg{display:inline-block;line-height:0}
.${scope} .fsl-svg svg{width:100%;height:100%;display:block}
.${scope} .fsl-svg[data-recolor="true"] svg[fill]:not([fill="none"]),.${scope} .fsl-svg[data-recolor="true"] svg [fill]:not([fill="none"]){fill:currentColor}
.${scope} .fsl-svg[data-recolor="true"] svg[stroke]:not([stroke="none"]),.${scope} .fsl-svg[data-recolor="true"] svg [stroke]:not([stroke="none"]){stroke:currentColor}
.${scope} .fsl-btn:focus-visible,.${scope} .fsl-link:focus-visible,.${scope} .fsl-dot:focus-visible{outline:2px solid currentColor;outline-offset:4px;border-radius:4px}
.${scope} .fsl-counter{color:${N.counterColor};font-variant-numeric:tabular-nums;white-space:nowrap}
.${scope} .fsl-dots{display:flex;align-items:center;gap:${N.dotGap}px}
.${scope} .fsl-ind-overlay{position:absolute;z-index:2;display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:8px;padding:6px 10px;border-radius:999px;background:${N.indicatorBackground};max-width:calc(100% - ${N.indicatorInset * 2}px);box-sizing:border-box}
.${scope} .fsl-dot{appearance:none;border:0;padding:0;cursor:pointer;height:${N.dotSize}px;width:${N.dotSize}px;border-radius:999px;background:${N.inactiveColor};transition:width .35s cubic-bezier(.22,1,.36,1),background .25s}
.${scope} .fsl-dot[aria-current="true"]{width:${N.dotActiveWidth}px;background:${N.activeColor}}

@keyframes fsl-fade{from{opacity:0}to{opacity:1}}
@keyframes fsl-rise{from{opacity:0;transform:translateY(${M.distance}px)}to{opacity:1;transform:none}}
@keyframes fsl-slide{from{opacity:0;transform:translateX(calc(${M.distance}px * var(--fsl-dir,1)))}to{opacity:1;transform:none}}
.${scope} .fsl-anim .fsl-line{animation:fsl-${M.textAnimation} ${textT.ms}ms ${textT.easing} both;animation-delay:calc(var(--i,0) * ${M.stagger}ms)}
@media (prefers-reduced-motion:reduce){.${scope} .fsl-anim .fsl-line{animation:none}}

${
    L.mobileEnabled
        ? `@container (max-width:${Math.max(1, L.mobileBreakpoint - 1)}px){
.${scope} .fsl-grid{flex:1 0 auto;grid-template-columns:minmax(0,1fr);grid-template-areas:${mAreas};grid-template-rows:auto;gap:${L.mobileGap}px;padding:${L.mobilePadding}px;height:auto}
.${scope} .fsl-media{aspect-ratio:${I.mobileRatio};align-self:auto}
.${scope} .fsl-copy{flex:none}
.${scope} .fsl-nav{margin-top:${navTextSpacing}px}
}`
        : ""
}
`

    /* ------------------- drag from outside the image (text, etc.) ------------------- */
    const suppressClick = useRef(false)
    const forwardDown = (e: any) => {
        if (!S.drag || n < 2) return
        if (e.pointerType === "mouse" && e.button !== 0) return
        if ((e.target as HTMLElement).closest(".fsl-media, button")) return
        const track = splideEl.current?.querySelector(".splide__track")
        if (!track) return
        const touch = e.pointerType !== "mouse"
        const sx = e.clientX
        const sy = e.clientY
        let moved = false
        const fire = (type: string, el: EventTarget, ev: any) =>
            el.dispatchEvent(
                new MouseEvent(type, {
                    bubbles: true,
                    cancelable: true,
                    view: window,
                    button: 0,
                    buttons: type === "mouseup" ? 0 : 1,
                    clientX: ev.clientX,
                    clientY: ev.clientY,
                    screenX: ev.screenX,
                    screenY: ev.screenY,
                })
            )
        fire("mousedown", track, e)
        const move = (ev: PointerEvent) => {
            if (
                !moved &&
                (Math.abs(ev.clientX - sx) > 6 || Math.abs(ev.clientY - sy) > 6)
            ) {
                moved = true
            }
            if (moved) window.getSelection()?.removeAllRanges()
            if (touch) fire("mousemove", window, ev)
        }
        const end = (ev: PointerEvent) => {
            if (touch) fire("mouseup", window, ev)
            window.removeEventListener("pointermove", move)
            window.removeEventListener("pointerup", end)
            window.removeEventListener("pointercancel", end)
            if (moved) {
                suppressClick.current = true
                setTimeout(() => (suppressClick.current = false), 60)
            }
        }
        window.addEventListener("pointermove", move)
        window.addEventListener("pointerup", end)
        window.addEventListener("pointercancel", end)
    }
    const forwardProps = {
        onPointerDown: forwardDown,
        onDragStart: (e: any) => e.preventDefault(),
        onClickCapture: (e: any) => {
            if (suppressClick.current) {
                e.preventDefault()
                e.stopPropagation()
            }
        },
    }
    const canDrag = !!S.drag && n > 1
    const target = S.dragTarget
    const gridForward = canDrag && target === "all"
    const textForward = canDrag && target === "content"
    const grabOn = canDrag && !!S.grabCursor

    /* ------------------------------ sub-renders ----------------------------- */
    const counter = (
        <span
            className="fsl-counter"
            aria-live="polite"
            style={N.counterFont as CSSProperties}
        >
            {pad2(idx + 1, N.counterPad)}
            {N.counterSeparator}
            {pad2(n, N.counterPad)}
        </span>
    )

    const dots = (
        <div className="fsl-dots" role="group" aria-label="Choose slide">
            {slides.map((_, i) => (
                <button
                    key={i}
                    type="button"
                    className="fsl-dot"
                    aria-label={`Go to slide ${i + 1}`}
                    aria-current={i === idx}
                    onClick={() => go(i)}
                />
            ))}
        </div>
    )

    const indicator =
        N.indicator === "counter"
            ? counter
            : N.indicator === "dots"
              ? dots
              : null

    const arrowsOnImage = N.arrowPlacement === "image"
    const indicatorOnImage = N.indicatorPlacement === "image"
    const navIndicator = indicatorOnImage ? null : indicator

    const arrow = (dir: "prev" | "next") => {
        const isPrev = dir === "prev"
        const disabled = isPrev ? prevDisabled : nextDisabled
        const click = () => go(isPrev ? "<" : ">")
        let inner: ReactNode = null
        let mirror = false
        let isComponent = false

        if (N.arrowSource === "component") {
            const own = isPrev ? prevComponent : nextComponent
            if (own) {
                inner = own
                isComponent = true
            } else if (!isPrev && prevComponent) {
                inner = prevComponent
                isComponent = true
                mirror = true
            }
        } else if (N.arrowSource === "svg") {
            const ownMarkup = isPrev
                ? prevSvgCode || fileSvgs[prevFile]
                : nextSvgCode || fileSvgs[nextFile]
            const prevMarkup = prevSvgCode || fileSvgs[prevFile]
            const markup = ownMarkup || (!isPrev ? prevMarkup : "")
            if (markup) {
                mirror = !ownMarkup && !isPrev
                inner = (
                    <span
                        className="fsl-svg"
                        data-recolor={N.svgRecolor ? "true" : "false"}
                        style={{ width: N.arrowSize, height: N.arrowSize }}
                        dangerouslySetInnerHTML={{ __html: cleanSvg(markup) }}
                    />
                )
            }
        }
        if (!inner) {
            mirror = !isPrev
            inner = (
                <Chevron
                    size={N.arrowSize}
                    stroke={N.arrowStroke}
                    icon={N.arrowIcon}
                />
            )
        }

        const common = {
            className: `fsl-btn ${dir}${arrowsOnImage ? " fsl-btn-overlay" : ""}`,
            "data-mirror": mirror ? "true" : "false",
            "data-custom": isComponent ? "true" : "false",
            "aria-label": isPrev ? "Previous slide" : "Next slide",
        } as any

        return isComponent ? (
            <div
                {...common}
                role="button"
                tabIndex={disabled ? -1 : 0}
                aria-disabled={disabled}
                style={{ opacity: disabled ? N.disabledOpacity : 1 }}
                onClick={() => !disabled && click()}
                onKeyDown={(e) => {
                    if (!disabled && (e.key === "Enter" || e.key === " ")) {
                        e.preventDefault()
                        click()
                    }
                }}
            >
                <span className="fsl-arrow-inner">{inner}</span>
            </div>
        ) : (
            <button
                {...common}
                type="button"
                disabled={disabled}
                onClick={click}
            >
                <span className="fsl-arrow-inner">{inner}</span>
            </button>
        )
    }
    const prevBtn = arrow("prev")
    const nextBtn = arrow("next")

    const navArrows = N.arrows && !arrowsOnImage
    const nav =
        N.show && n > 1 && (navArrows || navIndicator) ? (
            <div
                className="fsl-nav"
                role="group"
                aria-label="Slider navigation"
            >
                {navArrows && N.arrowLayout === "split" ? (
                    <>
                        {prevBtn}
                        {navIndicator}
                        {nextBtn}
                    </>
                ) : (
                    <>
                        {navIndicator}
                        {navArrows && (
                            <>
                                {prevBtn}
                                {nextBtn}
                            </>
                        )}
                    </>
                )}
            </div>
        ) : null

    const indPos = N.indicatorPosition || "bottom-center"
    const indV = indPos.startsWith("top") ? "top" : "bottom"
    const indH = indPos.endsWith("left")
        ? "left"
        : indPos.endsWith("right")
          ? "right"
          : "center"
    const indicatorStyle: CSSProperties = {
        top: indV === "top" ? N.indicatorInset : undefined,
        bottom: indV === "bottom" ? N.indicatorInset : undefined,
        left:
            indH === "left"
                ? N.indicatorInset
                : indH === "center"
                  ? "50%"
                  : undefined,
        right: indH === "right" ? N.indicatorInset : undefined,
        transform: indH === "center" ? "translateX(-50%)" : undefined,
    }

    const hiddenSlot: CSSProperties = {
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        maxHeight: "100vh",
        overflow: "hidden",
        opacity: 0,
        pointerEvents: "none",
        zIndex: -1,
    }

    /* ----------------------- stagger order + top labels ---------------------- */
    const showEyebrow =
        !!Ey.show && !!(liveEyebrowEl || (cur.eyebrow || "").trim())
    let step = 0
    const cStep = Cn.show ? step++ : 0
    const eStep = showEyebrow ? step++ : 0
    const hStep = liveHeadEl || cur.heading ? step++ : 0
    const dStep =
        liveDescEl || cur.description || cur.descriptionHtml ? step++ : 0
    const lStep = step

    const counterText =
        Cn.format === "total"
            ? `${pad2(idx + 1, Cn.pad)}${Cn.separator}${pad2(n, Cn.pad)}`
            : pad2(idx + 1, Cn.pad)

    /* ------------------------------- link node ------------------------------- */
    const textLink = showLink ? (
        <a
            className="fsl-link fsl-linkrow fsl-line"
            data-ul={K.underlineEffect}
            {...linkProps(linkUrl, K.newTab)}
            style={{ ["--i" as any]: lStep, ...(K.font as CSSProperties) }}
        >
            <span className="fsl-link-label">{linkLabel}</span>
            {K.arrow ? (
                <span className="fsl-link-arrow" aria-hidden="true">
                    {K.arrow}
                </span>
            ) : null}
        </a>
    ) : null

    /* ---------------------------- tallest-slide sizer ------------------------ */
    const ghostHtml = (el?: HTMLElement) => {
        if (!el) return ""
        const clone = el.cloneNode(true) as HTMLElement
        clone.querySelectorAll("[id]").forEach((n) => n.removeAttribute("id"))
        clone.querySelectorAll("img, picture, video, iframe").forEach((n) => {
            ;(n as HTMLElement).style.setProperty(
                "visibility",
                "hidden",
                "important"
            )
            ;(n as HTMLElement).style.setProperty("opacity", "0", "important")
            ;(n as HTMLElement).setAttribute("aria-hidden", "true")
        })
        return clone.outerHTML
    }

    const ghostStack = (
        <div
            className="fsl-ghost"
            aria-hidden="true"
            style={{
                visibility: "hidden",
                opacity: 0,
                pointerEvents: "none",
            }}
        >
            {slides.map((s, i) => {
                const gLabel = s.linkLabel || K.label
                const gHtml = s.descriptionHtml
                    ? s.descriptionHtml.replace(/\sid="[^"]*"/gi, "")
                    : ""
                const gHead = liveCms ? cmsLive.current.heading[i] : undefined
                const gEyebrow = liveCms
                    ? cmsLive.current.eyebrow[i]
                    : undefined
                const gDesc = liveCms ? cmsLive.current.desc[i] : undefined
                const gButtons = liveCms
                    ? cmsLive.current.buttons[i]
                    : undefined
                return (
                    <div className="fsl-box" key={i}>
                        {Ey.show && (gEyebrow || (s.eyebrow || "").trim()) ? (
                            gEyebrow ? (
                                <div
                                    className="fsl-top fsl-live"
                                    style={{ marginBottom: Ey.spacing }}
                                    dangerouslySetInnerHTML={{
                                        __html: ghostHtml(gEyebrow),
                                    }}
                                />
                            ) : (
                                <div
                                    className="fsl-top"
                                    style={{
                                        color: Ey.color,
                                        marginBottom: Ey.spacing,
                                        ...(Ey.font as CSSProperties),
                                    }}
                                >
                                    {s.eyebrow}
                                </div>
                            )
                        ) : null}
                        {gHead ? (
                            <div
                                className="fsl-h fsl-live"
                                dangerouslySetInnerHTML={{
                                    __html: ghostHtml(gHead),
                                }}
                            />
                        ) : s.heading ? (
                            <HeadingTag className="fsl-h" style={headingFont}>
                                {s.heading}
                            </HeadingTag>
                        ) : null}
                        {gDesc ? (
                            <div
                                className="fsl-d fsl-rich fsl-live"
                                dangerouslySetInnerHTML={{
                                    __html: ghostHtml(gDesc),
                                }}
                            />
                        ) : gHtml ? (
                            <div
                                className="fsl-d fsl-rich"
                                style={Ds.font as CSSProperties}
                                dangerouslySetInnerHTML={{ __html: gHtml }}
                            />
                        ) : s.description ? (
                            <p
                                className="fsl-d"
                                style={Ds.font as CSSProperties}
                            >
                                {s.description}
                            </p>
                        ) : null}
                        {K.show && gButtons ? (
                            <div
                                className="fsl-linkrow fsl-live"
                                dangerouslySetInnerHTML={{
                                    __html: ghostHtml(gButtons),
                                }}
                            />
                        ) : null}
                        {source !== "cms" &&
                        K.show &&
                        gLabel &&
                        (s.link || isCanvas || !K.hideEmpty) ? (
                            <div
                                className="fsl-linkrow"
                                style={K.font as CSSProperties}
                            >
                                <span className="fsl-link-label">{gLabel}</span>
                                {K.arrow ? (
                                    <span className="fsl-link-arrow">
                                        {K.arrow}
                                    </span>
                                ) : null}
                            </div>
                        ) : null}
                    </div>
                )
            })}
        </div>
    )

    /* --------------------------------- JSX ---------------------------------- */
    return (
        <div
            className={scope}
            ref={rootRef}
            style={hostMin ? { minHeight: hostMin } : undefined}
        >
            <style>{css}</style>

            {source === "cms" && (
                <div
                    ref={cmsRef}
                    aria-hidden={!showSlot}
                    style={
                        showSlot
                            ? {
                                  position: "absolute",
                                  inset: 0,
                                  zIndex: 2,
                                  overflow: "auto",
                                  background,
                              }
                            : hiddenSlot
                    }
                >
                    {cmsSlot}
                </div>
            )}

            {!showSlot && (
                <div
                    className={`fsl-grid ${grabOn && gridForward ? "fsl-grab" : ""} ${gridForward ? "fsl-drag" : ""}`}
                    {...(gridForward ? forwardProps : {})}
                >
                    {/* ------------------------------ text ------------------------------ */}
                    <div
                        className={`fsl-text ${grabOn && textForward ? "fsl-grab" : ""} ${textForward ? "fsl-drag" : ""}${copyLink ? " fsl-click" : ""}`}
                        {...hitProps(copyLink)}
                        {...(textForward ? forwardProps : {})}
                    >
                        {Cn.show && n > 0 ? (
                            <div
                                key={`index-${idx}`}
                                className={animate ? "fsl-anim" : ""}
                                style={{ display: "contents" }}
                            >
                                <div
                                    className="fsl-top fsl-line"
                                    aria-hidden="true"
                                    style={{
                                        ["--i" as any]: cStep,
                                        color: Cn.color,
                                        marginBottom: Cn.spacing + L.textGap,
                                        fontVariantNumeric: "tabular-nums",
                                        ...(Cn.font as CSSProperties),
                                    }}
                                >
                                    {counterText}
                                </div>
                            </div>
                        ) : null}
                        <div
                            key={idx}
                            className={`fsl-copy ${animate ? "fsl-anim" : ""}`}
                            style={{ ["--fsl-dir" as any]: dirRef.current }}
                        >
                            {ghostStack}
                            <div className="fsl-box">
                                <div className="fsl-body">
                                    {showEyebrow ? (
                                        liveEyebrowEl ? (
                                            <div
                                                className="fsl-top fsl-live fsl-line"
                                                ref={eyebrowHostRef}
                                                style={{
                                                    ["--i" as any]: eStep,
                                                    marginBottom: Ey.spacing,
                                                }}
                                            />
                                        ) : (
                                            <div
                                                className="fsl-top fsl-line"
                                                style={{
                                                    ["--i" as any]: eStep,
                                                    color: Ey.color,
                                                    marginBottom: Ey.spacing,
                                                    ...(Ey.font as CSSProperties),
                                                }}
                                            >
                                                {cur.eyebrow}
                                            </div>
                                        )
                                    ) : null}
                                    {liveHeadEl ? (
                                        <div
                                            className="fsl-h fsl-live fsl-line"
                                            ref={headHostRef}
                                            style={{ ["--i" as any]: hStep }}
                                        />
                                    ) : cur.heading ? (
                                        <HeadingTag
                                            className="fsl-h fsl-line"
                                            style={{
                                                ["--i" as any]: hStep,
                                                color: H.color,
                                                ...(H.font as CSSProperties),
                                            }}
                                        >
                                            {cur.heading}
                                        </HeadingTag>
                                    ) : null}
                                    {liveDescEl ||
                                    cur.description ||
                                    cur.descriptionHtml ? (
                                        liveDescEl ? (
                                            <div
                                                className="fsl-d fsl-rich fsl-live fsl-line"
                                                ref={descHostRef}
                                                style={{
                                                    ["--i" as any]: dStep,
                                                }}
                                            />
                                        ) : cur.descriptionHtml ? (
                                            <div
                                                className="fsl-d fsl-rich fsl-line"
                                                style={{
                                                    ["--i" as any]: dStep,
                                                    color: Ds.color,
                                                    ...(Ds.font as CSSProperties),
                                                }}
                                                onClickCapture={
                                                    onRichLinkCapture
                                                }
                                                dangerouslySetInnerHTML={{
                                                    __html: cur.descriptionHtml,
                                                }}
                                            />
                                        ) : (
                                            <p
                                                className="fsl-d fsl-line"
                                                style={{
                                                    ["--i" as any]: dStep,
                                                    color: Ds.color,
                                                    ...(Ds.font as CSSProperties),
                                                }}
                                            >
                                                {cur.description}
                                            </p>
                                        )
                                    ) : null}
                                </div>
                                {showButtons ? (
                                    <div
                                        className="fsl-linkrow fsl-live fsl-line"
                                        ref={buttonsHostRef}
                                        data-url={linkUrl ? "true" : "false"}
                                        style={{ ["--i" as any]: lStep }}
                                    />
                                ) : null}
                                {textLink}
                            </div>
                        </div>
                        {nav}
                    </div>

                    {/* ------------------------------ media ----------------------------- */}
                    <div
                        className={`fsl-media ${grabOn ? "fsl-grab" : ""}`}
                        data-click={mediaLink ? "true" : "false"}
                        {...hitProps(mediaLink)}
                        onClickCapture={
                            mediaLink
                                ? (e: any) => {
                                      const start = hitDown.current
                                      if (
                                          start &&
                                          Math.hypot(
                                              e.clientX - start.x,
                                              e.clientY - start.y
                                          ) > 8
                                      ) {
                                          e.preventDefault()
                                          e.stopPropagation()
                                      }
                                  }
                                : undefined
                        }
                    >
                        {n === 0 ? (
                            <div className="fsl-ph">
                                {source === "cms"
                                    ? cmsSlot
                                        ? "No rows found in the Collection List"
                                        : "Add a Collection List to the slot"
                                    : "Add slides"}
                            </div>
                        ) : (
                            <div
                                key={rebuildKey}
                                ref={splideEl}
                                className="splide"
                                aria-label={S.label}
                            >
                                <div className="splide__track">
                                    <ul className="splide__list">
                                        {slides.map((s, i) => {
                                            const img = s.src ? (
                                                <img
                                                    className="fsl-img"
                                                    src={s.src}
                                                    srcSet={s.srcSet}
                                                    sizes="(max-width: 810px) 100vw, 60vw"
                                                    alt={s.alt || ""}
                                                    draggable={false}
                                                    loading={
                                                        i === 0
                                                            ? "eager"
                                                            : "lazy"
                                                    }
                                                    decoding="async"
                                                />
                                            ) : (
                                                <div className="fsl-ph">
                                                    image
                                                </div>
                                            )
                                            return (
                                                <li
                                                    className="splide__slide"
                                                    key={i}
                                                >
                                                    {clickOnImage && s.link ? (
                                                        <a
                                                            className="fsl-slide-link"
                                                            {...linkProps(
                                                                s.link,
                                                                K.newTab
                                                            )}
                                                            aria-label={
                                                                s.heading ||
                                                                s.alt
                                                            }
                                                        >
                                                            {img}
                                                        </a>
                                                    ) : (
                                                        img
                                                    )}
                                                </li>
                                            )
                                        })}
                                    </ul>
                                </div>
                            </div>
                        )}
                        {N.show && N.arrows && arrowsOnImage && n > 1 ? (
                            <>
                                {prevBtn}
                                {nextBtn}
                            </>
                        ) : null}
                        {N.show && indicatorOnImage && indicator && n > 1 ? (
                            <div
                                className="fsl-ind-overlay"
                                role="group"
                                aria-label="Slider navigation"
                                style={indicatorStyle}
                            >
                                {indicator}
                            </div>
                        ) : null}
                    </div>
                </div>
            )}
        </div>
    )
}

/* -------------------------------------------------------------------------- */
/*  Property controls                                                          */
/* -------------------------------------------------------------------------- */

const seg = (options: string[], titles: string[]) => ({
    type: ControlType.Enum as const,
    options,
    optionTitles: titles,
    displaySegmentedControl: true,
    segmentedControlDirection: (options.length > 2
        ? "vertical"
        : "horizontal") as "vertical" | "horizontal",
})
CMSTwoColumnSlider.displayName = "CMS 2 Column Slider"
addPropertyControls(CMSTwoColumnSlider, {
    source: {
        type: ControlType.Enum,
        title: "Source",
        description: "[Remix Demo Project](https://framer.link/sNXTJ9U)",
        options: ["manual", "cms"],
        optionTitles: ["Manual", "CMS"],
        displaySegmentedControl: true,
        defaultValue: "manual",
    },

    /* ---------------------------------- data --------------------------------- */
    items: {
        type: ControlType.Array,
        title: "Slides",
        hidden: (p: any) => p.source === "cms",
        control: {
            type: ControlType.Object,
            controls: {
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                eyebrow: {
                    type: ControlType.String,
                    title: "Eyebrow",
                    placeholder: "Optional text above heading",
                },
                heading: {
                    type: ControlType.String,
                    title: "Heading",
                    defaultValue: "Medium long heading",
                },
                description: {
                    type: ControlType.String,
                    title: "Description",
                    displayTextArea: true,
                    defaultValue: "Long multiple line description",
                },
                linkLabel: {
                    type: ControlType.String,
                    title: "Link text",
                    placeholder: "Uses default",
                },
                link: { type: ControlType.Link, title: "Link" },
            },
        },
        defaultValue: [
            {
                eyebrow: "Branding",
                heading: "Medium long heading",
                description: "Long multiple line description",
            },
            {
                eyebrow: "Web design",
                heading: "Second project",
                description:
                    "A short note about what this project is and why it matters.",
            },
            {
                eyebrow: "Motion",
                heading: "Third project",
                description:
                    "Another description that wraps across a few lines.",
            },
        ],
    },
    cmsSlot: {
        type: ControlType.ComponentInstance,
        title: "Collection",
        hidden: (p: any) => p.source !== "cms",
    },
    editSlot: {
        type: ControlType.Boolean,
        title: "Edit slot",
        defaultValue: false,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        hidden: (p: any) => p.source !== "cms",
    },

    prevComponent: {
        type: ControlType.ComponentInstance,
        title: "Prev arrow",
        hidden: (p: any) => p.nav?.arrowSource !== "component",
    },
    nextComponent: {
        type: ControlType.ComponentInstance,
        title: "Next arrow",
        hidden: (p: any) => p.nav?.arrowSource !== "component",
    },
    prevFile: {
        type: ControlType.File,
        title: "Prev SVG file",
        allowedFileTypes: ["svg"],
        hidden: (p: any) => p.nav?.arrowSource !== "svg",
    },
    nextFile: {
        type: ControlType.File,
        title: "Next SVG file",
        allowedFileTypes: ["svg"],
        hidden: (p: any) => p.nav?.arrowSource !== "svg",
    },

    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#000000",
    },

    /* ------------------------------ text panel ------------------------------- */
    panel: {
        type: ControlType.Object,
        title: "Text panel",
        buttonTitle: "Background & padding",
        controls: {
            mode: {
                ...seg(["column", "content"], ["Whole column", "Text only"]),
                title: "Apply to",
                defaultValue: "column",
            },
            background: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: "rgba(0,0,0,0)",
            },
            padding: {
                type: ControlType.Padding,
                title: "Padding",
                defaultValue: "0px",
            },
            radius: {
                type: ControlType.Number,
                title: "Radius",
                min: 0,
                max: 80,
                unit: "px",
                defaultValue: 0,
            },
            width: {
                ...seg(["fill", "hug"], ["Fill", "Hug"]),
                title: "Text width",
                defaultValue: "fill",
            },
        },
    },

    /* --------------------------------- layout -------------------------------- */
    layout: {
        type: ControlType.Object,
        title: "Layout",
        buttonTitle: "Layout",
        controls: {
            imagePosition: {
                ...seg(["right", "left"], ["Right", "Left"]),
                title: "Image",
                defaultValue: "right",
            },
            textWidth: {
                type: ControlType.Number,
                title: "Text width",
                min: 20,
                max: 70,
                unit: "%",
                defaultValue: 34,
            },
            gap: {
                type: ControlType.Number,
                title: "Gap",
                min: 0,
                max: 200,
                unit: "px",
                defaultValue: 32,
            },
            padding: {
                type: ControlType.Number,
                title: "Padding",
                min: 0,
                max: 200,
                unit: "px",
                defaultValue: 24,
            },
            align: {
                ...seg(
                    ["left", "center", "right"],
                    ["Left", "Center", "Right"]
                ),
                title: "Align",
                defaultValue: "left",
            },
            vertical: {
                ...seg(
                    ["start", "center", "end", "spread", "textCenter"],
                    [
                        "Top",
                        "Middle",
                        "Bottom",
                        "Text top, link bottom",
                        "Middle text, link bottom",
                    ]
                ),
                title: "Vertical",
                defaultValue: "start",
            },
            navPlacement: {
                ...seg(["bottom", "below"], ["Pinned", "Below text"]),
                title: "Controls",
                defaultValue: "bottom",
            },
            textGap: {
                type: ControlType.Number,
                title: "Text gap",
                min: 0,
                max: 80,
                unit: "px",
                defaultValue: 16,
            },
            mobileEnabled: {
                type: ControlType.Boolean,
                title: "Mobile layout",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
            },
            mobileBreakpoint: {
                type: ControlType.Number,
                title: "Breakpoint",
                min: 320,
                max: 1400,
                unit: "px",
                defaultValue: 720,
            },
            mobileImagePosition: {
                ...seg(["top", "bottom"], ["Top", "Bottom"]),
                title: "Mobile image",
                defaultValue: "top",
            },
            mobileGap: {
                type: ControlType.Number,
                title: "Mobile gap",
                min: 0,
                max: 100,
                unit: "px",
                defaultValue: 24,
            },
            mobilePadding: {
                type: ControlType.Number,
                title: "Mobile pad",
                min: 0,
                max: 100,
                unit: "px",
                defaultValue: 20,
            },
        },
    },

    /* ---------------------------------- image -------------------------------- */
    image: {
        type: ControlType.Object,
        title: "Image",
        buttonTitle: "Image",
        controls: {
            ratio: {
                type: ControlType.Enum,
                title: "Ratio",
                options: [
                    "fill",
                    "16 / 9",
                    "3 / 2",
                    "4 / 3",
                    "1 / 1",
                    "4 / 5",
                    "21 / 9",
                ],
                optionTitles: [
                    "Fill height",
                    "16:9",
                    "3:2",
                    "4:3",
                    "1:1",
                    "4:5",
                    "21:9",
                ],
                defaultValue: "fill",
            },
            mobileRatio: {
                type: ControlType.Enum,
                title: "Mobile ratio",
                options: ["16 / 9", "3 / 2", "4 / 3", "1 / 1", "4 / 5"],
                optionTitles: ["16:9", "3:2", "4:3", "1:1", "4:5"],
                defaultValue: "4 / 3",
            },
            fit: {
                ...seg(["cover", "contain"], ["Cover", "Contain"]),
                title: "Fit",
                defaultValue: "cover",
            },
            position: {
                type: ControlType.String,
                title: "Focus",
                defaultValue: "50% 50%",
            },
            radius: {
                type: ControlType.Number,
                title: "Radius",
                min: 0,
                max: 80,
                unit: "px",
                defaultValue: 0,
            },
            background: {
                type: ControlType.Color,
                title: "Backdrop",
                defaultValue: "#0F0F0F",
            },
        },
    },

    /* --------------------------------- typography ---------------------------- */
    counter: {
        type: ControlType.Object,
        title: "Numbers above heading",
        buttonTitle: "Numbers",
        controls: {
            show: {
                type: ControlType.Boolean,
                title: "Show",
                defaultValue: false,
            },
            format: {
                ...seg(["index", "total"], ["Number", "Number / total"]),
                title: "Format",
                defaultValue: "index",
            },
            separator: {
                type: ControlType.String,
                title: "Separator",
                defaultValue: "/",
            },
            pad: {
                type: ControlType.Boolean,
                title: "Pad zeros",
                defaultValue: true,
            },
            font: {
                type: ControlType.Font,
                title: "Font",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: "14px",
                    variant: "Medium",
                    lineHeight: "1.2em",
                },
            },
            color: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: "#9094B8",
            },
            spacing: {
                type: ControlType.Number,
                title: "Space below",
                min: 0,
                max: 80,
                unit: "px",
                defaultValue: 0,
            },
        },
    },
    eyebrow: {
        type: ControlType.Object,
        title: "Eyebrow text",
        buttonTitle: "Eyebrow",
        controls: {
            show: {
                type: ControlType.Boolean,
                title: "Show",
                defaultValue: false,
            },
            font: {
                type: ControlType.Font,
                title: "Font",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: "14px",
                    variant: "Medium",
                    lineHeight: "1.2em",
                },
                hidden: (p: any) => p.source === "cms",
            },
            color: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: "#9094B8",
                hidden: (p: any) => p.source === "cms",
            },
            spacing: {
                type: ControlType.Number,
                title: "Space below",
                min: 0,
                max: 80,
                unit: "px",
                defaultValue: 0,
            },
        },
    },
    heading: {
        type: ControlType.Object,
        title: "Heading",
        buttonTitle: "Style",
        hidden: (p: any) => p.source === "cms",
        controls: {
            font: {
                type: ControlType.Font,
                title: "Font",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: "44px",
                    variant: "Medium",
                    letterSpacing: "-0.02em",
                    lineHeight: "1.15em",
                },
                hidden: (p: any) => p.source === "cms",
            },
            color: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: "#FFFFFF",
                hidden: (p: any) => p.source === "cms",
            },
            tag: {
                type: ControlType.Enum,
                title: "Tag",
                options: ["h1", "h2", "h3", "h4", "p", "div"],
                defaultValue: "h2",
            },
        },
    },
    description: {
        type: ControlType.Object,
        title: "Description",
        buttonTitle: "Style",
        hidden: (p: any) => p.source === "cms",
        controls: {
            font: {
                type: ControlType.Font,
                title: "Font",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: { fontSize: "18px", lineHeight: "1.5em" },
                hidden: (p: any) => p.source === "cms",
            },
            color: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: "#9094B8",
                hidden: (p: any) => p.source === "cms",
            },
            maxLines: {
                type: ControlType.Number,
                title: "Max lines",
                min: 0,
                max: 12,
                step: 1,
                displayStepper: true,
                defaultValue: 0,
            },
        },
    },
    link: {
        type: ControlType.Object,
        title: "Link",
        buttonTitle: "Link",
        controls: {
            show: {
                type: ControlType.Boolean,
                title: "Show",
                defaultValue: true,
            },
            clickTarget: {
                ...seg(
                    ["none", "image", "text", "both"],
                    ["Off", "Image", "Text", "Both"]
                ),
                title: "Click to open",
                defaultValue: "none",
            },
            spacing: {
                type: ControlType.Number,
                title: "Spacing",
                min: 0,
                max: 120,
                unit: "px",
                defaultValue: 16,
            },
            newTab: {
                type: ControlType.Boolean,
                title: "New tab",
                defaultValue: false,
            },
            label: {
                type: ControlType.String,
                title: "Default text",
                defaultValue: "See project",
                hidden: (p: any) => p.source === "cms",
            },
            font: {
                type: ControlType.Font,
                title: "Font",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: "14px",
                    variant: "Medium",
                    lineHeight: "1.2em",
                },
                hidden: (p: any) => p.source === "cms",
            },
            color: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: "#FFFFFF",
                hidden: (p: any) => p.source === "cms",
            },
            hoverColor: {
                type: ControlType.Color,
                title: "Hover",
                defaultValue: "#FFFFFF",
                hidden: (p: any) => p.source === "cms",
            },
            arrow: {
                type: ControlType.String,
                title: "Arrow",
                defaultValue: "",
                placeholder: "→ ↗ ›  (empty = none)",
                hidden: (p: any) => p.source === "cms",
            },
            arrowGap: {
                type: ControlType.Number,
                title: "Arrow gap",
                min: 0,
                max: 40,
                unit: "px",
                defaultValue: 6,
                hidden: (p: any) => p.source === "cms",
            },
            arrowNudge: {
                type: ControlType.Number,
                title: "Hover nudge",
                min: 0,
                max: 20,
                unit: "px",
                defaultValue: 4,
                hidden: (p: any) => p.source === "cms",
            },
            underlineEffect: {
                type: ControlType.Enum,
                title: "Underline",
                options: ["color", "grow", "none"],
                optionTitles: ["Static + color", "Grow on hover", "None"],
                defaultValue: "none",
                hidden: (p: any) => p.source === "cms",
            },
            underlineColor: {
                type: ControlType.Color,
                title: "Line color",
                defaultValue: "#9094B8",
                hidden: (p: any) => p.source === "cms",
            },
            underlineHoverColor: {
                type: ControlType.Color,
                title: "Line hover",
                defaultValue: "#FFFFFF",
                hidden: (p: any) => p.source === "cms",
            },
            underlineThickness: {
                type: ControlType.Number,
                title: "Line size",
                min: 1,
                max: 12,
                unit: "px",
                defaultValue: 2,
                hidden: (p: any) => p.source === "cms",
            },
            underlineOffset: {
                type: ControlType.Number,
                title: "Line offset",
                min: 0,
                max: 24,
                unit: "px",
                defaultValue: 4,
                hidden: (p: any) => p.source === "cms",
            },
            hideEmpty: {
                type: ControlType.Boolean,
                title: "Hide if empty",
                defaultValue: true,
                hidden: (p: any) => p.source === "cms",
            },
        },
    },

    /* -------------------------------- navigation ----------------------------- */
    nav: {
        type: ControlType.Object,
        title: "Navigation",
        buttonTitle: "Navigation",
        controls: {
            show: {
                type: ControlType.Boolean,
                title: "Show",
                defaultValue: true,
            },
            arrows: {
                type: ControlType.Boolean,
                title: "Arrows",
                defaultValue: true,
            },
            indicator: {
                type: ControlType.Enum,
                title: "Indicator",
                options: ["counter", "dots", "none"],
                optionTitles: ["Numbers", "Dots", "None"],
                displaySegmentedControl: true,
                segmentedControlDirection: "vertical",
                defaultValue: "dots",
            },
            indicatorPlacement: {
                ...seg(["nav", "image"], ["In nav", "On image"]),
                title: "Indicator position",
                defaultValue: "nav",
                hidden: (p: any) => (p.nav ?? p).indicator === "none",
            },
            indicatorPosition: {
                ...seg(
                    [
                        "top-left",
                        "top-center",
                        "top-right",
                        "bottom-left",
                        "bottom-center",
                        "bottom-right",
                    ],
                    [
                        "Top left",
                        "Top center",
                        "Top right",
                        "Bottom left",
                        "Bottom center",
                        "Bottom right",
                    ]
                ),
                title: "Indicator spot",
                defaultValue: "bottom-center",
                hidden: (p: any) => (p.nav ?? p).indicatorPlacement !== "image",
            },
            indicatorInset: {
                type: ControlType.Number,
                title: "Indicator inset",
                min: 0,
                max: 160,
                unit: "px",
                defaultValue: 16,
                hidden: (p: any) => (p.nav ?? p).indicatorPlacement !== "image",
            },
            indicatorBackground: {
                type: ControlType.Color,
                title: "Indicator backdrop",
                defaultValue: "rgba(0,0,0,0)",
                hidden: (p: any) => (p.nav ?? p).indicatorPlacement !== "image",
            },
            arrowLayout: {
                ...seg(["split", "grouped"], ["Around", "Together"]),
                title: "Arrow layout",
                defaultValue: "split",
                hidden: (p: any) => (p.nav ?? p).arrowPlacement === "image",
            },
            arrowPlacement: {
                ...seg(["nav", "image"], ["In nav", "On image"]),
                title: "Arrow position",
                defaultValue: "nav",
            },
            imageArrowInset: {
                type: ControlType.Number,
                title: "Image inset",
                min: 0,
                max: 160,
                unit: "px",
                defaultValue: 16,
                hidden: (p: any) => (p.nav ?? p).arrowPlacement !== "image",
            },
            imageArrowBackground: {
                type: ControlType.Color,
                title: "Arrow backdrop",
                defaultValue: "rgba(0,0,0,0)",
                hidden: (p: any) => (p.nav ?? p).arrowPlacement !== "image",
            },
            imageArrowRadius: {
                type: ControlType.Number,
                title: "Backdrop radius",
                min: 0,
                max: 999,
                unit: "px",
                defaultValue: 999,
                hidden: (p: any) => (p.nav ?? p).arrowPlacement !== "image",
            },
            arrowSource: {
                type: ControlType.Enum,
                title: "Arrow type",
                options: ["icon", "svg", "component"],
                optionTitles: ["Built-in", "SVG", "Component"],
                displaySegmentedControl: true,
                segmentedControlDirection: "vertical",
                defaultValue: "icon",
            },
            arrowIcon: {
                ...seg(["chevron", "arrow"], ["Chevron", "Arrow"]),
                title: "Built-in icon",
                defaultValue: "chevron",
            },
            svgRecolor: {
                type: ControlType.Boolean,
                title: "SVG recolor",
                defaultValue: true,
            },
            prevCode: {
                type: ControlType.String,
                title: "Prev SVG code",
                displayTextArea: true,
                placeholder: "<svg …> (overrides file)",
                hidden: (p: any) => (p.nav ?? p).arrowSource !== "svg",
            },
            nextCode: {
                type: ControlType.String,
                title: "Next SVG code",
                displayTextArea: true,
                placeholder: "Empty = mirror prev",
                hidden: (p: any) => (p.nav ?? p).arrowSource !== "svg",
            },
            disabledOpacity: {
                type: ControlType.Number,
                title: "Disabled fade",
                min: 0,
                max: 1,
                step: 0.05,
                defaultValue: 0.4,
            },
            arrowSize: {
                type: ControlType.Number,
                title: "Arrow size",
                min: 10,
                max: 64,
                unit: "px",
                defaultValue: 16,
            },
            arrowStroke: {
                type: ControlType.Number,
                title: "Stroke",
                min: 1,
                max: 6,
                step: 0.25,
                defaultValue: 2,
            },
            activeColor: {
                type: ControlType.Color,
                title: "Active",
                defaultValue: "#FFFFFF",
            },
            inactiveColor: {
                type: ControlType.Color,
                title: "Inactive",
                defaultValue: "#9094B8",
            },
            hoverColor: {
                type: ControlType.Color,
                title: "Hover",
                defaultValue: "#FFFFFF",
            },
            counterColor: {
                type: ControlType.Color,
                title: "Numbers color",
                defaultValue: "#9094B8",
            },
            counterFont: {
                type: ControlType.Font,
                title: "Numbers font",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: "18px",
                    variant: "Medium",
                    lineHeight: "1em",
                },
            },
            counterSeparator: {
                type: ControlType.String,
                title: "Separator",
                defaultValue: "/",
            },
            counterPad: {
                type: ControlType.Boolean,
                title: "Pad zeros",
                defaultValue: false,
            },
            gap: {
                type: ControlType.Number,
                title: "Gap",
                min: 0,
                max: 80,
                unit: "px",
                defaultValue: 14,
            },
            dotSize: {
                type: ControlType.Number,
                title: "Dot size",
                min: 3,
                max: 24,
                unit: "px",
                defaultValue: 8,
            },
            dotActiveWidth: {
                type: ControlType.Number,
                title: "Active dot",
                min: 3,
                max: 64,
                unit: "px",
                defaultValue: 24,
            },
            dotGap: {
                type: ControlType.Number,
                title: "Dot gap",
                min: 0,
                max: 32,
                unit: "px",
                defaultValue: 8,
            },
            textSpacing: {
                type: ControlType.Number,
                title: "Text spacing",
                min: 0,
                max: 160,
                unit: "px",
                defaultValue: 24,
            },
        },
    },

    /* --------------------------------- slider -------------------------------- */
    slider: {
        type: ControlType.Object,
        title: "Slider",
        buttonTitle: "Behavior",
        controls: {
            transition: {
                ...seg(["slide", "fade"], ["Slide", "Fade"]),
                title: "Transition",
                defaultValue: "slide",
            },
            loop: {
                type: ControlType.Boolean,
                title: "Loop",
                defaultValue: false,
            },
            motion: {
                type: ControlType.Transition,
                title: "Transition",
                defaultValue: {
                    type: "tween",
                    duration: 0.6,
                    ease: [0.25, 1, 0.5, 1],
                },
            },
            drag: {
                type: ControlType.Boolean,
                title: "Drag / swipe",
                defaultValue: true,
            },
            grabCursor: {
                type: ControlType.Boolean,
                title: "Grab cursor",
                defaultValue: true,
            },
            dragTarget: {
                type: ControlType.Enum,
                title: "Grab area",
                options: ["image", "content", "all"],
                optionTitles: ["Image only", "Image + text", "Whole component"],
                defaultValue: "image",
            },
            keyboard: {
                type: ControlType.Boolean,
                title: "Keyboard",
                defaultValue: true,
            },
            wheel: {
                type: ControlType.Boolean,
                title: "Mouse wheel",
                defaultValue: false,
            },
            autoplay: {
                type: ControlType.Boolean,
                title: "Autoplay",
                defaultValue: false,
            },
            interval: {
                type: ControlType.Number,
                title: "Interval",
                min: 1,
                max: 20,
                step: 0.5,
                unit: "s",
                defaultValue: 5,
            },
            pauseOnHover: {
                type: ControlType.Boolean,
                title: "Pause on hover",
                defaultValue: true,
            },
            startIndex: {
                type: ControlType.Number,
                title: "Start slide",
                min: 1,
                max: 50,
                step: 1,
                displayStepper: true,
                defaultValue: 1,
            },
            label: {
                type: ControlType.String,
                title: "ARIA label",
                defaultValue: "Project slider",
            },
        },
    },

    /* ---------------------------------- motion ------------------------------- */
    motion: {
        type: ControlType.Object,
        title: "Text motion",
        buttonTitle: "Text motion",
        controls: {
            textAnimation: {
                type: ControlType.Enum,
                title: "Effect",
                options: ["rise", "fade", "slide", "none"],
                optionTitles: ["Rise", "Fade", "Slide (direction)", "None"],
                defaultValue: "rise",
            },
            motion: {
                type: ControlType.Transition,
                title: "Transition",
                defaultValue: {
                    type: "tween",
                    duration: 0.6,
                    ease: [0.25, 1, 0.5, 1],
                },
            },
            distance: {
                type: ControlType.Number,
                title: "Distance",
                min: 0,
                max: 60,
                unit: "px",
                defaultValue: 14,
            },
            stagger: {
                type: ControlType.Number,
                title: "Stagger",
                min: 0,
                max: 300,
                step: 10,
                unit: "ms",
                defaultValue: 70,
            },
        },
    },
})
