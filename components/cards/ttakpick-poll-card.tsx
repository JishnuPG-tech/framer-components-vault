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


const ORIGIN = "https://ttakpick.com"
const CREATE_PATH = "/situations/group-vote/"
const CAMPAIGN = "free_group_poll_card"
const sampleTitle = "What should we do this weekend?"
const sampleOptions = "Coffee and a chat\nA game of bowling\nA walk in the park"
const themes = {
    lilac: { accent: "#4839B2", tint: "#F5F2FF", border: "#DED8F2" },
    pine: { accent: "#195C43", tint: "#EEF7F1", border: "#CDE5D6" },
    night: { accent: "#283957", tint: "#EFF3F8", border: "#D2DDEC" },
}
const copy = {
    en: {
        label: "Group poll",
        example: "Example poll",
        choices: "Choices preview",
        join: "Vote on ttakPick",
        create: "Create a free poll on ttakPick",
        remote: "Cast your vote on ttakPick.com. No sign-up or app needed.",
        setup: "Create your own poll on ttakPick.com. No sign-up or app needed.",
        invalid:
            "Use the public participation link copied from ttakPick. Host and personal links are not supported.",
    },
    ko: {
        label: "모임 투표",
        example: "투표 예시",
        choices: "후보 미리보기",
        join: "ttakPick에서 투표하기",
        create: "ttakPick에서 무료 투표 만들기",
        remote: "ttakPick.com에서 투표하세요. 가입이나 앱 설치가 필요 없어요.",
        setup: "ttakPick.com에서 내 투표를 만드세요. 가입이나 앱 설치가 필요 없어요.",
        invalid:
            "ttakPick에서 복사한 공개 참여 링크만 넣어 주세요. 주최자·개인 초대 링크는 사용할 수 없습니다.",
    },
}

function campaignLink(url: URL, enabled: boolean) {
    if (enabled) {
        url.searchParams.set("utm_source", "framer")
        url.searchParams.set("utm_medium", "component")
        url.searchParams.set("utm_campaign", CAMPAIGN)
    }
    return url.href
}

function publicInvitation(raw: string) {
    // Match the format emitted by ttakPick's Copy public participation link.
    // Accept only those two exact fields, in either order. Rebuild the URL below.
    const parts =
        /^https:\/\/ttakpick\.com\/join\.html\?(?:mode=public&invite=([a-f0-9]{64})|invite=([a-f0-9]{64})&mode=public)$/.exec(
            raw
        )
    if (!parts) return null
    const next = new URL("/join.html", ORIGIN)
    next.searchParams.set("mode", "public")
    next.searchParams.set("invite", parts[1] || parts[2])
    return next
}

