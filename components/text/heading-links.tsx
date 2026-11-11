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


/*
 * Heading Links — a "copy link" button on every heading
 * On the live site the component finds the headings on your page (including
 * CMS Rich Text), gives each one an ID if it has none, and adds a small
 * button. Clicking it copies a link straight to that section and shows a
 * "Link copied" toast. Visitors opening that link land on the heading.
 * Your text is never changed: the buttons, IDs and stylesheet it adds are
 * removed again when the component leaves the page.
 * Performance: one scan on load, then only newly added headings are processed.
 */

const { useEffect, useId } = React

type IconName = "hash" | "link" | "paragraph"

interface Headings {
    h1: boolean
    h2: boolean
    h3: boolean
    h4: boolean
    h5: boolean
}

interface Button {
    icon: IconName
    position: "left" | "right"
    reveal: "hover" | "always"
    size: number
    gap: number
    color: string
    hoverColor: string
}

interface Toast {
    show: boolean
    text: string
    position: "bottom" | "top"
    background: string
    color: string
    radius: number
}

interface Props {
    headings: Headings
    scope: "page" | "section"
    sectionId: string
    button: Button
    toast: Toast
    updateUrl: boolean
    jump: boolean
    offset: number
    style?: React.CSSProperties
}

const HEADINGS: Headings = {
    h1: false,
    h2: true,
    h3: true,
    h4: false,
    h5: false,
}
const BUTTON: Button = {
    icon: "hash",
    position: "left",
    reveal: "hover",
    size: 70,
    gap: 8,
    color: "rgba(140, 146, 158, 0.75)",
    hoverColor: "#4F7CFF",
}
const TOAST: Toast = {
    show: true,
    text: "Link copied",
    position: "bottom",
    background: "#16181D",
    color: "#FFFFFF",
    radius: 999,
}

// Never add buttons to headings inside these
const SKIP =
    "nav,header,footer,button,a,label,[contenteditable='true'],[aria-hidden='true'],[role='button'],[role='dialog']"
const MAX_HEADINGS = 150

// 24×24 stroke icons, used as CSS masks so they take the button color
const ICONS: Record<IconName | "check", string> = {
    hash: "M5 9h14M5 15h14M10 4 8 20M16 4l-2 16",
    link: "M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1",
    paragraph: "M13 4v16M17 4v16M19 4H9.5a4.5 4.5 0 0 0 0 9H13",
    check: "M5 12.5l4.5 4.5L19 7.5",
}
const iconUrl = (name: keyof typeof ICONS) => {
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'><path d='${ICONS[name] || ICONS.hash}'/></svg>`
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
}

// "Pricing & Plans" → "pricing-plans"
const slugify = (s: string) =>
    s
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
        .replace(/[^\p{L}\p{N}]+/gu, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 60) || "section"

const levelSelector = (h: Headings) =>
    (["h1", "h2", "h3", "h4", "h5"] as const)
        .filter((k) => h[k])
        .map((k) => (k === "h5" ? "h5,h6" : k))
        .join(",")

