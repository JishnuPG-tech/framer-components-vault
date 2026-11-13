// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useEffect, useMemo, useRef } from "react"

/**
 * Text Scramble — 見出しが記号の乱れから1字ずつ正しい字に落ち着く（無料の入口）。
 *
 *    ① 段組みは最終の文字で先に決まる＝乱れている間も行や幅が一切ずれない
 *       （各字の枠に本物の字を透明で置き、その上に乱れ字を重ねる）
 *    ② 読み上げは常に本物の文＝aria-label を固定・乱れ字は aria-hidden
 *    ③ 見えている間だけ動く（IntersectionObserver）・終われば rAF を止める
 *    ④ 動きを減らす設定とキャンバス（静的描画）では最終の文字だけを出す
 *    外部通信ゼロ・依存ゼロ。
 *
 * @framerIntrinsicWidth 560
 * @framerIntrinsicHeight 80
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */

const SETS: Record<string, string> = {
    glyphs: "!<>/\\[]{}?*^#:;|",
    letters: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    binary: "01",
    katakana:
        "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモ",
}

/* 字ごとに毎回同じ乱数（再生のたびに同じ落ち着き方） */
function seeded(i: number) {
    const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453
    return x - Math.floor(x)
}

export default function KhzHeadlineScramble(props) {
    const {
        text,
        tag,
        trigger,
        duration,
        spread,
        speed,
        charset,
        customChars,
        loopDelay,
        typeface: font,
        color,
        scrambleColor,
        alignment: align,
        style,
    } = props
    const isStatic = useIsStaticRenderer()
    const rootRef = useRef<HTMLElement>(null)
    const realRefs = useRef<(HTMLSpanElement | null)[]>([])
    const fakeRefs = useRef<(HTMLSpanElement | null)[]>([])
    const run = useRef({
        raf: 0,
        t0: 0,
        last: 0,
        visible: false,
        playing: false,
        played: false,
        timer: 0,
    })

    const chars = useMemo(() => Array.from(text || ""), [text])
    const pool = useMemo(() => {
        const src =
            charset === "custom"
                ? customChars || SETS.glyphs
                : SETS[charset] || SETS.glyphs
        return Array.from(src)
    }, [charset, customChars])
    /* 各字が落ち着く時刻（0〜1）＝左から順に＋少しの揺らぎ */
    const settle = useMemo(() => {
        const n = Math.max(chars.length - 1, 1)
        return chars.map((_, i) => (i / n) * spread + seeded(i) * (1 - spread))
    }, [chars, spread])

    useEffect(() => {
        if (isStatic) return
        const root = rootRef.current
        if (!root) return
        const r = run.current
        const reduced = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches

        const showFinal = () => {
            chars.forEach((_, i) => {
                const real = realRefs.current[i]
                const fake = fakeRefs.current[i]
                if (real) real.style.visibility = "visible"
                if (fake) fake.textContent = ""
            })
        }
        /* 字の枠に収まる記号だけを候補にする（細い i や l の上で隣と重ならない） */
        let fits: string[][] = []
        const measure = () => {
            const ctx = document.createElement("canvas").getContext("2d")
            const cs = window.getComputedStyle(root)
            if (ctx)
                ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`
            const gw = pool.map(
                (g) =>
                    [g, ctx ? ctx.measureText(g).width : 0] as [string, number]
            )
            const narrow = gw.slice().sort((a, b) => a[1] - b[1])[0]
            fits = chars.map((_, i) => {
                const slot =
                    realRefs.current[i]?.getBoundingClientRect().width || 0
                const ok = gw.filter(([, w]) => w <= slot * 1.1).map(([g]) => g)
                return ok.length ? ok : narrow ? [narrow[0]] : pool
            })
        }
        const pick = (i: number) => {
            const list = fits[i] || pool
            return list[Math.floor(Math.random() * list.length)] || ""
        }

        const frame = (now: number) => {
            r.raf = 0
            if (!r.playing || !r.visible) return
            const p = Math.min((now - r.t0) / (duration * 1000), 1)
            const swap = now - r.last >= speed
            if (swap) r.last = now
            chars.forEach((c, i) => {
                const real = realRefs.current[i]
                const fake = fakeRefs.current[i]
                if (!real || !fake) return
                const done = p >= settle[i] || /\s/.test(c)
                real.style.visibility = done ? "visible" : "hidden"
                if (done) fake.textContent = ""
                else if (swap || !fake.textContent) fake.textContent = pick(i)
            })
            if (p < 1) {
                r.raf = requestAnimationFrame(frame)
                return
            }
            r.playing = false
            r.played = true
            if (trigger === "loop")
                r.timer = window.setTimeout(play, loopDelay * 1000)
        }
        function play() {
            if (reduced) {
                showFinal()
                return
            }
            window.clearTimeout(r.timer)
            measure()
            r.playing = true
            r.t0 = performance.now()
            r.last = 0
            if (r.visible && !r.raf) r.raf = requestAnimationFrame(frame)
        }

        /* 初めの姿＝再生前の字は隠しておく（view/loop）。hover だけは最終の字から始める */
        if (reduced || trigger === "hover") showFinal()
        else
            chars.forEach((_, i) => {
                const real = realRefs.current[i]
                if (real && !/\s/.test(chars[i]))
                    real.style.visibility = "hidden"
            })

        const io = new IntersectionObserver(
            (entries) => {
                r.visible = entries[0].isIntersecting
                if (!r.visible) {
                    if (r.raf) cancelAnimationFrame(r.raf)
                    r.raf = 0
                    return
                }
                if (r.playing) r.raf = requestAnimationFrame(frame)
                else if (!r.played && trigger !== "hover") play()
            },
            { threshold: 0.2 }
        )
        io.observe(root)

        const onEnter = () => {
            if (trigger === "hover" || trigger === "both") play()
        }
        root.addEventListener("pointerenter", onEnter)
        root.addEventListener("focusin", onEnter)

        return () => {
            io.disconnect()
            root.removeEventListener("pointerenter", onEnter)
            root.removeEventListener("focusin", onEnter)
            if (r.raf) cancelAnimationFrame(r.raf)
            window.clearTimeout(r.timer)
            r.raf = 0
            r.playing = false
            r.played = false
        }
    }, [isStatic, chars, pool, settle, duration, speed, trigger, loopDelay])

    const Tag = (tag || "h2") as any
    /* 高さを固定された時は縦の中央に置く（auto の時は文字の高さそのまま） */
    return (
        <div
            style={{
                ...style,
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
            }}
        >
            <Tag
                ref={rootRef}
                aria-label={text}
                style={{
                    margin: 0,
                    width: "100%",
                    color,
                    textAlign: align,
                    whiteSpace: "pre-wrap",
                    ...font,
                }}
            >
                {chars.map((c, i) => (
                    <span
                        key={i}
                        aria-hidden={true}
                        style={{ position: "relative" }}
                    >
                        <span
                            ref={(el) => {
                                realRefs.current[i] = el
                            }}
                        >
                            {c}
                        </span>
                        <span
                            ref={(el) => {
                                fakeRefs.current[i] = el
                            }}
                            style={{
                                position: "absolute",
                                left: "50%",
                                top: 0,
                                transform: "translateX(-50%)",
                                color: scrambleColor,
                                pointerEvents: "none",
                            }}
                        />
                    </span>
                ))}
            </Tag>
        </div>
    )
}

KhzHeadlineScramble.defaultProps = {
    text: "Quiet type, sharp arrival.",
    tag: "h2",
    trigger: "view",
    duration: 1.4,
    spread: 0.7,
    speed: 55,
    charset: "glyphs",
    customChars: "",
    loopDelay: 3,
    color: "#111111",
    scrambleColor: "#9a9a9a",
    alignment: "center",
}

addPropertyControls(KhzHeadlineScramble, {
    text: { type: ControlType.String, title: "Text", displayTextArea: true },
    tag: {
        type: ControlType.Enum,
        title: "Tag",
        options: ["h1", "h2", "h3", "p", "span"],
        optionTitles: ["H1", "H2", "H3", "P", "Span"],
    },
    trigger: {
        type: ControlType.Enum,
        title: "Play",
        options: ["view", "hover", "both", "loop"],
        optionTitles: ["In View", "On Hover", "View + Hover", "Loop"],
    },
    loopDelay: {
        type: ControlType.Number,
        title: "Loop Gap",
        min: 0.5,
        max: 20,
        step: 0.5,
        unit: "s",
        hidden: (p) => p.trigger !== "loop",
    },
    duration: {
        type: ControlType.Number,
        title: "Duration",
        min: 0.2,
        max: 6,
        step: 0.1,
        unit: "s",
    },
    spread: {
        type: ControlType.Number,
        title: "Order",
        min: 0,
        max: 1,
        step: 0.05,
        description: "1 = strictly left to right. 0 = random order.",
    },
    speed: {
        type: ControlType.Number,
        title: "Flicker",
        min: 16,
        max: 200,
        step: 1,
        unit: "ms",
    },
    charset: {
        type: ControlType.Enum,
        title: "Glyphs",
        options: ["glyphs", "letters", "binary", "katakana", "custom"],
        optionTitles: ["Symbols", "Letters", "Binary", "Katakana", "Custom"],
    },
    customChars: {
        type: ControlType.String,
        title: "Custom",
        hidden: (p) => p.charset !== "custom",
    },
    typeface: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: 64, letterSpacing: "-0.02em" },
    },
    color: { type: ControlType.Color, title: "Color" },
    scrambleColor: { type: ControlType.Color, title: "Scramble" },
    alignment: {
        type: ControlType.Enum,
        title: "Align",
        options: ["left", "center", "right"],
        displaySegmentedControl: true,
    },
})
