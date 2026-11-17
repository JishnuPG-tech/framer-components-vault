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
 * OrbitKey Login — a progressive, state-reactive sign-in UI prototype.
 * UI only: connect your authentication provider before collecting real credentials.
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 1180
 * @framerIntrinsicHeight 700
 */
export default function OrbitKey(props) {
    const {
        brand = "NORTHSTAR",
        visualEyebrow = "MEMBER ACCESS / 01",
        visualHeading = "Your work,\nin orbit.",
        visualText = "A quieter way back into your space. One clear step at a time.",
        formHeading = "Welcome back.",
        formSubtitle = "Enter your email to continue to your workspace.",
        continueText = "Continue with email",
        signInText = "Sign in",
        accent = "#9D8BFF",
        background = "#080A13",
        panelBackground = "#101321",
        textColor = "#F2F1FA",
        mutedColor = "#A0A3B7",
        height = 700,
        cornerRadius = 28,
        style,
    } = props

    const [step, setStep] = React.useState("email")
    const [email, setEmail] = React.useState("")
    const [password, setPassword] = React.useState("")
    const [showPassword, setShowPassword] = React.useState(false)
    const [remember, setRemember] = React.useState(true)
    const [notice, setNotice] = React.useState("")
    const [error, setError] = React.useState("")
    const [focused, setFocused] = React.useState(false)
    const isStatic = useIsStaticRenderer()

    const rootStyle = Object.assign(
        { ...style, minHeight: height },
        {
            "--ok-accent": accent,
            "--ok-bg": background,
            "--ok-panel": panelBackground,
            "--ok-text": textColor,
            "--ok-muted": mutedColor,
            "--ok-height": height + "px",
            "--ok-radius": cornerRadius + "px",
        }
    ) as React.CSSProperties

    const continueWithEmail = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        const normalized = email.trim()
        const at = normalized.indexOf("@")
        const dot = normalized.lastIndexOf(".")
        if (at < 1 || dot < at + 2 || dot >= normalized.length - 1) {
            setError("Enter a valid email address to continue.")
            setNotice("")
            return
        }
        setEmail(normalized)
        setError("")
        setNotice("")
        setStep("password")
    }

    const finishDemo = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (!password.trim()) {
            setError("Enter a password to preview the next state.")
            setNotice("")
            return
        }
        setError("")
        setNotice("")
        setStep("success")
    }

    const resetDemo = () => {
        setPassword("")
        setError("")
        setNotice("")
        setStep("email")
    }

    const showResetNote = () => {
        setNotice("Connect this link to your password-reset flow.")
        setError("")
    }

    const staticFlag = isStatic ? "true" : "false"

    return (
        <div
            className="ok-root"
            style={rootStyle}
            data-static={staticFlag}
            data-step={step}
            data-focused={focused ? "true" : "false"}
            aria-label="OrbitKey sign-in component"
        >
            <style>{styles}</style>
            <main className="ok-shell">
                <section
                    className="ok-visual"
                    aria-label="OrbitKey visual identity"
                >
                    <div className="ok-visual-top">
                        <div className="ok-mark" aria-hidden="true">
                            <span />
                        </div>
                        <span className="ok-brand">{brand}</span>
                        <span className="ok-visual-code">
                            ACCESS SYSTEM <b>01</b>
                        </span>
                    </div>

                    <div className="ok-signal" aria-hidden="true">
                        <div className="ok-signal-haze" />
                        <div className="ok-ring ok-ring-a" />
                        <div className="ok-ring ok-ring-b" />
                        <div className="ok-ring ok-ring-c" />
                        <div className="ok-cross ok-cross-a" />
                        <div className="ok-cross ok-cross-b" />
                        <div className="ok-orbit-line" />
                        <div className="ok-satellite ok-satellite-a" />
                        <div className="ok-satellite ok-satellite-b" />
                        <div className="ok-core-wrap">
                            <div className="ok-core" />
                            <div className="ok-core-glint" />
                        </div>
                        <div className="ok-signal-readout">
                            <span className="ok-live-dot" />
                            {step === "success"
                                ? "ACCESS GRANTED"
                                : step === "password"
                                  ? "IDENTITY FOUND"
                                  : "SIGNAL READY"}
                        </div>
                    </div>

                    <div className="ok-visual-copy">
                        <p className="ok-eyebrow">
                            <span />
                            {visualEyebrow}
                        </p>
                        <h2>{visualHeading}</h2>
                        <p className="ok-visual-text">{visualText}</p>
                    </div>

                    <div className="ok-visual-footer">
                        <span>PRIVATE BY DESIGN</span>
                        <span>
                            37° 46′ N <i /> 122° 25′ W
                        </span>
                    </div>
                    <svg
                        className="ok-contour"
                        viewBox="0 0 700 700"
                        preserveAspectRatio="none"
                        aria-hidden="true"
                    >
                        <path d="M702 80C520 24 430 100 486 202S665 334 508 390 370 531 512 616 666 671 702 698" />
                        <path d="M702 108C546 56 457 126 507 218S646 333 493 402 403 526 536 592 676 645 702 672" />
                        <path d="M702 136C572 88 484 152 527 234S625 334 480 414 435 520 560 568 686 620 702 645" />
                        <path d="M702 164C596 120 511 178 547 250S605 335 467 426 468 514 584 544 696 594 702 618" />
                    </svg>
                    <div className="ok-visual-grain" />
                </section>

                <section className="ok-form-panel" aria-label="Sign-in form">
                    <div className="ok-form-top">
                        <span className="ok-mobile-brand">
                            <span className="ok-mobile-mark">N</span>
                            {brand}
                        </span>
                        <span className="ok-secure">
                            <span className="ok-secure-dot" />
                            UI PREVIEW
                        </span>
                    </div>

                    {step === "success" ? (
                        <div className="ok-success" aria-live="polite">
                            <div className="ok-success-icon">
                                <svg viewBox="0 0 24 24" aria-hidden="true">
                                    <path d="m5 12.5 4.5 4.2L19 7.5" />
                                </svg>
                            </div>
                            <p className="ok-kicker">DEMO COMPLETE</p>
                            <h1>You’re in.</h1>
                            <p className="ok-description">
                                This is a front-end preview. Connect your
                                authentication provider to enable real sign-in.
                            </p>
                            <button
                                className="ok-button ok-button-secondary"
                                type="button"
                                onClick={resetDemo}
                            >
                                Back to sign in{" "}
                                <span aria-hidden="true">↗</span>
                            </button>
                        </div>
                    ) : (
                        <div className="ok-form-content">
                            <div
                                className="ok-progress"
                                aria-label={
                                    step === "email"
                                        ? "Step 1 of 2"
                                        : "Step 2 of 2"
                                }
                            >
                                <span data-active="true">
                                    <b>01</b> Identity
                                </span>
                                <i />
                                <span
                                    data-active={
                                        step === "password" ? "true" : "false"
                                    }
                                >
                                    <b>02</b> Password
                                </span>
                            </div>

                            <p className="ok-kicker">
                                {step === "email"
                                    ? "YOUR SPACE AWAITS"
                                    : "IDENTITY CONFIRMED"}
                            </p>
                            <h1>{formHeading}</h1>
                            <p className="ok-description">
                                {step === "email"
                                    ? formSubtitle
                                    : "Enter your password to continue."}
                            </p>

                            {step === "email" ? (
                                <form
                                    className="ok-form"
                                    onSubmit={continueWithEmail}
                                    noValidate
                                >
                                    <label className="ok-field-label">
                                        Email address
                                        <span className="ok-input-wrap">
                                            <svg
                                                viewBox="0 0 20 20"
                                                aria-hidden="true"
                                            >
                                                <rect
                                                    x="2.5"
                                                    y="4.2"
                                                    width="15"
                                                    height="11.6"
                                                    rx="2"
                                                />
                                                <path d="m3.4 5.2 6.6 5.2 6.6-5.2" />
                                            </svg>
                                            <input
                                                type="email"
                                                value={email}
                                                placeholder="you@company.com"
                                                autoComplete="email"
                                                onChange={(event) => {
                                                    setEmail(event.target.value)
                                                    setError("")
                                                    setNotice("")
                                                }}
                                                onFocus={() => setFocused(true)}
                                                onBlur={() => setFocused(false)}
                                                aria-label="Email address"
                                            />
                                        </span>
                                    </label>
                                    {error && (
                                        <p
                                            className="ok-message ok-error"
                                            role="alert"
                                        >
                                            {error}
                                        </p>
                                    )}
                                    {notice && (
                                        <p className="ok-message" role="status">
                                            {notice}
                                        </p>
                                    )}
                                    <button className="ok-button" type="submit">
                                        {continueText}
                                        <span aria-hidden="true">↗</span>
                                    </button>
                                </form>
                            ) : (
                                <form
                                    className="ok-form"
                                    onSubmit={finishDemo}
                                    noValidate
                                >
                                    <div className="ok-email-chip">
                                        <span className="ok-email-avatar">
                                            {email.slice(0, 1).toUpperCase()}
                                        </span>
                                        <span className="ok-email-value">
                                            {email}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setStep("email")
                                                setError("")
                                                setNotice("")
                                            }}
                                            aria-label="Change email address"
                                        >
                                            Edit
                                        </button>
                                    </div>
                                    <label className="ok-field-label">
                                        Password
                                        <span className="ok-input-wrap">
                                            <svg
                                                viewBox="0 0 20 20"
                                                aria-hidden="true"
                                            >
                                                <rect
                                                    x="3.3"
                                                    y="8.4"
                                                    width="13.4"
                                                    height="9"
                                                    rx="2"
                                                />
                                                <path d="M6.2 8.4V6.1a3.8 3.8 0 0 1 7.6 0v2.3" />
                                            </svg>
                                            <input
                                                type={
                                                    showPassword
                                                        ? "text"
                                                        : "password"
                                                }
                                                value={password}
                                                placeholder="Enter your password"
                                                autoComplete="current-password"
                                                onChange={(event) => {
                                                    setPassword(
                                                        event.target.value
                                                    )
                                                    setError("")
                                                    setNotice("")
                                                }}
                                                onFocus={() => setFocused(true)}
                                                onBlur={() => setFocused(false)}
                                                aria-label="Password"
                                            />
                                            <button
                                                className="ok-reveal"
                                                type="button"
                                                onClick={() =>
                                                    setShowPassword(
                                                        !showPassword
                                                    )
                                                }
                                                aria-label={
                                                    showPassword
                                                        ? "Hide password"
                                                        : "Show password"
                                                }
                                            >
                                                {showPassword ? "HIDE" : "SHOW"}
                                            </button>
                                        </span>
                                    </label>
                                    <div className="ok-options">
                                        <label className="ok-remember">
                                            <input
                                                type="checkbox"
                                                checked={remember}
                                                onChange={(event) =>
                                                    setRemember(
                                                        event.target.checked
                                                    )
                                                }
                                            />
                                            <span className="ok-check" />
                                            Remember me
                                        </label>
                                        <button
                                            className="ok-text-button"
                                            type="button"
                                            onClick={showResetNote}
                                        >
                                            Forgot password?
                                        </button>
                                    </div>
                                    {error && (
                                        <p
                                            className="ok-message ok-error"
                                            role="alert"
                                        >
                                            {error}
                                        </p>
                                    )}
                                    {notice && (
                                        <p className="ok-message" role="status">
                                            {notice}
                                        </p>
                                    )}
                                    <button className="ok-button" type="submit">
                                        {signInText}
                                        <span aria-hidden="true">↗</span>
                                    </button>
                                </form>
                            )}

                            <div className="ok-divider">
                                <span /> <span>or continue with</span> <span />
                            </div>
                            <button
                                className="ok-passkey"
                                type="button"
                                onClick={() => {
                                    setNotice(
                                        "Connect a passkey provider to enable this option."
                                    )
                                    setError("")
                                }}
                            >
                                <svg viewBox="0 0 20 20" aria-hidden="true">
                                    <circle cx="7.2" cy="10" r="4.1" />
                                    <path d="M11.2 10h6.2m-2.5 0v2.2m-2.1-2.2v1.3" />
                                </svg>
                                Continue with passkey
                                <span className="ok-passkey-tag">OPTIONAL</span>
                            </button>

                            <p className="ok-legal">
                                By continuing, you agree to the{" "}
                                <a
                                    href="#"
                                    onClick={(event) => event.preventDefault()}
                                >
                                    Terms
                                </a>{" "}
                                and{" "}
                                <a
                                    href="#"
                                    onClick={(event) => event.preventDefault()}
                                >
                                    Privacy Policy
                                </a>
                                .
                            </p>
                        </div>
                    )}

                    <div className="ok-panel-footer">
                        <span>
                            ORBITKEY <b>v1.0</b>
                        </span>
                        <span>
                            <i /> DEMO — NO CREDENTIALS SENT
                        </span>
                    </div>
                </section>
            </main>
        </div>
    )
}

