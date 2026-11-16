// Letter Drop: a display title whose letters fall into place, each with a little spin, then lift away
// at slightly different speeds as you scroll past, as if they were never quite glued down.
// From the page titles of tanmaykaper's portfolio. STUDIO day kit v1.1, (c) 2026 Tanmay Kaper. See LICENSE.md.
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


type FontValue = { fontFamily?: string; fontWeight?: number | string; fontStyle?: string; fontSize?: string | number; letterSpacing?: string | number; lineHeight?: string | number; textAlign?: string }
type Props = {
    text: string
    tag: "h1" | "h2" | "p"
    font?: FontValue
    color: string
    uppercase: boolean
    trigger: "Load" | "In view"
    delay: number
    stagger: number
    spin: number
    lift: number
    wrap: "Words" | "Anywhere" | "None"
    overflow: "Visible" | "Clip"
    style?: React.CSSProperties
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 900
 */
export default function LetterDrop(props: Props) {
    const { text = "Experience", tag = "h1", color = "#ffffff", uppercase = true, trigger = "Load", delay = 0.25, stagger = 0.06, spin = 5, lift = 1, wrap = "Words", overflow = "Visible", style } = props
    // on the canvas, in thumbnails and in exports the title is drawn once, already in place
    const isStatic = useIsStaticRenderer()
    const ref = React.useRef<HTMLElement>(null)
    const [dropped, setDropped] = React.useState(isStatic)
    // words stay whole so lines break between them; every letter keeps its place in the stagger
    const words = React.useMemo(() => {
        let n = 0
        return text.split(/(\s+)/).filter(Boolean).map((w) => /^\s+$/.test(w) ? { space: true, letters: [] as { ch: string; i: number }[] } : { space: false, letters: [...w].map((ch) => ({ ch, i: n++ })) })
    }, [text])
    const count = words.reduce((c, w) => c + w.letters.length, 0)

    React.useEffect(() => {
        const el = ref.current
        if (!el || isStatic) return
        const go = () => requestAnimationFrame(() => requestAnimationFrame(() => setDropped(true)))
        if (trigger === "Load") { go(); return }
        const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { io.disconnect(); go() } }, { rootMargin: "0px 0px -15% 0px" })
        io.observe(el)
        return () => io.disconnect()
    }, [trigger, isStatic])

    // after landing, letters lift away at their own speeds as the title scrolls up the screen
    React.useEffect(() => {
        const el = ref.current
        if (!el || isStatic || !lift || matchMedia("(prefers-reduced-motion: reduce)").matches) return
        const letters = [...el.querySelectorAll<HTMLElement>("[data-l]")]
        const speeds = letters.map((_, i) => 0.1 + ((i * 7) % 5) * 0.07)
        let raf = 0, last = ""
        const update = () => {
            raf = 0
            // lifting starts once the title's top passes the middle of the screen (at once for a hero)
            const top = el.getBoundingClientRect().top + scrollY
            const passed = Math.max(0, Math.min(innerHeight * 1.4, scrollY - Math.max(0, top - innerHeight * 0.5)))
            const key = passed.toFixed(1)
            if (key === last) return
            last = key
            letters.forEach((l, i) => { l.style.translate = `0 ${(-passed * speeds[i] * lift).toFixed(1)}px` })
        }
        const on = () => { if (!raf) raf = requestAnimationFrame(update) }
        update()
        addEventListener("scroll", on, { passive: true })
        return () => { cancelAnimationFrame(raf); removeEventListener("scroll", on) }
    }, [lift, isStatic, count])

    const f = props.font || {}
    const Tag = tag as any
    const letter = (ch: string, i: number) => (
        <span key={i} data-l aria-hidden="true" className="sdDrop__l"
            style={isStatic ? undefined : ({ "--r": `${(((i * 37) % 11) - 5) * (spin / 5)}deg`, transitionDelay: `${delay + i * stagger}s, ${delay + i * stagger}s` } as React.CSSProperties)}>
            {ch}
        </span>
    )
    return (
        <Tag ref={ref} aria-label={text} className={`sdDrop sdDrop--${wrap.toLowerCase()}${dropped ? " is-in" : ""}${isStatic ? " is-static" : ""}`}
            style={{
                margin: 0, color, textTransform: uppercase ? "uppercase" : "none",
                whiteSpace: wrap === "None" ? "nowrap" : "normal", overflow: wrap === "None" && overflow === "Clip" ? "hidden" : undefined,
                fontFamily: f.fontFamily || '"Inter", "Helvetica Neue", Arial, sans-serif', fontWeight: f.fontWeight ?? 900, fontStyle: f.fontStyle || "normal",
                fontSize: f.fontSize ?? 160, letterSpacing: f.letterSpacing ?? "-0.03em", lineHeight: f.lineHeight ?? 0.9, textAlign: (f.textAlign as any) || "center",
                ...style,
            }}>
            <style>{CSS}</style>
            {words.map((w, k) => w.space ? " " : wrap === "Anywhere"
                ? <React.Fragment key={k}>{w.letters.map((l) => letter(l.ch, l.i))}</React.Fragment>
                : <span key={k} className="sdDrop__w">{w.letters.map((l) => letter(l.ch, l.i))}</span>)}
        </Tag>
    )
}

