// ─────────────────────────────────────────────────────────────────────────────
// AuthCard — Framer Code Component (Production-Ready Auth)
// Supports: Supabase · Firebase · Custom Webhook · UI-Only mode
// ─────────────────────────────────────────────────────────────────────────────

// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useState, useEffect, useCallback } from "react"

// ── Styles ───────────────────────────────────────────────────────────────────

const injectStyles = () => {
    if (typeof document === "undefined") return
    if (document.getElementById("__ac")) return
    const s = document.createElement("style")
    s.id = "__ac"
    s.textContent = `
        @keyframes ac-spin { to { transform: rotate(360deg) } }
        @keyframes ac-up   { from { opacity:0; transform:translateY(6px) } to { opacity:1; transform:translateY(0) } }
        @keyframes ac-in   { from { opacity:0 } to { opacity:1 } }
        .ac-card  { animation: ac-up 0.3s cubic-bezier(0.16,1,0.3,1) both }
        .ac-panel { animation: ac-in 0.18s ease both }
        .ac-ok    { animation: ac-in 0.22s ease both }
        .ac-spin  { animation: ac-spin 0.65s linear infinite }
        .ac-input::placeholder { color: #b8b8b8 }
        .ac-input:focus { outline: none }
        .ac-btn { transition: opacity 0.1s, transform 0.1s }
        .ac-btn:hover:not(:disabled) { opacity: 0.82 }
        .ac-btn:active:not(:disabled) { transform: scale(0.985) }
        .ac-btn:disabled { opacity: 0.28; cursor: not-allowed }
        .ac-outline:hover { background: #f5f5f3 !important }
        .ac-link { transition: color 0.12s }
        .ac-link:hover { color: #111 !important }
        .ac-tab { transition: color 0.15s, border-color 0.15s }
        .ac-mode { transition: all 0.15s }
    `
    document.head.appendChild(s)
}

// ── Icons ────────────────────────────────────────────────────────────────────

const IconArrow = ({ color = "#fff" }) => (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path
            d="M2 6h8M7 2.5l3.5 3.5L7 9.5"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
)
const IconCheck = () => (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
        <path
            d="M2 6.5l3 3 6-6"
            stroke="#16a34a"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
)
const IconGoogle = () => (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
        <path
            d="M13.5 7.67c0-.46-.04-.9-.11-1.33H7.5v2.52h3.37a2.88 2.88 0 01-1.25 1.89v1.57h2.02c1.18-1.09 1.86-2.69 1.86-4.65z"
            fill="#4285F4"
        />
        <path
            d="M7.5 13.5c1.69 0 3.1-.56 4.14-1.51l-2.02-1.57c-.56.38-1.28.6-2.12.6-1.63 0-3.01-1.1-3.5-2.58H1.91v1.62A6.5 6.5 0 007.5 13.5z"
            fill="#34A853"
        />
        <path
            d="M4 8.44a3.9 3.9 0 010-2.48V4.34H1.91a6.5 6.5 0 000 5.72L4 8.44z"
            fill="#FBBC05"
        />
        <path
            d="M7.5 3.38c.92 0 1.74.32 2.39.94l1.79-1.79A6.5 6.5 0 001.91 4.34L4 5.96c.49-1.48 1.87-2.58 3.5-2.58z"
            fill="#EA4335"
        />
    </svg>
)
const IconMagic = ({ color = "#111" }) => (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
        <path
            d="M2 12L9 5M6 2l1 2M10 3l-1 2M11 7l2-1M9 11l1 2"
            stroke={color}
            strokeWidth="1.4"
            strokeLinecap="round"
        />
        <circle cx="9.5" cy="4.5" r="1" fill={color} />
    </svg>
)
const IconEye = ({ show }: { show: boolean }) => (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
        <path
            d="M1 7.5S3.5 3 7.5 3s6.5 4.5 6.5 4.5S11.5 12 7.5 12 1 7.5 1 7.5z"
            stroke="#bbb"
            strokeWidth="1.2"
        />
        <circle cx="7.5" cy="7.5" r="2" stroke="#bbb" strokeWidth="1.2" />
        {!show && (
            <path
                d="M2 2l11 11"
                stroke="#bbb"
                strokeWidth="1.2"
                strokeLinecap="round"
            />
        )}
    </svg>
)

// ── Auth Provider Functions ──────────────────────────────────────────────────

type AuthProvider = "supabase" | "firebase" | "webhook" | "none"
type Mode = "login" | "register"
type AuthMethod = "magic" | "google" | "password"
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Supabase —————————————————————————————————————————————————————————————————

async function supabaseMagicLink(
    email: string,
    projectUrl: string,
    anonKey: string,
    redirectUrl: string
): Promise<{ error?: string }> {
    const url = `${projectUrl.replace(/\/$/, "")}/auth/v1/magiclink`
    const res = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            apikey: anonKey,
            Authorization: `Bearer ${anonKey}`,
        },
        body: JSON.stringify({
            email,
            ...(redirectUrl ? { redirect_to: redirectUrl } : {}),
        }),
    })
    if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        return {
            error:
                body?.error_description || body?.msg || `Error ${res.status}`,
        }
    }
    return {}
}