const styles = `
  .ok-root{--ok-accent:#9D8BFF;--ok-bg:#080A13;--ok-panel:#101321;--ok-text:#F2F1FA;--ok-muted:#A0A3B7;width:100%;min-height:var(--ok-height,700px);color:var(--ok-text);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
  .ok-root *{box-sizing:border-box}
  .ok-shell{position:relative;isolation:isolate;display:grid;grid-template-columns:minmax(0,1.04fr) minmax(390px,.96fr);width:100%;min-height:var(--ok-height,700px);height:100%;overflow:hidden;border:1px solid #ffffff13;border-radius:var(--ok-radius,28px);background:var(--ok-bg);box-shadow:0 35px 110px #02030a70}
  .ok-visual{position:relative;isolation:isolate;overflow:hidden;min-height:var(--ok-height,700px);padding:42px 46px;background:radial-gradient(ellipse at 67% 43%,#6c5bc530,transparent 34%),radial-gradient(ellipse at 18% 96%,#29305c70,transparent 47%),linear-gradient(135deg,#111629 0%,#0d1020 54%,#0c0e18 100%)}
  .ok-visual:after{content:"";position:absolute;inset:0;z-index:-1;opacity:.28;background-image:linear-gradient(#ffffff08 1px,transparent 1px),linear-gradient(90deg,#ffffff08 1px,transparent 1px);background-size:48px 48px;mask-image:linear-gradient(110deg,#000,transparent 85%)}
  .ok-visual-top{position:relative;z-index:5;display:flex;align-items:center;gap:11px}
  .ok-mark{position:relative;width:27px;height:27px;display:grid;place-items:center;border:1px solid color-mix(in srgb,var(--ok-accent) 60%,transparent);border-radius:9px;transform:rotate(45deg);box-shadow:0 0 25px color-mix(in srgb,var(--ok-accent) 16%,transparent)}
  .ok-mark:before{content:"";width:7px;height:7px;border-radius:2px;background:var(--ok-accent);box-shadow:0 0 12px var(--ok-accent)}
  .ok-mark span{position:absolute;width:14px;height:14px;border:1px solid #ffffff55;border-radius:50%}
  .ok-brand{font-size:10px;font-weight:760;letter-spacing:.19em}
  .ok-visual-code{margin-left:auto;color:#9195ad;font-size:8px;letter-spacing:.15em}.ok-visual-code b{margin-left:8px;color:var(--ok-accent);font-weight:600}
  .ok-signal{position:absolute;z-index:1;right:-3%;top:13%;width:min(66%,520px);aspect-ratio:1;display:grid;place-items:center;perspective:950px;transform-style:preserve-3d}
  .ok-signal-haze{position:absolute;inset:19%;border-radius:50%;background:radial-gradient(circle,#9d8bff30,transparent 68%);filter:blur(16px)}
  .ok-ring{position:absolute;border:1px solid #a99cff38;border-radius:50%;will-change:transform}
  .ok-ring-a{inset:10%;transform:rotateX(63deg) rotateZ(-28deg)}
  .ok-ring-b{inset:19%;transform:rotateX(63deg) rotateZ(33deg);border-color:#ffffff24}
  .ok-ring-c{inset:27%;transform:rotateX(63deg) rotateZ(-60deg);border-color:color-mix(in srgb,var(--ok-accent) 62%,transparent)}
  .ok-cross{position:absolute;left:50%;top:50%;background:#c5bdff36;transform:translate(-50%,-50%)}
  .ok-cross-a{width:76%;height:1px}.ok-cross-b{height:76%;width:1px}
  .ok-orbit-line{position:absolute;width:86%;height:34%;border:1px solid #c7bfff66;border-radius:50%;transform:rotate(-28deg);box-shadow:0 0 19px #8e7bff14}
  .ok-satellite{position:absolute;width:8px;height:8px;border-radius:50%;background:#e6e1ff;box-shadow:0 0 12px #a99cff}
  .ok-satellite-a{top:18%;right:23%}.ok-satellite-b{left:19%;bottom:29%;width:5px;height:5px;background:var(--ok-accent)}
  .ok-core-wrap{position:relative;width:27%;aspect-ratio:1;display:grid;place-items:center}
  .ok-core{position:absolute;inset:19%;border:1px solid #e5ddffb0;border-radius:32%;transform:rotate(45deg);background:radial-gradient(circle at 32% 27%,#eeeaff 0%,var(--ok-accent) 22%,#555093 62%,#282843 100%);box-shadow:0 0 22px color-mix(in srgb,var(--ok-accent) 70%,transparent),0 0 74px color-mix(in srgb,var(--ok-accent) 30%,transparent);transition:transform .65s cubic-bezier(.2,.8,.2,1),box-shadow .65s}
  .ok-core-glint{position:absolute;width:13%;aspect-ratio:1;border-radius:50%;background:#fff;box-shadow:0 0 16px #fff,0 0 40px var(--ok-accent)}
  .ok-root[data-step="password"] .ok-core{transform:rotate(90deg) scale(1.14);box-shadow:0 0 31px color-mix(in srgb,var(--ok-accent) 84%,transparent),0 0 104px color-mix(in srgb,var(--ok-accent) 43%,transparent)}
  .ok-root[data-step="success"] .ok-core{transform:rotate(135deg) scale(1.22);background:radial-gradient(circle at 35% 28%,#fff 0%,#b9ffd5 19%,#5cdb9b 55%,#1f654e 100%);box-shadow:0 0 38px #72efae,0 0 120px #49d48d70}
  .ok-root[data-step="password"] .ok-ring-a{transform:rotateX(63deg) rotateZ(22deg)}
  .ok-root[data-step="success"] .ok-ring-a{transform:rotateX(63deg) rotateZ(76deg);border-color:#72efae70}
  .ok-root[data-step="success"] .ok-ring-c{border-color:#72efaeaa}
  .ok-signal-readout{position:absolute;left:50%;bottom:9%;display:flex;align-items:center;gap:7px;transform:translateX(-50%);white-space:nowrap;color:#c0bed4;font-size:8px;letter-spacing:.16em}
  .ok-live-dot{width:5px;height:5px;border-radius:50%;background:var(--ok-accent);box-shadow:0 0 11px var(--ok-accent)}
  .ok-root[data-step="success"] .ok-live-dot{background:#72efae;box-shadow:0 0 12px #72efae}
  .ok-visual-copy{position:absolute;z-index:4;left:46px;bottom:82px;max-width:410px}
  .ok-eyebrow{display:flex;align-items:center;gap:9px;margin:0 0 16px;color:var(--ok-accent);font-size:9px;font-weight:700;letter-spacing:.17em}
  .ok-eyebrow span{width:20px;height:1px;background:currentColor}
  .ok-visual-copy h2{margin:0;color:#f2f1fa;font-size:clamp(42px,5.3vw,74px);font-weight:560;line-height:.97;letter-spacing:-.075em;white-space:pre-line}
  .ok-visual-text{max-width:310px;margin:18px 0 0;color:#a6a9be;font-size:12px;line-height:1.7}
  .ok-visual-footer{position:absolute;z-index:4;left:46px;right:46px;bottom:27px;display:flex;justify-content:space-between;gap:12px;color:#737990;font-size:7px;letter-spacing:.15em}
  .ok-visual-footer i{display:inline-block;width:3px;height:3px;margin:0 7px 2px;border-radius:50%;background:var(--ok-accent)}
  .ok-contour{position:absolute;z-index:0;right:-5%;bottom:-8%;width:76%;height:83%;opacity:.33;pointer-events:none}
  .ok-contour path{fill:none;stroke:#a99cff4d;stroke-width:1}
  .ok-visual-grain{position:absolute;z-index:2;inset:0;pointer-events:none;opacity:.22;background:radial-gradient(ellipse at center,transparent 45%,#03040b90 100%)}
  .ok-root[data-static="false"] .ok-signal-haze{animation:ok-breathe 6s ease-in-out infinite}
  .ok-root[data-static="false"] .ok-ring-a{animation:ok-drift-a 20s linear infinite}
  .ok-root[data-static="false"] .ok-ring-b{animation:ok-drift-b 27s linear infinite}
  .ok-root[data-static="false"] .ok-orbit-line{animation:ok-orbit 14s ease-in-out infinite alternate}
  @keyframes ok-breathe{0%,100%{opacity:.65;transform:scale(.92)}50%{opacity:1;transform:scale(1.08)}}
  @keyframes ok-drift-a{to{rotate:360deg}}
  @keyframes ok-drift-b{to{rotate:-360deg}}
  @keyframes ok-orbit{0%{transform:rotate(-28deg) scaleX(.94)}100%{transform:rotate(-17deg) scaleX(1.04)}}
  .ok-form-panel{position:relative;display:flex;flex-direction:column;justify-content:space-between;min-width:0;min-height:var(--ok-height,700px);padding:38px clamp(30px,5.1vw,70px) 26px;background:var(--ok-panel)}
  .ok-form-top{display:flex;align-items:center;justify-content:space-between;min-height:30px}
  .ok-mobile-brand{display:none;align-items:center;gap:8px;font-size:9px;font-weight:750;letter-spacing:.14em}
  .ok-mobile-mark{width:20px;height:20px;display:grid;place-items:center;border:1px solid color-mix(in srgb,var(--ok-accent) 65%,transparent);border-radius:6px;color:var(--ok-accent);font-size:9px}
  .ok-secure{display:flex;align-items:center;gap:7px;color:#83879d;font-size:8px;letter-spacing:.13em}
  .ok-secure-dot{width:5px;height:5px;border-radius:50%;background:#76dfa6;box-shadow:0 0 9px #76dfa6}
  .ok-form-content{width:100%;max-width:390px;margin:auto}
  .ok-progress{display:flex;align-items:center;gap:11px;margin:0 0 40px;color:#6f7389;font-size:9px;letter-spacing:.08em}
  .ok-progress span{display:flex;align-items:center;gap:7px;white-space:nowrap}
  .ok-progress b{color:#777c93;font-size:8px;font-weight:600}
  .ok-progress span[data-active="true"]{color:var(--ok-text)}
  .ok-progress span[data-active="true"] b{color:var(--ok-accent)}
  .ok-progress>i{height:1px;flex:1;max-width:44px;background:#34374b}
  .ok-kicker{margin:0 0 11px;color:var(--ok-accent);font-size:8px;font-weight:700;letter-spacing:.19em}
  .ok-form-content h1,.ok-success h1{margin:0;font-size:34px;font-weight:590;line-height:1.1;letter-spacing:-.055em}
  .ok-description{margin:11px 0 27px;color:var(--ok-muted);font-size:12px;line-height:1.6}
  .ok-form{display:flex;flex-direction:column;gap:15px}
  .ok-field-label{display:flex;flex-direction:column;gap:8px;color:#d8d8e6;font-size:10px;font-weight:600}
  .ok-input-wrap{position:relative;display:flex;align-items:center;min-height:49px;border:1px solid #36394e;border-radius:11px;background:#0a0c16;transition:border-color .2s,box-shadow .2s}
  .ok-input-wrap:focus-within{border-color:color-mix(in srgb,var(--ok-accent) 78%,#36394e);box-shadow:0 0 0 3px color-mix(in srgb,var(--ok-accent) 13%,transparent)}
  .ok-input-wrap>svg{width:16px;height:16px;margin-left:15px;flex:none;fill:none;stroke:#8e91a8;stroke-width:1.4;stroke-linecap:round;stroke-linejoin:round}
  .ok-input-wrap input{width:100%;min-width:0;height:47px;padding:0 12px;border:0;outline:0;background:transparent;color:var(--ok-text);font:400 12px Inter,ui-sans-serif,system-ui,sans-serif}
  .ok-input-wrap input::placeholder{color:#6e7288}
  .ok-reveal{margin-right:12px;padding:6px;border:0;background:none;color:#a7a0df;font-size:8px;font-weight:700;letter-spacing:.09em;cursor:pointer}
  .ok-email-chip{display:flex;align-items:center;gap:10px;min-height:43px;padding:6px 9px;border:1px solid #303348;border-radius:10px;background:#0c0e19}
  .ok-email-avatar{width:27px;height:27px;display:grid;place-items:center;border-radius:8px;background:#292641;color:#c5bbff;font-size:10px;font-weight:700}
  .ok-email-value{flex:1;min-width:0;overflow:hidden;color:#d6d5e5;font-size:10px;text-overflow:ellipsis;white-space:nowrap}
  .ok-email-chip button,.ok-text-button{padding:4px;border:0;background:transparent;color:#ada5ee;font-size:9px;cursor:pointer}
  .ok-options{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:-1px}
  .ok-remember{position:relative;display:flex;align-items:center;gap:8px;color:#a0a3b7;font-size:9px;cursor:pointer}
  .ok-remember input{position:absolute;width:1px;height:1px;opacity:0}
  .ok-check{width:14px;height:14px;display:grid;place-items:center;border:1px solid #55586d;border-radius:4px}
  .ok-remember input:checked+.ok-check{border-color:var(--ok-accent);background:var(--ok-accent)}
  .ok-remember input:checked+.ok-check:after{content:"";width:6px;height:3px;border-left:1.5px solid #101120;border-bottom:1.5px solid #101120;transform:rotate(-45deg) translateY(-1px)}
  .ok-message{margin:-3px 0 0;color:#c2baff;font-size:9px;line-height:1.45}
  .ok-error{color:#ff969e}
  .ok-button{display:flex;align-items:center;justify-content:space-between;gap:15px;width:100%;min-height:48px;padding:0 16px;border:1px solid color-mix(in srgb,var(--ok-accent) 60%,transparent);border-radius:11px;background:var(--ok-accent);color:#171326;font:700 11px Inter,ui-sans-serif,system-ui,sans-serif;cursor:pointer;box-shadow:0 8px 24px color-mix(in srgb,var(--ok-accent) 18%,transparent);transition:transform .2s,filter .2s,box-shadow .2s}
  .ok-button:hover{transform:translateY(-1px);filter:brightness(1.06);box-shadow:0 12px 30px color-mix(in srgb,var(--ok-accent) 26%,transparent)}
  .ok-button>span{font-size:15px}
  .ok-button-secondary{margin-top:22px;background:transparent;color:var(--ok-text);box-shadow:none}
  .ok-divider{display:flex;align-items:center;gap:12px;margin:23px 0 15px;color:#74788e;font-size:8px;white-space:nowrap}
  .ok-divider span:first-child,.ok-divider span:last-child{height:1px;flex:1;background:#2c2f42}
  .ok-passkey{display:flex;align-items:center;gap:9px;width:100%;min-height:43px;padding:0 13px;border:1px solid #33364b;border-radius:10px;background:transparent;color:#d4d3e2;font:500 10px Inter,ui-sans-serif,system-ui,sans-serif;cursor:pointer}
  .ok-passkey:hover{border-color:#696287;background:#ffffff04}
  .ok-passkey svg{width:17px;height:17px;fill:none;stroke:#b8b1e9;stroke-width:1.35;stroke-linecap:round;stroke-linejoin:round}
  .ok-passkey-tag{margin-left:auto;color:#777b91;font-size:7px;letter-spacing:.1em}
  .ok-legal{margin:17px 0 0;color:#70748a;font-size:8px;line-height:1.7}
  .ok-legal a{color:#b6afd9;text-decoration:none}
  .ok-panel-footer{display:flex;justify-content:space-between;gap:10px;padding-top:18px;border-top:1px solid #ffffff10;color:#70748a;font-size:7px;letter-spacing:.12em}
  .ok-panel-footer b{color:#a7a2c3;font-weight:600}
  .ok-panel-footer span:last-child{display:flex;align-items:center;gap:6px}
  .ok-panel-footer i{width:4px;height:4px;border-radius:50%;background:#76dfa6}
  .ok-success{width:100%;max-width:390px;margin:auto}
  .ok-success-icon{width:48px;height:48px;display:grid;place-items:center;margin-bottom:30px;border:1px solid #76dfa655;border-radius:15px;background:#76dfa614}
  .ok-success-icon svg{width:24px;height:24px;fill:none;stroke:#8df0bb;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}
  .ok-success .ok-description{max-width:310px}
  @media(max-width:900px){.ok-shell{grid-template-columns:minmax(0,.95fr) minmax(350px,1.05fr)}.ok-visual{padding:32px}.ok-visual-copy{left:32px;bottom:72px}.ok-visual-footer{left:32px;right:32px}.ok-form-panel{padding-right:35px;padding-left:35px}}
  @media(max-width:700px){.ok-root{min-height:max(var(--ok-height,700px),920px)}.ok-shell{grid-template-columns:1fr;min-height:max(var(--ok-height,700px),920px)}.ok-visual{min-height:345px;padding:25px 25px 28px}.ok-visual-top{gap:8px}.ok-visual-code{font-size:7px}.ok-signal{right:-2%;top:1%;width:56%;opacity:.86}.ok-visual-copy{left:25px;bottom:48px;max-width:57%}.ok-eyebrow{font-size:7px;margin-bottom:10px}.ok-visual-copy h2{font-size:37px}.ok-visual-text{margin-top:10px;font-size:10px}.ok-visual-footer{left:25px;right:25px;bottom:16px;font-size:6px}.ok-form-panel{min-height:570px;padding:24px 26px 20px}.ok-form-top{min-height:25px}.ok-mobile-brand{display:flex}.ok-secure{font-size:7px}.ok-progress{margin-bottom:28px}.ok-form-content h1,.ok-success h1{font-size:30px}}
  @media(max-width:390px){.ok-visual{min-height:318px}.ok-visual-copy h2{font-size:32px}.ok-form-panel{padding-right:20px;padding-left:20px}.ok-form-content h1,.ok-success h1{font-size:28px}.ok-options{gap:5px}.ok-remember,.ok-text-button{font-size:8px}}
  @media(prefers-reduced-motion:reduce){.ok-root *,.ok-root *:before,.ok-root *:after{animation-duration:.01ms!important;transition-duration:.01ms!important;scroll-behavior:auto!important}}
`

