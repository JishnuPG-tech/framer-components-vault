import { useEffect, useState } from "react"
import type { CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


// Self-contained on purpose: this file is meant to be pasted straight into
// Framer, so it imports nothing but react and framer.

type AgeGateProps = {
    minAge: number
    heading: string
    body: string
    confirmLabel: string
    denyLabel: string
    deniedMessage: string
    rememberDays: number
    storageKey: string
    backdropColor: string
    cardBackground: string
    textColor: string
    mutedColor: string
    confirmBackground: string
    confirmText: string
    radius: number
    maxWidth: number
    style?: CSSProperties
}

/**
 * Reads the saved answer. Anything unparseable or expired counts as "not
 * answered yet" — a corrupt value must never lock a visitor out.
 */
function readSaved(key: string): "yes" | "no" | null {
    if (typeof window === "undefined") return null
    try {
        const raw = window.localStorage.getItem(key)
        if (!raw) return null
        const saved = JSON.parse(raw) as { v?: string; exp?: number }
        if (saved.exp && Date.now() > saved.exp) {
            window.localStorage.removeItem(key)
            return null
        }
        return saved.v === "yes" || saved.v === "no" ? saved.v : null
    } catch {
        return null
    }
}

/**
 * An age confirmation gate that shows once per visitor.
 *
 * Covers the whole viewport until answered, remembers the answer in
 * localStorage, and stays out of the way on the Framer canvas so it never
 * blocks the person designing the page.
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 420
 * @framerIntrinsicHeight 260
 */
//@framerDisableUnlink
export default function AgeGate({
    minAge = 21,
    heading = "Are you 21 or older?",
    body = "You must confirm your age to enter this site.",
    confirmLabel = "Yes, I am",
    denyLabel = "No",
    deniedMessage = "Sorry — you are not old enough to view this site.",
    rememberDays = 30,
    storageKey = "age-gate",
    backdropColor = "rgba(9, 9, 11, 0.92)",
    cardBackground = "#FFFFFF",
    textColor = "#18181B",
    mutedColor = "#71717A",
    confirmBackground = "#18181B",
    confirmText = "#FFFFFF",
    radius = 16,
    maxWidth = 420,
    style,
}: Partial<AgeGateProps>) {
    // The gate must never cover the page while someone is designing it, and it
    // must not swallow the thumbnail either. useIsStaticRenderer is true on the
    // canvas, in thumbnails and on export — all the places where a full-screen
    // overlay would be in the way. Only a real visit gets the real gate.
    //
    // Checking RenderTarget.canvas alone is not enough: the on-demand canvas
    // screenshot reported a different target and the overlay covered the whole
    // page, hiding every other component on it.
    const isStatic = useIsStaticRenderer()

    // Start closed and open in an effect. Reading localStorage during render
    // would make the server and the browser disagree on the first paint.
    const [answer, setAnswer] = useState<"yes" | "no" | null>(null)
    const [ready, setReady] = useState(false)

    useEffect(() => {
        setAnswer(readSaved(storageKey))
        setReady(true)
    }, [storageKey])

    const save = (v: "yes" | "no") => {
        setAnswer(v)
        // "Remember 0 days" means ask again next visit, so nothing is written.
        // Writing with no expiry would remember forever, which is the opposite.
        if (rememberDays <= 0) return
        if (typeof window === "undefined") return
        try {
            const exp = Date.now() + rememberDays * 86400000
            window.localStorage.setItem(storageKey, JSON.stringify({ v, exp }))
        } catch {
            // Private browsing can refuse writes. The gate still works for
            // this visit; it will simply ask again next time.
        }
    }

    const card = (
        <div
            style={{
                width: "100%",
                maxWidth,
                background: cardBackground,
                borderRadius: radius,
                padding: 28,
                display: "flex",
                flexDirection: "column",
                gap: 10,
                textAlign: "center",
                boxSizing: "border-box",
            }}
        >
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: textColor }}>
                {answer === "no" ? deniedMessage : heading}
            </h2>

            {answer !== "no" && (
                <>
                    <p style={{ margin: 0, fontSize: 15, lineHeight: 1.5, color: mutedColor }}>
                        {body}
                    </p>
                    <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
                        <button
                            type="button"
                            onClick={() => save("yes")}
                            style={{
                                flex: 1,
                                padding: "12px 16px",
                                border: "none",
                                borderRadius: radius / 2,
                                background: confirmBackground,
                                color: confirmText,
                                fontSize: 15,
                                fontWeight: 600,
                                fontFamily: "inherit",
                                cursor: "pointer",
                            }}
                        >
                            {confirmLabel}
                        </button>
                        <button
                            type="button"
                            onClick={() => save("no")}
                            style={{
                                flex: 1,
                                padding: "12px 16px",
                                border: `1px solid ${mutedColor}`,
                                borderRadius: radius / 2,
                                background: "transparent",
                                color: textColor,
                                fontSize: 15,
                                fontWeight: 600,
                                fontFamily: "inherit",
                                cursor: "pointer",
                            }}
                        >
                            {denyLabel}
                        </button>
                    </div>
                    <span style={{ fontSize: 12, color: mutedColor, marginTop: 6 }}>
                        You must be {minAge} or older to continue.
                    </span>
                </>
            )}
        </div>
    )

    if (isStatic) {
        return (
            <div
                style={{
                    position: "relative",
                    display: "flex",
                    justifyContent: "center",
                    width: "100%",
                    ...style,
                }}
            >
                {card}
            </div>
        )
    }

    // Nothing renders until we know the saved answer, so the gate never
    // flashes at a visitor who already confirmed.
    if (!ready || answer === "yes") return null

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-label={heading}
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 2147483000,
                background: backdropColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 20,
                boxSizing: "border-box",
                fontFamily: "inherit",
            }}
        >
            {card}
        </div>
    )
}

