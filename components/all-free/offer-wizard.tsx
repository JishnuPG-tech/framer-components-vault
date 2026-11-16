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


type Option = {
    title: string
    description: string
    icon: string
    image?: string
    svg?: string
    iconColor?: string
    iconBackground?: string
}
type Step = {
    title: string
    description: string
    image?: string
    svg?: string
    options: Option[]
}
type CustomField = {
    label: string
    kind: "text" | "email" | "textarea"
    required: boolean
    placeholder: string
}
type Props = {
    textureMode: "dots" | "image" | "gradient" | "none"
    textureImage?: string
    textureGradient: string
    textureOpacity: number
    textureSize: "cover" | "contain" | "repeat"
    backIcon?: string
    skipIcon?: string
    goIcon?: string
    backSvg?: string
    skipSvg?: string
    goSvg?: string
    buttonIconSize: number
    buttonRadius: number
    buttonTextColor: string
    buttonBackground: string
    goLabel: string
    illustrationSize: number
    optionIconSize: number
    glyphSize: number
    imageFit: "cover" | "contain"
    fontFamily: string
    contactTitle: string
    contactDescription: string
    submitLabel: string
    customFields: CustomField[]
    showCompany: boolean
    showBudget: boolean
    showDescription: boolean
    steps: Step[]
    background: string
    cardColor: string
    textColor: string
    mutedColor: string
    accent: string
    borderColor: string
    radius: number
    padding: number
    headingSize: number
    bodySize: number
    showProgress: boolean
    showDots: boolean
    showBack: boolean
    showSkip: boolean
    backLabel: string
    skipLabel: string
    completedTitle: string
    completedText: string
    restartLabel: string
    completeUrl?: string
    iconRadius: number
}

const initialSteps: Step[] = [
    {
        title: "Choose offer type",
        description: "What type of collaboration do you have in mind?",
        options: [
            {
                title: "Collaboration",
                description: "Treated as partnership",
                icon: "edit",
            },
            {
                title: "Paid Plan",
                description: "Budget based, average $600",
                icon: "briefcase",
            },
            {
                title: "Unpaid Plan",
                description: "Based on mutual benefits",
                icon: "star",
            },
        ],
    },
    {
        title: "Choose a timeline",
        description: "When would you like to get started?",
        options: [
            {
                title: "Right away",
                description: "Ready to start as soon as possible",
                icon: "bolt",
            },
            {
                title: "In a few weeks",
                description: "Planning for the near future",
                icon: "calendar",
            },
            {
                title: "Just exploring",
                description: "I'm still figuring things out",
                icon: "star",
            },
        ],
    },
    {
        title: "Choose your goal",
        description: "What matters most to you?",
        options: [
            {
                title: "Build something",
                description: "Create a new project together",
                icon: "edit",
            },
            {
                title: "Grow a brand",
                description: "Reach a wider audience",
                icon: "bolt",
            },
            {
                title: "Explore ideas",
                description: "Let's discuss the possibilities",
                icon: "star",
            },
        ],
    },
]

