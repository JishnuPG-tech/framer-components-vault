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


// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Size = "small" | "medium" | "large"

interface ResponsiveImage {
    src?: string
    srcSet?: string
    alt?: string
}

interface Props {
    channelId: string
    label: string
    size: Size
    background: string
    textColor: string
    radius: string
    font?: React.CSSProperties
    shadow: boolean
    showIcon: boolean
    customIcon?: ResponsiveImage
    newTab: boolean
    style?: React.CSSProperties
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SIZES: Record<
    Size,
    { height: number; fontSize: number; padX: number; icon: number; gap: number }
> = {
    small: { height: 40, fontSize: 14, padX: 16, icon: 16, gap: 6 },
    medium: { height: 48, fontSize: 16, padX: 20, icon: 20, gap: 8 },
    large: { height: 56, fontSize: 18, padX: 24, icon: 22, gap: 8 },
}

const FALLBACK_ARIA = "1:1 채팅 상담 열기"

// Component-scoped class. Keyboard-only focus ring; colour comes from the
// per-instance CSS variable so each button's ring matches its fill.
const CLS = "kccb-9d4e2a"
const FOCUS_CSS = [
    `.${CLS}{transition:filter .15s ease,transform .15s ease}`,
    `.${CLS}:hover{filter:brightness(1.12)}`,
    `.${CLS}:active{transform:scale(.97)}`,
    `.${CLS}:focus-visible{outline:2px solid var(--${CLS}-ring);outline-offset:2px}`,
    `@media (prefers-reduced-motion:reduce){.${CLS}{transition:none}.${CLS}:active{transform:none}}`,
].join("")

const SHADOW =
    "0 1px 2px rgba(0,0,0,0.10), 0 4px 10px rgba(0,0,0,0.10), 0 10px 24px rgba(0,0,0,0.08)"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Accepts a bare ID ("_ZeUTxl") or a pasted pf.kakao.com URL.
 * Returns the cleaned ID, or null when it doesn't look like a channel ID.
 */
function normalizeChannelId(raw: string): string | null {
    let value = (raw || "").trim()
    if (!value) return null
    const fromUrl = value.match(/pf\.kakao\.com\/([^/?#\s]+)/i)
    if (fromUrl) value = fromUrl[1]
    return /^_?[A-Za-z0-9]+$/.test(value) ? value : null
}

function buildChatUrl(id: string): string {
    return `https://pf.kakao.com/${encodeURIComponent(id)}/chat`
}

// Generic outlined chat bubble: rounded rectangle + three dots.
// Deliberately NOT the Kakao symbol (filled oval bubble).
function BubbleIcon({ size }: { size: number }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            focusable="false"
            style={{ flexShrink: 0, display: "block" }}
        >
            <path d="M5 4h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-8l-5 4v-4H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
            <circle cx="8" cy="10.5" r="0.6" fill="currentColor" />
            <circle cx="12" cy="10.5" r="0.6" fill="currentColor" />
            <circle cx="16" cy="10.5" r="0.6" fill="currentColor" />
        </svg>
    )
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * @framerDisableUnlink
 *
 * @framerIntrinsicWidth 200
 * @framerIntrinsicHeight 48
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 */
export default function ChannelChatButton(props: Props) {
    const {
        channelId,
        label,
        size,
        background,
        textColor,
        radius,
        font,
        shadow,
        showIcon,
        customIcon,
        newTab,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const s = SIZES[size] ?? SIZES.medium
    const id = normalizeChannelId(channelId)
    const text = (label || "").trim()

    const base: React.CSSProperties = {
        ...style,
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: s.gap,
        minHeight: s.height,
        padding: `0 ${s.padX}px`,
        borderRadius: radius,
        fontFamily: "inherit",
        fontWeight: 600,
        // Project font from the Font control; size always comes from the Size control.
        ...font,
        fontSize: s.fontSize,
        lineHeight: 1.2,
        whiteSpace: "nowrap",
        textDecoration: "none",
        userSelect: "none",
    }

    // Empty or malformed channel ID → visible guidance instead of a broken link.
    if (!id) {
        return (
            <div
                role="note"
                style={{
                    ...base,
                    background: "rgba(136,136,136,0.12)",
                    color: "#666",
                    border: "1px dashed rgba(136,136,136,0.6)",
                    fontWeight: 500,
                    fontSize: Math.min(s.fontSize, 14),
                }}
            >
                {channelId?.trim()
                    ? "채널 ID 형식을 확인하세요 (예: _ZeUTxl)"
                    : "속성에서 채널 ID를 입력하세요"}
            </div>
        )
    }

    const icon = showIcon ? (
        customIcon?.src ? (
            <img
                src={customIcon.src}
                srcSet={customIcon.srcSet}
                alt=""
                width={s.icon}
                height={s.icon}
                style={{ flexShrink: 0, display: "block", objectFit: "contain" }}
            />
        ) : (
            <BubbleIcon size={s.icon} />
        )
    ) : null

    const aria = (text || FALLBACK_ARIA) + (newTab ? " (새 창에서 열림)" : "")

    // Icon only → square (width = height). A fixed width set by the user still wins.
    const iconOnly = !text && !!icon
    const shape: React.CSSProperties = iconOnly
        ? { padding: 0, minWidth: s.height, aspectRatio: "1 / 1" }
        : {}

    return (
        <>
            <style>{FOCUS_CSS}</style>
            <a
                className={CLS}
                // On canvas / export: no href, so nothing can navigate from the editor.
                href={isStatic ? undefined : buildChatUrl(id)}
                target={newTab ? "_blank" : undefined}
                rel={newTab ? "noopener noreferrer" : undefined}
                aria-label={aria}
                style={
                    {
                        ...base,
                        ...shape,
                        background,
                        color: textColor,
                        boxShadow: shadow ? SHADOW : "none",
                        cursor: "pointer",
                        [`--${CLS}-ring`]: background,
                    } as React.CSSProperties
                }
            >
                {icon}
                {text ? <span>{text}</span> : null}
            </a>
        </>
    )
}

// ---------------------------------------------------------------------------
// Property controls
// ---------------------------------------------------------------------------

addPropertyControls(ChannelChatButton, {
    channelId: {
        type: ControlType.String,
        title: "Channel ID",
        defaultValue: "",
        placeholder: "_ZeUTxl",
        description:
            "Channel ID starting with _ (the part after pf.kakao.com/). A pasted channel URL also works.",
    },
    label: {
        type: ControlType.String,
        title: "Label",
        defaultValue: "1:1 채팅 상담",
        placeholder: "Leave empty for icon only",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "basic",
        defaultFontType: "sans-serif",
        defaultValue: { variant: "Semibold" },
    },
    size: {
        type: ControlType.Enum,
        title: "Size",
        defaultValue: "medium",
        options: ["small", "medium", "large"],
        optionTitles: ["S", "M", "L"],
        displaySegmentedControl: true,
    },
    background: {
        type: ControlType.Color,
        title: "Fill",
        defaultValue: "#1F2937",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#FFFFFF",
    },
    radius: {
        type: ControlType.BorderRadius,
        title: "Radius",
        defaultValue: "999px",
    },
    shadow: {
        type: ControlType.Boolean,
        title: "Shadow",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    showIcon: {
        type: ControlType.Boolean,
        title: "Icon",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    customIcon: {
        type: ControlType.ResponsiveImage,
        title: "Custom Icon",
        hidden: (p: Props) => !p.showIcon,
    },
    newTab: {
        type: ControlType.Boolean,
        title: "New Tab",
        defaultValue: false,
        enabledTitle: "Yes",
        disabledTitle: "No",
        description:
            "On mobile, a leftover tab may stay open after KakaoTalk opens.\n\nCreated by Copy-pasta",
    },
})