addPropertyControls(AgeGate, {
    minAge: {
        type: ControlType.Number,
        title: "Min age",
        defaultValue: 21,
        min: 13,
        max: 99,
        step: 1,
    },
    heading: {
        type: ControlType.String,
        title: "Heading",
        defaultValue: "Are you 21 or older?",
    },
    body: {
        type: ControlType.String,
        title: "Body",
        defaultValue: "You must confirm your age to enter this site.",
        displayTextArea: true,
    },
    confirmLabel: {
        type: ControlType.String,
        title: "Confirm",
        defaultValue: "Yes, I am",
    },
    denyLabel: {
        type: ControlType.String,
        title: "Deny",
        defaultValue: "No",
    },
    deniedMessage: {
        type: ControlType.String,
        title: "Denied",
        defaultValue: "Sorry — you are not old enough to view this site.",
        displayTextArea: true,
    },
    rememberDays: {
        type: ControlType.Number,
        title: "Remember",
        defaultValue: 30,
        min: 0,
        max: 365,
        step: 1,
        unit: "days",
        description: "0 asks on every visit.",
    },
    storageKey: {
        type: ControlType.String,
        title: "Storage key",
        defaultValue: "age-gate",
        description: "Change this to ask everyone again.",
    },
    maxWidth: {
        type: ControlType.Number,
        title: "Card width",
        defaultValue: 420,
        min: 260,
        max: 800,
        step: 10,
        unit: "px",
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 16,
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
    },
    backdropColor: {
        type: ControlType.Color,
        title: "Backdrop",
        defaultValue: "rgba(9, 9, 11, 0.92)",
    },
    cardBackground: {
        type: ControlType.Color,
        title: "Card",
        defaultValue: "#FFFFFF",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#18181B",
    },
    mutedColor: {
        type: ControlType.Color,
        title: "Muted",
        defaultValue: "#71717A",
    },
    confirmBackground: {
        type: ControlType.Color,
        title: "Button",
        defaultValue: "#18181B",
    },
    confirmText: {
        type: ControlType.Color,
        title: "Button text",
        defaultValue: "#FFFFFF",
        description: "More components by this maker: [vivi park](https://www.framer.com/@vivi-park/?tab=marketplace)",
    },
})
