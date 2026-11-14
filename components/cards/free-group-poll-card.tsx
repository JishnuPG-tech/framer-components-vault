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
    lilac: {
        accent: "#4839B2",
        tint: "#F0EDFF",
        ring: "#A9A0E8",
        border: "#DAD5F4",
    },
    pine: {
        accent: "#195C43",
        tint: "#E9F6EE",
        ring: "#91C5AB",
        border: "#CDE5D6",
    },
    night: {
        accent: "#283957",
        tint: "#EAF0F8",
        ring: "#A7B9D6",
        border: "#D2DDEC",
    },
}
const copy = {
    en: {
        label: "Group poll",
        example: "Example poll",
        choices: "Options",
        join: "Open poll on ttakPick",
        create: "Create a free poll on ttakPick",
        remote: "Voting takes place on ttakPick.",
        setup: "The options shown are an example. Set up your own poll on ttakPick.",
        invalid:
            "Use the public participation link copied from ttakPick. Host and personal links are not supported.",
    },
    ko: {
        label: "모임 투표",
        example: "투표 예시",
        choices: "후보",
        join: "ttakPick에서 투표 열기",
        create: "ttakPick에서 무료 투표 만들기",
        remote: "투표는 ttakPick에서 진행됩니다.",
        setup: "표시된 후보는 예시입니다. ttakPick에서 내 투표를 만들 수 있어요.",
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
        fontWeight: 650,
        lineHeight: 1.35,
        textDecoration: "underline",
        textUnderlineOffset: 3,
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
                padding: "clamp(14px, 5%, 26px)",
                border: `1px solid ${color.border}`,
                borderRadius: radius,
                background: "#FFFFFF",
                color: "#211C39",
                font: '400 15px/1.5 system-ui, -apple-system, "Segoe UI", sans-serif',
                overflowWrap: "anywhere",
                ...style,
            }}
        >
            <header style={{ display: "grid", gap: 10, marginBottom: 19 }}>
                <span
                    style={{
                        justifySelf: "start",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 7,
                        padding: "4px 10px",
                        borderRadius: 999,
                        color: color.accent,
                        background: color.tint,
                        fontSize: 12,
                        fontWeight: 700,
                        letterSpacing: ".04em",
                    }}
                >
                    <svg
                        aria-hidden="true"
                        width="15"
                        height="15"
                        viewBox="0 0 16 16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <rect x="2.5" y="2.5" width="11" height="11" rx="2.5" />
                        <path d="m5.5 8 1.6 1.6 3.4-3.4" />
                    </svg>
                    {invite ? t.label : t.example}
                </span>
                <h2
                    id={headingId}
                    style={{
                        margin: 0,
                        fontSize: "clamp(21px, 5vw, 28px)",
                        fontWeight: 720,
                        lineHeight: 1.18,
                        letterSpacing: "-.025em",
                    }}
                >
                    {title.trim() ||
                        (language === "ko"
                            ? "주말에 함께 뭐 할까요?"
                            : sampleTitle)}
                </h2>
            </header>
            {names.length > 0 && (
                <ul
                    role="list"
                    aria-label={t.choices}
                    style={{
                        display: "grid",
                        gap: 7,
                        listStyle: "none",
                        padding: 0,
                        margin: "0 0 18px",
                    }}
                >
                    {names.map((name, index) => (
                        <li
                            key={index}
                            style={{
                                display: "flex",
                                alignItems: "start",
                                gap: 10,
                                padding: "8px 10px",
                                borderRadius: 12,
                                background: color.tint,
                                fontWeight: 550,
                                lineHeight: 1.4,
                            }}
                        >
                            <span
                                aria-hidden="true"
                                style={{
                                    flex: "none",
                                    minWidth: 22,
                                    padding: "1px 3px",
                                    borderRadius: 6,
                                    background: "#FFFFFF",
                                    color: color.accent,
                                    textAlign: "center",
                                    fontSize: 12,
                                }}
                            >
                                {String.fromCharCode(65 + index)}
                            </span>
                            <span>{name}</span>
                        </li>
                    ))}
                </ul>
            )}
            <p style={{ margin: "0 0 12px", color: "#514B64", fontSize: 13 }}>
                {invite ? t.remote : t.setup}
            </p>
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
    title: {
        type: ControlType.String,
        title: "Question",
        defaultValue: sampleTitle,
        maxLength: 100,
    },
    options: {
        type: ControlType.String,
        title: "Options",
        displayTextArea: true,
        defaultValue: sampleOptions,
        maxLength: 605,
        description:
            "One option per line. Up to six. These labels are display text only.",
    },
    participationLink: {
        type: ControlType.String,
        title: "Public link",
        defaultValue: "",
        placeholder: "Paste a ttakPick public link",
        maxLength: 160,
        description:
            "Paste only Copy public link from ttakPick. This URL is public on your site. Never paste a host or personal invite link. Empty or invalid links open the free poll setup page.",
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
