// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useMemo } from "react"

/**
 * Line Balance — 見出しの改行を、日本語と英語の両方で正しく折る。
 *
 * 🔴 なぜ棚に要るか（09-09に Typography 棚を実測＝縦組み0本・禁則0本）
 *    ブラウザの既定の折り返しは、日本語では**行頭に「、」「。」「）」を置く**（禁則が効かない）。
 *    英語では**最後の1語だけが次の行に落ちる**（widow）。どちらも見出しでいちばん目につく崩れ。
 *
 *    ① 行頭禁則＝閉じ括弧・句読点・長音・小書き仮名を、直前の字と分離不可にする（U+2060）
 *    ② 行末禁則＝開き括弧を、次の字と分離不可にする
 *    ③ 分離禁止＝「……」「――」を割らない
 *    ④ Balance ＝ CSS text-wrap で各行の長さを揃える（英語見出しに効く）
 *    ⑤ Auto Phrase ＝日本語を文節で折る（対応ブラウザのみ／非対応でも崩れない）
 *    ⑥ No Widow ＝英文の最後の2語を繋いで、1語だけ落ちるのを止める
 *
 *    アニメーションを一切持たない＝キャンバスでも書き出しでも同じ絵になる。
 *    外部通信ゼロ・依存ゼロ・辞書ゼロ。
 *
 * @framerIntrinsicWidth 420
 * @framerIntrinsicHeight 120
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */

const WJ = "⁠" // word joiner（見えない・分離不可）
const NBSP = " "

/* 行頭に置いてはいけない字＝直前の字とくっつける */
const NO_START =
    "、。，．,.・：；:;！？!?)]｝〕〉》」』】〙〗〟’”｠»…‥ヽヾゝゞー–—〜～ぁぃぅぇぉっゃゅょゎァィゥェォッャュョヮヵヶ％‰℃°"
/* 行末に置いてはいけない字＝次の字とくっつける */
const NO_END = "([｛〔〈《「『【〘〖〝‘“｟«￥＄$#＃"

function kinsokuJoin(src: string, kinsoku: boolean, keepPairs: boolean) {
    let s = src
    if (keepPairs) {
        s = s.replace(/…{1,}|‥{1,}|—{1,}|―{1,}/g, (m) => m.split("").join(WJ))
    }
    if (!kinsoku) return s
    let out = ""
    for (let i = 0; i < s.length; i++) {
        const ch = s[i]
        const prev = out[out.length - 1]
        if (NO_START.includes(ch) && prev && prev !== "\n") out += WJ + ch
        else if (NO_END.includes(ch)) out += ch + WJ
        else out += ch
    }
    return out
}

/* 英文の最後の2語を繋ぐ（1語だけ次の行に落ちるのを止める） */
function killWidow(line: string) {
    const words = line.trim().split(/ +/)
    if (words.length < 3) return line
    const last = words.pop() as string
    return words.join(" ") + NBSP + last
}

export default function LineBalance(props) {
    const {
        text,
        tag,
        font,
        color,
        align,
        wrapMode,
        kinsoku,
        keepPairs,
        autoPhrase,
        noWidow,
        hanging,
        maxWidth,
        style,
    } = props

    const lines = useMemo(() => {
        const raw = String(text ?? "").split("\n")
        return raw.map((l) => {
            let s = noWidow ? killWidow(l) : l
            return kinsokuJoin(s, kinsoku, keepPairs)
        })
    }, [text, kinsoku, keepPairs, noWidow])

    const Tag = (tag || "h2") as any

    const css: any = {
        margin: 0,
        color,
        textAlign: align,
        textWrap: wrapMode === "off" ? "wrap" : wrapMode,
        lineBreak: kinsoku ? "strict" : "auto",
        wordBreak: autoPhrase ? "auto-phrase" : "normal",
        overflowWrap: "break-word",
        hangingPunctuation: hanging ? "first allow-end last" : "none",
        maxWidth: maxWidth > 0 ? `${maxWidth}ch` : undefined,
        width: "100%",
        ...font,
        ...style,
    }

    return (
        <Tag style={css}>
            {lines.map((l, i) => (
                <span key={i}>
                    {l}
                    {i < lines.length - 1 ? <br /> : null}
                </span>
            ))}
        </Tag>
    )
}

/* ------------------------------------------------------------ 設定欄 */

LineBalance.defaultProps = {
    text: "静けさのなかで、線は（ようやく）意味を持つ。\nQuiet type that never breaks a line in the wrong place.",
    tag: "h2",
    color: "#111111",
    align: "start",
    wrapMode: "balance",
    kinsoku: true,
    keepPairs: true,
    autoPhrase: true,
    noWidow: true,
    hanging: false,
    maxWidth: 0,
}

addPropertyControls(LineBalance, {
    text: {
        type: ControlType.String,
        title: "Text",
        displayTextArea: true,
        description: "改行はそのまま行が変わります。禁則は自動で当たります。",
    },
    tag: {
        type: ControlType.Enum,
        title: "Tag",
        options: ["h1", "h2", "h3", "p"],
        optionTitles: ["H1", "H2", "H3", "P"],
        displaySegmentedControl: true,
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: 32, lineHeight: 1.5 },
    },
    color: { type: ControlType.Color, title: "Color" },
    align: {
        type: ControlType.Enum,
        title: "Align",
        options: ["start", "center", "end"],
        optionTitles: ["Left", "Center", "Right"],
        displaySegmentedControl: true,
    },
    wrapMode: {
        type: ControlType.Enum,
        title: "Wrap",
        options: ["balance", "pretty", "off"],
        optionTitles: ["Balance", "Pretty", "Off"],
        description:
            "Balance＝各行の長さを揃える（見出し向き）。Pretty＝最終行だけ守る（本文向き）。",
    },
    kinsoku: {
        type: ControlType.Boolean,
        title: "Kinsoku",
        description: "行頭に「、。）」を置かない／行末に「（「」を残さない。",
    },
    keepPairs: {
        type: ControlType.Boolean,
        title: "Keep …／——",
        hidden: (p) => !p.kinsoku,
    },
    autoPhrase: {
        type: ControlType.Boolean,
        title: "Auto Phrase",
        description: "日本語を文節で折る（対応ブラウザのみ）。",
    },
    noWidow: {
        type: ControlType.Boolean,
        title: "No Widow",
        description: "英文の最後の2語を繋いで、1語だけ落ちるのを止める。",
    },
    hanging: { type: ControlType.Boolean, title: "Hanging Punctuation" },
    maxWidth: {
        type: ControlType.Number,
        title: "Measure",
        min: 0,
        max: 90,
        step: 1,
        unit: "ch",
        description:
            "0で切る。20〜45字で見出しがいちばん読みやすい。\n\nMore type & gallery components: search “KHZ ART” in the Marketplace.",
    },
})
