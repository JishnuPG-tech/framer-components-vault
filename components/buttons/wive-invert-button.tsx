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


/**
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function WipeInvert({
    label = "WIPE OFF!",
    background = "#080b08",
    foreground = "#ecebe5",
    link = "",
    disabled = false,
}: {
    label?: string
    background?: string
    foreground?: string
    link?: string
    disabled?: boolean
}) {
    const content = (
        <>
            <span className="wipeLabel wipeLabelBase">{label}</span>
            <span className="wipeOverlay" aria-hidden="true">
                <span className="wipeLabel wipeLabelInverse">{label}</span>
            </span>
        </>
    )
    const style = {
        "--wipe-background": background,
        "--wipe-foreground": foreground,
    } as React.CSSProperties
    return (
        <>
            <style>{css}</style>
            {disabled ? (
                <button
                    className="wipeButton"
                    style={style}
                    disabled
                    aria-label={label}
                >
                    {content}
                </button>
            ) : link ? (
                <a
                    className="wipeButton"
                    style={style}
                    href={link}
                    aria-label={label}
                >
                    {content}
                </a>
            ) : (
                <button className="wipeButton" style={style} aria-label={label}>
                    {content}
                </button>
            )}
        </>
    )
}

const css = [
    ".wipeButton { --wipe-background: #080b08; --wipe-foreground: #ecebe5; appearance: none; -webkit-appearance: none; position: relative; display: inline-grid; place-items: center; box-sizing: border-box; min-height: 48px; padding: 12px 18px; overflow: hidden; border: 0; border-radius: 0; background: var(--wipe-background); color: var(--wipe-foreground); font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace; font-size: 11px; font-weight: 600; line-height: 1; letter-spacing: .12em; text-decoration: none; text-transform: uppercase; cursor: pointer; transition: transform 120ms ease; }",
    ".wipeButton:focus-visible { outline: 2px solid var(--wipe-background); outline-offset: 3px; }",
    ".wipeLabel { grid-area: 1 / 1; white-space: nowrap; }",
    ".wipeOverlay { position: absolute; inset: 0; display: grid; place-items: center; background: var(--wipe-foreground); color: var(--wipe-background); clip-path: polygon(0% 0%, 0% 0%, -100% 100%, 0% 100%); transition: clip-path .4s cubic-bezier(.25, 0, 0, 1); }",
    ".wipeButton:hover .wipeOverlay, .wipeButton:focus-visible .wipeOverlay { clip-path: polygon(0% 0%, 200% 0%, 100% 100%, 0% 100%); }",
    ".wipeButton:active { transform: translateY(1px); }",
    ".wipeButton:disabled { opacity: .42; cursor: default; }",
    ".wipeButton:disabled .wipeOverlay { display: none; }",
    "@media (prefers-reduced-motion: reduce) { .wipeButton, .wipeOverlay { transition: none; } }",
].join("")

addPropertyControls(WipeInvert, {
    label: {
        type: ControlType.String,
        title: "Label",
        defaultValue: "WIPE OFF!",
    },
    link: { type: ControlType.Link, title: "Link" },
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#080b08",
    },
    foreground: {
        type: ControlType.Color,
        title: "Foreground",
        defaultValue: "#ecebe5",
    },
    disabled: {
        type: ControlType.Boolean,
        title: "Disabled",
        defaultValue: false,
    },
})