// SVG is loaded as an image rather than injected into the document.
function svgSource(svg?: string): string | undefined {
    const trimmed = svg?.trim()
    return trimmed &&
        /^<svg(?:\s|>)/i.test(trimmed) &&
        /<\/svg>$/i.test(trimmed)
        ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(trimmed)}`
        : undefined
}
// Locally rendered, Lucide-style SVG paths: no remote executable dependency.
function ButtonIcon({
    svg,
    image,
    fallback,
    size,
}: {
    svg?: string
    image?: string
    fallback: "back" | "skip" | "go"
    size: number
}) {
    const src = svgSource(svg) || image
    if (src)
        return (
            <img
                src={src}
                alt=""
                style={{
                    display: "block",
                    width: size,
                    height: size,
                    objectFit: "contain",
                    flexShrink: 0,
                }}
            />
        )
    return (
        <svg
            aria-hidden="true"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            {fallback === "back" ? (
                <>
                    <path d="m12 19-7-7 7-7" />
                    <path d="M19 12H5" />
                </>
            ) : fallback === "skip" ? (
                <>
                    <path d="m5 5 10 7-10 7z" />
                    <path d="M19 5v14" />
                </>
            ) : (
                <>
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                </>
            )}
        </svg>
    )
}
function Glyph({ name, size = 22 }: { name: string; size?: number }) {
    return (
        <svg
            aria-hidden="true"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            {name === "briefcase" ? (
                <>
                    <rect x="3" y="7" width="18" height="14" rx="2" />
                    <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18" />
                </>
            ) : name === "star" ? (
                <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9Z" />
            ) : name === "bolt" ? (
                <path d="m13 2-9 12h7l-1 8 10-12h-7z" />
            ) : name === "calendar" ? (
                <>
                    <rect x="3" y="5" width="18" height="16" rx="2" />
                    <path d="M7 3v4M17 3v4M3 10h18" />
                </>
            ) : (
                <>
                    <path d="m4 17-1 4 4-1L19 8l-3-3L4 17Zm10-10 3 3M13 21h7" />
                </>
            )}
        </svg>
    )
}
function ContractArt() {
    return (
        <svg width="118" height="125" viewBox="0 0 118 125" aria-hidden="true">
            <defs>
                <linearGradient id="ow-folder" x1="0" y1="0" x2="0" y2="1">
                    <stop stopColor="#646a72" />
                    <stop offset="1" stopColor="#20242a" />
                </linearGradient>
            </defs>
            <rect
                x="18"
                y="19"
                width="88"
                height="93"
                rx="11"
                fill="#cbd0d5"
                transform="rotate(-6 62 65)"
            />
            <rect
                x="24"
                y="26"
                width="89"
                height="89"
                rx="10"
                fill="#f0f0f0"
                transform="rotate(5 65 65)"
            />
            <path
                d="M13 63q0-10 10-10h23l11 9h44q9 0 9 10v30q0 15-14 15H27q-14 0-14-15Z"
                fill="url(#ow-folder)"
                stroke="#808891"
                strokeOpacity=".6"
            />
            <path d="M27 69h65" stroke="#fff" strokeOpacity=".15" />
            <text
                x="47"
                y="51"
                fill="#343434"
                fontSize="10"
                fontFamily="sans-serif"
                transform="rotate(5 47 51)"
            >
                Contract
            </text>
        </svg>
    )
}

/**
 * Configurable multi-step selection wizard. Selections are kept in component state.
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 640
 * @framerIntrinsicHeight 810
 * @framerDisableUnlink
 */
export default function OfferWizard(props: Props) {
    const {
        steps = initialSteps,
        background,
        cardColor,
        textColor,
        mutedColor,
        accent,
        borderColor,
        radius,
        padding,
        headingSize,
        bodySize,
        showProgress,
        showDots,
        showBack,
        showSkip,
        backLabel,
        skipLabel,
        completedTitle,
        completedText,
        restartLabel,
        completeUrl,
        iconRadius,
    } = props
    const [index, setIndex] = React.useState(0)
    const [answers, setAnswers] = React.useState<(string | null)[]>([])
    const [done, setDone] = React.useState(false)
    const [contact, setContact] = React.useState(false)
    const [name, setName] = React.useState("")
    const [email, setEmail] = React.useState("")
    const [company, setCompany] = React.useState("")
    const [budget, setBudget] = React.useState("")
    const [description, setDescription] = React.useState("")
    const [customValues, setCustomValues] = React.useState<
        Record<number, string>
    >({})
    const safeIndex = Math.min(index, Math.max(0, steps.length - 1))
    const step = steps[safeIndex]
    const uid = React.useId().replace(/:/g, "")
    function next(answer: string | null) {
        const updated = answers.slice(0, safeIndex)
        updated[safeIndex] = answer
        setAnswers(updated)
        if (safeIndex < steps.length - 1) setIndex(safeIndex + 1)
        else {
            setContact(true)
        }
    }
    function submit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        // No network request is made by this component. The host page may listen
        // for this event and decide how (or whether) to handle the submission.
        const detail = {
            name: name.trim(),
            email: email.trim(),
            answers: steps.map((step, i) => ({
                question: step.title,
                answer: answers[i] ?? null,
            })),
            ...(props.showCompany ? { company } : {}),
            ...(props.showBudget ? { budget } : {}),
            ...(props.showDescription
                ? { projectDescription: description }
                : {}),
            customFields: (props.customFields || []).map((field, i) => ({
                label: field.label || `Field ${i + 1}`,
                value: customValues[i] || "",
            })),
        }
        if (typeof window !== "undefined")
            window.dispatchEvent(
                new CustomEvent("offer-wizard-submit", { detail })
            )
        setContact(false)
        setDone(true)
        if (completeUrl && typeof window !== "undefined")
            window.location.assign(completeUrl)
    }
    const reset = () => {
        setIndex(0)
        setAnswers([])
        setDone(false)
        setContact(false)
        setName("")
        setEmail("")
        setCompany("")
        setBudget("")
        setDescription("")
        setCustomValues({})
    }
    const buttonBase: React.CSSProperties = {
        font: "inherit",
        cursor: "pointer",
        color: "inherit",
    }
    return (
        <div
            style={{
                width: "100%",
                minHeight: 360,
                boxSizing: "border-box",
                background,
                color: textColor,
                fontFamily:
                    props.fontFamily ||
                    'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
            }}
        >
            <style>{`.ow-opt-${uid}{transition:background .22s,transform .22s}.ow-opt-${uid}:hover{background:rgba(255,255,255,.045);transform:translateX(4px)}.ow-opt-${uid}:focus-visible,.ow-action-${uid}:focus-visible{outline:2px solid ${accent};outline-offset:3px}.ow-opt-${uid}:hover .ow-arrow-${uid}{background:${accent};color:#101411;border-color:${accent}}.ow-action-${uid}:hover{color:${textColor}!important;border-color:${accent}!important}@media(prefers-reduced-motion:reduce){.ow-opt-${uid}{transition:none}}`}</style>
            <div
                style={{
                    position: "relative",
                    width: "100%",
                    overflow: "hidden",
                    boxSizing: "border-box",
                    borderRadius: radius,
                    border: `1px solid ${borderColor}`,
                    background: cardColor,
                    boxShadow: `0 18px 80px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.06)`,
                    padding: `clamp(24px, ${padding / 6.4}vw, ${padding}px)`,
                }}
            >
                {showDots && props.textureMode !== "none" && (
                    <div
                        aria-hidden="true"
                        style={{
                            position: "absolute",
                            inset: 0,
                            backgroundImage:
                                props.textureMode === "image" &&
                                props.textureImage
                                    ? `url("${props.textureImage.replace(/["\\]/g, "\\$&")}")`
                                    : props.textureMode === "gradient"
                                      ? props.textureGradient
                                      : "radial-gradient(rgba(255,255,255,.6) 0.7px,transparent 0.8px)",
                            backgroundSize:
                                props.textureMode === "dots"
                                    ? "14px 14px"
                                    : props.textureSize === "repeat"
                                      ? "auto"
                                      : props.textureSize,
                            backgroundRepeat:
                                props.textureMode === "dots" ||
                                props.textureSize === "repeat"
                                    ? "repeat"
                                    : "no-repeat",
                            backgroundPosition: "center",
                            opacity: props.textureOpacity / 100,
                            maskImage:
                                props.textureMode === "dots"
                                    ? "linear-gradient(to bottom, black, transparent 55%)"
                                    : undefined,
                            pointerEvents: "none",
                        }}
                    />
                )}
                <div
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        left: -90,
                        top: "48%",
                        width: 190,
                        height: 280,
                        background: accent,
                        opacity: 0.07,
                        filter: "blur(65px)",
                        pointerEvents: "none",
                    }}
                />
                <div style={{ position: "relative" }}>
                    {showProgress && steps.length > 0 && (
                        <div
                            role="progressbar"
                            aria-label="Wizard progress"
                            aria-valuemin={1}
                            aria-valuemax={steps.length}
                            aria-valuenow={done ? steps.length : safeIndex + 1}
                            style={{
                                display: "flex",
                                justifyContent: "center",
                                gap: 9,
                                marginBottom: 34,
                            }}
                        >
                            {steps.map((_, i) => (
                                <span
                                    key={i}
                                    style={{
                                        width: 35,
                                        maxWidth: `${80 / steps.length}%`,
                                        height: 5,
                                        borderRadius: 5,
                                        background:
                                            i <= safeIndex || done
                                                ? accent
                                                : "rgba(255,255,255,.2)",
                                        boxShadow:
                                            i === safeIndex && !done
                                                ? `0 0 15px ${accent}`
                                                : "none",
                                    }}
                                />
                            ))}
                        </div>
                    )}
                    <div style={{ textAlign: "center" }}>
                        <div
                            style={{
                                width: props.illustrationSize,
                                height: props.illustrationSize,
                                display: "flex",
                                margin: "0 auto 18px",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            {svgSource(step?.svg) || step?.image ? (
                                <img
                                    src={svgSource(step?.svg) || step?.image}
                                    alt=""
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "contain",
                                    }}
                                />
                            ) : (
                                <span
                                    style={{
                                        transform: `scale(${props.illustrationSize / 125})`,
                                        display: "flex",
                                    }}
                                >
                                    <ContractArt />
                                </span>
                            )}
                        </div>
                        <h2
                            style={{
                                margin: 0,
                                fontSize: `clamp(23px, 5vw, ${headingSize}px)`,
                                lineHeight: 1.12,
                                letterSpacing: "-.04em",
                                fontWeight: 650,
                            }}
                        >
                            {done
                                ? completedTitle
                                : contact
                                  ? props.contactTitle
                                  : step?.title || "Add a step"}
                        </h2>
                        <p
                            style={{
                                margin: "13px auto 0",
                                maxWidth: 350,
                                color: mutedColor,
                                fontSize: bodySize,
                                lineHeight: 1.35,
                            }}
                        >
                            {done
                                ? completedText
                                : contact
                                  ? props.contactDescription
                                  : step?.description ||
                                    "Configure your steps in the property panel."}
                        </p>
                    </div>
                    {!done && !contact && step && (
                        <div
                            style={{
                                marginTop: 38,
                                display: "flex",
                                flexDirection: "column",
                                gap: 8,
                            }}
                        >
                            {(step.options || []).map((option, i) => (
                                <button
                                    key={i}
                                    className={`ow-opt-${uid}`}
                                    onClick={() => next(option.title)}
                                    style={{
                                        ...buttonBase,
                                        width: "100%",
                                        border: 0,
                                        background: "transparent",
                                        borderRadius: 14,
                                        textAlign: "left",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 16,
                                        padding: "9px 3px",
                                    }}
                                >
                                    <span
                                        style={{
                                            flex: `0 0 ${props.optionIconSize}px`,
                                            height: props.optionIconSize,
                                            borderRadius: iconRadius,
                                            background:
                                                option.iconBackground ||
                                                `color-mix(in srgb, ${accent} 12%, transparent)`,
                                            color: option.iconColor || accent,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            overflow: "hidden",
                                        }}
                                    >
                                        {svgSource(option.svg) ||
                                        option.image ? (
                                            <img
                                                src={
                                                    svgSource(option.svg) ||
                                                    option.image
                                                }
                                                alt=""
                                                style={{
                                                    width: "100%",
                                                    height: "100%",
                                                    objectFit: props.imageFit,
                                                }}
                                            />
                                        ) : (
                                            <Glyph
                                                name={option.icon}
                                                size={props.glyphSize}
                                            />
                                        )}
                                    </span>
                                    <span style={{ flex: 1, minWidth: 0 }}>
                                        <span
                                            style={{
                                                display: "block",
                                                fontSize: bodySize + 1,
                                                lineHeight: 1.2,
                                                fontWeight: 600,
                                                letterSpacing: "-.025em",
                                            }}
                                        >
                                            {option.title}
                                        </span>
                                        <span
                                            style={{
                                                display: "block",
                                                fontSize: bodySize,
                                                lineHeight: 1.3,
                                                color: mutedColor,
                                                marginTop: 5,
                                            }}
                                        >
                                            {option.description}
                                        </span>
                                    </span>
                                    <span
                                        className={`ow-arrow-${uid}`}
                                        aria-hidden="true"
                                        style={{
                                            width: 48,
                                            height: 48,
                                            flex: "0 0 48px",
                                            display: "grid",
                                            placeItems: "center",
                                            border: `1px solid ${borderColor}`,
                                            borderRadius: props.buttonRadius,
                                            fontSize: 23,
                                            transition:
                                                "background .2s, color .2s, border-color .2s",
                                        }}
                                    >
                                        <ButtonIcon
                                            svg={props.goSvg}
                                            image={props.goIcon}
                                            fallback="go"
                                            size={props.buttonIconSize}
                                        />
                                    </span>
                                    {props.goLabel && (
                                        <span style={{ fontSize: 14 }}>
                                            {props.goLabel}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                    {contact && !done && (
                        <form
                            onSubmit={submit}
                            style={{ display: "grid", gap: 14, marginTop: 34 }}
                        >
                            <label
                                style={{
                                    display: "grid",
                                    gap: 7,
                                    fontSize: 14,
                                }}
                            >
                                Name
                                <input
                                    required
                                    autoComplete="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    style={{
                                        background: "#1c1e1c",
                                        color: textColor,
                                        border: `1px solid ${borderColor}`,
                                        borderRadius: 12,
                                        padding: 14,
                                        font: "inherit",
                                    }}
                                />
                            </label>
                            <label
                                style={{
                                    display: "grid",
                                    gap: 7,
                                    fontSize: 14,
                                }}
                            >
                                Email
                                <input
                                    required
                                    type="email"
                                    autoComplete="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    style={{
                                        background: "#1c1e1c",
                                        color: textColor,
                                        border: `1px solid ${borderColor}`,
                                        borderRadius: 12,
                                        padding: 14,
                                        font: "inherit",
                                    }}
                                />
                            </label>
                            {props.showCompany && (
                                <label
                                    style={{
                                        display: "grid",
                                        gap: 7,
                                        fontSize: 14,
                                    }}
                                >
                                    Company
                                    <input
                                        value={company}
                                        onChange={(e) =>
                                            setCompany(e.target.value)
                                        }
                                        autoComplete="organization"
                                        style={{
                                            background: "#1c1e1c",
                                            color: textColor,
                                            border: `1px solid ${borderColor}`,
                                            borderRadius: 12,
                                            padding: 14,
                                            font: "inherit",
                                        }}
                                    />
                                </label>
                            )}
                            {props.showBudget && (
                                <label
                                    style={{
                                        display: "grid",
                                        gap: 7,
                                        fontSize: 14,
                                    }}
                                >
                                    Budget
                                    <input
                                        value={budget}
                                        onChange={(e) =>
                                            setBudget(e.target.value)
                                        }
                                        placeholder="e.g. $1,000–$2,000"
                                        style={{
                                            background: "#1c1e1c",
                                            color: textColor,
                                            border: `1px solid ${borderColor}`,
                                            borderRadius: 12,
                                            padding: 14,
                                            font: "inherit",
                                        }}
                                    />
                                </label>
                            )}
                            {props.showDescription && (
                                <label
                                    style={{
                                        display: "grid",
                                        gap: 7,
                                        fontSize: 14,
                                    }}
                                >
                                    Project description
                                    <textarea
                                        value={description}
                                        onChange={(e) =>
                                            setDescription(e.target.value)
                                        }
                                        rows={4}
                                        style={{
                                            background: "#1c1e1c",
                                            color: textColor,
                                            border: `1px solid ${borderColor}`,
                                            borderRadius: 12,
                                            padding: 14,
                                            font: "inherit",
                                            resize: "vertical",
                                        }}
                                    />
                                </label>
                            )}
                            {(props.customFields || []).map((field, i) => (
                                <label
                                    key={i}
                                    style={{
                                        display: "grid",
                                        gap: 7,
                                        fontSize: 14,
                                    }}
                                >
                                    {field.label || `Field ${i + 1}`}
                                    {field.required ? " *" : ""}
                                    {field.kind === "textarea" ? (
                                        <textarea
                                            required={field.required}
                                            placeholder={field.placeholder}
                                            value={customValues[i] || ""}
                                            onChange={(e) =>
                                                setCustomValues((v) => ({
                                                    ...v,
                                                    [i]: e.target.value,
                                                }))
                                            }
                                            rows={3}
                                            style={{
                                                background: "#1c1e1c",
                                                color: textColor,
                                                border: `1px solid ${borderColor}`,
                                                borderRadius: 12,
                                                padding: 14,
                                                font: "inherit",
                                            }}
                                        />
                                    ) : (
                                        <input
                                            type={
                                                field.kind === "email"
                                                    ? "email"
                                                    : "text"
                                            }
                                            required={field.required}
                                            placeholder={field.placeholder}
                                            value={customValues[i] || ""}
                                            onChange={(e) =>
                                                setCustomValues((v) => ({
                                                    ...v,
                                                    [i]: e.target.value,
                                                }))
                                            }
                                            style={{
                                                background: "#1c1e1c",
                                                color: textColor,
                                                border: `1px solid ${borderColor}`,
                                                borderRadius: 12,
                                                padding: 14,
                                                font: "inherit",
                                            }}
                                        />
                                    )}
                                </label>
                            ))}
                            <button
                                type="submit"
                                style={{
                                    ...buttonBase,
                                    border: 0,
                                    background: accent,
                                    color: "#111",
                                    borderRadius: 12,
                                    padding: 15,
                                    fontWeight: 650,
                                    opacity: 1,
                                }}
                            >
                                {props.submitLabel}
                            </button>
                        </form>
                    )}
                    <div
                        style={{
                            display: "flex",
                            justifyContent: done ? "center" : "space-between",
                            gap: 12,
                            marginTop: 42,
                        }}
                    >
                        {done ? (
                            <button
                                className={`ow-action-${uid}`}
                                onClick={reset}
                                style={{
                                    ...buttonBase,
                                    border: `1px solid ${borderColor}`,
                                    background: "transparent",
                                    color: mutedColor,
                                    borderRadius: 14,
                                    padding: "12px 18px",
                                }}
                            >
                                {restartLabel}
                            </button>
                        ) : (
                            <>
                                {showBack ? (
                                    <button
                                        className={`ow-action-${uid}`}
                                        onClick={() =>
                                            contact
                                                ? setContact(false)
                                                : safeIndex > 0 &&
                                                  setIndex(safeIndex - 1)
                                        }
                                        disabled={!contact && safeIndex === 0}
                                        style={{
                                            ...buttonBase,
                                            border: `1px solid ${borderColor}`,
                                            background: props.buttonBackground,
                                            color: props.buttonTextColor,
                                            borderRadius: props.buttonRadius,
                                            padding: "11px 17px",
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: 8,
                                            opacity:
                                                !contact && safeIndex === 0
                                                    ? 0.45
                                                    : 1,
                                            cursor:
                                                !contact && safeIndex === 0
                                                    ? "default"
                                                    : "pointer",
                                        }}
                                    >
                                        <ButtonIcon
                                            svg={props.backSvg}
                                            image={props.backIcon}
                                            fallback="back"
                                            size={props.buttonIconSize}
                                        />
                                        {backLabel}
                                    </button>
                                ) : (
                                    <span />
                                )}
                                {showSkip && !contact && step && (
                                    <button
                                        className={`ow-action-${uid}`}
                                        onClick={() => next(null)}
                                        style={{
                                            ...buttonBase,
                                            border: `1px solid ${borderColor}`,
                                            background: props.buttonBackground,
                                            color: props.buttonTextColor,
                                            borderRadius: props.buttonRadius,
                                            padding: "11px 17px",
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: 8,
                                        }}
                                    >
                                        <ButtonIcon
                                            svg={props.skipSvg}
                                            image={props.skipIcon}
                                            fallback="skip"
                                            size={props.buttonIconSize}
                                        />
                                        {skipLabel}
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
OfferWizard.defaultProps = {
    textureMode: "dots",
    textureGradient: "linear-gradient(135deg, #1c3d2c 0%, #111211 70%)",
    textureOpacity: 20,
    textureSize: "cover",
    buttonIconSize: 20,
    buttonRadius: 14,
    buttonTextColor: "#858785",
    buttonBackground: "transparent",
    goLabel: "",
    illustrationSize: 125,
    optionIconSize: 58,
    glyphSize: 22,
    imageFit: "cover",
    fontFamily: "Inter, sans-serif",
    contactTitle: "Your details",
    contactDescription: "Tell us how to get in touch.",
    submitLabel: "Submit",
    customFields: [],
    showCompany: true,
    showBudget: true,
    showDescription: true,
    steps: initialSteps,
    background: "transparent",
    cardColor: "#111211",
    textColor: "#f9faf9",
    mutedColor: "#858785",
    accent: "#24e985",
    borderColor: "#303230",
    radius: 48,
    padding: 52,
    headingSize: 32,
    bodySize: 18,
    showProgress: true,
    showDots: true,
    showBack: true,
    showSkip: true,
    backLabel: "Back",
    skipLabel: "Skip",
    completedTitle: "You're all set",
    completedText: "Your details are ready.",
    restartLabel: "Start again",
    iconRadius: 16,
}
addPropertyControls(OfferWizard, {
    textureMode: {
        type: ControlType.Enum,
        title: "Card texture",
        options: ["dots", "image", "gradient", "none"],
        optionTitles: ["Dots", "Image", "Gradient", "None"],
        defaultValue: "dots",
        hidden: (p) => !p.showDots,
    },
    textureImage: {
        type: ControlType.Image,
        title: "Texture image",
        hidden: (p) => !p.showDots || p.textureMode !== "image",
    },
    textureGradient: {
        type: ControlType.String,
        title: "CSS gradient",
        defaultValue: "linear-gradient(135deg, #1c3d2c 0%, #111211 70%)",
        hidden: (p) => !p.showDots || p.textureMode !== "gradient",
    },
    textureOpacity: {
        type: ControlType.Number,
        title: "Texture opacity",
        min: 0,
        max: 100,
        defaultValue: 20,
        unit: "%",
        hidden: (p) => !p.showDots || p.textureMode === "none",
    },
    textureSize: {
        type: ControlType.Enum,
        title: "Image fit",
        options: ["cover", "contain", "repeat"],
        defaultValue: "cover",
        hidden: (p) => !p.showDots || p.textureMode !== "image",
    },
    buttonIconSize: {
        type: ControlType.Number,
        title: "Button icon size",
        min: 12,
        max: 36,
        defaultValue: 20,
        unit: "px",
    },
    buttonRadius: {
        type: ControlType.Number,
        title: "Button radius",
        min: 0,
        max: 40,
        defaultValue: 14,
        unit: "px",
    },
    buttonTextColor: {
        type: ControlType.Color,
        title: "Button text",
        defaultValue: "#858785",
    },
    buttonBackground: {
        type: ControlType.Color,
        title: "Button fill",
        defaultValue: "transparent",
    },
    goLabel: { type: ControlType.String, title: "Go label", defaultValue: "" },
    backIcon: {
        type: ControlType.Image,
        title: "Back icon",
        hidden: (p) => !p.showBack,
    },
    backSvg: {
        type: ControlType.String,
        title: "Back SVG",
        displayTextArea: true,
        hidden: (p) => !p.showBack,
    },
    skipIcon: {
        type: ControlType.Image,
        title: "Skip icon",
        hidden: (p) => !p.showSkip,
    },
    skipSvg: {
        type: ControlType.String,
        title: "Skip SVG",
        displayTextArea: true,
        hidden: (p) => !p.showSkip,
    },
    goIcon: { type: ControlType.Image, title: "Go icon" },
    goSvg: { type: ControlType.String, title: "Go SVG", displayTextArea: true },
    illustrationSize: {
        type: ControlType.Number,
        title: "Top image size",
        defaultValue: 125,
        min: 50,
        max: 240,
        unit: "px",
    },
    optionIconSize: {
        type: ControlType.Number,
        title: "Icon box size",
        defaultValue: 58,
        min: 32,
        max: 100,
        unit: "px",
    },
    glyphSize: {
        type: ControlType.Number,
        title: "Symbol size",
        defaultValue: 22,
        min: 12,
        max: 50,
        unit: "px",
    },
    imageFit: {
        type: ControlType.Enum,
        title: "Icon image fit",
        options: ["cover", "contain"],
        defaultValue: "cover",
        displaySegmentedControl: true,
    },
    fontFamily: {
        type: ControlType.String,
        title: "Font family",
        defaultValue: "Inter, sans-serif",
    },
    contactTitle: {
        type: ControlType.String,
        title: "Form title",
        defaultValue: "Your details",
    },
    contactDescription: {
        type: ControlType.String,
        title: "Form subtitle",
        defaultValue: "Tell us how to get in touch.",
    },
    submitLabel: {
        type: ControlType.String,
        title: "Submit label",
        defaultValue: "Submit",
    },
    showCompany: {
        type: ControlType.Boolean,
        title: "Company field",
        defaultValue: true,
    },
    showBudget: {
        type: ControlType.Boolean,
        title: "Budget field",
        defaultValue: true,
    },
    showDescription: {
        type: ControlType.Boolean,
        title: "Project field",
        defaultValue: true,
    },
    customFields: {
        type: ControlType.Array,
        title: "Custom fields",
        maxCount: 12,
        defaultValue: [],
        control: {
            type: ControlType.Object,
            controls: {
                label: {
                    type: ControlType.String,
                    title: "Label",
                    defaultValue: "Custom field",
                },
                kind: {
                    type: ControlType.Enum,
                    title: "Type",
                    options: ["text", "email", "textarea"],
                    optionTitles: ["Text", "Email", "Long text"],
                    defaultValue: "text",
                },
                required: {
                    type: ControlType.Boolean,
                    title: "Required",
                    defaultValue: false,
                },
                placeholder: {
                    type: ControlType.String,
                    title: "Placeholder",
                    defaultValue: "",
                },
            },
        },
    },
    steps: {
        type: ControlType.Array,
        title: "Steps",
        maxCount: 12,
        defaultValue: initialSteps,
        control: {
            type: ControlType.Object,
            controls: {
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "Choose an option",
                },
                description: {
                    type: ControlType.String,
                    title: "Description",
                    displayTextArea: true,
                },
                image: { type: ControlType.Image, title: "Top image" },
                svg: {
                    type: ControlType.String,
                    title: "Top SVG code",
                    displayTextArea: true,
                    placeholder: "<svg ...>...</svg>",
                },
                options: {
                    type: ControlType.Array,
                    title: "Options",
                    maxCount: 10,
                    control: {
                        type: ControlType.Object,
                        controls: {
                            title: {
                                type: ControlType.String,
                                title: "Title",
                                defaultValue: "Option",
                            },
                            description: {
                                type: ControlType.String,
                                title: "Description",
                                defaultValue: "Option description",
                            },
                            icon: {
                                type: ControlType.Enum,
                                title: "Icon",
                                options: [
                                    "edit",
                                    "briefcase",
                                    "star",
                                    "bolt",
                                    "calendar",
                                ],
                                optionTitles: [
                                    "Edit",
                                    "Briefcase",
                                    "Star",
                                    "Bolt",
                                    "Calendar",
                                ],
                                defaultValue: "edit",
                            },
                            image: {
                                type: ControlType.Image,
                                title: "Custom icon",
                            },
                            svg: {
                                type: ControlType.String,
                                title: "SVG code",
                                displayTextArea: true,
                                placeholder: "<svg ...>...</svg>",
                            },
                            iconColor: {
                                type: ControlType.Color,
                                title: "Icon color",
                            },
                            iconBackground: {
                                type: ControlType.Color,
                                title: "Icon background",
                            },
                        },
                    },
                },
            },
        },
    },
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "transparent",
    },
    cardColor: {
        type: ControlType.Color,
        title: "Card color",
        defaultValue: "#111211",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text color",
        defaultValue: "#f9faf9",
    },
    mutedColor: {
        type: ControlType.Color,
        title: "Muted color",
        defaultValue: "#858785",
    },
    accent: {
        type: ControlType.Color,
        title: "Accent",
        defaultValue: "#24e985",
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border",
        defaultValue: "#303230",
    },
    radius: {
        type: ControlType.Number,
        title: "Card radius",
        min: 0,
        max: 100,
        defaultValue: 48,
        unit: "px",
    },
    iconRadius: {
        type: ControlType.Number,
        title: "Icon radius",
        min: 0,
        max: 40,
        defaultValue: 16,
        unit: "px",
    },
    padding: {
        type: ControlType.Number,
        title: "Padding",
        min: 20,
        max: 100,
        defaultValue: 52,
        unit: "px",
    },
    headingSize: {
        type: ControlType.Number,
        title: "Heading size",
        min: 18,
        max: 64,
        defaultValue: 32,
        unit: "px",
    },
    bodySize: {
        type: ControlType.Number,
        title: "Body size",
        min: 12,
        max: 30,
        defaultValue: 18,
        unit: "px",
    },
    showProgress: {
        type: ControlType.Boolean,
        title: "Progress",
        defaultValue: true,
    },
    showDots: {
        type: ControlType.Boolean,
        title: "Show texture",
        defaultValue: true,
    },
    showBack: {
        type: ControlType.Boolean,
        title: "Back button",
        defaultValue: true,
    },
    showSkip: {
        type: ControlType.Boolean,
        title: "Skip button",
        defaultValue: true,
    },
    backLabel: {
        type: ControlType.String,
        title: "Back label",
        defaultValue: "Back",
        hidden: (p) => !p.showBack,
    },
    skipLabel: {
        type: ControlType.String,
        title: "Skip label",
        defaultValue: "Skip",
        hidden: (p) => !p.showSkip,
    },
    completedTitle: {
        type: ControlType.String,
        title: "Done title",
        defaultValue: "You're all set",
    },
    completedText: {
        type: ControlType.String,
        title: "Done text",
        defaultValue: "Your details are ready.",
        displayTextArea: true,
    },
    restartLabel: {
        type: ControlType.String,
        title: "Restart label",
        defaultValue: "Start again",
    },
    completeUrl: { type: ControlType.Link, title: "Finish link" },
})