// Button + toast styles, shared by the live page and the canvas preview
function buildCss(
    cls: string,
    attr: string,
    b: Button,
    t: Toast,
    offset: number
): string {
    const size = `${Math.max(30, Math.min(120, b.size)) / 100}em`
    const left = b.position === "left"
    const place = left
        ? `position:absolute;right:100%;top:50%;transform:translateY(-50%);margin-right:${b.gap}px;`
        : `position:relative;vertical-align:middle;margin-left:${b.gap}px;top:-0.06em;`
    const toastPos = t.position === "top" ? "top:24px;" : "bottom:24px;"
    return [
        `[${attr}]{scroll-margin-top:${offset}px}`,
        left ? `[${attr}]{position:relative}` : "",
        `.${cls}{${place}display:inline-flex;align-items:center;justify-content:center;width:calc(${size} + 8px);height:calc(${size} + 8px);padding:0;margin-top:0;margin-bottom:0;border:0;border-radius:6px;background:transparent;color:${b.color};cursor:pointer;user-select:none;-webkit-user-select:none;line-height:0;font-size:inherit;opacity:${b.reveal === "always" ? 1 : 0};transition:opacity .18s ease,color .18s ease,background-color .18s ease}`,
        `.${cls}::before{content:"";width:${size};height:${size};background:currentColor;-webkit-mask:var(--${cls}-i) center/contain no-repeat;mask:var(--${cls}-i) center/contain no-repeat}`,
        `.${cls}{--${cls}-i:${iconUrl(b.icon)}}`,
        `.${cls}[data-done]{--${cls}-i:${iconUrl("check")};color:${b.hoverColor};opacity:1}`,
        `[${attr}]:hover .${cls},.${cls}:focus-visible{opacity:1}`,
        `.${cls}:hover{color:${b.hoverColor};background:color-mix(in srgb,${b.hoverColor} 10%,transparent)}`,
        `.${cls}:focus-visible{outline:2px solid ${b.hoverColor};outline-offset:2px}`,
        `@media (hover:none){.${cls}{opacity:1}}`,
        // Small screens: no room in the left margin, so sit after the text instead
        left
            ? `@media (max-width:640px){.${cls}{position:relative;right:auto;top:-0.06em;transform:none;vertical-align:middle;margin-right:0;margin-left:${b.gap}px}}`
            : "",
        `.${cls}-t{position:fixed;left:50%;${toastPos}z-index:2147483000;transform:translate(-50%,${t.position === "top" ? "-8px" : "8px"});display:flex;align-items:center;gap:8px;padding:10px 16px;border-radius:${t.radius}px;background:${t.background};color:${t.color};font:500 14px/1.2 Inter,system-ui,-apple-system,sans-serif;letter-spacing:-0.01em;box-shadow:0 8px 28px rgba(0,0,0,.18),0 0 0 1px rgba(255,255,255,.06) inset;opacity:0;pointer-events:none;white-space:nowrap;transition:opacity .2s ease,transform .2s ease}`,
        `.${cls}-t::before{content:"";width:16px;height:16px;flex:none;background:currentColor;-webkit-mask:${iconUrl("check")} center/contain no-repeat;mask:${iconUrl("check")} center/contain no-repeat}`,
        `.${cls}-t[data-on]{opacity:1;transform:translate(-50%,0)}`,
        `@media (prefers-reduced-motion:reduce){.${cls},.${cls}-t{transition:none}}`,
    ]
        .filter(Boolean)
        .join("\n")
}

async function copyText(text: string): Promise<boolean> {
    try {
        await navigator.clipboard.writeText(text)
        return true
    } catch {
        // Older browsers / insecure context
        const ta = document.createElement("textarea")
        ta.value = text
        ta.setAttribute("readonly", "")
        ta.style.cssText =
            "position:fixed;top:0;left:0;opacity:0;pointer-events:none"
        document.body.appendChild(ta)
        ta.select()
        let ok = false
        try {
            ok = document.execCommand("copy")
        } catch {}
        ta.remove()
        return ok
    }
}

interface Opts {
    cls: string
    attr: string
    headings: Headings
    scope: Props["scope"]
    sectionId: string
    button: Button
    toast: Toast
    updateUrl: boolean
    jump: boolean
    offset: number
}

