import { useState, useEffect, useRef } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


export default function PremiumCountdown(props) {
    const {
        targetDate = "2026-03-15",
        targetTime = "20:00",
        eventTitle = "The Big Launch Event",
        eventDescription = "Join us!",
        eventLocation = "Online",
        calendarEventName = "The Big Launch Event",
        layout = "horizontal",
        gridColumns = 2,
        cardSize = 100,
        cardGap = 14,
        cardBorderRadius = 20,
        showDays = true,
        showHours = true,
        showMinutes = true,
        showSeconds = true,
        labelDays = "Days",
        labelHours = "Hours",
        labelMinutes = "Minutes",
        labelSeconds = "Seconds",
        showLabels = true,
        labelPosition = "bottom",
        showBackground = false,
        backgroundColor = "#0f0f23",
        backgroundGradient = false,
        gradientColor1 = "#1a1a2e",
        gradientColor2 = "#16213e",
        gradientColor3 = "#0f0f23",
        gradientAngle = 135,
        showOrbs = false,
        orb1Color = "rgba(99,102,241,0.15)",
        orb2Color = "rgba(236,72,153,0.12)",
        orb3Color = "rgba(34,211,238,0.1)",
        orbAnimationDuration = 8,
        cardBackground = "rgba(255,255,255,0.08)",
        cardBorderColor = "rgba(255,255,255,0.12)",
        cardBorderWidth = 1,
        cardBlur = true,
        cardBlurAmount = 20,
        cardShadow = true,
        cardShadowColor = "rgba(0,0,0,0.3)",
        cardShadowBlur = 32,
        cardShadowY = 8,
        showCardShine = false,
        cardShineOpacity = 0.12,
        numberColor = "#ffffff",
        numberFont = {
            fontFamily: "Inter, system-ui, sans-serif",
            fontSize: 44,
            fontWeight: 600,
            lineHeight: 1,
            letterSpacing: "-0.02em",
        },
        labelColor = "rgba(255,255,255,0.5)",
        labelFont = {
            fontFamily: "Inter, system-ui, sans-serif",
            fontSize: 12,
            fontWeight: 500,
            letterSpacing: "0.04em",
        },
        labelGap = 10,
        showProgressBar = true,
        progressBarHeight = 5,
        progressBarBorderRadius = 100,
        progressBarBackground = "rgba(255,255,255,0.1)",
        progressBarFillColor = "#6366f1",
        progressBarFillGradient = true,
        progressBarGradientStart = "#6366f1",
        progressBarGradientMiddle = "#8b5cf6",
        progressBarGradientEnd = "#ec4899",
        progressBarGlow = true,
        progressBarGlowColor = "rgba(99,102,241,0.5)",
        progressLabelText = "Progress",
        progressLabelColor = "rgba(255,255,255,0.4)",
        progressLabelFont = {
            fontFamily: "Inter, system-ui, sans-serif",
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: "0.08em",
        },
        progressValueColor = "rgba(255,255,255,0.7)",
        progressValueFont = {
            fontFamily: "Inter, system-ui, sans-serif",
            fontSize: 12,
            fontWeight: 600,
        },
        showProgressLabels = true,
        progressTotalDays = 365,
        gapCardsToProgress = 24,
        gapProgressToButtons = 28,
        gapButtonsToDate = 28,
        showMilestone = true,
        milestoneBgColor = "rgba(245,158,11,0.15)",
        milestoneBorderColor = "rgba(245,158,11,0.3)",
        milestoneTextColor = "#fbbf24",
        showButtons = true,
        showNotifyButton = true,
        showCalendarButton = true,
        showShareButton = true,
        buttonBackground = "rgba(255,255,255,0.1)",
        buttonHoverBackground = "rgba(255,255,255,0.2)",
        buttonBorderColor = "rgba(255,255,255,0.15)",
        buttonTextColor = "#ffffff",
        buttonBorderRadius = 12,
        buttonPaddingX = 24,
        buttonPaddingY = 12,
        buttonFont = {
            fontFamily: "Inter, system-ui, sans-serif",
            fontSize: 13,
            fontWeight: 500,
        },
        buttonBlur = true,
        subscribeButtonGradient = "linear-gradient(135deg,#6366f1,#8b5cf6)",
        subscribedBgColor = "rgba(34,197,94,0.2)",
        subscribedBorderColor = "rgba(34,197,94,0.4)",
        subscribedTextColor = "#22c55e",
        dropdownBackground = "rgba(20,20,35,0.98)",
        dropdownBorderColor = "rgba(255,255,255,0.15)",
        dropdownBorderRadius = 12,
        dropdownItemHoverBg = "rgba(255,255,255,0.1)",
        showShareTwitter = true,
        showShareFacebook = true,
        showShareLinkedIn = true,
        showShareWhatsApp = true,
        showShareCopyLink = true,
        showDateDisplay = true,
        dateDisplayColor = "rgba(255,255,255,0.4)",
        dateDisplayFont = {
            fontFamily: "Inter, system-ui, sans-serif",
            fontSize: 13,
            fontWeight: 400,
        },
        emailIntegrationMethod = "localStorage",
        mailchimpFormAction = "",
        mailchimpU = "",
        mailchimpId = "",
        googleSheetsUrl = "",
        webhookUrl = "",
        webhookAuthToken = "",
        enableAnimations = true,
    } = props

    const [time, setTime] = useState({
        days: 62,
        hours: 5,
        minutes: 9,
        seconds: 14,
    })
    const [email, setEmail] = useState("")
    const [showEmailInput, setShowEmailInput] = useState(false)
    const [isSubscribed, setIsSubscribed] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const [showCalendarMenu, setShowCalendarMenu] = useState(false)
    const [showShareMenu, setShowShareMenu] = useState(false)
    const [copySuccess, setCopySuccess] = useState(false)
    const [hovered, setHovered] = useState(null)
    const calendarRef = useRef(null),
        shareRef = useRef(null)
    const fullTargetDate = new Date(`${targetDate}T${targetTime}:00`)

    useEffect(() => {
        const h = (e) => {
            if (calendarRef.current && !calendarRef.current.contains(e.target))
                setShowCalendarMenu(false)
            if (shareRef.current && !shareRef.current.contains(e.target))
                setShowShareMenu(false)
        }
        document.addEventListener("mousedown", h)
        return () => document.removeEventListener("mousedown", h)
    }, [])
    useEffect(() => {
        const u = () => {
            const d = fullTargetDate.getTime() - Date.now()
            if (d > 0)
                setTime({
                    days: Math.floor(d / 86400000),
                    hours: Math.floor((d % 86400000) / 3600000),
                    minutes: Math.floor((d % 3600000) / 60000),
                    seconds: Math.floor((d % 60000) / 1000),
                })
        }
        u()
        const i = setInterval(u, 1000)
        return () => clearInterval(i)
    }, [targetDate, targetTime])

    const units = []
    if (showDays) units.push({ value: time.days, label: labelDays })
    if (showHours) units.push({ value: time.hours, label: labelHours })
    if (showMinutes) units.push({ value: time.minutes, label: labelMinutes })
    if (showSeconds) units.push({ value: time.seconds, label: labelSeconds })

    const getContentWidth = () => {
        if (layout === "grid") {
            const cols = Math.min(gridColumns, units.length)
            return cols * cardSize + (cols - 1) * cardGap
        }
        if (layout === "vertical") return cardSize
        return units.length * cardSize + (units.length - 1) * cardGap
    }
    const contentWidth = getContentWidth()

    const totalSec =
        time.days * 86400 + time.hours * 3600 + time.minutes * 60 + time.seconds
    const progress = Math.max(
        0,
        Math.min(
            100,
            ((progressTotalDays * 86400 - totalSec) /
                (progressTotalDays * 86400)) *
                100
        )
    )
    const getMilestone = () => {
        if (time.days === 0 && time.hours === 0 && time.minutes < 60)
            return "🔥 Final Hour!"
        if (time.days === 0 && time.hours < 24) return "⚡ Last 24 Hours!"
        if (time.days < 7) return "📅 Final Week!"
        if (time.days < 30) return "🗓️ Less than a month!"
        return null
    }
    const format = (n) => String(n).padStart(2, "0")
    const formatDate = () =>
        fullTargetDate.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
        })

    const handleNotify = async () => {
        if (!showEmailInput) {
            setShowEmailInput(true)
            return
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setError("Please enter a valid email")
            return
        }
        setIsLoading(true)
        setError("")
        try {
            if (emailIntegrationMethod === "mailchimp")
                await fetch(
                    `${mailchimpFormAction}?u=${mailchimpU}&id=${mailchimpId}&EMAIL=${encodeURIComponent(email)}`,
                    { method: "POST", mode: "no-cors" }
                )
            else if (emailIntegrationMethod === "googleSheets")
                await fetch(googleSheetsUrl, {
                    method: "POST",
                    mode: "no-cors",
                    body: JSON.stringify({ email }),
                })
            else if (emailIntegrationMethod === "webhook")
                await fetch(webhookUrl, {
                    method: "POST",
                    mode: "no-cors",
                    body: JSON.stringify({ email, event: eventTitle }),
                })
            else {
                const s = JSON.parse(
                    localStorage.getItem("countdown_subs") || "[]"
                )
                if (!s.includes(email))
                    localStorage.setItem(
                        "countdown_subs",
                        JSON.stringify([...s, email])
                    )
            }
            setIsSubscribed(true)
            setShowEmailInput(false)
            setEmail("")
        } catch {
            setIsSubscribed(true)
            setShowEmailInput(false)
        }
        setIsLoading(false)
    }

    const addGoogle = () => {
        const s = fullTargetDate.toISOString().replace(/-|:|\.\d+/g, ""),
            e = new Date(fullTargetDate.getTime() + 7200000)
                .toISOString()
                .replace(/-|:|\.\d+/g, "")
        window.open(
            `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(calendarEventName)}&dates=${s}/${e}&details=${encodeURIComponent(eventDescription)}&location=${encodeURIComponent(eventLocation)}`,
            "_blank"
        )
        setShowCalendarMenu(false)
    }
    const addApple = () => {
        const ics = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nDTSTART:${fullTargetDate.toISOString().replace(/-|:|\.\d+Z/g, "")}Z\nSUMMARY:${calendarEventName}\nDESCRIPTION:${eventDescription}\nLOCATION:${eventLocation}\nEND:VEVENT\nEND:VCALENDAR`
        const a = document.createElement("a")
        a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }))
        a.download = "event.ics"
        a.click()
        setShowCalendarMenu(false)
    }
    const addOutlook = () => {
        window.open(
            `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(calendarEventName)}&body=${encodeURIComponent(eventDescription)}&startdt=${fullTargetDate.toISOString()}&location=${encodeURIComponent(eventLocation)}`,
            "_blank"
        )
        setShowCalendarMenu(false)
    }

    const url = typeof window !== "undefined" ? window.location.href : "",
        txt = `${eventTitle} - ${time.days} days left!`
    const shareX = () => {
        window.open(
            `https://twitter.com/intent/tweet?text=${encodeURIComponent(txt)}&url=${encodeURIComponent(url)}`,
            "_blank"
        )
        setShowShareMenu(false)
    }
    const shareFB = () => {
        window.open(
            `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
            "_blank"
        )
        setShowShareMenu(false)
    }
    const shareLI = () => {
        window.open(
            `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
            "_blank"
        )
        setShowShareMenu(false)
    }
    const shareWA = () => {
        window.open(
            `https://wa.me/?text=${encodeURIComponent(txt + " " + url)}`,
            "_blank"
        )
        setShowShareMenu(false)
    }
    const copyL = () => {
        navigator.clipboard.writeText(url)
        setCopySuccess(true)
        setTimeout(() => setCopySuccess(false), 1500)
    }

    const milestone = getMilestone()
    const getProgressFill = () =>
        progressBarFillGradient
            ? `linear-gradient(90deg,${progressBarGradientStart} 0%,${progressBarGradientMiddle} 50%,${progressBarGradientEnd} 100%)`
            : progressBarFillColor
    const btnStyle = (id) => ({
        padding: `${buttonPaddingY}px ${buttonPaddingX}px`,
        background: hovered === id ? buttonHoverBackground : buttonBackground,
        backdropFilter: buttonBlur ? "blur(20px)" : "none",
        WebkitBackdropFilter: buttonBlur ? "blur(20px)" : "none",
        border: `1px solid ${buttonBorderColor}`,
        borderRadius: buttonBorderRadius,
        color: buttonTextColor,
        ...buttonFont,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 8,
        transition: "all 0.2s",
        transform: hovered === id ? "translateY(-2px)" : "none",
        boxShadow: hovered === id ? "0 4px 12px rgba(0,0,0,0.15)" : "none",
    })
    const ddStyle = (id) => ({
        display: "flex",
        alignItems: "center",
        gap: 12,
        width: "100%",
        padding: "12px 14px",
        background: hovered === id ? dropdownItemHoverBg : "transparent",
        border: "none",
        borderRadius: 8,
        color: "#fff",
        fontSize: 13,
        fontWeight: 500,
        cursor: "pointer",
        textAlign: "left",
        transition: "background 0.15s",
    })

    const getCardsLayout = () => {
        if (layout === "grid")
            return {
                display: "grid",
                gridTemplateColumns: `repeat(${gridColumns},${cardSize}px)`,
                gap: cardGap,
                justifyContent: "center",
            }
        if (layout === "vertical")
            return {
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: cardGap,
            }
        return { display: "flex", justifyContent: "center", gap: cardGap }
    }

    const Icons = {
        Google: () => (
            <svg width="18" height="18" viewBox="0 0 24 24">
                <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
            </svg>
        ),
        Apple: () => (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
            </svg>
        ),
        Outlook: () => (
            <svg width="18" height="18" viewBox="0 0 24 24">
                <path
                    fill="#0078D4"
                    d="M24 7.4v10.5c0 .2-.1.4-.2.6-.2.1-.4.2-.6.2h-8.5V11.7l1.6 1.2c.1.1.2.1.4.1.1 0 .3 0 .4-.1l6.8-5.2c.1-.1.2-.2.2-.2 0-.1.1-.2.1-.3 0-.1 0-.2-.1-.3-.1-.1-.2-.1-.3-.2H24v.7z"
                />
                <path fill="#0078D4" d="M7.5 5.5v13l-7-2v-9l7-2z" />
                <path
                    fill="#0078D4"
                    d="M14.6 6.1v12h-5.1c-.2 0-.4-.1-.6-.2-.1-.2-.2-.3-.2-.6V6.1h5.9z"
                />
            </svg>
        ),
        X: () => (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
        ),
        FB: () => (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2">
                <path d="M24 12c0-6.6-5.4-12-12-12S0 5.4 0 12c0 6 4.4 11 10.1 11.9v-8.4H7.1v-3.5h3V9.4c0-3 1.8-4.7 4.5-4.7 1.3 0 2.7.2 2.7.2v3h-1.5c-1.5 0-2 .9-2 1.9v2.2h3.3l-.5 3.5H13.9v8.4C19.6 23 24 18 24 12z" />
            </svg>
        ),
        LI: () => (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#0A66C2">
                <path d="M20.4 20.5h-3.6v-5.6c0-1.3 0-3-1.9-3s-2.1 1.4-2.1 2.9v5.7H9.4V9h3.4v1.6c.5-.9 1.6-1.9 3.4-1.9 3.6 0 4.3 2.4 4.3 5.5v6.3zM5.3 7.4c-1.1 0-2.1-.9-2.1-2.1 0-1.1.9-2 2.1-2s2.1.9 2.1 2c0 1.2-.9 2.1-2.1 2.1zm1.8 13.1H3.6V9h3.5v11.5zM22.2 0H1.8C.8 0 0 .8 0 1.7v20.6c0 .9.8 1.7 1.8 1.7h20.5c1 0 1.8-.8 1.8-1.7V1.7c0-.9-.8-1.7-1.8-1.7z" />
            </svg>
        ),
        WA: () => (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#25D366">
                <path d="M17.5 14.4c-.3-.1-1.8-.9-2-.1s-.5.2-.7.1c-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.2-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.2.2-.3.3-.5.1-.2.1-.4 0-.5-.1-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.6-.3m-5.4 7.4a9.9 9.9 0 01-5-1.4l-.4-.2-3.7 1 1-3.6-.2-.4a9.9 9.9 0 01-1.5-5.3c0-5.5 4.4-9.9 9.9-9.9 2.6 0 5.1 1 7 2.9a9.8 9.8 0 012.9 7c0 5.4-4.4 9.9-9.9 9.9m8.4-18.3A11.8 11.8 0 0012 0C5.5 0 .2 5.3.2 11.9c0 2.1.5 4.1 1.6 5.9L0 24l6.3-1.7a11.9 11.9 0 005.7 1.4c6.6 0 11.9-5.3 11.9-11.9 0-3.2-1.2-6.1-3.5-8.4z" />
            </svg>
        ),
        Link: () => (
            <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#fff"
                strokeWidth="2"
            >
                <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" />
                <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
            </svg>
        ),
        Check: () => (
            <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#22c55e"
                strokeWidth="2"
            >
                <polyline points="20 6 9 17 4 12" />
            </svg>
        ),
    }

    // Check if any share option is enabled
    const hasShareOptions =
        showShareTwitter ||
        showShareFacebook ||
        showShareLinkedIn ||
        showShareWhatsApp ||
        showShareCopyLink

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                background: showBackground
                    ? backgroundGradient
                        ? `linear-gradient(${gradientAngle}deg,${gradientColor1},${gradientColor2},${gradientColor3})`
                        : backgroundColor
                    : "transparent",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",

                position: "relative",
                overflow: "visible",
            }}
        >
            {showOrbs && enableAnimations && (
                <>
                    <div
                        style={{
                            position: "absolute",
                            top: "20%",
                            left: "10%",
                            width: 400,
                            height: 400,
                            background: `radial-gradient(circle,${orb1Color} 0%,transparent 70%)`,
                            borderRadius: "50%",
                            filter: "blur(60px)",
                            animation: `float ${orbAnimationDuration}s ease-in-out infinite`,
                            pointerEvents: "none",
                        }}
                    />
                    <div
                        style={{
                            position: "absolute",
                            bottom: "20%",
                            right: "10%",
                            width: 350,
                            height: 350,
                            background: `radial-gradient(circle,${orb2Color} 0%,transparent 70%)`,
                            borderRadius: "50%",
                            filter: "blur(50px)",
                            animation: `float ${orbAnimationDuration + 2}s ease-in-out infinite reverse`,
                            pointerEvents: "none",
                        }}
                    />
                    <div
                        style={{
                            position: "absolute",
                            top: "60%",
                            left: "50%",
                            width: 300,
                            height: 300,
                            background: `radial-gradient(circle,${orb3Color} 0%,transparent 70%)`,
                            borderRadius: "50%",
                            filter: "blur(40px)",
                            animation: `float ${orbAnimationDuration + 4}s ease-in-out infinite`,
                            pointerEvents: "none",
                        }}
                    />
                </>
            )}

            <div
                style={{
                    position: "relative",
                    zIndex: 1,
                    width: contentWidth,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                }}
            >
                {showMilestone && milestone && (
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "center",
                            marginBottom: 20,
                            width: "100%",
                        }}
                    >
                        <div
                            style={{
                                padding: "8px 20px",
                                background: milestoneBgColor,
                                backdropFilter: "blur(10px)",
                                borderRadius: 100,
                                border: `1px solid ${milestoneBorderColor}`,
                            }}
                        >
                            <span
                                style={{
                                    fontSize: 13,
                                    fontWeight: 600,
                                    color: milestoneTextColor,
                                }}
                            >
                                {milestone}
                            </span>
                        </div>
                    </div>
                )}

                <div
                    style={{
                        ...getCardsLayout(),
                        width: "100%",
                        marginBottom:
                            showProgressBar || showButtons
                                ? gapCardsToProgress
                                : 0,
                    }}
                >
                    {units.map((u) => (
                        <div
                            key={u.label}
                            style={{
                                display: "flex",
                                flexDirection:
                                    labelPosition === "top"
                                        ? "column-reverse"
                                        : "column",
                                alignItems: "center",
                                gap: labelGap,
                            }}
                        >
                            <div
                                style={{
                                    position: "relative",
                                    width: cardSize,
                                    height: cardSize,
                                }}
                            >
                                <div
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        background: cardBackground,
                                        backdropFilter: cardBlur
                                            ? `blur(${cardBlurAmount}px)`
                                            : "none",
                                        WebkitBackdropFilter: cardBlur
                                            ? `blur(${cardBlurAmount}px)`
                                            : "none",
                                        borderRadius: cardBorderRadius,
                                        border: `${cardBorderWidth}px solid ${cardBorderColor}`,
                                        boxShadow: cardShadow
                                            ? `0 ${cardShadowY}px ${cardShadowBlur}px ${cardShadowColor}`
                                            : "none",
                                    }}
                                />
                                <div
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        zIndex: 2,
                                    }}
                                >
                                    <span
                                        style={{
                                            color: numberColor,
                                            fontVariantNumeric: "tabular-nums",
                                            ...numberFont,
                                        }}
                                    >
                                        {format(u.value)}
                                    </span>
                                </div>
                                {showCardShine && (
                                    <div
                                        style={{
                                            position: "absolute",
                                            top: 0,
                                            left: 0,
                                            right: 0,
                                            height: "45%",
                                            background: `linear-gradient(180deg,rgba(255,255,255,${cardShineOpacity}) 0%,transparent 100%)`,
                                            borderRadius: `${cardBorderRadius}px ${cardBorderRadius}px 0 0`,
                                            pointerEvents: "none",
                                            zIndex: 3,
                                        }}
                                    />
                                )}
                            </div>
                            {showLabels && (
                                <span
                                    style={{
                                        color: labelColor,
                                        ...labelFont,
                                    }}
                                >
                                    {u.label}
                                </span>
                            )}
                        </div>
                    ))}
                </div>

                {showProgressBar && (
                    <div
                        style={{
                            width: "100%",
                            marginBottom: showButtons
                                ? gapProgressToButtons
                                : 0,
                        }}
                    >
                        {showProgressLabels && (
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    marginBottom: 8,
                                }}
                            >
                                <span
                                    style={{
                                        color: progressLabelColor,
                                        textTransform: "uppercase",
                                        ...progressLabelFont,
                                        letterSpacing: "0.1em",
                                    }}
                                >
                                    {progressLabelText}
                                </span>
                                <span
                                    style={{
                                        color: progressValueColor,
                                        ...progressValueFont,
                                    }}
                                >
                                    {progress.toFixed(1)}%
                                </span>
                            </div>
                        )}
                        <div
                            style={{
                                height: progressBarHeight,
                                background: progressBarBackground,
                                borderRadius: progressBarBorderRadius,
                                overflow: "hidden",
                                width: "100%",
                            }}
                        >
                            <div
                                style={{
                                    height: "100%",
                                    width: `${progress}%`,
                                    background: getProgressFill(),
                                    borderRadius: progressBarBorderRadius,
                                    boxShadow: progressBarGlow
                                        ? `0 0 20px ${progressBarGlowColor}`
                                        : "none",
                                    transition: "width 0.5s",
                                }}
                            />
                        </div>
                    </div>
                )}

                {showButtons && (
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "center",
                            gap: 12,
                            flexWrap: "wrap",
                            marginBottom: showDateDisplay
                                ? gapButtonsToDate
                                : 0,
                            width: "100%",
                        }}
                    >
                        {showNotifyButton && (
                            <div>
                                {isSubscribed ? (
                                    <div
                                        style={{
                                            ...btnStyle("sub"),
                                            background: subscribedBgColor,
                                            border: `1px solid ${subscribedBorderColor}`,
                                            color: subscribedTextColor,
                                        }}
                                    >
                                        <Icons.Check /> Subscribed!
                                    </div>
                                ) : showEmailInput ? (
                                    <div
                                        style={{
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: 8,
                                        }}
                                    >
                                        <div
                                            style={{ display: "flex", gap: 8 }}
                                        >
                                            <input
                                                type="email"
                                                placeholder="Enter your email"
                                                value={email}
                                                onChange={(e) => {
                                                    setEmail(e.target.value)
                                                    setError("")
                                                }}
                                                onKeyPress={(e) =>
                                                    e.key === "Enter" &&
                                                    handleNotify()
                                                }
                                                style={{
                                                    padding: "12px 16px",
                                                    background:
                                                        buttonBackground,
                                                    backdropFilter: buttonBlur
                                                        ? "blur(20px)"
                                                        : "none",
                                                    border: `1px solid ${error ? "#ef4444" : buttonBorderColor}`,
                                                    borderRadius:
                                                        buttonBorderRadius,
                                                    color: "#fff",
                                                    fontSize: 13,
                                                    outline: "none",
                                                    width: 200,
                                                }}
                                            />
                                            <button
                                                onClick={handleNotify}
                                                onMouseEnter={() =>
                                                    setHovered("sub")
                                                }
                                                onMouseLeave={() =>
                                                    setHovered(null)
                                                }
                                                disabled={isLoading}
                                                style={{
                                                    ...btnStyle("sub"),
                                                    background:
                                                        subscribeButtonGradient,
                                                    border: "none",
                                                    opacity: isLoading
                                                        ? 0.7
                                                        : 1,
                                                }}
                                            >
                                                {isLoading
                                                    ? "..."
                                                    : "Subscribe"}
                                            </button>
                                        </div>
                                        {error && (
                                            <span
                                                style={{
                                                    fontSize: 12,
                                                    color: "#ef4444",
                                                }}
                                            >
                                                {error}
                                            </span>
                                        )}
                                    </div>
                                ) : (
                                    <button
                                        onClick={handleNotify}
                                        onMouseEnter={() =>
                                            setHovered("notify")
                                        }
                                        onMouseLeave={() => setHovered(null)}
                                        style={btnStyle("notify")}
                                    >
                                        <svg
                                            width="15"
                                            height="15"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                        >
                                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                                        </svg>
                                        Notify Me
                                    </button>
                                )}
                            </div>
                        )}

                        {showCalendarButton && (
                            <div
                                ref={calendarRef}
                                style={{ position: "relative" }}
                            >
                                <button
                                    onClick={() => {
                                        setShowCalendarMenu(!showCalendarMenu)
                                        setShowShareMenu(false)
                                    }}
                                    onMouseEnter={() => setHovered("cal")}
                                    onMouseLeave={() => setHovered(null)}
                                    style={btnStyle("cal")}
                                >
                                    <svg
                                        width="15"
                                        height="15"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                    >
                                        <rect
                                            x="3"
                                            y="4"
                                            width="18"
                                            height="18"
                                            rx="2"
                                        />
                                        <line x1="16" y1="2" x2="16" y2="6" />
                                        <line x1="8" y1="2" x2="8" y2="6" />
                                        <line x1="3" y1="10" x2="21" y2="10" />
                                    </svg>
                                    Add to Calendar
                                </button>
                                {showCalendarMenu && (
                                    <div
                                        style={{
                                            position: "absolute",
                                            top: "calc(100% + 8px)",
                                            left: "50%",
                                            transform: "translateX(-50%)",
                                            background: dropdownBackground,
                                            backdropFilter: "blur(20px)",
                                            border: `1px solid ${dropdownBorderColor}`,
                                            borderRadius: dropdownBorderRadius,
                                            padding: 6,
                                            minWidth: 200,
                                            zIndex: 100,
                                            boxShadow:
                                                "0 10px 40px rgba(0,0,0,0.4)",
                                        }}
                                    >
                                        <button
                                            onClick={addGoogle}
                                            onMouseEnter={() => setHovered("g")}
                                            onMouseLeave={() =>
                                                setHovered(null)
                                            }
                                            style={ddStyle("g")}
                                        >
                                            <Icons.Google /> Google Calendar
                                        </button>
                                        <button
                                            onClick={addApple}
                                            onMouseEnter={() => setHovered("a")}
                                            onMouseLeave={() =>
                                                setHovered(null)
                                            }
                                            style={ddStyle("a")}
                                        >
                                            <Icons.Apple /> Apple Calendar
                                        </button>
                                        <button
                                            onClick={addOutlook}
                                            onMouseEnter={() => setHovered("o")}
                                            onMouseLeave={() =>
                                                setHovered(null)
                                            }
                                            style={ddStyle("o")}
                                        >
                                            <Icons.Outlook /> Outlook
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {showShareButton && hasShareOptions && (
                            <div
                                ref={shareRef}
                                style={{ position: "relative" }}
                            >
                                <button
                                    onClick={() => {
                                        setShowShareMenu(!showShareMenu)
                                        setShowCalendarMenu(false)
                                    }}
                                    onMouseEnter={() => setHovered("share")}
                                    onMouseLeave={() => setHovered(null)}
                                    style={btnStyle("share")}
                                >
                                    <svg
                                        width="15"
                                        height="15"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                    >
                                        <circle cx="18" cy="5" r="3" />
                                        <circle cx="6" cy="12" r="3" />
                                        <circle cx="18" cy="19" r="3" />
                                        <line
                                            x1="8.59"
                                            y1="13.51"
                                            x2="15.42"
                                            y2="17.49"
                                        />
                                        <line
                                            x1="15.41"
                                            y1="6.51"
                                            x2="8.59"
                                            y2="10.49"
                                        />
                                    </svg>
                                    Share
                                </button>
                                {showShareMenu && (
                                    <div
                                        style={{
                                            position: "absolute",
                                            top: "calc(100% + 8px)",
                                            left: "50%",
                                            transform: "translateX(-50%)",
                                            background: dropdownBackground,
                                            backdropFilter: "blur(20px)",
                                            border: `1px solid ${dropdownBorderColor}`,
                                            borderRadius: dropdownBorderRadius,
                                            padding: 6,
                                            minWidth: 180,
                                            zIndex: 100,
                                            boxShadow:
                                                "0 10px 40px rgba(0,0,0,0.4)",
                                        }}
                                    >
                                        {showShareTwitter && (
                                            <button
                                                onClick={shareX}
                                                onMouseEnter={() =>
                                                    setHovered("x")
                                                }
                                                onMouseLeave={() =>
                                                    setHovered(null)
                                                }
                                                style={ddStyle("x")}
                                            >
                                                <Icons.X /> Twitter / X
                                            </button>
                                        )}
                                        {showShareFacebook && (
                                            <button
                                                onClick={shareFB}
                                                onMouseEnter={() =>
                                                    setHovered("fb")
                                                }
                                                onMouseLeave={() =>
                                                    setHovered(null)
                                                }
                                                style={ddStyle("fb")}
                                            >
                                                <Icons.FB /> Facebook
                                            </button>
                                        )}
                                        {showShareLinkedIn && (
                                            <button
                                                onClick={shareLI}
                                                onMouseEnter={() =>
                                                    setHovered("li")
                                                }
                                                onMouseLeave={() =>
                                                    setHovered(null)
                                                }
                                                style={ddStyle("li")}
                                            >
                                                <Icons.LI /> LinkedIn
                                            </button>
                                        )}
                                        {showShareWhatsApp && (
                                            <button
                                                onClick={shareWA}
                                                onMouseEnter={() =>
                                                    setHovered("wa")
                                                }
                                                onMouseLeave={() =>
                                                    setHovered(null)
                                                }
                                                style={ddStyle("wa")}
                                            >
                                                <Icons.WA /> WhatsApp
                                            </button>
                                        )}
                                        {showShareCopyLink && (
                                            <button
                                                onClick={copyL}
                                                onMouseEnter={() =>
                                                    setHovered("cp")
                                                }
                                                onMouseLeave={() =>
                                                    setHovered(null)
                                                }
                                                style={ddStyle("cp")}
                                            >
                                                {copySuccess ? (
                                                    <Icons.Check />
                                                ) : (
                                                    <Icons.Link />
                                                )}{" "}
                                                {copySuccess
                                                    ? "Copied!"
                                                    : "Copy Link"}
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {showDateDisplay && (
                    <p
                        style={{
                            textAlign: "center",
                            color: dateDisplayColor,
                            margin: 0,
                            ...dateDisplayFont,
                            width: "100%",
                        }}
                    >
                        {formatDate()}
                    </p>
                )}
            </div>
            <style>{`@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-20px)}}`}</style>
        </div>
    )
}

addPropertyControls(PremiumCountdown, {
    targetDate: {
        type: ControlType.String,
        title: "Target Date",
        defaultValue: "2026-03-15",
    },
    targetTime: {
        type: ControlType.String,
        title: "Target Time",
        defaultValue: "20:00",
    },
    eventTitle: {
        type: ControlType.String,
        title: "Event Title",
        defaultValue: "The Big Launch Event",
    },
    eventDescription: {
        type: ControlType.String,
        title: "Description",
        defaultValue: "Join us!",
    },
    eventLocation: {
        type: ControlType.String,
        title: "Location",
        defaultValue: "Online",
    },
    calendarEventName: {
        type: ControlType.String,
        title: "📅 Calendar Name",
        defaultValue: "The Big Launch Event",
    },
    layout: {
        type: ControlType.Enum,
        title: "Layout",
        options: ["horizontal", "vertical", "grid"],
        defaultValue: "horizontal",
    },
    gridColumns: {
        type: ControlType.Number,
        title: "Grid Columns",
        defaultValue: 2,
        min: 2,
        max: 4,
        hidden: (p) => p.layout !== "grid",
    },
    cardSize: {
        type: ControlType.Number,
        title: "Card Size",
        defaultValue: 100,
        min: 60,
        max: 200,
    },
    cardGap: {
        type: ControlType.Number,
        title: "Card Gap",
        defaultValue: 14,
        min: 0,
        max: 50,
    },
    cardBorderRadius: {
        type: ControlType.Number,
        title: "Card Radius",
        defaultValue: 20,
        min: 0,
        max: 50,
    },
    showDays: {
        type: ControlType.Boolean,
        title: "Show Days",
        defaultValue: true,
    },
    showHours: {
        type: ControlType.Boolean,
        title: "Show Hours",
        defaultValue: true,
    },
    showMinutes: {
        type: ControlType.Boolean,
        title: "Show Minutes",
        defaultValue: true,
    },
    showSeconds: {
        type: ControlType.Boolean,
        title: "Show Seconds",
        defaultValue: true,
    },
    showLabels: {
        type: ControlType.Boolean,
        title: "Show Labels",
        defaultValue: true,
    },
    labelPosition: {
        type: ControlType.Enum,
        title: "Label Position",
        options: ["top", "bottom"],
        defaultValue: "bottom",
    },
    labelDays: {
        type: ControlType.String,
        title: "Days Label",
        defaultValue: "Days",
    },
    labelHours: {
        type: ControlType.String,
        title: "Hours Label",
        defaultValue: "Hours",
    },
    labelMinutes: {
        type: ControlType.String,
        title: "Minutes Label",
        defaultValue: "Minutes",
    },
    labelSeconds: {
        type: ControlType.String,
        title: "Seconds Label",
        defaultValue: "Seconds",
    },

    gapCardsToProgress: {
        type: ControlType.Number,
        title: "⬇️ Cards → Progress",
        defaultValue: 24,
        min: 0,
        max: 80,
    },
    gapProgressToButtons: {
        type: ControlType.Number,
        title: "⬇️ Progress → Buttons",
        defaultValue: 28,
        min: 0,
        max: 80,
    },
    gapButtonsToDate: {
        type: ControlType.Number,
        title: "⬇️ Buttons → Date",
        defaultValue: 28,
        min: 0,
        max: 80,
    },

    showBackground: {
        type: ControlType.Boolean,
        title: "Show Background",
        defaultValue: false,
    },
    backgroundGradient: {
        type: ControlType.Boolean,
        title: "Gradient",
        defaultValue: false,
        hidden: (p) => !p.showBackground,
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Bg Color",
        defaultValue: "#0f0f23",
        hidden: (p) => !p.showBackground || p.backgroundGradient,
    },
    gradientColor1: {
        type: ControlType.Color,
        title: "Gradient 1",
        defaultValue: "#1a1a2e",
        hidden: (p) => !p.showBackground || !p.backgroundGradient,
    },
    gradientColor2: {
        type: ControlType.Color,
        title: "Gradient 2",
        defaultValue: "#16213e",
        hidden: (p) => !p.showBackground || !p.backgroundGradient,
    },
    gradientColor3: {
        type: ControlType.Color,
        title: "Gradient 3",
        defaultValue: "#0f0f23",
        hidden: (p) => !p.showBackground || !p.backgroundGradient,
    },
    gradientAngle: {
        type: ControlType.Number,
        title: "Angle",
        defaultValue: 135,
        min: 0,
        max: 360,
        hidden: (p) => !p.showBackground || !p.backgroundGradient,
    },
    showOrbs: {
        type: ControlType.Boolean,
        title: "Show Orbs",
        defaultValue: false,
    },
    orb1Color: {
        type: ControlType.Color,
        title: "Orb 1",
        defaultValue: "rgba(99,102,241,0.15)",
        hidden: (p) => !p.showOrbs,
    },
    orb2Color: {
        type: ControlType.Color,
        title: "Orb 2",
        defaultValue: "rgba(236,72,153,0.12)",
        hidden: (p) => !p.showOrbs,
    },
    orb3Color: {
        type: ControlType.Color,
        title: "Orb 3",
        defaultValue: "rgba(34,211,238,0.1)",
        hidden: (p) => !p.showOrbs,
    },
    cardBackground: {
        type: ControlType.Color,
        title: "Card Bg",
        defaultValue: "rgba(255,255,255,0.08)",
    },
    cardBorderColor: {
        type: ControlType.Color,
        title: "Card Border",
        defaultValue: "rgba(255,255,255,0.12)",
    },
    cardBorderWidth: {
        type: ControlType.Number,
        title: "Border Width",
        defaultValue: 1,
        min: 0,
        max: 5,
    },
    cardBlur: {
        type: ControlType.Boolean,
        title: "Card Blur",
        defaultValue: true,
    },
    cardBlurAmount: {
        type: ControlType.Number,
        title: "Blur Amount",
        defaultValue: 20,
        min: 0,
        max: 50,
        hidden: (p) => !p.cardBlur,
    },
    cardShadow: {
        type: ControlType.Boolean,
        title: "Card Shadow",
        defaultValue: true,
    },
    cardShadowColor: {
        type: ControlType.Color,
        title: "Shadow Color",
        defaultValue: "rgba(0,0,0,0.3)",
        hidden: (p) => !p.cardShadow,
    },
    showCardShine: {
        type: ControlType.Boolean,
        title: "Card Shine",
        defaultValue: false,
    },
    numberColor: {
        type: ControlType.Color,
        title: "Number Color",
        defaultValue: "#ffffff",
    },
    numberFont: {
        type: ControlType.Font,
        title: "Number Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 44,
            variant: "Semibold",
            lineHeight: 1,
            letterSpacing: "-0.02em",
        },
    },
    labelColor: {
        type: ControlType.Color,
        title: "Label Color",
        defaultValue: "rgba(255,255,255,0.5)",
    },
    labelFont: {
        type: ControlType.Font,
        title: "Label Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 12,
            variant: "Medium",
            letterSpacing: "0.04em",
        },
    },
    labelGap: {
        type: ControlType.Number,
        title: "Label Gap",
        defaultValue: 10,
        min: 0,
        max: 30,
    },

    showProgressBar: {
        type: ControlType.Boolean,
        title: "Show Progress",
        defaultValue: true,
    },
    progressTotalDays: {
        type: ControlType.Number,
        title: "Total Days (365=year)",
        defaultValue: 365,
        min: 1,
        max: 1000,
        hidden: (p) => !p.showProgressBar,
    },
    progressBarHeight: {
        type: ControlType.Number,
        title: "Bar Height",
        defaultValue: 5,
        min: 2,
        max: 30,
        hidden: (p) => !p.showProgressBar,
    },
    progressBarBorderRadius: {
        type: ControlType.Number,
        title: "Bar Radius",
        defaultValue: 100,
        min: 0,
        max: 50,
        hidden: (p) => !p.showProgressBar,
    },
    progressBarBackground: {
        type: ControlType.Color,
        title: "Bar Bg",
        defaultValue: "rgba(255,255,255,0.1)",
        hidden: (p) => !p.showProgressBar,
    },
    progressBarFillGradient: {
        type: ControlType.Boolean,
        title: "Fill Gradient",
        defaultValue: true,
        hidden: (p) => !p.showProgressBar,
    },
    progressBarFillColor: {
        type: ControlType.Color,
        title: "Fill Color",
        defaultValue: "#6366f1",
        hidden: (p) => !p.showProgressBar || p.progressBarFillGradient,
    },
    progressBarGradientStart: {
        type: ControlType.Color,
        title: "Gradient Start",
        defaultValue: "#6366f1",
        hidden: (p) => !p.showProgressBar || !p.progressBarFillGradient,
    },
    progressBarGradientMiddle: {
        type: ControlType.Color,
        title: "Gradient Mid",
        defaultValue: "#8b5cf6",
        hidden: (p) => !p.showProgressBar || !p.progressBarFillGradient,
    },
    progressBarGradientEnd: {
        type: ControlType.Color,
        title: "Gradient End",
        defaultValue: "#ec4899",
        hidden: (p) => !p.showProgressBar || !p.progressBarFillGradient,
    },
    progressBarGlow: {
        type: ControlType.Boolean,
        title: "Bar Glow",
        defaultValue: true,
        hidden: (p) => !p.showProgressBar,
    },
    progressBarGlowColor: {
        type: ControlType.Color,
        title: "Glow Color",
        defaultValue: "rgba(99,102,241,0.5)",
        hidden: (p) => !p.showProgressBar || !p.progressBarGlow,
    },
    showProgressLabels: {
        type: ControlType.Boolean,
        title: "Show Labels",
        defaultValue: true,
        hidden: (p) => !p.showProgressBar,
    },
    progressLabelText: {
        type: ControlType.String,
        title: "Label Text",
        defaultValue: "Progress",
        hidden: (p) => !p.showProgressBar || !p.showProgressLabels,
    },
    progressLabelColor: {
        type: ControlType.Color,
        title: "Label Color",
        defaultValue: "rgba(255,255,255,0.4)",
        hidden: (p) => !p.showProgressBar || !p.showProgressLabels,
    },
    progressLabelFont: {
        type: ControlType.Font,
        title: "Progress Label Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 11,
            variant: "Medium",
            letterSpacing: "0.08em",
        },
        hidden: (p) => !p.showProgressBar || !p.showProgressLabels,
    },
    progressValueColor: {
        type: ControlType.Color,
        title: "Value Color",
        defaultValue: "rgba(255,255,255,0.7)",
        hidden: (p) => !p.showProgressBar || !p.showProgressLabels,
    },
    progressValueFont: {
        type: ControlType.Font,
        title: "Progress Value Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 12,
            variant: "Semibold",
        },
        hidden: (p) => !p.showProgressBar || !p.showProgressLabels,
    },
    showMilestone: {
        type: ControlType.Boolean,
        title: "Show Milestone",
        defaultValue: true,
    },
    milestoneBgColor: {
        type: ControlType.Color,
        title: "Milestone Bg",
        defaultValue: "rgba(245,158,11,0.15)",
        hidden: (p) => !p.showMilestone,
    },
    milestoneTextColor: {
        type: ControlType.Color,
        title: "Milestone Text",
        defaultValue: "#fbbf24",
        hidden: (p) => !p.showMilestone,
    },

    showButtons: {
        type: ControlType.Boolean,
        title: "Show Buttons",
        defaultValue: true,
    },
    showNotifyButton: {
        type: ControlType.Boolean,
        title: "Notify Button",
        defaultValue: true,
        hidden: (p) => !p.showButtons,
    },
    showCalendarButton: {
        type: ControlType.Boolean,
        title: "Calendar Button",
        defaultValue: true,
        hidden: (p) => !p.showButtons,
    },
    showShareButton: {
        type: ControlType.Boolean,
        title: "Share Button",
        defaultValue: true,
        hidden: (p) => !p.showButtons,
    },

    // Individual share options
    showShareTwitter: {
        type: ControlType.Boolean,
        title: "↳ Twitter/X",
        defaultValue: true,
        hidden: (p) => !p.showButtons || !p.showShareButton,
    },
    showShareFacebook: {
        type: ControlType.Boolean,
        title: "↳ Facebook",
        defaultValue: true,
        hidden: (p) => !p.showButtons || !p.showShareButton,
    },
    showShareLinkedIn: {
        type: ControlType.Boolean,
        title: "↳ LinkedIn",
        defaultValue: true,
        hidden: (p) => !p.showButtons || !p.showShareButton,
    },
    showShareWhatsApp: {
        type: ControlType.Boolean,
        title: "↳ WhatsApp",
        defaultValue: true,
        hidden: (p) => !p.showButtons || !p.showShareButton,
    },
    showShareCopyLink: {
        type: ControlType.Boolean,
        title: "↳ Copy Link",
        defaultValue: true,
        hidden: (p) => !p.showButtons || !p.showShareButton,
    },

    buttonBackground: {
        type: ControlType.Color,
        title: "Button Bg",
        defaultValue: "rgba(255,255,255,0.1)",
        hidden: (p) => !p.showButtons,
    },
    buttonHoverBackground: {
        type: ControlType.Color,
        title: "Button Hover",
        defaultValue: "rgba(255,255,255,0.2)",
        hidden: (p) => !p.showButtons,
    },
    buttonBorderColor: {
        type: ControlType.Color,
        title: "Button Border",
        defaultValue: "rgba(255,255,255,0.15)",
        hidden: (p) => !p.showButtons,
    },
    buttonTextColor: {
        type: ControlType.Color,
        title: "Button Text",
        defaultValue: "#ffffff",
        hidden: (p) => !p.showButtons,
    },
    buttonBorderRadius: {
        type: ControlType.Number,
        title: "Button Radius",
        defaultValue: 12,
        min: 0,
        max: 30,
        hidden: (p) => !p.showButtons,
    },
    buttonFont: {
        type: ControlType.Font,
        title: "Button Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 13,
            variant: "Medium",
        },
        hidden: (p) => !p.showButtons,
    },
    buttonBlur: {
        type: ControlType.Boolean,
        title: "Button Blur",
        defaultValue: true,
        hidden: (p) => !p.showButtons,
    },

    // Dropdown styling
    dropdownBackground: {
        type: ControlType.Color,
        title: "Dropdown Bg",
        defaultValue: "rgba(20,20,35,0.98)",
        hidden: (p) => !p.showButtons,
    },
    dropdownBorderColor: {
        type: ControlType.Color,
        title: "Dropdown Border",
        defaultValue: "rgba(255,255,255,0.15)",
        hidden: (p) => !p.showButtons,
    },
    dropdownBorderRadius: {
        type: ControlType.Number,
        title: "Dropdown Radius",
        defaultValue: 12,
        min: 0,
        max: 30,
        hidden: (p) => !p.showButtons,
    },
    dropdownItemHoverBg: {
        type: ControlType.Color,
        title: "Dropdown Hover",
        defaultValue: "rgba(255,255,255,0.1)",
        hidden: (p) => !p.showButtons,
    },

    showDateDisplay: {
        type: ControlType.Boolean,
        title: "Show Date",
        defaultValue: true,
    },
    dateDisplayColor: {
        type: ControlType.Color,
        title: "Date Color",
        defaultValue: "rgba(255,255,255,0.4)",
        hidden: (p) => !p.showDateDisplay,
    },
    dateDisplayFont: {
        type: ControlType.Font,
        title: "Date Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 13,
            variant: "Regular",
        },
        hidden: (p) => !p.showDateDisplay,
    },
    emailIntegrationMethod: {
        type: ControlType.Enum,
        title: "Email Method",
        options: ["localStorage", "mailchimp", "googleSheets", "webhook"],
        defaultValue: "localStorage",
    },
    mailchimpFormAction: {
        type: ControlType.String,
        title: "Mailchimp URL",
        defaultValue: "",
        hidden: (p) => p.emailIntegrationMethod !== "mailchimp",
    },
    mailchimpU: {
        type: ControlType.String,
        title: "Mailchimp U",
        defaultValue: "",
        hidden: (p) => p.emailIntegrationMethod !== "mailchimp",
    },
    mailchimpId: {
        type: ControlType.String,
        title: "Mailchimp ID",
        defaultValue: "",
        hidden: (p) => p.emailIntegrationMethod !== "mailchimp",
    },
    googleSheetsUrl: {
        type: ControlType.String,
        title: "Sheets URL",
        defaultValue: "",
        hidden: (p) => p.emailIntegrationMethod !== "googleSheets",
    },
    webhookUrl: {
        type: ControlType.String,
        title: "Webhook URL",
        defaultValue: "",
        hidden: (p) => p.emailIntegrationMethod !== "webhook",
    },
    webhookAuthToken: {
        type: ControlType.String,
        title: "Auth Token",
        defaultValue: "",
        hidden: (p) => p.emailIntegrationMethod !== "webhook",
    },
    enableAnimations: {
        type: ControlType.Boolean,
        title: "Animations",
        defaultValue: true,
    },
})
