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

import { createClient } from "@supabase/supabase-js"

/**
 * ClientLogin
 *
 * A Framer code component that authenticates a client against Supabase
 * (email + password) and, on success, redirects them to their private
 * project-files page. Button carries four states — idle, hover,
 * submitting, and success ("thank you") — matching the site's submit
 * button pattern, plus an error state on failed login.
 *
 * SETUP IN FRAMER
 * 1. In the code component's file panel, add the npm dependency:
 *    @supabase/supabase-js
 * 2. Drop this component on a page (e.g. /login).
 * 3. In the right-hand Properties panel, paste your Supabase Project URL
 *    and Anon (public) key — found in Supabase → Project Settings → API.
 *    Never paste the service_role key here; only the anon key is safe
 *    for client-side code.
 * 4. Set "Redirect To" using the link picker — choose any page already
 *    in this Framer project, or paste an external URL. If you leave it
 *    blank, the component just won't navigate anywhere after login —
 *    it will never guess a path that might not exist on your site.
 *
 * WHY THIS WON'T LAG THE CANVAS
 * Framer's editor canvas re-renders code components constantly while
 * you work. If a component fires real network requests (session
 * checks, auth calls) on every one of those re-renders, the whole
 * project can slow down or a page can fail to build in Preview. This
 * component checks RenderTarget.current() and skips ALL Supabase
 * activity — no client creation, no network calls, no redirects —
 * whenever it's sitting on the canvas. It only talks to Supabase
 * inside an actual Preview or the published site.
 */

type Props = {
    supabaseUrl: string
    supabaseAnonKey: string
    redirectPath: string
    backgroundColor: string
    textColor: string
    buttonColor: string
    buttonTextColor: string
    hoverColor: string
    errorColor: string
}

let cachedClient: ReturnType<typeof createClient> | null = null
let cachedKey = ""

function getSupabase(url: string, anonKey: string) {
    const key = `${url}::${anonKey}`
    if (!cachedClient || cachedKey !== key) {
        cachedClient = createClient(url, anonKey)
        cachedKey = key
    }
    return cachedClient
}

type ButtonState = "idle" | "submitting" | "error" | "success"