// Adds buttons, IDs, one stylesheet and one toast. Returns cleanup.
// Performance: one scan on load, then only NEWLY ADDED headings are processed.
// The observer watches only the scan root (the section when scoped), never watches
// text edits (characterData), and ignores the buttons and toast this component adds.
function mountLinks(o: Opts): () => void {
    const { cls, attr } = o
    const sel = levelSelector(o.headings)
    const css = document.createElement("style")
    css.textContent = buildCss(cls, attr, o.button, o.toast, o.offset)
    document.head.appendChild(css)

    const toast = document.createElement("div")
    toast.className = `${cls}-t`
    toast.setAttribute("role", "status")
    toast.setAttribute("aria-live", "polite")
    document.body.appendChild(toast)

    const timers = new Set<any>()
    const later = (fn: () => void, ms: number) => {
        const t = setTimeout(() => {
            timers.delete(t)
            fn()
        }, ms)
        timers.add(t)
        return t
    }
    let flushT: any = 0
    let toastT: any = 0
    let hashDone = !location.hash
    let count = 0
    let root: Element | null = null
    let mo: MutationObserver | null = null
    let pending = new Set<Element>()
    const used = new Set<string>()

    // Nodes this component created: never react to them
    const ours = (n: Node) =>
        n === toast ||
        toast.contains(n) ||
        (n.nodeType === 1 && (n as Element).classList.contains(cls)) ||
        (n.parentElement?.classList.contains(cls) ?? false)

    const showToast = (msg: string) => {
        if (!o.toast.show) return
        toast.textContent = msg
        toast.setAttribute("data-on", "")
        clearTimeout(toastT)
        timers.delete(toastT)
        toastT = later(() => toast.removeAttribute("data-on"), 1800)
    }

    const onClick = async (e: Event) => {
        e.preventDefault()
        const btn = e.currentTarget as HTMLButtonElement
        const h = btn.parentElement
        if (!h?.id) return
        const url = `${location.href.split("#")[0]}#${encodeURIComponent(h.id)}`
        const ok = await copyText(url)
        if (o.updateUrl) {
            try {
                history.replaceState(
                    history.state,
                    "",
                    `#${encodeURIComponent(h.id)}`
                )
            } catch {}
        }
        if (o.jump) {
            const reduce = matchMedia(
                "(prefers-reduced-motion: reduce)"
            ).matches
            h.scrollIntoView({
                behavior: reduce ? "auto" : "smooth",
                block: "start",
            })
        }
        btn.setAttribute("data-done", "")
        later(() => btn.removeAttribute("data-done"), 1500)
        showToast(ok ? o.toast.text || "Link copied" : "Couldn't copy the link")
    }

    const label = (h: Element) =>
        `Copy link to “${(h.textContent || "").trim().slice(0, 80)}”`

    // Adds the ID + button to one heading (safe to call again: updates the label only)
    const addTo = (h: Element) => {
        if (h.closest(SKIP) || !(h.textContent || "").trim()) return
        if (!h.hasAttribute(attr)) {
            if (count >= MAX_HEADINGS) return
            count++
        }
        if (!h.id) {
            // Unique slug from the heading text; remembered so cleanup can remove it
            const base = slugify(h.textContent || "")
            let slug = base
            for (
                let n = 2;
                used.has(slug) || document.getElementById(slug);
                n++
            )
                slug = `${base}-${n}`
            h.id = slug
            h.setAttribute(`${attr}-id`, "")
        }
        used.add(h.id)
        h.setAttribute(attr, "")
        let btn = Array.from(h.children).find((c) =>
            c.classList.contains(cls)
        ) as HTMLButtonElement | undefined
        if (!btn) {
            btn = document.createElement("button")
            btn.type = "button"
            btn.className = cls
            btn.addEventListener("click", onClick)
            h.appendChild(btn)
        }
        const l = label(h)
        if (btn.getAttribute("aria-label") !== l) {
            btn.setAttribute("aria-label", l)
            btn.title = "Copy link"
        }
    }

    // Visitor arrived with #slug that only exists now: scroll to it once
    const checkHash = () => {
        if (hashDone) return
        const target = document.getElementById(
            decodeURIComponent(location.hash.slice(1))
        )
        if (target?.hasAttribute(`${attr}-id`)) {
            hashDone = true
            target.scrollIntoView({ block: "start" })
        }
    }

    // Process one added subtree: the node itself, its heading parent, and headings inside it
    const scanIn = (node: Element) => {
        if (!root || !root.contains(node)) return
        if (node.matches(sel)) addTo(node)
        else {
            const h = node.closest(sel)
            if (h && root.contains(h)) addTo(h)
        }
        node.querySelectorAll(sel).forEach(addTo)
    }

    const flush = () => {
        flushT = 0
        const batch = pending
        pending = new Set()
        batch.forEach((n) => n.isConnected && scanIn(n))
        checkHash()
    }

    // Only ADDITIONS that are not ours are queued; everything else is ignored
    const onMutations = (recs: MutationRecord[]) => {
        for (const r of recs) {
            if (ours(r.target)) continue
            r.addedNodes.forEach((n) => {
                if (ours(n)) return
                if (n.nodeType === 1) pending.add(n as Element)
                else if (n.nodeType === 3 && n.parentElement)
                    pending.add(n.parentElement)
            })
        }
        if (pending.size && !flushT) flushT = setTimeout(flush, 200)
    }

    const start = (r: Element) => {
        root = r
        r.querySelectorAll(sel).forEach(addTo)
        checkHash()
        mo?.disconnect()
        mo = new MutationObserver(onMutations)
        mo.observe(r, { childList: true, subtree: true })
    }

    if (sel) {
        const id = (o.sectionId || "").trim().replace(/^#/, "")
        if (o.scope === "section") {
            const found = id ? document.getElementById(id) : null
            if (found) start(found)
            else if (id) {
                // Section not rendered yet (CMS / page transition): wait for it, then narrow down
                mo = new MutationObserver(() => {
                    const el = document.getElementById(id)
                    if (el) start(el)
                })
                mo.observe(document.body, { childList: true, subtree: true })
            }
        } else start(document.body)
    }
    // Stop waiting for a late #hash after a few seconds
    later(() => (hashDone = true), 6000)

    const clear = () => {
        document.querySelectorAll(`.${cls}`).forEach((b) => {
            b.removeEventListener("click", onClick)
            b.remove()
        })
        document.querySelectorAll(`[${attr}-id]`).forEach((h) => {
            h.removeAttribute("id")
            h.removeAttribute(`${attr}-id`)
        })
        document
            .querySelectorAll(`[${attr}]`)
            .forEach((h) => h.removeAttribute(attr))
    }

    return () => {
        clearTimeout(flushT)
        timers.forEach((t) => clearTimeout(t))
        timers.clear()
        mo?.disconnect()
        clear()
        toast.remove()
        css.remove()
    }
}

/**
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 420
 * @framerIntrinsicHeight 220
 */
export default function HeadingLinks(props: Props) {
    const { scope, sectionId, updateUrl, jump, offset, style } = props
    const headings: Headings = { ...HEADINGS, ...props.headings }
    const button: Button = { ...BUTTON, ...props.button }
    const toast: Toast = { ...TOAST, ...props.toast }
    // Canvas, thumbnails and static export: preview card only, no page scanning
    const isStatic = useIsStaticRenderer()
    const uid = useId()
        .replace(/[^a-zA-Z0-9]/g, "")
        .toLowerCase()
    const cls = `hlc${uid}`
    const attr = `data-hlc${uid}`

    const key = JSON.stringify({
        headings,
        scope,
        sectionId,
        button,
        toast,
        updateUrl,
        jump,
        offset,
    })

    useEffect(() => {
        if (isStatic || typeof document === "undefined") return
        return mountLinks({
            cls,
            attr,
            headings,
            scope,
            sectionId,
            button,
            toast,
            updateUrl,
            jump,
            offset: offset ?? 24,
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key, isStatic, cls])

    // Live site: takes zero space; buttons are added to your own headings
    if (!isStatic)
        return (
            <div
                aria-hidden="true"
                style={{
                    ...style,
                    width: 0,
                    height: 0,
                    minWidth: 0,
                    minHeight: 0,
                    padding: 0,
                    overflow: "hidden",
                    pointerEvents: "none",
                }}
            />
        )

    // Static: a preview of the look, plus what it will scan (no transitions)
    const levels = (["h1", "h2", "h3", "h4", "h5"] as const)
        .filter((k) => headings[k])
        .map((k) => k.toUpperCase())
    const where =
        scope === "section"
            ? sectionId
                ? `#${sectionId.replace(/^#/, "")}`
                : "a section (set its ID)"
            : "the page"
    const previewCss =
        buildCss(cls, attr, { ...button, reveal: "always" }, toast, 0)
            // the card is narrow: keep the left position on canvas
            .replace(/@media \(max-width:640px\)\{.*\}\}/, "")
            .replace(
                /position:fixed;left:50%;(top|bottom):24px;/,
                "position:relative;left:50%;"
            )
            .replace(
                "opacity:0;pointer-events:none;white-space",
                "opacity:1;pointer-events:none;white-space"
            ) + `.${cls},.${cls}-t{transition:none!important}`

    return (
        <div
            style={{
                ...style,
                width: 420,
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                gap: 14,
                padding: "20px 20px 20px 44px",
                borderRadius: 16,
                border: "1px dashed rgba(128,128,128,0.4)",
                background: "rgba(128,128,128,0.06)",
                fontFamily: "Inter, system-ui, sans-serif",
                color: "#8E939E",
            }}
        >
            {levels.length ? (
                <>
                    <style>{previewCss}</style>
                    <div
                        {...{ [attr]: "" }}
                        style={{
                            fontSize: 22,
                            fontWeight: 600,
                            lineHeight: 1.3,
                            letterSpacing: "-0.01em",
                        }}
                    >
                        Getting started
                        <span className={cls} aria-hidden="true" />
                    </div>
                    <div style={{ fontSize: 14, lineHeight: 1.5 }}>
                        Every {levels.join(", ")} heading gets a button that
                        copies a link straight to it.
                    </div>
                    {toast.show && (
                        <div style={{ height: 38, marginLeft: -24 }}>
                            <div
                                className={`${cls}-t`}
                                style={{
                                    transform: "translateX(-50%)",
                                    display: "inline-flex",
                                }}
                            >
                                {toast.text || "Link copied"}
                            </div>
                        </div>
                    )}
                    <div
                        style={{
                            fontSize: 11.5,
                            letterSpacing: 0.2,
                            opacity: 0.85,
                            marginLeft: -24,
                        }}
                    >
                        Heading Links · adds buttons to headings in {where} on
                        the live site
                    </div>
                </>
            ) : (
                <div
                    style={{
                        textAlign: "center",
                        fontSize: 13,
                        lineHeight: 1.5,
                        marginLeft: -24,
                    }}
                >
                    Turn on at least one heading level
                    <br />
                    in the right panel.
                </div>
            )}
        </div>
    )
}

HeadingLinks.displayName = "Heading Links"

addPropertyControls(HeadingLinks, {
    headings: {
        type: ControlType.Object,
        title: "Headings",
        controls: {
            h1: {
                type: ControlType.Boolean,
                title: "H1",
                defaultValue: HEADINGS.h1,
            },
            h2: {
                type: ControlType.Boolean,
                title: "H2",
                defaultValue: HEADINGS.h2,
            },
            h3: {
                type: ControlType.Boolean,
                title: "H3",
                defaultValue: HEADINGS.h3,
            },
            h4: {
                type: ControlType.Boolean,
                title: "H4",
                defaultValue: HEADINGS.h4,
            },
            h5: {
                type: ControlType.Boolean,
                title: "H5 / H6",
                defaultValue: HEADINGS.h5,
            },
        },
    },
    scope: {
        type: ControlType.Enum,
        title: "Scan",
        options: ["page", "section"],
        optionTitles: ["Whole Page", "One Section"],
        displaySegmentedControl: true,
        defaultValue: "page",
    },
    sectionId: {
        type: ControlType.String,
        title: "Section ID",
        placeholder: "article",
        defaultValue: "",
        description: "The ID set on a frame (Layer → Scroll Section ID).",
        hidden: (p: any) => p.scope !== "section",
    },
    button: {
        type: ControlType.Object,
        title: "Button",
        controls: {
            icon: {
                type: ControlType.Enum,
                title: "Icon",
                options: ["hash", "link", "paragraph"],
                optionTitles: ["#", "Link", "¶"],
                displaySegmentedControl: true,
                defaultValue: BUTTON.icon,
            },
            position: {
                type: ControlType.Enum,
                title: "Position",
                options: ["left", "right"],
                optionTitles: ["Left", "After Text"],
                displaySegmentedControl: true,
                defaultValue: BUTTON.position,
                description: "Left moves after the text on small screens.",
            },
            reveal: {
                type: ControlType.Enum,
                title: "Show",
                options: ["hover", "always"],
                optionTitles: ["On Hover", "Always"],
                displaySegmentedControl: true,
                defaultValue: BUTTON.reveal,
            },
            size: {
                type: ControlType.Number,
                title: "Size",
                defaultValue: BUTTON.size,
                min: 30,
                max: 120,
                step: 5,
                unit: "%",
            },
            gap: {
                type: ControlType.Number,
                title: "Gap",
                defaultValue: BUTTON.gap,
                min: 0,
                max: 32,
            },
            color: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: BUTTON.color,
            },
            hoverColor: {
                type: ControlType.Color,
                title: "Hover",
                defaultValue: BUTTON.hoverColor,
            },
        },
    },
    toast: {
        type: ControlType.Object,
        title: "Toast",
        controls: {
            show: {
                type: ControlType.Boolean,
                title: "Show",
                defaultValue: TOAST.show,
            },
            text: {
                type: ControlType.String,
                title: "Text",
                defaultValue: TOAST.text,
                hidden: (p: any) => !p.show,
            },
            position: {
                type: ControlType.Enum,
                title: "Position",
                options: ["bottom", "top"],
                optionTitles: ["Bottom", "Top"],
                displaySegmentedControl: true,
                defaultValue: TOAST.position,
                hidden: (p: any) => !p.show,
            },
            background: {
                type: ControlType.Color,
                title: "Fill",
                defaultValue: TOAST.background,
                hidden: (p: any) => !p.show,
            },
            color: {
                type: ControlType.Color,
                title: "Text Color",
                defaultValue: TOAST.color,
                hidden: (p: any) => !p.show,
            },
            radius: {
                type: ControlType.Number,
                title: "Radius",
                defaultValue: TOAST.radius,
                min: 0,
                max: 999,
                hidden: (p: any) => !p.show,
            },
        },
    },
    updateUrl: {
        type: ControlType.Boolean,
        title: "Update URL",
        defaultValue: true,
        description: "Adds #section to the address bar on click.",
    },
    jump: {
        type: ControlType.Boolean,
        title: "Scroll on Click",
        defaultValue: false,
    },
    offset: {
        type: ControlType.Number,
        title: "Offset",
        defaultValue: 24,
        min: 0,
        max: 240,
        description:
            "Space kept above a heading when a link opens it, e.g. for a sticky navbar.",
    },
})