type Props = {
    title?: string
    options?: string
    participationLink?: string
    language?: keyof typeof copy
    theme?: keyof typeof themes
    radius?: number
    campaign?: boolean
    style?: React.CSSProperties
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 420
 */
export default function FreeGroupPollCard({
    title = sampleTitle,
    options = sampleOptions,
    participationLink = "",
    language = "en",
    theme = "lilac",
    radius = 24,
    campaign = true,
    style,
}: Props) {
    const t = copy[language] ?? copy.en
    const color = themes[theme] ?? themes.lilac
    const raw = participationLink.trim()
    const invite = publicInvitation(raw)
    const href = campaignLink(invite ?? new URL(CREATE_PATH, ORIGIN), campaign)
    const canvas = RenderTarget.current() === RenderTarget.canvas
    const names = options
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .slice(0, 6)
    const action = invite ? t.join : t.create
    const headingId = React.useId()
    const linkStyle: React.CSSProperties = {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        boxSizing: "border-box",
        minHeight: 48,
        padding: "12px 16px",
        color: "#FFFFFF",
        background: color.accent,
        borderRadius: Math.min(radius, 14),
        fontWeight: 700,
        lineHeight: 1.35,
        textDecoration: "underline",
        textUnderlineOffset: 4,
    }
    const label = (
        <>
            <span>{action}</span>
            <span aria-hidden="true" style={{ flex: "none" }}>
                ↗
            </span>
        </>
    )

    return (
        <section
            lang={language === "ko" ? "ko" : "en"}
            aria-labelledby={headingId}
            style={{
                width: 420,
                maxWidth: "100%",
                boxSizing: "border-box",
                minWidth: 0,
                padding: "clamp(16px, 5%, 26px)",
                border: `1px solid ${color.border}`,
                borderRadius: radius,
                background: "#FFFFFF",
                color: "#211C39",
                font: '400 15px/1.5 system-ui, -apple-system, "Segoe UI", sans-serif',
                overflowWrap: "anywhere",
                ...style,
            }}
        >
            <header style={{ display: "grid", gap: 12, marginBottom: 18 }}>
                <p
                    style={{
                        margin: 0,
                        display: "flex",
                        flexWrap: "wrap",
                        alignItems: "baseline",
                        gap: "4px 9px",
                        fontSize: 12,
                    }}
                >
                    <strong
                        lang="en"
                        style={{
                            color: color.accent,
                            fontSize: 15,
                            letterSpacing: "-.02em",
                        }}
                    >
                        ttakPick
                    </strong>
                    <span aria-hidden="true">·</span>
                    <span>{invite ? t.label : t.example}</span>
                </p>
                <h2
                    id={headingId}
                    style={{
                        margin: 0,
                        fontSize: "clamp(23px, 5vw, 29px)",
                        fontWeight: 720,
                        lineHeight: 1.18,
                        letterSpacing: "-.025em",
                        textWrap: "balance",
                    }}
                >
                    {title.trim() ||
                        (language === "ko"
                            ? "주말에 함께 뭐 할까요?"
                            : sampleTitle)}
                </h2>
            </header>
            {names.length > 0 && (
                <div
                    style={{
                        padding: "12px 14px",
                        marginBottom: 16,
                        background: color.tint,
                        borderRadius: Math.min(radius, 14),
                    }}
                >
                    <p
                        aria-hidden="true"
                        style={{
                            margin: "0 0 5px",
                            color: color.accent,
                            fontSize: 12,
                            fontWeight: 700,
                        }}
                    >
                        {t.choices}
                    </p>
                    <ul
                        aria-label={t.choices}
                        style={{
                            display: "grid",
                            gap: 4,
                            listStyle: "disc",
                            margin: 0,
                            paddingInlineStart: 20,
                        }}
                    >
                        {names.map((name, index) => (
                            <li key={index}>{name}</li>
                        ))}
                    </ul>
                </div>
            )}
            {canvas ? (
                <span style={linkStyle}>{label}</span>
            ) : (
                <a
                    href={href}
                    style={linkStyle}
                    referrerPolicy="strict-origin"
                    onFocus={(event) => {
                        event.currentTarget.style.outline = `3px solid ${color.accent}`
                        event.currentTarget.style.outlineOffset = "3px"
                    }}
                    onBlur={(event) => {
                        event.currentTarget.style.removeProperty("outline")
                        event.currentTarget.style.removeProperty(
                            "outline-offset"
                        )
                    }}
                >
                    {label}
                </a>
            )}
            <p style={{ margin: "10px 0 0", color: "#514B64", fontSize: 13 }}>
                {invite ? t.remote : t.setup}
            </p>
            {canvas && raw && !invite && (
                <p
                    style={{
                        margin: "12px 0 0",
                        color: "#982A27",
                        fontSize: 13,
                    }}
                >
                    {t.invalid}
                </p>
            )}
        </section>
    )
}

addPropertyControls(FreeGroupPollCard, {
    participationLink: {
        type: ControlType.String,
        title: "ttakPick Link",
        defaultValue: "",
        placeholder: "Paste a ttakPick public link",
        maxLength: 160,
        description:
            "Create a poll at ttakPick.com, then paste its public participation link. Leave blank to link to poll setup. Keep host and personal links private.",
    },
    title: {
        type: ControlType.String,
        title: "Poll Question",
        defaultValue: sampleTitle,
        maxLength: 100,
        description: "Match the question in the linked poll.",
    },
    options: {
        type: ControlType.String,
        title: "Choices",
        displayTextArea: true,
        defaultValue: sampleOptions,
        maxLength: 605,
        description:
            "Paste up to six choices from your poll, one per line. Visitors vote on ttakPick, not from this list.",
    },
    language: {
        type: ControlType.Enum,
        title: "Labels",
        defaultValue: "en",
        options: ["en", "ko"],
        optionTitles: ["English", "한국어"],
        description:
            "Sets the built-in labels. Edit the question and options to translate those too.",
    },
    theme: {
        type: ControlType.Enum,
        title: "Theme",
        defaultValue: "lilac",
        options: ["lilac", "pine", "night"],
        optionTitles: ["Lilac", "Pine", "Night"],
    },
    radius: {
        type: ControlType.Number,
        title: "Corners",
        defaultValue: 24,
        min: 0,
        max: 36,
        step: 1,
        unit: "px",
    },
    campaign: {
        type: ControlType.Boolean,
        title: "Campaign tags",
        defaultValue: true,
        description:
            "Add fixed campaign labels to the outgoing ttakPick link. The card itself sends no analytics.",
    },
})
