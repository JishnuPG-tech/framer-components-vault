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


type Props = {
    image?: {
        src?: string
        srcSet?: string
        alt?: string
        positionX?: string
        positionY?: string
    }
    name: string
    role: string
    headline: string
    description: string
    status: string
    available: boolean
    primaryLabel: string
    primaryLink: string
    secondaryLabel: string
    secondaryLink: string
    newTab: boolean
    note: string
    background: string
    textColor: string
    mutedColor: string
    accent: string
    accentText: string
    statusColor: string
    lineColor: string
    radius: number
    padding: number
    sideInset: number
    imageWidth: number
    imagePosition: number
    headingFont?: React.CSSProperties
    bodyFont?: React.CSSProperties
    style?: React.CSSProperties
}

const portrait = {
    src: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1000&q=85",
    alt: "Portrait of an independent designer",
}

const defaults = {
    image: portrait,
    name: "Alex Morgan",
    role: "Independent designer",
    headline: "Good things start\nwith a conversation.",
    description:
        "Have a project in mind? Let's make something that feels like you.",
    status: "Available for projects",
    available: true,
    primaryLabel: "Book an intro call",
    primaryLink: "mailto:hello@example.com?subject=Intro%20call",
    secondaryLabel: "Explore my work",
    secondaryLink: "#projects",
    newTab: false,
    note: "20 min · A little hello, no pressure",
    background: "#F5F4EF",
    textColor: "#20211E",
    mutedColor: "#70716A",
    accent: "#E9F59A",
    accentText: "#20211E",
    statusColor: "#557A35",
    lineColor: "rgba(32,33,30,0.14)",
    radius: 0,
    padding: 26,
    sideInset: 24,
    imageWidth: 36,
    imagePosition: 50,
}