async function supabaseSignUp(
    email: string,
    password: string,
    name: string,
    projectUrl: string,
    anonKey: string,
    redirectUrl: string
): Promise<{ error?: string }> {
    const url = `${projectUrl.replace(/\/$/, "")}/auth/v1/signup`
    const res = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            apikey: anonKey,
            Authorization: `Bearer ${anonKey}`,
        },
        body: JSON.stringify({
            email,
            password,
            data: name ? { full_name: name } : undefined,
            ...(redirectUrl ? { redirect_to: redirectUrl } : {}),
        }),
    })
    if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        return {
            error:
                body?.error_description || body?.msg || `Error ${res.status}`,
        }
    }
    return {}
}

async function supabaseSignIn(
    email: string,
    password: string,
    projectUrl: string,
    anonKey: string
): Promise<{ error?: string; data?: any }> {
    const url = `${projectUrl.replace(/\/$/, "")}/auth/v1/token?grant_type=password`
    const res = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            apikey: anonKey,
            Authorization: `Bearer ${anonKey}`,
        },
        body: JSON.stringify({ email, password }),
    })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) {
        return {
            error:
                body?.error_description || body?.msg || `Error ${res.status}`,
        }
    }
    return { data: body }
}

function supabaseGoogleOAuth(projectUrl: string, redirectUrl: string) {
    if (typeof window === "undefined") return
    const base = `${projectUrl.replace(/\/$/, "")}/auth/v1/authorize`
    const params = new URLSearchParams({
        provider: "google",
        ...(redirectUrl ? { redirect_to: redirectUrl } : {}),
    })
    window.location.href = `${base}?${params.toString()}`
}

// Firebase —————————————————————————————————————————————————————————————————

async function firebaseMagicLink(
    email: string,
    apiKey: string,
    redirectUrl: string
): Promise<{ error?: string }> {
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${apiKey}`
    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            requestType: "EMAIL_SIGNIN",
            email,
            continueUrl:
                redirectUrl ||
                (typeof window !== "undefined" ? window.location.href : ""),
            canHandleCodeInApp: true,
        }),
    })
    if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        return { error: body?.error?.message || `Error ${res.status}` }
    }
    return {}
}

async function firebaseSignUp(
    email: string,
    password: string,
    name: string,
    apiKey: string
): Promise<{ error?: string; data?: any }> {
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`
    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, returnSecureToken: true }),
    })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) {
        return { error: body?.error?.message || `Error ${res.status}` }
    }
    if (name && body.idToken) {
        await fetch(
            `https://identitytoolkit.googleapis.com/v1/accounts:update?key=${apiKey}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    idToken: body.idToken,
                    displayName: name,
                    returnSecureToken: false,
                }),
            }
        ).catch(() => {})
    }
    return { data: body }
}

async function firebaseSignIn(
    email: string,
    password: string,
    apiKey: string
): Promise<{ error?: string; data?: any }> {
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`
    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, returnSecureToken: true }),
    })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) {
        const msg = body?.error?.message || `Error ${res.status}`
        const friendly: Record<string, string> = {
            INVALID_LOGIN_CREDENTIALS: "Invalid email or password.",
            EMAIL_NOT_FOUND: "No account found with this email.",
            INVALID_PASSWORD: "Incorrect password.",
            USER_DISABLED: "This account has been disabled.",
            TOO_MANY_ATTEMPTS_TRY_LATER: "Too many attempts. Try again later.",
        }
        return { error: friendly[msg] || msg }
    }
    return { data: body }
}

// Webhook ——————————————————————————————————————————————————————————————————

async function webhookAuth(
    webhookUrl: string,
    action: string,
    payload: Record<string, string>
): Promise<{ error?: string; data?: any }> {
    const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...payload }),
    })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) {
        return { error: body?.error || `Error ${res.status}` }
    }
    return { data: body }
}

async function webhookGoogle(webhookUrl: string) {
    if (typeof window === "undefined") return
    const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "google_oauth" }),
    })
    if (res.ok) {
        const body = await res.json().catch(() => ({}))
        if (body?.redirect_url) {
            window.location.href = body.redirect_url
            return
        }
    }
}

// ── Props ────────────────────────────────────────────────────────────────────

interface Props {
    defaultMode?: Mode
    loginHeading?: string
    loginSubheading?: string
    registerHeading?: string
    registerSubheading?: string
    emailPlaceholder?: string
    passwordPlaceholder?: string
    namePlaceholder?: string
    magicButtonLogin?: string
    magicButtonRegister?: string
    googleButtonLogin?: string
    googleButtonRegister?: string
    passwordButtonLogin?: string
    passwordButtonRegister?: string
    successTextLogin?: string
    successTextRegister?: string
    showMagic?: boolean
    showGoogle?: boolean
    showPassword?: boolean
    showName?: boolean
    showSubheading?: boolean
    authProvider?: AuthProvider
    supabaseUrl?: string
    supabaseAnonKey?: string
    firebaseApiKey?: string
    webhookUrl?: string
    redirectUrl?: string
    termsLabel?: string
    termsUrl?: string
    privacyLabel?: string
    privacyUrl?: string
    headingFont?: any
    bodyFont?: any
    accentColor?: string
    pageBg?: string
    radius?: number
    onLogin?: (data: object) => void
    onRegister?: (data: object) => void
    onGoogleClick?: () => void
    onAuthError?: (error: string) => void
}