export default function ClientLogin(props: Props) {
    const {
        supabaseUrl,
        supabaseAnonKey,
        redirectPath,
        backgroundColor,
        textColor,
        buttonColor,
        buttonTextColor,
        hoverColor,
        errorColor,
    } = props

    const COLORS = {
        cream: backgroundColor,
        ink: textColor,
        error: errorColor,
        hover: hoverColor,
        buttonBg: buttonColor,
        buttonText: buttonTextColor,
    }

    const [email, setEmail] = React.useState("")
    const [password, setPassword] = React.useState("")
    const [buttonState, setButtonState] = React.useState<ButtonState>("idle")
    const [errorMessage, setErrorMessage] = React.useState("")
    const [checkingSession, setCheckingSession] = React.useState(true)

    const isCanvas = RenderTarget.current() === RenderTarget.canvas

    const supabase = React.useMemo(() => {
        if (isCanvas) return null // never touch Supabase on the canvas
        if (!supabaseUrl || !supabaseAnonKey) return null
        try {
            return getSupabase(supabaseUrl, supabaseAnonKey)
        } catch {
            return null
        }
    }, [isCanvas, supabaseUrl, supabaseAnonKey])

    function goToRedirect() {
        if (redirectPath) {
            window.location.href = redirectPath
        }
        // No redirect target set — stay put rather than guessing a path
        // that might not exist and triggering a 404.
    }

    // If a client is already logged in (returning visitor), skip the form.
    // Skipped entirely on canvas so the editor never fires network calls.
    React.useEffect(() => {
        if (isCanvas || !supabase) {
            setCheckingSession(false)
            return
        }
        let active = true
        supabase.auth
            .getSession()
            .then(({ data }) => {
                if (!active) return
                if (data.session) {
                    goToRedirect()
                } else {
                    setCheckingSession(false)
                }
            })
            .catch(() => {
                if (active) setCheckingSession(false)
            })
        return () => {
            active = false
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isCanvas, supabase, redirectPath])

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault()
        if (isCanvas) return
        setErrorMessage("")

        if (!supabase) {
            setButtonState("error")
            setErrorMessage(
                "Login isn't configured yet — add your Supabase URL and anon key in the component properties."
            )
            return
        }
        if (!email || !password) {
            setButtonState("error")
            setErrorMessage("Enter your email and password.")
            return
        }

        setButtonState("submitting")
        const { error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (authError) {
            setButtonState("error")
            setErrorMessage(
                authError.message ||
                    "Login failed. Check your email and password."
            )
            return
        }

        setButtonState("success")
        // brief "thank you" beat before handing off to the project-files page
        window.setTimeout(() => {
            goToRedirect()
        }, 900)
    }

    const buttonLabel =
        buttonState === "submitting"
            ? "Logging in…"
            : buttonState === "success"
              ? "Welcome back ✓"
              : buttonState === "error"
                ? "Try again"
                : "Log in"

    const wrapperStyle: React.CSSProperties = {
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Inter, sans-serif",
        background: COLORS.cream,
    }

    const inputStyle: React.CSSProperties = {
        padding: "14px",
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: `${COLORS.ink}33`,
        borderRadius: "8px",
        fontSize: "16px",
        background: COLORS.cream,
        color: COLORS.ink,
    }

    if (checkingSession) {
        return (
            <div style={wrapperStyle}>
                <p
                    style={{
                        color: COLORS.ink,
                        opacity: 0.5,
                        fontSize: "14px",
                    }}
                >
                    Loading…
                </p>
            </div>
        )
    }

    return (
        <div style={wrapperStyle}>
            <style>{`
                .cl-input::placeholder { color: ${COLORS.ink}; opacity: 0.4; }
                .cl-input:focus { outline: none; border-color: ${COLORS.ink}; }
                .cl-input-error:focus { border-color: ${COLORS.error}; }
                .cl-btn {
                    background: ${COLORS.buttonBg};
                    transition: background 0.18s ease;
                }
                .cl-btn:hover:not(:disabled) { background: ${COLORS.hover}; }
                .cl-btn:disabled { cursor: default; }
                .cl-btn-error { background: ${COLORS.error} !important; }
                .cl-btn-success { background: ${COLORS.buttonBg} !important; }
            `}</style>

            <form
                onSubmit={handleLogin}
                style={{
                    width: "320px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                }}
            >
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    className={`cl-input ${buttonState === "error" ? "cl-input-error" : ""}`}
                    style={{
                        ...inputStyle,
                        borderColor:
                            buttonState === "error"
                                ? COLORS.error
                                : inputStyle.borderColor,
                    }}
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className={`cl-input ${buttonState === "error" ? "cl-input-error" : ""}`}
                    style={{
                        ...inputStyle,
                        borderColor:
                            buttonState === "error"
                                ? COLORS.error
                                : inputStyle.borderColor,
                    }}
                />

                {buttonState === "error" && errorMessage && (
                    <p
                        style={{
                            color: COLORS.error,
                            fontSize: "13px",
                            margin: 0,
                        }}
                    >
                        {errorMessage}
                    </p>
                )}

                <button
                    type="submit"
                    disabled={
                        buttonState === "submitting" ||
                        buttonState === "success"
                    }
                    className={`cl-btn ${
                        buttonState === "error"
                            ? "cl-btn-error"
                            : buttonState === "success"
                              ? "cl-btn-success"
                              : ""
                    }`}
                    style={{
                        padding: "14px",
                        border: "none",
                        borderRadius: "8px",
                        color: COLORS.buttonText,
                        fontSize: "16px",
                        opacity: buttonState === "submitting" ? 0.7 : 1,
                    }}
                >
                    {buttonLabel}
                </button>
            </form>
        </div>
    )
}

addPropertyControls(ClientLogin, {
    supabaseUrl: {
        type: ControlType.String,
        title: "Supabase URL",
        placeholder: "https://xxxx.supabase.co",
    },
    supabaseAnonKey: {
        type: ControlType.String,
        title: "Anon Key",
        placeholder: "public-anon-key",
    },
    redirectPath: {
        type: ControlType.Link,
        title: "Redirect To",
        defaultValue: "",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#FFF4E8",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#050208",
    },
    buttonColor: {
        type: ControlType.Color,
        title: "Button",
        defaultValue: "#050208",
    },
    buttonTextColor: {
        type: ControlType.Color,
        title: "Button Text",
        defaultValue: "#FFF4E8",
    },
    hoverColor: {
        type: ControlType.Color,
        title: "Button Hover",
        defaultValue: "#330400",
    },
    errorColor: {
        type: ControlType.Color,
        title: "Error",
        defaultValue: "#A01C2A",
    },
})

/**
 * GATING THE PROJECT-FILES PAGE
 *
 * This component only handles login. The page that shows a client's
 * project files needs its own guard so people can't type the URL and
 * see it without logging in:
 *
 *   1. Create a small "RequireAuth" code component that, on mount,
 *      calls supabase.auth.getSession() and redirects to /login if
 *      there's no session.
 *   2. Place it at the top of the project-files page.
 *
 * Making sure each client only sees THEIR OWN files (not everyone's)
 * is a separate step — Row Level Security policies in Supabase tied to
 * the logged-in user's ID, plus a client_id column on your projects
 * table. Happy to build that next.
 */