function Arrow({ diagonal = false }: { diagonal?: boolean }) {
    return (
        <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
        >
            <path
                d={diagonal ? "M6 18 18 6M6 6h12v12" : "M4 12h15m-6-6 6 6-6 6"}
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 620
 * @framerIntrinsicHeight 360
 */
export default function BookingCard(props: Props) {
    const p = { ...defaults, ...props }
    const isStatic = useIsStaticRenderer()
    const id = React.useId().replace(/[^a-zA-Z0-9_-]/g, "")
    const scope = `booking-${id}`

    const [failedImage, setFailedImage] = React.useState(false)

    React.useEffect(() => {
        setFailedImage(false)
    }, [p.image?.src])

    const bodyFont = {
        fontFamily: '"Inter", sans-serif',
        fontSize: 13,
        fontWeight: 400,
        lineHeight: "1.5em",
        ...p.bodyFont,
    }

    const headingFont = {
        fontFamily: '"Inter", sans-serif',
        fontSize: 30,
        fontWeight: 500,
        lineHeight: "1.08em",
        letterSpacing: "-0.045em",
        ...p.headingFont,
    }

    const hasImage = !!p.image?.src && !failedImage

    const initials =
        p.name
            .trim()
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0])
            .join("") || "AM"

    const target = p.newTab ? "_blank" : undefined
    const rel = p.newTab ? "noopener noreferrer" : undefined

    const rootStyle = {
        ...bodyFont,
        width: "100%",
        position: "relative",
        color: p.textColor,
        ...p.style,
        boxSizing: "border-box",
        paddingLeft: p.sideInset,
        paddingRight: p.sideInset,
        containerType: "inline-size",
        "--bc-bg": p.background,
        "--bc-text": p.textColor,
        "--bc-muted": p.mutedColor,
        "--bc-accent": p.accent,
        "--bc-accent-text": p.accentText,
        "--bc-line": p.lineColor,
        "--bc-pad": `${p.padding}px`,
        "--bc-image": `${p.imageWidth}%`,
        "--bc-radius": `${p.radius}px`,
    } as React.CSSProperties

    return (
        <div
            className={scope}
            style={rootStyle}
            data-static={isStatic ? "true" : "false"}
        >
            <style>{`
                .${scope},
                .${scope} * {
                    box-sizing: border-box;
                }

                .${scope} .bc-card {
                    display: grid;
                    grid-template-columns:
                        var(--bc-image) minmax(0, 1fr);
                    background: var(--bc-bg);
                    border: 1px solid var(--bc-line);
                    border-radius: var(--bc-radius);
                    overflow: hidden;
                    isolation: isolate;
                }

                .${scope} .bc-portrait {
                    position: relative;
                    overflow: hidden;
                    min-height: 340px;
                    background: #DDDED5;
                }

                .${scope} .bc-image {
                    position: absolute;
                    inset: 0;
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    display: block;
                    transition:
                        transform 650ms cubic-bezier(.2,.7,.2,1);
                }

                .${scope} .bc-initials {
                    position: absolute;
                    inset: 0;
                    display: grid;
                    place-items: center;
                    font-size: 64px;
                    letter-spacing: -.08em;
                    color: #686B5A;
                }

                .${scope} .bc-caption {
                    position: absolute;
                    inset: auto 0 0;
                    padding: 46px 20px 20px;
                    color: white;
                    background:
                        linear-gradient(
                            transparent,
                            rgba(0,0,0,.62)
                        );
                }

                .${scope} .bc-name {
                    font-weight: 500;
                }

                .${scope} .bc-role {
                    opacity: .8;
                    font-size: .85em;
                    margin-top: 2px;
                }

                .${scope} .bc-content {
                    min-width: 0;
                    padding: var(--bc-pad);
                    display: flex;
                    flex-direction: column;
                    align-items: stretch;
                    gap: 25px;
                }

                .${scope} .bc-status {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: .82em;
                    color: var(--bc-muted);
                }

                .${scope} .bc-dot {
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                    flex-shrink: 0;
                }

                .${scope} .bc-heading {
                    margin: 0;
                    white-space: pre-line;
                }

                .${scope} .bc-description {
                    margin: 13px 0 0;
                    color: var(--bc-muted);
                }

                .${scope} .bc-actions {
                    margin-top: auto;
                }

                .${scope} .bc-link {
                    color: inherit;
                    text-decoration: none;
                    font: inherit;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 16px;
                    min-height: 48px;
                    -webkit-tap-highlight-color: transparent;
                }

                .${scope} .bc-primary {
                    padding: 13px 16px;
                    background: var(--bc-accent);
                    color: var(--bc-accent-text);
                    font-weight: 500;
                    transition: filter 200ms ease;
                }

                .${scope} .bc-secondary {
                    margin-top: 8px;
                    padding: 10px 0;
                    border-bottom: 1px solid var(--bc-line);
                }

                .${scope} .bc-arrow {
                    flex-shrink: 0;
                    display: flex;
                    transition:
                        transform 250ms cubic-bezier(.2,.7,.2,1);
                }

                .${scope} .bc-note {
                    color: var(--bc-muted);
                    font-size: .76em;
                    margin: 12px 0 0;
                    text-align: center;
                }

                .${scope} .bc-link:focus-visible {
                    outline: 2px solid var(--bc-text);
                    outline-offset: 3px;
                }

                .${scope} .bc-link[aria-disabled="true"] {
                    opacity: .5;
                }

                .${scope} .bc-heading,
                .${scope} .bc-description,
                .${scope} .bc-caption,
                .${scope} .bc-link,
                .${scope} .bc-status,
                .${scope} .bc-note {
                    overflow-wrap: anywhere;
                }

                @container (max-width: 479px) {
                    .${scope} .bc-card {
                        grid-template-columns: minmax(0, 1fr);
                    }

                    .${scope} .bc-portrait {
                        min-height: 0;
                        height: 210px;
                    }

                    .${scope} .bc-content {
                        gap: 22px;
                    }
                }

                @media
                    (hover: hover) and
                    (prefers-reduced-motion: no-preference) {

                    .${scope}[data-static="false"]
                    .bc-card:hover .bc-image {
                        transform: scale(1.045);
                    }

                    .${scope}[data-static="false"]
                    .bc-primary[href]:hover {
                        filter: brightness(.96);
                    }

                    .${scope}[data-static="false"]
                    .bc-primary[href]:hover .bc-arrow {
                        transform: translateX(3px);
                    }

                    .${scope}[data-static="false"]
                    .bc-secondary[href]:hover .bc-arrow {
                        transform: translate(2px,-2px);
                    }
                }

                @media (prefers-reduced-motion: reduce) {
                    .${scope} * {
                        transition: none !important;
                    }
                }
            `}</style>

            <article className="bc-card" aria-labelledby={`${scope}-heading`}>
                <div className="bc-portrait">
                    {hasImage ? (
                        <img
                            className="bc-image"
                            src={p.image?.src}
                            srcSet={p.image?.srcSet}
                            sizes="(max-width: 479px) 100vw, 360px"
                            alt={p.image?.alt || `Portrait of ${p.name}`}
                            style={{
                                objectPosition: `50% ${p.imagePosition}%`,
                            }}
                            onError={() => setFailedImage(true)}
                            decoding="async"
                        />
                    ) : (
                        <div className="bc-initials" aria-hidden="true">
                            {initials}
                        </div>
                    )}

                    <div className="bc-caption">
                        <div className="bc-name">{p.name}</div>

                        {p.role && <div className="bc-role">{p.role}</div>}
                    </div>
                </div>

                <div className="bc-content">
                    {p.status && (
                        <div className="bc-status">
                            <span
                                className="bc-dot"
                                aria-hidden="true"
                                style={{
                                    background: p.available
                                        ? p.statusColor
                                        : p.mutedColor,
                                }}
                            />

                            <span>{p.status}</span>
                        </div>
                    )}

                    <div>
                        <h3
                            id={`${scope}-heading`}
                            className="bc-heading"
                            style={headingFont}
                        >
                            {p.headline}
                        </h3>

                        {p.description && (
                            <p className="bc-description">{p.description}</p>
                        )}
                    </div>

                    <div className="bc-actions">
                        {p.primaryLabel && (
                            <a
                                className="bc-link bc-primary"
                                href={p.primaryLink?.trim() || undefined}
                                aria-disabled={
                                    !p.primaryLink?.trim() || undefined
                                }
                                target={target}
                                rel={rel}
                            >
                                <span>{p.primaryLabel}</span>

                                <span className="bc-arrow">
                                    <Arrow />
                                </span>
                            </a>
                        )}

                        {p.secondaryLabel && (
                            <a
                                className="bc-link bc-secondary"
                                href={p.secondaryLink?.trim() || undefined}
                                aria-disabled={
                                    !p.secondaryLink?.trim() || undefined
                                }
                                target={target}
                                rel={rel}
                            >
                                <span>{p.secondaryLabel}</span>

                                <span className="bc-arrow">
                                    <Arrow diagonal />
                                </span>
                            </a>
                        )}

                        {p.note && <p className="bc-note">{p.note}</p>}
                    </div>
                </div>
            </article>
        </div>
    )
}