OrbitKey.defaultProps = {
    brand: "NORTHSTAR",
    visualEyebrow: "MEMBER ACCESS / 01",
    visualHeading: "Your work,\nin orbit.",
    visualText: "A quieter way back into your space. One clear step at a time.",
    formHeading: "Welcome back.",
    formSubtitle: "Enter your email to continue to your workspace.",
    continueText: "Continue with email",
    signInText: "Sign in",
    accent: "#9D8BFF",
    background: "#080A13",
    panelBackground: "#101321",
    textColor: "#F2F1FA",
    mutedColor: "#A0A3B7",
    height: 700,
    cornerRadius: 28,
}

addPropertyControls(OrbitKey, {
    brand: { type: ControlType.String, title: "Brand" },
    visualEyebrow: { type: ControlType.String, title: "Visual Label" },
    visualHeading: {
        type: ControlType.String,
        title: "Visual Heading",
        displayTextArea: true,
    },
    visualText: {
        type: ControlType.String,
        title: "Visual Text",
        displayTextArea: true,
    },
    formHeading: { type: ControlType.String, title: "Form Heading" },
    formSubtitle: {
        type: ControlType.String,
        title: "Form Text",
        displayTextArea: true,
    },
    continueText: { type: ControlType.String, title: "Continue Button" },
    signInText: { type: ControlType.String, title: "Sign-in Button" },
    accent: { type: ControlType.Color, title: "Accent" },
    background: { type: ControlType.Color, title: "Visual Background" },
    panelBackground: { type: ControlType.Color, title: "Form Panel" },
    textColor: { type: ControlType.Color, title: "Text" },
    mutedColor: { type: ControlType.Color, title: "Muted Text" },
    height: {
        type: ControlType.Number,
        title: "Height",
        min: 540,
        max: 960,
        step: 10,
        unit: "px",
    },
    cornerRadius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 44,
        step: 2,
        unit: "px",
    },
})