// ── Component ────────────────────────────────────────────────────────────────

export default function AuthCard({
    defaultMode = "login",
    loginHeading = "Welcome back",
    loginSubheading = "Sign in to your account to continue.",
    registerHeading = "Create an account",
    registerSubheading = "Get started — it only takes a few seconds.",
    emailPlaceholder = "your@email.com",
    passwordPlaceholder = "Password",
    namePlaceholder = "Full name",
    magicButtonLogin = "Send magic link",
    magicButtonRegister = "Create account",
    googleButtonLogin = "Continue with Google",
    googleButtonRegister = "Sign up with Google",
    passwordButtonLogin = "Sign in",
    passwordButtonRegister = "Create account",
    successTextLogin = "Check your inbox. Magic link expires in 10 min.",
    successTextRegister = "Almost there! Check your inbox to verify your email.",
    showMagic = true,
    showGoogle = true,
    showPassword = true,
    showName = true,
    showSubheading = true,
    authProvider = "none",
    supabaseUrl = "",
    supabaseAnonKey = "",
    firebaseApiKey = "",
    webhookUrl = "",
    redirectUrl = "",
    termsLabel = "Terms",
    termsUrl = "",
    privacyLabel = "Privacy",
    privacyUrl = "",
    headingFont = {},
    bodyFont = {},
    accentColor = "#111111",
    pageBg = "#f5f5f3",
    radius = 12,
    onLogin,
    onRegister,
    onGoogleClick,
    onAuthError,
}: Props) {
    const isCanvas = false

    const [mode, setMode] = useState<Mode>(defaultMode)
    const [authMethod, setMethod] = useState<AuthMethod>(
        showMagic ? "magic" : showGoogle ? "google" : "password"
    )
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [showPw, setShowPw] = useState(false)
    const [loading, setLoading] = useState(false)
    const [done, setDone] = useState(false)
    const [focused, setFocused] = useState<string | null>(null)
    const [errors, setErrors] = useState<Record<string, string>>({})

    useEffect(() => {
        injectStyles()
    }, [])

    // ── FIX: inlined firstMethod logic, added showMagic/showGoogle to deps ───
    useEffect(() => {
        setEmail("")
        setPassword("")
        setName("")
        setErrors({})
        setDone(false)
        setLoading(false)
        setMethod(showMagic ? "magic" : showGoogle ? "google" : "password")
    }, [mode, showMagic, showGoogle])

    useEffect(() => {
        setEmail("")
        setPassword("")
        setErrors({})
        setDone(false)
    }, [authMethod])

    // ── Helpers ──────────────────────────────────────────────────────────────

    const ff = (f: any) =>
        f?.fontFamily
            ? `"${f.fontFamily}", system-ui, sans-serif`
            : `system-ui, -apple-system, sans-serif`

    const R = Math.max(6, radius * 0.65)

    const validate = () => {
        const e: Record<string, string> = {}
        if (!emailRe.test(email.trim()))
            e.email = "Enter a valid email address."
        if (authMethod === "password") {
            if (password.length < 8) e.password = "Minimum 8 characters."
            if (mode === "register" && showName && !name.trim())
                e.name = "Please enter your name."
        }
        setErrors(e)
        return Object.keys(e).length === 0
    }

    const openUrl = (url: string) => {
        if (!url || typeof window === "undefined") return
        window.open(
            url.startsWith("http") ? url : "https://" + url,
            "_blank",
            "noopener noreferrer"
        )
    }

    // ── Submit handler ───────────────────────────────────────────────────────

    const submit = useCallback(async () => {
        if (loading || done) return
        if (!validate()) return
        setLoading(true)
        setErrors({})

        const isLogin = mode === "login"
        const trimmedEmail = email.trim()
        const trimmedName = name.trim()

        try {
            let result: { error?: string; data?: any } = {}

            if (authMethod === "magic") {
                switch (authProvider) {
                    case "supabase":
                        if (!supabaseUrl || !supabaseAnonKey) {
                            result = { error: "Supabase is not configured." }
                        } else {
                            result = await supabaseMagicLink(
                                trimmedEmail,
                                supabaseUrl,
                                supabaseAnonKey,
                                redirectUrl
                            )
                        }
                        break
                    case "firebase":
                        if (!firebaseApiKey) {
                            result = { error: "Firebase is not configured." }
                        } else {
                            result = await firebaseMagicLink(
                                trimmedEmail,
                                firebaseApiKey,
                                redirectUrl
                            )
                        }
                        break
                    case "webhook":
                        if (!webhookUrl) {
                            result = { error: "Webhook URL is not configured." }
                        } else {
                            result = await webhookAuth(
                                webhookUrl,
                                isLogin
                                    ? "magic_link_login"
                                    : "magic_link_register",
                                {
                                    email: trimmedEmail,
                                    ...(!isLogin && trimmedName
                                        ? { name: trimmedName }
                                        : {}),
                                }
                            )
                        }
                        break
                    case "none":
                    default:
                        break
                }
            }

            if (authMethod === "password") {
                switch (authProvider) {
                    case "supabase":
                        if (!supabaseUrl || !supabaseAnonKey) {
                            result = { error: "Supabase is not configured." }
                        } else if (isLogin) {
                            result = await supabaseSignIn(
                                trimmedEmail,
                                password,
                                supabaseUrl,
                                supabaseAnonKey
                            )
                        } else {
                            result = await supabaseSignUp(
                                trimmedEmail,
                                password,
                                trimmedName,
                                supabaseUrl,
                                supabaseAnonKey,
                                redirectUrl
                            )
                        }
                        break
                    case "firebase":
                        if (!firebaseApiKey) {
                            result = { error: "Firebase is not configured." }
                        } else if (isLogin) {
                            result = await firebaseSignIn(
                                trimmedEmail,
                                password,
                                firebaseApiKey
                            )
                        } else {
                            result = await firebaseSignUp(
                                trimmedEmail,
                                password,
                                trimmedName,
                                firebaseApiKey
                            )
                        }
                        break
                    case "webhook":
                        if (!webhookUrl) {
                            result = { error: "Webhook URL is not configured." }
                        } else {
                            result = await webhookAuth(
                                webhookUrl,
                                isLogin
                                    ? "password_login"
                                    : "password_register",
                                {
                                    email: trimmedEmail,
                                    password,
                                    ...(!isLogin && trimmedName
                                        ? { name: trimmedName }
                                        : {}),
                                }
                            )
                        }
                        break
                    case "none":
                    default:
                        break
                }
            }

            if (result.error) {
                setErrors({ form: result.error })
                onAuthError?.(result.error)
            } else {
                setDone(true)
                const payload = {
                    email: trimmedEmail,
                    name: trimmedName,
                    method: authMethod,
                    ...(result.data || {}),
                }
                isLogin ? onLogin?.(payload) : onRegister?.(payload)

                if (
                    authMethod === "password" &&
                    isLogin &&
                    redirectUrl &&
                    authProvider !== "none"
                ) {
                    setTimeout(() => {
                        if (typeof window !== "undefined")
                            window.location.href = redirectUrl
                    }, 600)
                }
            }
        } catch (e: any) {
            const msg = e?.message || "Something went wrong. Please try again."
            setErrors({ form: msg })
            onAuthError?.(msg)
        } finally {
            setLoading(false)
        }
    }, [
        loading,
        done,
        mode,
        email,
        password,
        name,
        authMethod,
        authProvider,
        supabaseUrl,
        supabaseAnonKey,
        firebaseApiKey,
        webhookUrl,
        redirectUrl,
        onLogin,
        onRegister,
        onAuthError,
    ])

    // ── Google handler ───────────────────────────────────────────────────────

    const handleGoogle = useCallback(() => {
        switch (authProvider) {
            case "supabase":
                if (supabaseUrl) supabaseGoogleOAuth(supabaseUrl, redirectUrl)
                break
            case "webhook":
                if (webhookUrl) webhookGoogle(webhookUrl)
                break
            case "firebase":
                onGoogleClick?.()
                break
            case "none":
            default:
                onGoogleClick?.()
                break
        }
    }, [authProvider, supabaseUrl, webhookUrl, redirectUrl, onGoogleClick])

    // ── Shared styles ────────────────────────────────────────────────────────

    const inputCss = (field: string): React.CSSProperties => ({
        width: "100%",
        padding: "10px 13px",
        fontSize: 14,
        fontFamily: ff(bodyFont),
        color: "#111",
        background: "#fff",
        border: `1px solid ${focused === field ? "#999" : errors[field] ? "#fca5a5" : "#d8d8d6"}`,
        borderRadius: R,
        boxSizing: "border-box",
        display: "block",
        transition: "border-color 0.12s, box-shadow 0.12s",
        boxShadow:
            focused === field
                ? "0 0 0 3px rgba(0,0,0,0.07)"
                : errors[field]
                  ? "0 0 0 3px rgba(239,68,68,0.08)"
                  : "none",
    })

    const primaryBtn: React.CSSProperties = {
        width: "100%",
        padding: "10px 16px",
        background: accentColor,
        color: "#fff",
        border: "none",
        borderRadius: R,
        fontSize: 14,
        fontWeight: 600,
        fontFamily: ff(bodyFont),
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        letterSpacing: "-0.01em",
        boxSizing: "border-box",
    }

    const isLogin = mode === "login"
    const activeMethods = [showMagic, showGoogle, showPassword].filter(Boolean)

    // ── Render ───────────────────────────────────────────────────────────────

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                background: pageBg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 24,
                boxSizing: "border-box",
            }}
        >
            <div
                className="ac-card"
                style={{
                    width: 400,
                    flexShrink: 0,
                    background: "#fff",
                    border: "1px solid #e0e0de",
                    borderRadius: radius,
                    padding: "28px 28px 24px",
                    boxSizing: "border-box",
                    boxShadow:
                        "0 1px 3px rgba(0,0,0,0.05), 0 8px 28px rgba(0,0,0,0.07)",
                    fontFamily: ff(bodyFont),
                }}
            >
                {/* Mode pill */}
                <div
                    style={{
                        display: "flex",
                        width: "100%",
                        background: "#f3f3f1",
                        borderRadius: R,
                        padding: 3,
                        marginBottom: 24,
                        boxSizing: "border-box",
                        gap: 3,
                    }}
                >
                    {(["login", "register"] as Mode[]).map((m) => (
                        <button
                            key={m}
                            className="ac-mode"
                            onClick={() => setMode(m)}
                            style={{
                                flex: 1,
                                padding: "7px 0",
                                fontSize: 13.5,
                                fontWeight: mode === m ? 600 : 400,
                                fontFamily: ff(bodyFont),
                                color: mode === m ? "#111" : "#888",
                                background: mode === m ? "#fff" : "transparent",
                                border:
                                    mode === m
                                        ? "1px solid #e0e0de"
                                        : "1px solid transparent",
                                borderRadius: R - 2,
                                cursor: "pointer",
                                letterSpacing: "-0.01em",
                                textAlign: "center",
                                boxShadow:
                                    mode === m
                                        ? "0 1px 3px rgba(0,0,0,0.09)"
                                        : "none",
                            }}
                        >
                            {m === "login" ? "Sign in" : "Sign up"}
                        </button>
                    ))}
                </div>

                {/* Heading */}
                <h1
                    style={{
                        fontFamily: ff(headingFont),
                        fontSize: 20,
                        fontWeight: 700,
                        color: "#111",
                        margin: "0 0 4px",
                        lineHeight: 1.2,
                        letterSpacing: "-0.02em",
                    }}
                >
                    {isLogin ? loginHeading : registerHeading}
                </h1>

                {showSubheading && (
                    <p
                        style={{
                            fontSize: 13.5,
                            color: "#888",
                            margin: "0 0 22px",
                            lineHeight: 1.55,
                            fontWeight: 400,
                        }}
                    >
                        {isLogin ? loginSubheading : registerSubheading}
                    </p>
                )}

                {/* Auth method tabs */}
                {activeMethods.length > 1 && (
                    <div
                        style={{
                            display: "flex",
                            width: "100%",
                            borderBottom: "1px solid #e8e8e6",
                            marginBottom: 22,
                        }}
                    >
                        {[
                            showMagic && {
                                key: "magic" as AuthMethod,
                                label: "Magic Link",
                                icon: (
                                    <IconMagic
                                        color={
                                            authMethod === "magic"
                                                ? accentColor
                                                : "#bbb"
                                        }
                                    />
                                ),
                            },
                            showGoogle && {
                                key: "google" as AuthMethod,
                                label: "Google",
                                icon: <IconGoogle />,
                            },
                            showPassword && {
                                key: "password" as AuthMethod,
                                label: "Password",
                                icon: null,
                            },
                        ]
                            .filter(Boolean)
                            .map((item: any) => (
                                <button
                                    key={item.key}
                                    className="ac-tab"
                                    onClick={() => setMethod(item.key)}
                                    style={{
                                        flex: 1,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: 5,
                                        padding: "8px 4px 10px",
                                        background: "none",
                                        border: "none",
                                        borderBottom: `2px solid ${authMethod === item.key ? accentColor : "transparent"}`,
                                        marginBottom: -1,
                                        fontSize: 12.5,
                                        fontWeight:
                                            authMethod === item.key ? 600 : 400,
                                        color:
                                            authMethod === item.key
                                                ? accentColor
                                                : "#aaa",
                                        cursor: "pointer",
                                        fontFamily: ff(bodyFont),
                                        letterSpacing: "-0.01em",
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    {item.icon}
                                    {item.label}
                                </button>
                            ))}
                    </div>
                )}

                {/* ── Magic Link panel ── */}
                {authMethod === "magic" && showMagic && (
                    <div className="ac-panel">
                        <label
                            style={{
                                display: "block",
                                fontSize: 13.5,
                                fontWeight: 600,
                                color: "#111",
                                marginBottom: 6,
                            }}
                        >
                            Email address
                        </label>
                        <input
                            className="ac-input"
                            type="email"
                            autoComplete="email"
                            placeholder={emailPlaceholder}
                            value={email}
                            disabled={done}
                            onChange={(e) => {
                                setEmail(e.target.value)
                                setErrors((p) => ({ ...p, email: "" }))
                            }}
                            onFocus={() => setFocused("email")}
                            onBlur={() => setFocused(null)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") submit()
                            }}
                            style={{
                                ...inputCss("email"),
                                marginBottom: errors.email ? 4 : 16,
                            }}
                        />
                        {errors.email && (
                            <p
                                style={{
                                    fontSize: 11.5,
                                    color: "#dc2626",
                                    margin: "0 0 12px",
                                    lineHeight: 1.4,
                                }}
                            >
                                {errors.email}
                            </p>
                        )}
                        {errors.form && !done && (
                            <p
                                style={{
                                    fontSize: 11.5,
                                    color: "#dc2626",
                                    margin: "0 0 12px",
                                    lineHeight: 1.4,
                                }}
                            >
                                {errors.form}
                            </p>
                        )}

                        {done ? (
                            <div
                                className="ac-ok"
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    background: "#f0fdf4",
                                    border: "1px solid #bbf7d0",
                                    borderRadius: R,
                                    padding: "11px 14px",
                                }}
                            >
                                <IconCheck />
                                <span
                                    style={{
                                        fontSize: 13,
                                        color: "#166534",
                                        fontWeight: 500,
                                        lineHeight: 1.45,
                                    }}
                                >
                                    {isLogin
                                        ? successTextLogin
                                        : successTextRegister}
                                </span>
                            </div>
                        ) : (
                            <button
                                className="ac-btn"
                                onClick={submit}
                                disabled={
                                    !emailRe.test(email.trim()) || loading
                                }
                                style={primaryBtn}
                            >
                                {loading ? (
                                    <span
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 6,
                                        }}
                                    >
                                        <span
                                            className="ac-spin"
                                            style={{
                                                width: 12,
                                                height: 12,
                                                border: "1.8px solid rgba(255,255,255,0.25)",
                                                borderTopColor: "#fff",
                                                borderRadius: "50%",
                                                display: "inline-block",
                                            }}
                                        />
                                        Sending…
                                    </span>
                                ) : (
                                    <span
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 6,
                                        }}
                                    >
                                        {isLogin
                                            ? magicButtonLogin
                                            : magicButtonRegister}
                                        <IconArrow color="#fff" />
                                    </span>
                                )}
                            </button>
                        )}
                    </div>
                )}

                {/* ── Google panel ── */}
                {authMethod === "google" && showGoogle && (
                    <div className="ac-panel">
                        <button
                            className="ac-btn ac-outline"
                            onClick={handleGoogle}
                            style={{
                                width: "100%",
                                padding: "11px 16px",
                                background: "#fff",
                                color: "#111",
                                border: "1px solid #d8d8d6",
                                borderRadius: R,
                                fontSize: 14,
                                fontWeight: 600,
                                fontFamily: ff(bodyFont),
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 8,
                                letterSpacing: "-0.01em",
                                boxSizing: "border-box",
                            }}
                        >
                            <IconGoogle />
                            {isLogin ? googleButtonLogin : googleButtonRegister}
                        </button>
                    </div>
                )}

                {/* ── Password panel ── */}
                {authMethod === "password" && showPassword && (
                    <div className="ac-panel">
                        {!isLogin && showName && (
                            <div style={{ marginBottom: 14 }}>
                                <label
                                    style={{
                                        display: "block",
                                        fontSize: 13.5,
                                        fontWeight: 600,
                                        color: "#111",
                                        marginBottom: 6,
                                    }}
                                >
                                    Full name
                                </label>
                                <input
                                    className="ac-input"
                                    type="text"
                                    autoComplete="name"
                                    placeholder={namePlaceholder}
                                    value={name}
                                    onChange={(e) => {
                                        setName(e.target.value)
                                        setErrors((p) => ({ ...p, name: "" }))
                                    }}
                                    onFocus={() => setFocused("name")}
                                    onBlur={() => setFocused(null)}
                                    style={{
                                        ...inputCss("name"),
                                        marginBottom: errors.name ? 4 : 0,
                                    }}
                                />
                                {errors.name && (
                                    <p
                                        style={{
                                            fontSize: 11.5,
                                            color: "#dc2626",
                                            margin: "4px 0 0",
                                            lineHeight: 1.4,
                                        }}
                                    >
                                        {errors.name}
                                    </p>
                                )}
                            </div>
                        )}

                        <div style={{ marginBottom: 14 }}>
                            <label
                                style={{
                                    display: "block",
                                    fontSize: 13.5,
                                    fontWeight: 600,
                                    color: "#111",
                                    marginBottom: 6,
                                }}
                            >
                                Email address
                            </label>
                            <input
                                className="ac-input"
                                type="email"
                                autoComplete="email"
                                placeholder={emailPlaceholder}
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value)
                                    setErrors((p) => ({ ...p, email: "" }))
                                }}
                                onFocus={() => setFocused("email")}
                                onBlur={() => setFocused(null)}
                                style={{
                                    ...inputCss("email"),
                                    marginBottom: errors.email ? 4 : 0,
                                }}
                            />
                            {errors.email && (
                                <p
                                    style={{
                                        fontSize: 11.5,
                                        color: "#dc2626",
                                        margin: "4px 0 0",
                                        lineHeight: 1.4,
                                    }}
                                >
                                    {errors.email}
                                </p>
                            )}
                        </div>

                        <div style={{ marginBottom: 18 }}>
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    marginBottom: 6,
                                }}
                            >
                                <label
                                    style={{
                                        fontSize: 13.5,
                                        fontWeight: 600,
                                        color: "#111",
                                    }}
                                >
                                    Password
                                </label>
                                {isLogin && (
                                    <span
                                        className="ac-link"
                                        style={{
                                            fontSize: 12,
                                            color: "#888",
                                            textDecoration: "underline",
                                            cursor: "pointer",
                                        }}
                                    >
                                        Forgot password?
                                    </span>
                                )}
                            </div>
                            <div style={{ position: "relative" }}>
                                <input
                                    className="ac-input"
                                    type={showPw ? "text" : "password"}
                                    autoComplete={
                                        isLogin
                                            ? "current-password"
                                            : "new-password"
                                    }
                                    placeholder={passwordPlaceholder}
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value)
                                        setErrors((p) => ({
                                            ...p,
                                            password: "",
                                        }))
                                    }}
                                    onFocus={() => setFocused("password")}
                                    onBlur={() => setFocused(null)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") submit()
                                    }}
                                    style={{
                                        ...inputCss("password"),
                                        paddingRight: 42,
                                        marginBottom: errors.password ? 4 : 0,
                                    }}
                                />
                                <button
                                    onClick={() => setShowPw((v) => !v)}
                                    style={{
                                        position: "absolute",
                                        right: 12,
                                        top: "50%",
                                        transform: "translateY(-50%)",
                                        background: "none",
                                        border: "none",
                                        cursor: "pointer",
                                        padding: 0,
                                        display: "flex",
                                        lineHeight: 0,
                                    }}
                                >
                                    <IconEye show={showPw} />
                                </button>
                            </div>
                            {errors.password && (
                                <p
                                    style={{
                                        fontSize: 11.5,
                                        color: "#dc2626",
                                        margin: "4px 0 0",
                                        lineHeight: 1.4,
                                    }}
                                >
                                    {errors.password}
                                </p>
                            )}
                            {!isLogin && !errors.password && (
                                <p
                                    style={{
                                        fontSize: 11.5,
                                        color: "#bbb",
                                        margin: "5px 0 0",
                                        lineHeight: 1.5,
                                    }}
                                >
                                    Minimum 8 characters.
                                </p>
                            )}
                        </div>

                        {errors.form && !done && (
                            <p
                                style={{
                                    fontSize: 11.5,
                                    color: "#dc2626",
                                    margin: "0 0 12px",
                                    lineHeight: 1.4,
                                }}
                            >
                                {errors.form}
                            </p>
                        )}

                        {done ? (
                            <div
                                className="ac-ok"
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    background: "#f0fdf4",
                                    border: "1px solid #bbf7d0",
                                    borderRadius: R,
                                    padding: "11px 14px",
                                }}
                            >
                                <IconCheck />
                                <span
                                    style={{
                                        fontSize: 13,
                                        color: "#166534",
                                        fontWeight: 500,
                                        lineHeight: 1.45,
                                    }}
                                >
                                    {isLogin
                                        ? successTextLogin
                                        : successTextRegister}
                                </span>
                            </div>
                        ) : (
                            <button
                                className="ac-btn"
                                onClick={submit}
                                disabled={loading}
                                style={primaryBtn}
                            >
                                {loading ? (
                                    <span
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 6,
                                        }}
                                    >
                                        <span
                                            className="ac-spin"
                                            style={{
                                                width: 12,
                                                height: 12,
                                                border: "1.8px solid rgba(255,255,255,0.25)",
                                                borderTopColor: "#fff",
                                                borderRadius: "50%",
                                                display: "inline-block",
                                            }}
                                        />
                                        {isLogin
                                            ? "Signing in…"
                                            : "Creating account…"}
                                    </span>
                                ) : (
                                    <span
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 6,
                                        }}
                                    >
                                        {isLogin
                                            ? passwordButtonLogin
                                            : passwordButtonRegister}
                                        <IconArrow color="#fff" />
                                    </span>
                                )}
                            </button>
                        )}
                    </div>
                )}

                {/* Footer */}
                <div
                    style={{
                        marginTop: 18,
                        textAlign: "center",
                        fontSize: 11.5,
                        color: "#c0c0bc",
                        lineHeight: 1.6,
                    }}
                >
                    <span>By continuing you agree to our </span>
                    <span
                        className="ac-link"
                        onClick={() => openUrl(termsUrl)}
                        style={{
                            color: "#999",
                            textDecoration: "underline",
                            cursor: termsUrl ? "pointer" : "default",
                        }}
                    >
                        {termsLabel}
                    </span>
                    <span> & </span>
                    <span
                        className="ac-link"
                        onClick={() => openUrl(privacyUrl)}
                        style={{
                            color: "#999",
                            textDecoration: "underline",
                            cursor: privacyUrl ? "pointer" : "default",
                        }}
                    >
                        {privacyLabel}
                    </span>
                </div>
            </div>
        </div>
    )
}