BookingCard.defaultProps = defaults

addPropertyControls(BookingCard, {
    image: {
        type: ControlType.ResponsiveImage,
        title: "Portrait",
    },

    imagePosition: {
        type: ControlType.Number,
        title: "Image focus",
        min: 0,
        max: 100,
        unit: "%",
        defaultValue: 50,
    },

    name: {
        type: ControlType.String,
        title: "Name",
        defaultValue: defaults.name,
    },

    role: {
        type: ControlType.String,
        title: "Role",
        defaultValue: defaults.role,
    },

    headline: {
        type: ControlType.String,
        title: "Headline",
        displayTextArea: true,
        defaultValue: defaults.headline,
    },

    description: {
        type: ControlType.String,
        title: "Description",
        displayTextArea: true,
        defaultValue: defaults.description,
    },

    status: {
        type: ControlType.String,
        title: "Status",
        defaultValue: defaults.status,
    },

    available: {
        type: ControlType.Boolean,
        title: "Available",
        defaultValue: true,
    },

    primaryLabel: {
        type: ControlType.String,
        title: "CTA label",
        defaultValue: defaults.primaryLabel,
    },

    primaryLink: {
        type: ControlType.Link,
        title: "CTA link",
        defaultValue: defaults.primaryLink,
    },

    secondaryLabel: {
        type: ControlType.String,
        title: "Link label",
        defaultValue: defaults.secondaryLabel,
    },

    secondaryLink: {
        type: ControlType.Link,
        title: "Link",
        defaultValue: defaults.secondaryLink,
    },

    newTab: {
        type: ControlType.Boolean,
        title: "New tab",
        defaultValue: false,
    },

    note: {
        type: ControlType.String,
        title: "Note",
        defaultValue: defaults.note,
    },

    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: defaults.background,
    },

    textColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: defaults.textColor,
    },

    mutedColor: {
        type: ControlType.Color,
        title: "Secondary",
        defaultValue: defaults.mutedColor,
    },

    accent: {
        type: ControlType.Color,
        title: "CTA fill",
        defaultValue: defaults.accent,
    },

    accentText: {
        type: ControlType.Color,
        title: "CTA text",
        defaultValue: defaults.accentText,
    },

    statusColor: {
        type: ControlType.Color,
        title: "Status dot",
        defaultValue: defaults.statusColor,
    },

    lineColor: {
        type: ControlType.Color,
        title: "Border",
        defaultValue: defaults.lineColor,
    },

    radius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 40,
        defaultValue: 0,
    },

    padding: {
        type: ControlType.Number,
        title: "Padding",
        min: 16,
        max: 48,
        defaultValue: 26,
    },

    sideInset: {
        type: ControlType.Number,
        title: "Side inset",
        min: 0,
        max: 120,
        step: 1,
        unit: "px",
        defaultValue: 24,
    },

    imageWidth: {
        type: ControlType.Number,
        title: "Image width",
        min: 25,
        max: 45,
        unit: "%",
        defaultValue: 36,
    },

    headingFont: {
        type: ControlType.Font,
        title: "Heading",
        controls: "extended",
        defaultValue: {
            fontFamily: "Inter",
            fontSize: "30px",
            fontWeight: 500,
            lineHeight: "1.08em",
            letterSpacing: "-0.045em",
        },
    },

    bodyFont: {
        type: ControlType.Font,
        title: "Body",
        controls: "extended",
        defaultValue: {
            fontFamily: "Inter",
            fontSize: "13px",
            fontWeight: 400,
            lineHeight: "1.5em",
        },
    },
})