const CSS = `
.sdDrop--words { text-wrap: balance; }
.sdDrop__w { display: inline-block; white-space: nowrap; }
.sdDrop__l { display: inline-block; opacity: 0; transform: translateY(-0.9em) rotate(var(--r, 0deg)); }
.sdDrop.is-in .sdDrop__l { opacity: 1; transform: none; transition: transform 1.2s cubic-bezier(.34,1.32,.64,1), opacity .5s linear; }
.sdDrop.is-static .sdDrop__l { opacity: 1; transform: none; translate: none; transition: none; }
@media (prefers-reduced-motion: reduce) { .sdDrop__l { opacity: 1; transform: none; transition: none !important; } }
`

addPropertyControls(LetterDrop, {
    text: { type: ControlType.String, title: "Text", defaultValue: "Experience" },
    tag: { type: ControlType.Enum, title: "Tag", options: ["h1", "h2", "p"], displaySegmentedControl: true, defaultValue: "h1" },
    font: { type: ControlType.Font, title: "Font", controls: "extended", defaultFontType: "sans-serif", defaultValue: { fontSize: 160, lineHeight: "0.9em", letterSpacing: "-0.03em" } },
    color: { type: ControlType.Color, title: "Colour", defaultValue: "#ffffff" },
    uppercase: { type: ControlType.Boolean, title: "Uppercase", defaultValue: true },
    trigger: { type: ControlType.Enum, title: "Drop on", options: ["Load", "In view"], displaySegmentedControl: true, defaultValue: "Load" },
    delay: { type: ControlType.Number, title: "Delay", min: 0, max: 3, step: 0.05, unit: "s", defaultValue: 0.25 },
    stagger: { type: ControlType.Number, title: "Stagger", min: 0, max: 0.3, step: 0.01, unit: "s", defaultValue: 0.06 },
    spin: { type: ControlType.Number, title: "Spin", min: 0, max: 30, step: 1, unit: "°", defaultValue: 5 },
    lift: { type: ControlType.Number, title: "Scroll lift", min: 0, max: 3, step: 0.1, defaultValue: 1, description: "How far letters lift away as you scroll past. 0 keeps them still." },
    wrap: { type: ControlType.Enum, title: "Wrap", options: ["Words", "Anywhere", "None"], optionTitles: ["Between words", "Anywhere", "One line"], defaultValue: "Words", description: "Long titles wrap between words, so they stay readable in narrow frames and when text is zoomed." },
    overflow: { type: ControlType.Enum, title: "Overflow", options: ["Visible", "Clip"], displaySegmentedControl: true, defaultValue: "Visible", hidden: (p: Props) => p.wrap !== "None", description: "What happens when a one-line title is wider than its frame." },
})