// ── Property Controls ────────────────────────────────────────────────────────

addPropertyControls(AuthCard, {
    authProvider: {
        type: ControlType.Enum,
        title: "Auth Provider",
        options: ["supabase", "firebase", "webhook", "none"],
        optionTitles: ["Supabase", "Firebase", "Custom Webhook", "UI Only"],
        defaultValue: "none",
        description: "Choose your authentication backend.",
    },
    supabaseUrl: {
        type: ControlType.String,
        title: "Supabase URL",
        defaultValue: "",
        placeholder: "https://abc.supabase.co",
        description: "Your Supabase project URL.",
        hidden: (p: any) => p.authProvider !== "supabase",
    },
    supabaseAnonKey: {
        type: ControlType.String,
        title: "Supabase Anon Key",
        defaultValue: "",
        placeholder: "eyJhbGci…",
        description: "Your Supabase anon (public) API key.",
        hidden: (p: any) => p.authProvider !== "supabase",
    },
    firebaseApiKey: {
        type: ControlType.String,
        title: "Firebase API Key",
        defaultValue: "",
        placeholder: "AIzaSy…",
        description: "Your Firebase Web API key.",
        hidden: (p: any) => p.authProvider !== "firebase",
    },
    webhookUrl: {
        type: ControlType.String,
        title: "Webhook URL",
        defaultValue: "",
        placeholder: "https://api.example.com/auth",
        description:
            "POST endpoint. Receives { email, password, action, name }.",
        hidden: (p: any) => p.authProvider !== "webhook",
    },
    redirectUrl: {
        type: ControlType.String,
        title: "Redirect URL",
        defaultValue: "",
        placeholder: "https://yoursite.com/dashboard",
        description: "Where to redirect after authentication.",
        hidden: (p: any) => p.authProvider === "none",
    },
    defaultMode: {
        type: ControlType.Enum,
        title: "Default Mode",
        options: ["login", "register"],
        optionTitles: ["Login", "Register"],
        defaultValue: "login",
    },
    loginHeading: {
        type: ControlType.String,
        title: "Login Heading",
        defaultValue: "Welcome back",
    },
    loginSubheading: {
        type: ControlType.String,
        title: "Login Subheading",
        defaultValue: "Sign in to your account to continue.",
    },
    registerHeading: {
        type: ControlType.String,
        title: "Register Heading",
        defaultValue: "Create an account",
    },
    registerSubheading: {
        type: ControlType.String,
        title: "Register Subheading",
        defaultValue: "Get started — it only takes a few seconds.",
    },
    magicButtonLogin: {
        type: ControlType.String,
        title: "Magic Btn · Login",
        defaultValue: "Send magic link",
    },
    magicButtonRegister: {
        type: ControlType.String,
        title: "Magic Btn · Register",
        defaultValue: "Create account",
    },
    passwordButtonLogin: {
        type: ControlType.String,
        title: "PW Btn · Login",
        defaultValue: "Sign in",
    },
    passwordButtonRegister: {
        type: ControlType.String,
        title: "PW Btn · Register",
        defaultValue: "Create account",
    },
    googleButtonLogin: {
        type: ControlType.String,
        title: "Google Btn · Login",
        defaultValue: "Continue with Google",
    },
    googleButtonRegister: {
        type: ControlType.String,
        title: "Google Btn · Register",
        defaultValue: "Sign up with Google",
    },
    successTextLogin: {
        type: ControlType.String,
        title: "Success · Login",
        defaultValue: "Check your inbox. Magic link expires in 10 min.",
    },
    successTextRegister: {
        type: ControlType.String,
        title: "Success · Register",
        defaultValue: "Almost there! Check your inbox to verify your email.",
    },
    emailPlaceholder: {
        type: ControlType.String,
        title: "Email Placeholder",
        defaultValue: "your@email.com",
    },
    passwordPlaceholder: {
        type: ControlType.String,
        title: "PW Placeholder",
        defaultValue: "Password",
    },
    namePlaceholder: {
        type: ControlType.String,
        title: "Name Placeholder",
        defaultValue: "Full name",
    },
    showMagic: {
        type: ControlType.Boolean,
        title: "Magic Link",
        defaultValue: true,
    },
    showGoogle: {
        type: ControlType.Boolean,
        title: "Google",
        defaultValue: true,
    },
    showPassword: {
        type: ControlType.Boolean,
        title: "Password",
        defaultValue: true,
    },
    showName: {
        type: ControlType.Boolean,
        title: "Name Field",
        defaultValue: true,
        hidden: (p: any) => !p.showPassword,
    },
    showSubheading: {
        type: ControlType.Boolean,
        title: "Subheading",
        defaultValue: true,
    },
    termsLabel: {
        type: ControlType.String,
        title: "Terms Label",
        defaultValue: "Terms",
    },
    termsUrl: {
        type: ControlType.String,
        title: "Terms URL",
        defaultValue: "",
    },
    privacyLabel: {
        type: ControlType.String,
        title: "Privacy Label",
        defaultValue: "Privacy",
    },
    privacyUrl: {
        type: ControlType.String,
        title: "Privacy URL",
        defaultValue: "",
    },
    headingFont: { type: ControlType.Font, title: "Heading Font" },
    bodyFont: { type: ControlType.Font, title: "Body Font" },
    accentColor: {
        type: ControlType.Color,
        title: "Accent",
        defaultValue: "#111111",
    },
    pageBg: {
        type: ControlType.Color,
        title: "Page Bg",
        defaultValue: "#f5f5f3",
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 12,
        min: 0,
        max: 28,
        step: 2,
    },
})
