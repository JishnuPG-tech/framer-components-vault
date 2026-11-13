import { motion, AnimatePresence } from "framer-motion"
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


/* ==================================================================
   Icons. String name in, SVG out, so no JSX travels through props.
================================================================== */
function Icon(props) {
    const c = props.color
    const s = props.size || 22
    const n = props.name

    if (n === "back") {
        return (
            <svg
                width={s}
                height={s}
                viewBox="0 0 24 24"
                fill="none"
                stroke={c}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
            >
                <path d="M15 18l-6-6 6-6" />
            </svg>
        )
    }
    if (n === "search") {
        return (
            <svg
                width={s}
                height={s}
                viewBox="0 0 24 24"
                fill="none"
                stroke={c}
                strokeWidth="2"
                strokeLinecap="round"
                aria-hidden="true"
            >
                <circle cx="11" cy="11" r="7" />
                <path d="M16.5 16.5L21 21" />
            </svg>
        )
    }
    if (n === "cart") {
        return (
            <svg
                width={s}
                height={s}
                viewBox="0 0 24 24"
                fill="none"
                stroke={c}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
            >
                <path d="M6 6h15l-1.5 9h-12z" />
                <circle cx="9" cy="20" r="1.4" />
                <circle cx="18" cy="20" r="1.4" />
                <path d="M6 6L5 3H2" />
            </svg>
        )
    }
    if (n === "home") {
        return (
            <svg
                width={s}
                height={s}
                viewBox="0 0 24 24"
                fill="none"
                stroke={c}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
            >
                <path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
            </svg>
        )
    }
    if (n === "user") {
        return (
            <svg
                width={s}
                height={s}
                viewBox="0 0 24 24"
                fill="none"
                stroke={c}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
            >
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21c0-4 3.6-6 8-6s8 2 8 6" />
            </svg>
        )
    }
    if (n === "heart") {
        return (
            <svg
                width={s}
                height={s}
                viewBox="0 0 24 24"
                fill="none"
                stroke={c}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
            >
                <path d="M12 20s-7-4.4-7-9a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 4.6-7 9-7 9z" />
            </svg>
        )
    }
    if (n === "star") {
        return (
            <svg
                width={s}
                height={s}
                viewBox="0 0 24 24"
                fill={c}
                aria-hidden="true"
            >
                <path d="M12 3l2.6 5.6 6.1.8-4.4 4.3 1.1 6.1L12 17l-5.4 2.8 1.1-6.1L3.3 9.4l6.1-.8z" />
            </svg>
        )
    }
    if (n === "clock") {
        return (
            <svg
                width={s}
                height={s}
                viewBox="0 0 24 24"
                fill="none"
                stroke={c}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
            >
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" />
            </svg>
        )
    }
    if (n === "trash") {
        return (
            <svg
                width={s}
                height={s}
                viewBox="0 0 24 24"
                fill="none"
                stroke={c}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
            >
                <path d="M4 7h16" />
                <path d="M9 7V4h6v3" />
                <path d="M6 7l1 13h10l1-13" />
            </svg>
        )
    }
    if (n === "pin") {
        return (
            <svg
                width={s}
                height={s}
                viewBox="0 0 24 24"
                fill="none"
                stroke={c}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
            >
                <path d="M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11z" />
                <circle cx="12" cy="10" r="2.5" />
            </svg>
        )
    }
    if (n === "check") {
        return (
            <svg
                width={s}
                height={s}
                viewBox="0 0 24 24"
                fill="none"
                stroke={c}
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
            >
                <path d="M4 12.5l5.2 5L20 7" />
            </svg>
        )
    }
    if (n === "google") {
        return (
            <svg
                width={s}
                height={s}
                viewBox="0 0 24 24"
                fill="none"
                stroke={c}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
            >
                <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
                <path d="M3 7l9 6 9-6" />
            </svg>
        )
    }
    if (n === "phone") {
        return (
            <svg
                width={s}
                height={s}
                viewBox="0 0 24 24"
                fill="none"
                stroke={c}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
            >
                <rect x="6" y="2" width="12" height="20" rx="2.5" />
                <path d="M11 18.5h2" />
            </svg>
        )
    }
    if (n === "card") {
        return (
            <svg
                width={s}
                height={s}
                viewBox="0 0 24 24"
                fill="none"
                stroke={c}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
            >
                <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
                <path d="M2.5 10h19" />
            </svg>
        )
    }
    if (n === "wallet") {
        return (
            <svg
                width={s}
                height={s}
                viewBox="0 0 24 24"
                fill="none"
                stroke={c}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
            >
                <path d="M3 7a2 2 0 0 1 2-2h12v4" />
                <rect x="3" y="7" width="18" height="12" rx="2" />
                <circle cx="17" cy="13" r="1.3" fill={c} />
            </svg>
        )
    }
    if (n === "cash") {
        return (
            <svg
                width={s}
                height={s}
                viewBox="0 0 24 24"
                fill="none"
                stroke={c}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
            >
                <rect x="2.5" y="6" width="19" height="12" rx="2" />
                <circle cx="12" cy="12" r="2.6" />
            </svg>
        )
    }
    if (n === "bike") {
        return (
            <svg
                width={s}
                height={s}
                viewBox="0 0 24 24"
                fill="none"
                stroke={c}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
            >
                <circle cx="5.5" cy="17" r="3.2" />
                <circle cx="18.5" cy="17" r="3.2" />
                <path d="M5.5 17l4-8h5l3 8" />
                <path d="M9 6h3" />
            </svg>
        )
    }
    if (n === "bag") {
        return (
            <svg
                width={s}
                height={s}
                viewBox="0 0 24 24"
                fill="none"
                stroke={c}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
            >
                <path d="M6 8h12l-1 12H7L6 8z" />
                <path d="M9 8V6a3 3 0 0 1 6 0v2" />
            </svg>
        )
    }
    if (n === "gift") {
        return (
            <svg
                width={s}
                height={s}
                viewBox="0 0 24 24"
                fill="none"
                stroke={c}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
            >
                <rect x="3" y="9" width="18" height="12" rx="2" />
                <path d="M3 13h18M12 9v12" />
                <path d="M12 9C10 9 8 8 8 6a2 2 0 0 1 4 0c0 2-2 3-4 3M12 9c2 0 4-1 4-3a2 2 0 0 0-4 0c0 2 2 3 4 3" />
            </svg>
        )
    }
    return null
}

/* Auto-generated food swatch so the demo never shows a broken image */
function foodImage(seed) {
    var t = seed || ""
    var h = 0
    for (var i = 0; i < t.length; i++) {
        h = (h * 31 + t.charCodeAt(i)) % 100000
    }
    var hue = 12 + (h % 46)
    var hue2 = (hue + 18) % 360
    var sat = 46 + (h % 20)
    var li = 58 + (h % 14)
    var initial = (t.trim().charAt(0) || "-").toUpperCase()

    var c1 = "hsl(" + hue + "," + sat + "%," + li + "%)"
    var c2 = "hsl(" + hue2 + "," + (sat + 10) + "%," + (li - 18) + "%)"
    var c3 = "hsl(" + hue + "," + (sat - 8) + "%," + (li + 16) + "%)"
    var c4 =
        "hsl(" + hue + "," + (sat + 6) + "%," + Math.max(18, li - 40) + "%)"

    var svg =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">' +
        '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
        '<stop offset="0%" stop-color="' +
        c1 +
        '"/>' +
        '<stop offset="100%" stop-color="' +
        c2 +
        '"/>' +
        "</linearGradient></defs>" +
        '<rect width="120" height="120" fill="url(#g)"/>' +
        '<circle cx="60" cy="62" r="34" fill="' +
        c3 +
        '" opacity="0.55"/>' +
        '<circle cx="60" cy="62" r="22" fill="' +
        c1 +
        '" opacity="0.7"/>' +
        '<text x="60" y="64" font-family="Georgia, serif" font-size="30" fill="' +
        c4 +
        '" text-anchor="middle" dominant-baseline="central">' +
        initial +
        "</text></svg>"

    return "data:image/svg+xml;utf8," + encodeURIComponent(svg)
}

/* Small circular avatar for the Google account chooser */
function avatarImage(seed, tint) {
    var t = seed || ""
    var h = 0
    for (var i = 0; i < t.length; i++) {
        h = (h * 31 + t.charCodeAt(i)) % 100000
    }
    var initial = (t.trim().charAt(0) || "-").toUpperCase()
    var col = tint || "hsl(" + (h % 360) + ",52%,55%)"

    var svg =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">' +
        '<rect width="80" height="80" fill="' +
        col +
        '"/>' +
        '<text x="40" y="43" font-family="Inter, sans-serif" font-size="34" font-weight="600" fill="#FFFFFF" text-anchor="middle" dominant-baseline="central">' +
        initial +
        "</text></svg>"

    return "data:image/svg+xml;utf8," + encodeURIComponent(svg)
}

/* ==================================================================
   Demo content
================================================================== */
const DEMO_ITEMS = [
    {
        name: "Margherita Pizza",
        desc: "San Marzano tomato, fior di latte, basil",
        price: 349,
        category: "Pizza",
        rating: 4.6,
        time: "25 min",
        veg: true,
        image: "",
    },
    {
        name: "Paneer Tikka Bowl",
        desc: "Char-grilled paneer, rice, mint chutney",
        price: 289,
        category: "Bowls",
        rating: 4.4,
        time: "20 min",
        veg: true,
        image: "",
    },
    {
        name: "Classic Cheeseburger",
        desc: "Grilled patty, cheddar, pickles, house sauce",
        price: 259,
        category: "Burgers",
        rating: 4.7,
        time: "18 min",
        veg: false,
        image: "",
    },
    {
        name: "Butter Chicken",
        desc: "Tandoori chicken, tomato cashew gravy",
        price: 379,
        category: "Curries",
        rating: 4.8,
        time: "30 min",
        veg: false,
        image: "",
    },
    {
        name: "Crispy Fries",
        desc: "Sea salt, rosemary, garlic aioli",
        price: 129,
        category: "Sides",
        rating: 4.3,
        time: "12 min",
        veg: true,
        image: "",
    },
    {
        name: "Chocolate Shake",
        desc: "Belgian cocoa, vanilla ice cream",
        price: 169,
        category: "Drinks",
        rating: 4.5,
        time: "10 min",
        veg: true,
        image: "",
    },
]

const DEMO_ACCOUNTS = [
    { name: "Alex Doe", email: "alex.doe@example.com", tint: "#4A7CF0" },
    { name: "Sam Rivera", email: "sam@example.com", tint: "#2E9E63" },
]

const DEMO_ADDRESSES = [
    { label: "Home", line: "12 Civil Lines, Jaipur 302006" },
    { label: "Work", line: "4th Floor, Malviya Nagar, Jaipur 302017" },
]

const DEMO_PAYMENTS = [
    { label: "UPI", sub: "Pay by any UPI app", icon: "phone" },
    { label: "Card", sub: "Credit or debit card", icon: "card" },
    { label: "Wallet", sub: "Balance 1,240", icon: "wallet" },
    { label: "Cash on delivery", sub: "Pay when it arrives", icon: "cash" },
]

const DEMO_TRACK = [
    { title: "Order confirmed", sub: "We have received your order" },
    { title: "Preparing", sub: "The kitchen is on it" },
    { title: "Out for delivery", sub: "Rider is on the way" },
    { title: "Delivered", sub: "Enjoy your meal" },
]

/* ==================================================================
   Building blocks
================================================================== */
function VegMark(props) {
    if (!props.show) return null
    const col = props.veg ? props.vegColor : props.nonVegColor
    const s = props.size || 13
    return (
        <span
            aria-hidden="true"
            style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: s,
                height: s,
                border: "1.4px solid " + col,
                borderRadius: 3,
                flexShrink: 0,
            }}
        >
            <span
                style={{
                    width: s * 0.44,
                    height: s * 0.44,
                    borderRadius: "50%",
                    background: col,
                }}
            />
        </span>
    )
}

function TopBar(props) {
    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "16px 18px 12px",
                flexShrink: 0,
            }}
        >
            {props.onBack ? (
                <button
                    type="button"
                    onClick={props.onBack}
                    aria-label="Back"
                    style={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        border: "1px solid " + props.border,
                        background: "transparent",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        flexShrink: 0,
                        padding: 0,
                    }}
                >
                    <Icon name="back" color={props.text} size={19} />
                </button>
            ) : null}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div
                    style={{
                        fontSize: 17,
                        fontWeight: 600,
                        color: props.text,
                        lineHeight: 1.2,
                    }}
                >
                    {props.title}
                </div>
                {props.sub ? (
                    <div
                        style={{
                            fontSize: 12.5,
                            color: props.muted,
                            marginTop: 2,
                        }}
                    >
                        {props.sub}
                    </div>
                ) : null}
            </div>
        </div>
    )
}

function PrimaryButton(props) {
    return (
        <button
            type="button"
            onClick={props.onClick}
            disabled={props.disabled}
            style={{
                width: "100%",
                border: "none",
                borderRadius: props.radius,
                padding: "16px 20px",
                fontSize: 15,
                fontWeight: 600,
                fontFamily: "inherit",
                cursor: props.disabled ? "not-allowed" : "pointer",
                background: props.disabled ? props.border : props.accent,
                color: props.disabled ? props.muted : props.onAccent,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
            }}
        >
            {props.label}
            {props.note ? (
                <span style={{ fontSize: 13, fontWeight: 500, opacity: 0.85 }}>
                    {props.note}
                </span>
            ) : null}
        </button>
    )
}

function GhostButton(props) {
    return (
        <button
            type="button"
            onClick={props.onClick}
            style={{
                width: "100%",
                border: "1px solid " + props.border,
                background: props.surface,
                color: props.text,
                borderRadius: props.radius,
                padding: "15px 20px",
                fontSize: 15,
                fontWeight: 500,
                cursor: "pointer",
                fontFamily: "inherit",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
            }}
        >
            {props.icon ? (
                <Icon name={props.icon} size={19} color={props.text} />
            ) : null}
            {props.label}
        </button>
    )
}

function QtyStepper(props) {
    return (
        <div
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 2,
                border: "1px solid " + props.border,
                borderRadius: 999,
                padding: 3,
                background: props.surface,
            }}
        >
            <button
                type="button"
                onClick={props.onMinus}
                aria-label="Decrease quantity"
                style={{
                    width: 28,
                    height: 28,
                    border: "none",
                    background: "transparent",
                    color: props.accent,
                    fontSize: 19,
                    lineHeight: 1,
                    cursor: "pointer",
                    borderRadius: "50%",
                    padding: 0,
                }}
            >
                &#8722;
            </button>
            <span
                style={{
                    minWidth: 24,
                    textAlign: "center",
                    fontSize: 14,
                    fontWeight: 600,
                    color: props.text,
                    fontVariantNumeric: "tabular-nums",
                }}
            >
                {props.value}
            </span>
            <button
                type="button"
                onClick={props.onPlus}
                aria-label="Increase quantity"
                style={{
                    width: 28,
                    height: 28,
                    border: "none",
                    background: "transparent",
                    color: props.accent,
                    fontSize: 19,
                    lineHeight: 1,
                    cursor: "pointer",
                    borderRadius: "50%",
                    padding: 0,
                }}
            >
                +
            </button>
        </div>
    )
}

function Row(props) {
    return (
        <div
            style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 9,
            }}
        >
            <span style={{ fontSize: 13.5, color: props.muted }}>
                {props.label}
            </span>
            <span
                style={{
                    fontSize: 13.5,
                    color: props.valueColor || props.text,
                    fontWeight: 500,
                }}
            >
                {props.value}
            </span>
        </div>
    )
}

function BottomNav(props) {
    const tabs = [
        { key: "home", icon: "home", label: props.labels.home },
        { key: "search", icon: "search", label: props.labels.search },
        { key: "cart", icon: "cart", label: props.labels.cart },
        { key: "account", icon: "user", label: props.labels.account },
    ]

    return (
        <div
            style={{
                display: "flex",
                borderTop: "1px solid " + props.border,
                background: props.surface,
                paddingBottom: 6,
                flexShrink: 0,
            }}
        >
            {tabs.map(function (t) {
                const active = t.key === props.active
                return (
                    <button
                        key={t.key}
                        type="button"
                        onClick={function () {
                            props.onTab(t.key)
                        }}
                        style={{
                            flex: 1,
                            border: "none",
                            background: "transparent",
                            padding: "11px 0 7px",
                            cursor: "pointer",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 4,
                            position: "relative",
                            fontFamily: "inherit",
                        }}
                    >
                        <span
                            style={{
                                position: "relative",
                                display: "inline-flex",
                            }}
                        >
                            <Icon
                                name={t.icon}
                                color={active ? props.accent : props.muted}
                                size={21}
                            />
                            {t.key === "cart" && props.cartCount > 0 ? (
                                <span
                                    style={{
                                        position: "absolute",
                                        top: -5,
                                        right: -8,
                                        minWidth: 16,
                                        height: 16,
                                        padding: "0 4px",
                                        borderRadius: 999,
                                        background: props.accent,
                                        color: props.onAccent,
                                        fontSize: 10,
                                        fontWeight: 700,
                                        display: "inline-flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                                    {props.cartCount}
                                </span>
                            ) : null}
                        </span>
                        <span
                            style={{
                                fontSize: 10.5,
                                color: active ? props.accent : props.muted,
                                fontWeight: active ? 600 : 500,
                            }}
                        >
                            {t.label}
                        </span>
                    </button>
                )
            })}
        </div>
    )
}

/* ==================================================================
   MAIN
================================================================== */
/**
 * Food Order App
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 390
 * @framerIntrinsicHeight 844
 * @framerDisableUnlink
 */
export default function FoodOrderApp(props) {
    const items = Array.isArray(props.items) ? props.items : []
    const accounts = Array.isArray(props.accounts) ? props.accounts : []
    const addresses = Array.isArray(props.addresses) ? props.addresses : []
    const payments = Array.isArray(props.payments) ? props.payments : []
    const trackSteps = Array.isArray(props.trackSteps) ? props.trackSteps : []

    const t = {
        appName: props.appName,
        tagline: props.tagline,
        phoneCta: props.phoneCta,
        googleCta: props.googleCta,
        guestCta: props.guestCta,
        legalNote: props.legalNote,
        loginTitle: props.loginTitle,
        loginSub: props.loginSub,
        dialCode: props.dialCode,
        phonePlaceholder: props.phonePlaceholder,
        sendCodeCta: props.sendCodeCta,
        otpTitle: props.otpTitle,
        otpSub: props.otpSub,
        verifyCta: props.verifyCta,
        wrongCode: props.wrongCode,
        resendLabel: props.resendLabel,
        resendReady: props.resendReady,
        googleTitle: props.googleTitle,
        googleSub: props.googleSub,
        useAnother: props.useAnother,
        deliverTo: props.deliverTo,
        searchPlaceholder: props.searchPlaceholder,
        allLabel: props.allLabel,
        addCta: props.addCta,
        viewCartCta: props.viewCartCta,
        noResults: props.noResults,
        quantityLabel: props.quantityLabel,
        addToCartCta: props.addToCartCta,
        cartTitle: props.cartTitle,
        emptyCartTitle: props.emptyCartTitle,
        emptyCartSub: props.emptyCartSub,
        browseCta: props.browseCta,
        billTitle: props.billTitle,
        itemTotalLabel: props.itemTotalLabel,
        deliveryLabel: props.deliveryLabel,
        freeLabel: props.freeLabel,
        taxLabel: props.taxLabel,
        toPayLabel: props.toPayLabel,
        freeHint: props.freeHint,
        addressCta: props.addressCta,
        addressTitle: props.addressTitle,
        newAddressLabel: props.newAddressLabel,
        instructionsLabel: props.instructionsLabel,
        instructionsPlaceholder: props.instructionsPlaceholder,
        paymentCta: props.paymentCta,
        paymentTitle: props.paymentTitle,
        payNowCta: props.payNowCta,
        successTitle: props.successTitle,
        successSub: props.successSub,
        orderIdLabel: props.orderIdLabel,
        trackCta: props.trackCta,
        homeCta: props.homeCta,
        trackTitle: props.trackTitle,
        etaTitle: props.etaTitle,
        riderLine: props.riderLine,
        summaryTitle: props.summaryTitle,
        paidLabel: props.paidLabel,
        orderAgainCta: props.orderAgainCta,
        navHome: props.navHome,
        navSearch: props.navSearch,
        navCart: props.navCart,
        navAccount: props.navAccount,
    }

    const currency = props.currency
    const currencyAfter = props.currencyAfter
    const locale = props.numberLocale
    const deliveryFee = props.deliveryFee
    const taxPercent = props.taxPercent
    const freeAbove = props.freeAbove
    const startScreen = props.startScreen
    const demoOtp = String(props.demoOtp || "1234").replace(/\D/g, "")
    const otpLength = demoOtp.length > 0 ? demoOtp.length : 4
    const resendSeconds = props.resendSeconds
    const showVegMarks = props.showVegMarks
    const showRatings = props.showRatings
    const showFrame = props.showFrame

    const accent = props.accentColor
    const onAccent = props.onAccentColor
    const bg = props.backgroundColor
    const surface = props.surfaceColor
    const text = props.textColor
    const muted = props.mutedColor
    const border = props.borderColor
    const successColor = props.successColor
    const vegColor = props.vegColor
    const nonVegColor = props.nonVegColor
    const starColor = props.starColor
    const radius = props.radius
    const font = props.fontFamily

    const isStatic = useIsStaticRenderer()

    const [screen, setScreen] = useState(startScreen)
    const [tab, setTab] = useState("home")
    const [phone, setPhone] = useState("")
    const [otp, setOtp] = useState("")
    const [otpError, setOtpError] = useState(false)
    const [secondsLeft, setSecondsLeft] = useState(resendSeconds)
    const [account, setAccount] = useState(null)
    const [openItem, setOpenItem] = useState(0)
    const [detailQty, setDetailQty] = useState(1)
    const [cart, setCart] = useState([])
    const [category, setCategory] = useState("__all__")
    const [query, setQuery] = useState("")
    const [addressIndex, setAddressIndex] = useState(0)
    const [payIndex, setPayIndex] = useState(0)
    const [trackStep, setTrackStep] = useState(1)

    const otpInputRef = useRef(null)

    /* ---------- resend countdown ---------- */
    useEffect(
        function () {
            if (isStatic) return
            if (screen !== "otp") return
            if (secondsLeft <= 0) return

            const timer = setTimeout(function () {
                setSecondsLeft(function (s) {
                    return s - 1
                })
            }, 1000)

            return function () {
                clearTimeout(timer)
            }
        },
        [screen, secondsLeft, isStatic]
    )

    /* ---------- auto verify once the code is complete ---------- */
    useEffect(
        function () {
            if (isStatic) return
            if (screen !== "otp") return

            const digits = otp.replace(/\D/g, "")
            if (digits.length < otpLength) {
                setOtpError(false)
                return
            }

            const timer = setTimeout(function () {
                if (digits === demoOtp) {
                    setOtpError(false)
                    setScreen("home")
                } else {
                    setOtpError(true)
                }
            }, 320)

            return function () {
                clearTimeout(timer)
            }
        },
        [otp, screen, demoOtp, otpLength, isStatic]
    )

    /* ---------- helpers ---------- */
    function money(n) {
        const num = Number(n) || 0
        let out
        try {
            out = num.toLocaleString(locale || "en-IN", {
                maximumFractionDigits: 0,
            })
        } catch (err) {
            out = String(Math.round(num))
        }
        if (currencyAfter) return out + " " + currency
        return currency + out
    }

    function fill(template, map) {
        let out = String(template || "")
        for (var key in map) {
            out = out.split("{" + key + "}").join(map[key])
        }
        return out
    }

    function imageFor(it) {
        if (it && it.image) return it.image
        return foodImage(it ? it.name : "")
    }

    function go(next) {
        setScreen(next)
    }

    function qtyOf(index) {
        for (var i = 0; i < cart.length; i++) {
            if (cart[i].index === index) return cart[i].qty
        }
        return 0
    }

    function addToCart(index, amount) {
        setCart(function (prev) {
            const next = []
            let found = false
            for (var i = 0; i < prev.length; i++) {
                if (prev[i].index === index) {
                    found = true
                    const q = prev[i].qty + amount
                    if (q > 0) next.push({ index: index, qty: q })
                } else {
                    next.push(prev[i])
                }
            }
            if (!found && amount > 0) next.push({ index: index, qty: amount })
            return next
        })
    }

    function removeLine(index) {
        setCart(function (prev) {
            return prev.filter(function (l) {
                return l.index !== index
            })
        })
    }

    function startOtp() {
        setOtp("")
        setOtpError(false)
        setSecondsLeft(resendSeconds)
        go("otp")
    }

    let cartCount = 0
    let subtotal = 0
    for (var ci = 0; ci < cart.length; ci++) {
        const line = items[cart[ci].index]
        if (line) {
            cartCount = cartCount + cart[ci].qty
            subtotal = subtotal + (Number(line.price) || 0) * cart[ci].qty
        }
    }
    const shipping = subtotal >= freeAbove || subtotal === 0 ? 0 : deliveryFee
    const tax = Math.round((subtotal * taxPercent) / 100)
    const total = subtotal + shipping + tax

    const activeAddress = addresses[addressIndex] ||
        addresses[0] || { label: "", line: "" }

    const categories = []
    for (var k = 0; k < items.length; k++) {
        const c = (items[k].category || "").trim()
        if (c && categories.indexOf(c) === -1) categories.push(c)
    }

    const visibleItems = []
    for (var v = 0; v < items.length; v++) {
        const it = items[v]
        const inCat =
            category === "__all__" || (it.category || "").trim() === category
        const q = query.trim().toLowerCase()
        const inQ =
            q.length === 0 ||
            (it.name || "").toLowerCase().indexOf(q) !== -1 ||
            (it.desc || "").toLowerCase().indexOf(q) !== -1
        if (inCat && inQ) visibleItems.push({ item: it, index: v })
    }

    const orderId = 4820 + cartCount

    /* shared styles */
    const chip = function (active) {
        return {
            border: "1px solid " + (active ? accent : border),
            background: active ? accent : "transparent",
            color: active ? onAccent : muted,
            padding: "8px 15px",
            borderRadius: 999,
            fontSize: 12.5,
            fontWeight: 500,
            cursor: "pointer",
            whiteSpace: "nowrap",
            fontFamily: "inherit",
            flexShrink: 0,
        }
    }

    const inputStyle = {
        width: "100%",
        padding: "15px 16px",
        fontSize: 15,
        fontFamily: "inherit",
        color: text,
        background: surface,
        border: "1px solid " + border,
        borderRadius: radius * 0.7,
        outline: "none",
        boxSizing: "border-box",
    }

    const scrollArea = { flex: 1, overflowY: "auto", padding: "0 18px 18px" }
    const stickyBar = {
        padding: "12px 18px 16px",
        borderTop: "1px solid " + border,
        background: surface,
        flexShrink: 0,
    }
    const cardStyle = {
        background: surface,
        border: "1px solid " + border,
        borderRadius: radius * 0.7,
        padding: 15,
    }
    const sectionLabel = {
        fontSize: 12.5,
        fontWeight: 600,
        color: muted,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        marginBottom: 12,
    }

    /* ==============================================================
       SCREENS
    ============================================================== */

    function renderWelcome() {
        return (
            <div
                style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    padding: 26,
                }}
            >
                <div
                    style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: 22,
                    }}
                >
                    <div
                        style={{
                            width: 92,
                            height: 92,
                            borderRadius: 26,
                            background: accent,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <Icon name="bike" color={onAccent} size={44} />
                    </div>
                    <div style={{ textAlign: "center" }}>
                        <div
                            style={{
                                fontSize: 27,
                                fontWeight: 700,
                                color: text,
                                letterSpacing: "-0.02em",
                            }}
                        >
                            {t.appName}
                        </div>
                        <div
                            style={{
                                fontSize: 14.5,
                                color: muted,
                                marginTop: 8,
                                lineHeight: 1.5,
                                maxWidth: 250,
                            }}
                        >
                            {t.tagline}
                        </div>
                    </div>
                </div>

                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 11,
                    }}
                >
                    <PrimaryButton
                        label={t.phoneCta}
                        onClick={function () {
                            go("login")
                        }}
                        accent={accent}
                        onAccent={onAccent}
                        border={border}
                        muted={muted}
                        radius={radius * 0.7}
                    />
                    <GhostButton
                        label={t.googleCta}
                        icon="google"
                        onClick={function () {
                            go("google")
                        }}
                        border={border}
                        surface={surface}
                        text={text}
                        radius={radius * 0.7}
                    />
                    {t.guestCta ? (
                        <button
                            type="button"
                            onClick={function () {
                                go("home")
                            }}
                            style={{
                                border: "none",
                                background: "transparent",
                                color: accent,
                                fontSize: 14,
                                fontWeight: 500,
                                cursor: "pointer",
                                fontFamily: "inherit",
                                padding: "6px 0",
                            }}
                        >
                            {t.guestCta}
                        </button>
                    ) : null}
                    <div
                        style={{
                            fontSize: 11.5,
                            color: muted,
                            textAlign: "center",
                            marginTop: 2,
                            lineHeight: 1.5,
                        }}
                    >
                        {t.legalNote}
                    </div>
                </div>
            </div>
        )
    }

    function renderGoogle() {
        return (
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                <TopBar
                    title=""
                    onBack={function () {
                        go("welcome")
                    }}
                    text={text}
                    muted={muted}
                    border={border}
                />
                <div style={{ flex: 1, padding: "6px 22px" }}>
                    <div style={{ display: "inline-flex", marginBottom: 18 }}>
                        <Icon name="google" size={30} />
                    </div>
                    <div
                        style={{
                            fontSize: 22,
                            fontWeight: 600,
                            color: text,
                            letterSpacing: "-0.01em",
                        }}
                    >
                        {t.googleTitle}
                    </div>
                    <div
                        style={{
                            fontSize: 14,
                            color: muted,
                            marginTop: 8,
                            lineHeight: 1.5,
                        }}
                    >
                        {fill(t.googleSub, { app: t.appName })}
                    </div>

                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            marginTop: 22,
                            border: "1px solid " + border,
                            borderRadius: radius * 0.7,
                            overflow: "hidden",
                        }}
                    >
                        {accounts.map(function (a, i) {
                            return (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={function () {
                                        setAccount(a)
                                        go("home")
                                    }}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 13,
                                        padding: 15,
                                        border: "none",
                                        borderBottom:
                                            i < accounts.length - 1
                                                ? "1px solid " + border
                                                : "none",
                                        background: surface,
                                        cursor: "pointer",
                                        textAlign: "left",
                                        fontFamily: "inherit",
                                    }}
                                >
                                    <span
                                        style={{
                                            width: 40,
                                            height: 40,
                                            borderRadius: "50%",
                                            overflow: "hidden",
                                            flexShrink: 0,
                                        }}
                                    >
                                        <img
                                            src={avatarImage(a.name, a.tint)}
                                            alt=""
                                            style={{
                                                width: "100%",
                                                height: "100%",
                                                display: "block",
                                            }}
                                        />
                                    </span>
                                    <span style={{ flex: 1, minWidth: 0 }}>
                                        <span
                                            style={{
                                                display: "block",
                                                fontSize: 14.5,
                                                fontWeight: 600,
                                                color: text,
                                            }}
                                        >
                                            {a.name}
                                        </span>
                                        <span
                                            style={{
                                                display: "block",
                                                fontSize: 12.5,
                                                color: muted,
                                                marginTop: 2,
                                                whiteSpace: "nowrap",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                            }}
                                        >
                                            {a.email}
                                        </span>
                                    </span>
                                </button>
                            )
                        })}

                        <button
                            type="button"
                            onClick={function () {
                                go("login")
                            }}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 13,
                                padding: 15,
                                border: "none",
                                borderTop: "1px solid " + border,
                                background: surface,
                                cursor: "pointer",
                                textAlign: "left",
                                fontFamily: "inherit",
                            }}
                        >
                            <span
                                style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: "50%",
                                    border: "1px dashed " + border,
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                }}
                            >
                                <Icon name="user" color={muted} size={19} />
                            </span>
                            <span style={{ fontSize: 14.5, color: text }}>
                                {t.useAnother}
                            </span>
                        </button>
                    </div>

                    <div
                        style={{
                            fontSize: 11.5,
                            color: muted,
                            marginTop: 18,
                            lineHeight: 1.55,
                        }}
                    >
                        {t.legalNote}
                    </div>
                </div>
            </div>
        )
    }

    function renderLogin() {
        const valid = phone.replace(/\D/g, "").length >= 10
        return (
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                <TopBar
                    title=""
                    onBack={function () {
                        go("welcome")
                    }}
                    text={text}
                    muted={muted}
                    border={border}
                />
                <div style={{ flex: 1, padding: "10px 22px" }}>
                    <div
                        style={{
                            fontSize: 24,
                            fontWeight: 700,
                            color: text,
                            letterSpacing: "-0.02em",
                        }}
                    >
                        {t.loginTitle}
                    </div>
                    <div
                        style={{
                            fontSize: 14,
                            color: muted,
                            marginTop: 8,
                            lineHeight: 1.5,
                        }}
                    >
                        {fill(t.loginSub, { count: otpLength })}
                    </div>

                    <div style={{ display: "flex", gap: 10, marginTop: 26 }}>
                        <div
                            style={{
                                padding: "15px 14px",
                                border: "1px solid " + border,
                                borderRadius: radius * 0.7,
                                background: surface,
                                fontSize: 15,
                                color: text,
                                flexShrink: 0,
                            }}
                        >
                            {t.dialCode}
                        </div>
                        <input
                            type="tel"
                            value={phone}
                            onChange={function (e) {
                                setPhone(e.target.value)
                            }}
                            placeholder={t.phonePlaceholder}
                            aria-label="Phone number"
                            style={inputStyle}
                        />
                    </div>

                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            margin: "26px 0",
                        }}
                    >
                        <span
                            style={{ flex: 1, height: 1, background: border }}
                        />
                        <span style={{ fontSize: 12, color: muted }}>or</span>
                        <span
                            style={{ flex: 1, height: 1, background: border }}
                        />
                    </div>

                    <GhostButton
                        label={t.googleCta}
                        icon="google"
                        onClick={function () {
                            go("google")
                        }}
                        border={border}
                        surface={surface}
                        text={text}
                        radius={radius * 0.7}
                    />
                </div>

                <div style={stickyBar}>
                    <PrimaryButton
                        label={t.sendCodeCta}
                        disabled={!valid}
                        onClick={function () {
                            if (valid) startOtp()
                        }}
                        accent={accent}
                        onAccent={onAccent}
                        border={border}
                        muted={muted}
                        radius={radius * 0.7}
                    />
                </div>
            </div>
        )
    }

    function renderOtp() {
        const digits = otp.replace(/\D/g, "").slice(0, otpLength)
        const boxes = []
        for (var b = 0; b < otpLength; b++) boxes.push(b)

        const mins = Math.floor(secondsLeft / 60)
        const secs = secondsLeft % 60
        const clock = mins + ":" + (secs < 10 ? "0" + secs : secs)

        return (
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                <TopBar
                    title=""
                    onBack={function () {
                        go("login")
                    }}
                    text={text}
                    muted={muted}
                    border={border}
                />
                <div style={{ flex: 1, padding: "10px 22px" }}>
                    <div
                        style={{
                            fontSize: 24,
                            fontWeight: 700,
                            color: text,
                            letterSpacing: "-0.02em",
                        }}
                    >
                        {t.otpTitle}
                    </div>
                    <div
                        style={{
                            fontSize: 14,
                            color: muted,
                            marginTop: 8,
                            lineHeight: 1.5,
                        }}
                    >
                        {fill(t.otpSub, {
                            number:
                                t.dialCode +
                                " " +
                                (phone || t.phonePlaceholder),
                        })}
                    </div>

                    <div style={{ position: "relative", marginTop: 28 }}>
                        <div style={{ display: "flex", gap: 10 }}>
                            {boxes.map(function (b) {
                                const filled = digits.length > b
                                const isNext = digits.length === b
                                const boxBorder = otpError
                                    ? nonVegColor
                                    : isNext
                                      ? accent
                                      : border
                                return (
                                    <div
                                        key={b}
                                        style={{
                                            flex: 1,
                                            height: 58,
                                            borderRadius: radius * 0.6,
                                            border: "1.5px solid " + boxBorder,
                                            background: surface,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            fontSize: 22,
                                            fontWeight: 600,
                                            color: text,
                                        }}
                                    >
                                        {filled ? digits.charAt(b) : ""}
                                    </div>
                                )
                            })}
                        </div>
                        <input
                            ref={otpInputRef}
                            type="tel"
                            value={otp}
                            onChange={function (e) {
                                setOtp(e.target.value)
                            }}
                            aria-label="Verification code"
                            style={{
                                position: "absolute",
                                inset: 0,
                                width: "100%",
                                height: "100%",
                                opacity: 0,
                                border: "none",
                                cursor: "pointer",
                            }}
                        />
                    </div>

                    {otpError ? (
                        <div
                            style={{
                                fontSize: 13,
                                color: nonVegColor,
                                marginTop: 14,
                                textAlign: "center",
                            }}
                        >
                            {t.wrongCode}
                        </div>
                    ) : null}

                    <div
                        style={{
                            fontSize: 13,
                            color: muted,
                            marginTop: otpError ? 12 : 20,
                            textAlign: "center",
                        }}
                    >
                        {secondsLeft > 0 ? (
                            <span>{fill(t.resendLabel, { time: clock })}</span>
                        ) : (
                            <button
                                type="button"
                                onClick={function () {
                                    setSecondsLeft(resendSeconds)
                                    setOtp("")
                                    setOtpError(false)
                                }}
                                style={{
                                    border: "none",
                                    background: "transparent",
                                    color: accent,
                                    fontSize: 13,
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    fontFamily: "inherit",
                                    padding: 0,
                                }}
                            >
                                {t.resendReady}
                            </button>
                        )}
                    </div>

                    {props.showOtpHint ? (
                        <div
                            style={{
                                marginTop: 22,
                                padding: "11px 14px",
                                background: accent + "12",
                                border: "1px solid " + accent + "33",
                                borderRadius: radius * 0.5,
                                fontSize: 12.5,
                                color: muted,
                                textAlign: "center",
                            }}
                        >
                            Demo code:{" "}
                            <span
                                style={{
                                    color: text,
                                    fontWeight: 700,
                                    letterSpacing: "0.08em",
                                }}
                            >
                                {demoOtp}
                            </span>
                        </div>
                    ) : null}
                </div>

                <div style={stickyBar}>
                    <PrimaryButton
                        label={t.verifyCta}
                        disabled={digits.length < otpLength}
                        onClick={function () {
                            if (digits === demoOtp) go("home")
                            else setOtpError(true)
                        }}
                        accent={accent}
                        onAccent={onAccent}
                        border={border}
                        muted={muted}
                        radius={radius * 0.7}
                    />
                </div>
            </div>
        )
    }

    function renderHome() {
        return (
            <div
                style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    minHeight: 0,
                }}
            >
                <div style={{ padding: "16px 18px 10px", flexShrink: 0 }}>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                        }}
                    >
                        <Icon name="pin" color={accent} size={18} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12, color: muted }}>
                                {t.deliverTo}
                            </div>
                            <div
                                style={{
                                    fontSize: 14,
                                    fontWeight: 600,
                                    color: text,
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                }}
                            >
                                {activeAddress.label} · {activeAddress.line}
                            </div>
                        </div>
                        {account ? (
                            <span
                                style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: "50%",
                                    overflow: "hidden",
                                    flexShrink: 0,
                                }}
                            >
                                <img
                                    src={avatarImage(
                                        account.name,
                                        account.tint
                                    )}
                                    alt=""
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        display: "block",
                                    }}
                                />
                            </span>
                        ) : null}
                    </div>

                    <div style={{ position: "relative", marginTop: 14 }}>
                        <span
                            style={{
                                position: "absolute",
                                left: 14,
                                top: "50%",
                                transform: "translateY(-50%)",
                                pointerEvents: "none",
                                display: "flex",
                            }}
                        >
                            <Icon name="search" color={muted} size={18} />
                        </span>
                        <input
                            type="text"
                            value={query}
                            onChange={function (e) {
                                setQuery(e.target.value)
                            }}
                            placeholder={t.searchPlaceholder}
                            aria-label="Search"
                            style={{
                                width: "100%",
                                padding: "13px 16px 13px 42px",
                                fontSize: 14,
                                fontFamily: "inherit",
                                color: text,
                                background: surface,
                                border: "1px solid " + border,
                                borderRadius: 999,
                                outline: "none",
                                boxSizing: "border-box",
                            }}
                        />
                    </div>

                    <div
                        style={{
                            display: "flex",
                            gap: 8,
                            marginTop: 14,
                            overflowX: "auto",
                            paddingBottom: 2,
                        }}
                    >
                        <button
                            type="button"
                            onClick={function () {
                                setCategory("__all__")
                            }}
                            style={chip(category === "__all__")}
                        >
                            {t.allLabel}
                        </button>
                        {categories.map(function (c) {
                            return (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={function () {
                                        setCategory(c)
                                    }}
                                    style={chip(category === c)}
                                >
                                    {c}
                                </button>
                            )
                        })}
                    </div>
                </div>

                <div style={scrollArea}>
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 14,
                            marginTop: 12,
                        }}
                    >
                        {visibleItems.map(function (row) {
                            const it = row.item
                            const q = qtyOf(row.index)
                            return (
                                <div
                                    key={row.index}
                                    style={{
                                        display: "flex",
                                        gap: 13,
                                        padding: 11,
                                        background: surface,
                                        border: "1px solid " + border,
                                        borderRadius: radius * 0.75,
                                    }}
                                >
                                    <button
                                        type="button"
                                        onClick={function () {
                                            setOpenItem(row.index)
                                            setDetailQty(q > 0 ? q : 1)
                                            go("detail")
                                        }}
                                        style={{
                                            width: 84,
                                            height: 84,
                                            flexShrink: 0,
                                            borderRadius: radius * 0.55,
                                            overflow: "hidden",
                                            border: "none",
                                            padding: 0,
                                            background: border,
                                            cursor: "pointer",
                                        }}
                                        aria-label={it.name}
                                    >
                                        <img
                                            src={imageFor(it)}
                                            alt=""
                                            style={{
                                                width: "100%",
                                                height: "100%",
                                                objectFit: "cover",
                                                display: "block",
                                            }}
                                        />
                                    </button>

                                    <div
                                        style={{
                                            flex: 1,
                                            minWidth: 0,
                                            display: "flex",
                                            flexDirection: "column",
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 7,
                                            }}
                                        >
                                            <VegMark
                                                show={showVegMarks}
                                                veg={it.veg}
                                                vegColor={vegColor}
                                                nonVegColor={nonVegColor}
                                            />
                                            <span
                                                style={{
                                                    fontSize: 15,
                                                    fontWeight: 600,
                                                    color: text,
                                                    lineHeight: 1.25,
                                                }}
                                            >
                                                {it.name}
                                            </span>
                                        </div>
                                        <div
                                            style={{
                                                fontSize: 12.5,
                                                color: muted,
                                                marginTop: 4,
                                                lineHeight: 1.45,
                                            }}
                                        >
                                            {it.desc}
                                        </div>

                                        {showRatings ? (
                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 12,
                                                    marginTop: 7,
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        display: "inline-flex",
                                                        alignItems: "center",
                                                        gap: 4,
                                                        fontSize: 12,
                                                        color: muted,
                                                    }}
                                                >
                                                    <Icon
                                                        name="star"
                                                        color={starColor}
                                                        size={13}
                                                    />
                                                    {it.rating}
                                                </span>
                                                <span
                                                    style={{
                                                        display: "inline-flex",
                                                        alignItems: "center",
                                                        gap: 4,
                                                        fontSize: 12,
                                                        color: muted,
                                                    }}
                                                >
                                                    <Icon
                                                        name="clock"
                                                        color={muted}
                                                        size={13}
                                                    />
                                                    {it.time}
                                                </span>
                                            </div>
                                        ) : null}

                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "space-between",
                                                marginTop: "auto",
                                                paddingTop: 9,
                                            }}
                                        >
                                            <span
                                                style={{
                                                    fontSize: 15,
                                                    fontWeight: 700,
                                                    color: text,
                                                }}
                                            >
                                                {money(it.price)}
                                            </span>
                                            {q > 0 ? (
                                                <QtyStepper
                                                    value={q}
                                                    onMinus={function () {
                                                        addToCart(row.index, -1)
                                                    }}
                                                    onPlus={function () {
                                                        addToCart(row.index, 1)
                                                    }}
                                                    border={border}
                                                    surface={bg}
                                                    accent={accent}
                                                    text={text}
                                                />
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={function () {
                                                        addToCart(row.index, 1)
                                                    }}
                                                    style={{
                                                        border:
                                                            "1px solid " +
                                                            accent,
                                                        background:
                                                            "transparent",
                                                        color: accent,
                                                        borderRadius: 999,
                                                        padding: "7px 18px",
                                                        fontSize: 13,
                                                        fontWeight: 600,
                                                        cursor: "pointer",
                                                        fontFamily: "inherit",
                                                    }}
                                                >
                                                    {t.addCta}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}

                        {visibleItems.length === 0 ? (
                            <div
                                style={{
                                    padding: "40px 20px",
                                    textAlign: "center",
                                    color: muted,
                                    fontSize: 14,
                                }}
                            >
                                {t.noResults}
                            </div>
                        ) : null}
                    </div>
                </div>

                {cartCount > 0 ? (
                    <div style={{ padding: "10px 18px 6px", flexShrink: 0 }}>
                        <button
                            type="button"
                            onClick={function () {
                                go("cart")
                            }}
                            style={{
                                width: "100%",
                                border: "none",
                                background: accent,
                                color: onAccent,
                                borderRadius: radius * 0.7,
                                padding: "13px 18px",
                                fontSize: 14,
                                fontWeight: 600,
                                cursor: "pointer",
                                fontFamily: "inherit",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                            }}
                        >
                            <span>
                                {cartCount} · {money(subtotal)}
                            </span>
                            <span>{t.viewCartCta}</span>
                        </button>
                    </div>
                ) : null}
            </div>
        )
    }

    function renderDetail() {
        const it = items[openItem]
        if (!it) return renderHome()

        return (
            <div
                style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    minHeight: 0,
                }}
            >
                <div style={{ position: "relative", flexShrink: 0 }}>
                    <div
                        style={{
                            width: "100%",
                            aspectRatio: "16 / 11",
                            overflow: "hidden",
                            background: border,
                        }}
                    >
                        <img
                            src={imageFor(it)}
                            alt=""
                            style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                display: "block",
                            }}
                        />
                    </div>
                    <button
                        type="button"
                        onClick={function () {
                            go("home")
                        }}
                        aria-label="Back"
                        style={{
                            position: "absolute",
                            top: 14,
                            left: 14,
                            width: 36,
                            height: 36,
                            borderRadius: "50%",
                            border: "none",
                            background: surface,
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            boxShadow: "0 2px 10px rgba(0,0,0,0.14)",
                            padding: 0,
                        }}
                    >
                        <Icon name="back" color={text} size={19} />
                    </button>
                    <button
                        type="button"
                        aria-label="Save"
                        style={{
                            position: "absolute",
                            top: 14,
                            right: 14,
                            width: 36,
                            height: 36,
                            borderRadius: "50%",
                            border: "none",
                            background: surface,
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            boxShadow: "0 2px 10px rgba(0,0,0,0.14)",
                            padding: 0,
                        }}
                    >
                        <Icon name="heart" color={muted} size={18} />
                    </button>
                </div>

                <div style={scrollArea}>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            marginTop: 18,
                        }}
                    >
                        <VegMark
                            show={showVegMarks}
                            veg={it.veg}
                            size={15}
                            vegColor={vegColor}
                            nonVegColor={nonVegColor}
                        />
                        <span
                            style={{
                                fontSize: 12,
                                color: muted,
                                letterSpacing: "0.05em",
                                textTransform: "uppercase",
                            }}
                        >
                            {it.category}
                        </span>
                    </div>

                    <div
                        style={{
                            fontSize: 23,
                            fontWeight: 700,
                            color: text,
                            marginTop: 8,
                            letterSpacing: "-0.02em",
                            lineHeight: 1.2,
                        }}
                    >
                        {it.name}
                    </div>

                    {showRatings ? (
                        <div
                            style={{ display: "flex", gap: 16, marginTop: 12 }}
                        >
                            <span
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 5,
                                    fontSize: 13,
                                    color: muted,
                                }}
                            >
                                <Icon name="star" color={starColor} size={15} />
                                {it.rating}
                            </span>
                            <span
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 5,
                                    fontSize: 13,
                                    color: muted,
                                }}
                            >
                                <Icon name="clock" color={muted} size={15} />
                                {it.time}
                            </span>
                        </div>
                    ) : null}

                    <div
                        style={{
                            fontSize: 14.5,
                            color: muted,
                            marginTop: 16,
                            lineHeight: 1.6,
                        }}
                    >
                        {it.desc}
                    </div>

                    <div
                        style={{
                            height: 1,
                            background: border,
                            margin: "20px 0",
                        }}
                    />

                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                        }}
                    >
                        <span
                            style={{
                                fontSize: 15,
                                fontWeight: 600,
                                color: text,
                            }}
                        >
                            {t.quantityLabel}
                        </span>
                        <QtyStepper
                            value={detailQty}
                            onMinus={function () {
                                setDetailQty(Math.max(1, detailQty - 1))
                            }}
                            onPlus={function () {
                                setDetailQty(Math.min(99, detailQty + 1))
                            }}
                            border={border}
                            surface={surface}
                            accent={accent}
                            text={text}
                        />
                    </div>
                </div>

                <div style={stickyBar}>
                    <PrimaryButton
                        label={t.addToCartCta}
                        note={money((Number(it.price) || 0) * detailQty)}
                        onClick={function () {
                            const have = qtyOf(openItem)
                            addToCart(openItem, detailQty - have)
                            go("cart")
                        }}
                        accent={accent}
                        onAccent={onAccent}
                        border={border}
                        muted={muted}
                        radius={radius * 0.7}
                    />
                </div>
            </div>
        )
    }

    function renderCart() {
        return (
            <div
                style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    minHeight: 0,
                }}
            >
                <TopBar
                    title={t.cartTitle}
                    sub={cartCount > 0 ? String(cartCount) : ""}
                    onBack={function () {
                        go("home")
                    }}
                    text={text}
                    muted={muted}
                    border={border}
                />

                <div style={scrollArea}>
                    {cart.length === 0 ? (
                        <div
                            style={{
                                padding: "60px 20px",
                                textAlign: "center",
                            }}
                        >
                            <div
                                style={{
                                    display: "inline-flex",
                                    marginBottom: 14,
                                }}
                            >
                                <Icon name="cart" color={border} size={46} />
                            </div>
                            <div
                                style={{
                                    fontSize: 16,
                                    fontWeight: 600,
                                    color: text,
                                }}
                            >
                                {t.emptyCartTitle}
                            </div>
                            <div
                                style={{
                                    fontSize: 13.5,
                                    color: muted,
                                    marginTop: 6,
                                }}
                            >
                                {t.emptyCartSub}
                            </div>
                            <button
                                type="button"
                                onClick={function () {
                                    go("home")
                                }}
                                style={{
                                    marginTop: 20,
                                    border: "none",
                                    background: accent,
                                    color: onAccent,
                                    borderRadius: 999,
                                    padding: "11px 26px",
                                    fontSize: 14,
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    fontFamily: "inherit",
                                }}
                            >
                                {t.browseCta}
                            </button>
                        </div>
                    ) : (
                        <div>
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 12,
                                    marginTop: 4,
                                }}
                            >
                                {cart.map(function (line) {
                                    const it = items[line.index]
                                    if (!it) return null
                                    return (
                                        <div
                                            key={line.index}
                                            style={{
                                                display: "flex",
                                                gap: 12,
                                                padding: 11,
                                                background: surface,
                                                border: "1px solid " + border,
                                                borderRadius: radius * 0.7,
                                                alignItems: "center",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    width: 60,
                                                    height: 60,
                                                    flexShrink: 0,
                                                    borderRadius: radius * 0.45,
                                                    overflow: "hidden",
                                                    background: border,
                                                }}
                                            >
                                                <img
                                                    src={imageFor(it)}
                                                    alt=""
                                                    style={{
                                                        width: "100%",
                                                        height: "100%",
                                                        objectFit: "cover",
                                                        display: "block",
                                                    }}
                                                />
                                            </div>
                                            <div
                                                style={{ flex: 1, minWidth: 0 }}
                                            >
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: 6,
                                                    }}
                                                >
                                                    <VegMark
                                                        show={showVegMarks}
                                                        veg={it.veg}
                                                        size={12}
                                                        vegColor={vegColor}
                                                        nonVegColor={
                                                            nonVegColor
                                                        }
                                                    />
                                                    <span
                                                        style={{
                                                            fontSize: 14,
                                                            fontWeight: 600,
                                                            color: text,
                                                        }}
                                                    >
                                                        {it.name}
                                                    </span>
                                                </div>
                                                <div
                                                    style={{
                                                        fontSize: 14,
                                                        fontWeight: 700,
                                                        color: text,
                                                        marginTop: 6,
                                                    }}
                                                >
                                                    {money(
                                                        (Number(it.price) ||
                                                            0) * line.qty
                                                    )}
                                                </div>
                                            </div>
                                            <div
                                                style={{
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    alignItems: "flex-end",
                                                    gap: 8,
                                                }}
                                            >
                                                <button
                                                    type="button"
                                                    onClick={function () {
                                                        removeLine(line.index)
                                                    }}
                                                    aria-label="Remove"
                                                    style={{
                                                        border: "none",
                                                        background:
                                                            "transparent",
                                                        cursor: "pointer",
                                                        padding: 2,
                                                    }}
                                                >
                                                    <Icon
                                                        name="trash"
                                                        color={muted}
                                                        size={17}
                                                    />
                                                </button>
                                                <QtyStepper
                                                    value={line.qty}
                                                    onMinus={function () {
                                                        addToCart(
                                                            line.index,
                                                            -1
                                                        )
                                                    }}
                                                    onPlus={function () {
                                                        addToCart(line.index, 1)
                                                    }}
                                                    border={border}
                                                    surface={bg}
                                                    accent={accent}
                                                    text={text}
                                                />
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            <div
                                style={{
                                    marginTop: 18,
                                    background: surface,
                                    border: "1px solid " + border,
                                    borderRadius: radius * 0.7,
                                    padding: 15,
                                }}
                            >
                                <div style={sectionLabel}>{t.billTitle}</div>
                                <Row
                                    label={t.itemTotalLabel}
                                    value={money(subtotal)}
                                    muted={muted}
                                    text={text}
                                />
                                <Row
                                    label={t.deliveryLabel}
                                    value={
                                        shipping === 0
                                            ? t.freeLabel
                                            : money(shipping)
                                    }
                                    muted={muted}
                                    text={text}
                                    valueColor={
                                        shipping === 0 ? successColor : text
                                    }
                                />
                                <Row
                                    label={fill(t.taxLabel, {
                                        percent: taxPercent,
                                    })}
                                    value={money(tax)}
                                    muted={muted}
                                    text={text}
                                />
                                <div
                                    style={{
                                        height: 1,
                                        background: border,
                                        margin: "11px 0",
                                    }}
                                />
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                    }}
                                >
                                    <span
                                        style={{
                                            fontSize: 15,
                                            fontWeight: 700,
                                            color: text,
                                        }}
                                    >
                                        {t.toPayLabel}
                                    </span>
                                    <span
                                        style={{
                                            fontSize: 15,
                                            fontWeight: 700,
                                            color: text,
                                        }}
                                    >
                                        {money(total)}
                                    </span>
                                </div>
                            </div>

                            {subtotal < freeAbove && subtotal > 0 ? (
                                <div
                                    style={{
                                        marginTop: 12,
                                        fontSize: 12.5,
                                        color: muted,
                                        textAlign: "center",
                                    }}
                                >
                                    {fill(t.freeHint, {
                                        amount: money(freeAbove - subtotal),
                                    })}
                                </div>
                            ) : null}
                        </div>
                    )}
                </div>

                {cart.length > 0 ? (
                    <div style={stickyBar}>
                        <PrimaryButton
                            label={t.addressCta}
                            note={money(total)}
                            onClick={function () {
                                go("address")
                            }}
                            accent={accent}
                            onAccent={onAccent}
                            border={border}
                            muted={muted}
                            radius={radius * 0.7}
                        />
                    </div>
                ) : null}
            </div>
        )
    }

    function renderAddress() {
        return (
            <div
                style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    minHeight: 0,
                }}
            >
                <TopBar
                    title={t.addressTitle}
                    onBack={function () {
                        go("cart")
                    }}
                    text={text}
                    muted={muted}
                    border={border}
                />

                <div style={scrollArea}>
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 11,
                            marginTop: 6,
                        }}
                    >
                        {addresses.map(function (a, i) {
                            const active = i === addressIndex
                            return (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={function () {
                                        setAddressIndex(i)
                                    }}
                                    style={{
                                        display: "flex",
                                        gap: 12,
                                        padding: 15,
                                        background: surface,
                                        border:
                                            "1.5px solid " +
                                            (active ? accent : border),
                                        borderRadius: radius * 0.7,
                                        cursor: "pointer",
                                        textAlign: "left",
                                        fontFamily: "inherit",
                                        alignItems: "flex-start",
                                    }}
                                >
                                    <span
                                        style={{
                                            marginTop: 2,
                                            display: "flex",
                                        }}
                                    >
                                        <Icon
                                            name="pin"
                                            color={active ? accent : muted}
                                            size={19}
                                        />
                                    </span>
                                    <span style={{ flex: 1, minWidth: 0 }}>
                                        <span
                                            style={{
                                                display: "block",
                                                fontSize: 14.5,
                                                fontWeight: 600,
                                                color: text,
                                            }}
                                        >
                                            {a.label}
                                        </span>
                                        <span
                                            style={{
                                                display: "block",
                                                fontSize: 13,
                                                color: muted,
                                                marginTop: 4,
                                                lineHeight: 1.45,
                                            }}
                                        >
                                            {a.line}
                                        </span>
                                    </span>
                                    <span
                                        style={{
                                            width: 19,
                                            height: 19,
                                            borderRadius: "50%",
                                            border:
                                                "1.5px solid " +
                                                (active ? accent : border),
                                            background: active
                                                ? accent
                                                : "transparent",
                                            display: "inline-flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            flexShrink: 0,
                                            marginTop: 2,
                                        }}
                                    >
                                        {active ? (
                                            <Icon
                                                name="check"
                                                color={onAccent}
                                                size={12}
                                            />
                                        ) : null}
                                    </span>
                                </button>
                            )
                        })}
                    </div>

                    {t.newAddressLabel ? (
                        <div
                            style={{
                                marginTop: 14,
                                padding: 15,
                                border: "1px dashed " + border,
                                borderRadius: radius * 0.7,
                                fontSize: 14,
                                color: accent,
                                fontWeight: 500,
                                textAlign: "center",
                            }}
                        >
                            {t.newAddressLabel}
                        </div>
                    ) : null}

                    {t.instructionsLabel ? (
                        <div style={{ marginTop: 20 }}>
                            <div
                                style={{
                                    fontSize: 13,
                                    fontWeight: 600,
                                    color: text,
                                    marginBottom: 9,
                                }}
                            >
                                {t.instructionsLabel}
                            </div>
                            <input
                                type="text"
                                placeholder={t.instructionsPlaceholder}
                                aria-label="Instructions"
                                style={inputStyle}
                            />
                        </div>
                    ) : null}
                </div>

                <div style={stickyBar}>
                    <PrimaryButton
                        label={t.paymentCta}
                        onClick={function () {
                            go("payment")
                        }}
                        accent={accent}
                        onAccent={onAccent}
                        border={border}
                        muted={muted}
                        radius={radius * 0.7}
                    />
                </div>
            </div>
        )
    }

    function renderPayment() {
        return (
            <div
                style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    minHeight: 0,
                }}
            >
                <TopBar
                    title={t.paymentTitle}
                    sub={money(total)}
                    onBack={function () {
                        go("address")
                    }}
                    text={text}
                    muted={muted}
                    border={border}
                />

                <div style={scrollArea}>
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 11,
                            marginTop: 6,
                        }}
                    >
                        {payments.map(function (m, i) {
                            const active = i === payIndex
                            return (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={function () {
                                        setPayIndex(i)
                                    }}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 13,
                                        padding: 15,
                                        background: surface,
                                        border:
                                            "1.5px solid " +
                                            (active ? accent : border),
                                        borderRadius: radius * 0.7,
                                        cursor: "pointer",
                                        textAlign: "left",
                                        fontFamily: "inherit",
                                    }}
                                >
                                    <span
                                        style={{
                                            width: 40,
                                            height: 40,
                                            borderRadius: radius * 0.45,
                                            background: active
                                                ? accent + "1A"
                                                : bg,
                                            display: "inline-flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            flexShrink: 0,
                                        }}
                                    >
                                        <Icon
                                            name={m.icon}
                                            color={active ? accent : muted}
                                            size={20}
                                        />
                                    </span>
                                    <span style={{ flex: 1, minWidth: 0 }}>
                                        <span
                                            style={{
                                                display: "block",
                                                fontSize: 14.5,
                                                fontWeight: 600,
                                                color: text,
                                            }}
                                        >
                                            {m.label}
                                        </span>
                                        <span
                                            style={{
                                                display: "block",
                                                fontSize: 12.5,
                                                color: muted,
                                                marginTop: 3,
                                            }}
                                        >
                                            {m.sub}
                                        </span>
                                    </span>
                                    <span
                                        style={{
                                            width: 19,
                                            height: 19,
                                            borderRadius: "50%",
                                            border:
                                                "1.5px solid " +
                                                (active ? accent : border),
                                            background: active
                                                ? accent
                                                : "transparent",
                                            display: "inline-flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            flexShrink: 0,
                                        }}
                                    >
                                        {active ? (
                                            <Icon
                                                name="check"
                                                color={onAccent}
                                                size={12}
                                            />
                                        ) : null}
                                    </span>
                                </button>
                            )
                        })}
                    </div>

                    <div
                        style={{
                            marginTop: 18,
                            background: surface,
                            border: "1px solid " + border,
                            borderRadius: radius * 0.7,
                            padding: 15,
                        }}
                    >
                        <Row
                            label={t.itemTotalLabel}
                            value={money(subtotal)}
                            muted={muted}
                            text={text}
                        />
                        <Row
                            label={t.deliveryLabel}
                            value={
                                shipping === 0 ? t.freeLabel : money(shipping)
                            }
                            muted={muted}
                            text={text}
                        />
                        <Row
                            label={fill(t.taxLabel, { percent: taxPercent })}
                            value={money(tax)}
                            muted={muted}
                            text={text}
                        />
                        <div
                            style={{
                                height: 1,
                                background: border,
                                margin: "11px 0",
                            }}
                        />
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                            }}
                        >
                            <span
                                style={{
                                    fontSize: 15,
                                    fontWeight: 700,
                                    color: text,
                                }}
                            >
                                {t.toPayLabel}
                            </span>
                            <span
                                style={{
                                    fontSize: 15,
                                    fontWeight: 700,
                                    color: text,
                                }}
                            >
                                {money(total)}
                            </span>
                        </div>
                    </div>
                </div>

                <div style={stickyBar}>
                    <PrimaryButton
                        label={t.payNowCta}
                        note={money(total)}
                        onClick={function () {
                            setTrackStep(1)
                            go("success")
                        }}
                        accent={accent}
                        onAccent={onAccent}
                        border={border}
                        muted={muted}
                        radius={radius * 0.7}
                    />
                </div>
            </div>
        )
    }

    function renderSuccess() {
        return (
            <div
                style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    padding: 26,
                }}
            >
                <div
                    style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        textAlign: "center",
                    }}
                >
                    <div
                        style={{
                            width: 84,
                            height: 84,
                            borderRadius: "50%",
                            background: successColor,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            marginBottom: 22,
                        }}
                    >
                        <Icon name="check" color="#FFFFFF" size={40} />
                    </div>
                    <div
                        style={{
                            fontSize: 23,
                            fontWeight: 700,
                            color: text,
                            letterSpacing: "-0.02em",
                        }}
                    >
                        {t.successTitle}
                    </div>
                    <div
                        style={{
                            fontSize: 14,
                            color: muted,
                            marginTop: 10,
                            lineHeight: 1.55,
                            maxWidth: 264,
                        }}
                    >
                        {fill(t.successSub, {
                            amount: money(total),
                            place: activeAddress.label,
                        })}
                    </div>

                    <div
                        style={{
                            marginTop: 24,
                            padding: "13px 20px",
                            background: surface,
                            border: "1px solid " + border,
                            borderRadius: radius * 0.7,
                            fontSize: 13,
                            color: muted,
                        }}
                    >
                        {t.orderIdLabel}{" "}
                        <span style={{ color: text, fontWeight: 600 }}>
                            #{orderId}
                        </span>
                    </div>
                </div>

                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 11,
                    }}
                >
                    <PrimaryButton
                        label={t.trackCta}
                        onClick={function () {
                            go("track")
                        }}
                        accent={accent}
                        onAccent={onAccent}
                        border={border}
                        muted={muted}
                        radius={radius * 0.7}
                    />
                    <GhostButton
                        label={t.homeCta}
                        onClick={function () {
                            setCart([])
                            go("home")
                        }}
                        border={border}
                        surface="transparent"
                        text={text}
                        radius={radius * 0.7}
                    />
                </div>
            </div>
        )
    }

    function renderTrack() {
        return (
            <div
                style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    minHeight: 0,
                }}
            >
                <TopBar
                    title={t.trackTitle}
                    sub={"#" + orderId}
                    onBack={function () {
                        go("success")
                    }}
                    text={text}
                    muted={muted}
                    border={border}
                />

                <div style={scrollArea}>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 13,
                            padding: 15,
                            background: accent + "12",
                            border: "1px solid " + accent + "33",
                            borderRadius: radius * 0.7,
                            marginTop: 4,
                        }}
                    >
                        <span
                            style={{
                                width: 42,
                                height: 42,
                                borderRadius: "50%",
                                background: accent,
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                            }}
                        >
                            <Icon name="bike" color={onAccent} size={22} />
                        </span>
                        <span style={{ flex: 1, minWidth: 0 }}>
                            <span
                                style={{
                                    display: "block",
                                    fontSize: 14.5,
                                    fontWeight: 600,
                                    color: text,
                                }}
                            >
                                {t.etaTitle}
                            </span>
                            <span
                                style={{
                                    display: "block",
                                    fontSize: 12.5,
                                    color: muted,
                                    marginTop: 3,
                                }}
                            >
                                {t.riderLine}
                            </span>
                        </span>
                    </div>

                    <div style={{ marginTop: 24 }}>
                        {trackSteps.map(function (st, i) {
                            const done = i <= trackStep
                            const isLast = i === trackSteps.length - 1
                            return (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={function () {
                                        setTrackStep(i)
                                    }}
                                    style={{
                                        display: "flex",
                                        gap: 14,
                                        width: "100%",
                                        border: "none",
                                        background: "transparent",
                                        padding: 0,
                                        textAlign: "left",
                                        cursor: "pointer",
                                        fontFamily: "inherit",
                                    }}
                                >
                                    <span
                                        style={{
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "center",
                                            flexShrink: 0,
                                        }}
                                    >
                                        <span
                                            style={{
                                                width: 24,
                                                height: 24,
                                                borderRadius: "50%",
                                                background: done
                                                    ? accent
                                                    : "transparent",
                                                border:
                                                    "1.5px solid " +
                                                    (done ? accent : border),
                                                display: "inline-flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                            }}
                                        >
                                            {done ? (
                                                <Icon
                                                    name="check"
                                                    color={onAccent}
                                                    size={13}
                                                />
                                            ) : null}
                                        </span>
                                        {!isLast ? (
                                            <span
                                                style={{
                                                    width: 2,
                                                    height: 42,
                                                    background:
                                                        i < trackStep
                                                            ? accent
                                                            : border,
                                                }}
                                            />
                                        ) : null}
                                    </span>
                                    <span
                                        style={{
                                            paddingBottom: isLast ? 0 : 18,
                                            flex: 1,
                                        }}
                                    >
                                        <span
                                            style={{
                                                display: "block",
                                                fontSize: 14.5,
                                                fontWeight: 600,
                                                color: done ? text : muted,
                                            }}
                                        >
                                            {st.title}
                                        </span>
                                        <span
                                            style={{
                                                display: "block",
                                                fontSize: 12.5,
                                                color: muted,
                                                marginTop: 3,
                                            }}
                                        >
                                            {st.sub}
                                        </span>
                                    </span>
                                </button>
                            )
                        })}
                    </div>

                    <div
                        style={{
                            marginTop: 20,
                            background: surface,
                            border: "1px solid " + border,
                            borderRadius: radius * 0.7,
                            padding: 15,
                        }}
                    >
                        <div style={sectionLabel}>{t.summaryTitle}</div>
                        {cart.map(function (line) {
                            const it = items[line.index]
                            if (!it) return null
                            return (
                                <Row
                                    key={line.index}
                                    label={line.qty + " × " + it.name}
                                    value={money(
                                        (Number(it.price) || 0) * line.qty
                                    )}
                                    muted={muted}
                                    text={text}
                                />
                            )
                        })}
                        <div
                            style={{
                                height: 1,
                                background: border,
                                margin: "11px 0",
                            }}
                        />
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                            }}
                        >
                            <span
                                style={{
                                    fontSize: 14.5,
                                    fontWeight: 700,
                                    color: text,
                                }}
                            >
                                {t.paidLabel}
                            </span>
                            <span
                                style={{
                                    fontSize: 14.5,
                                    fontWeight: 700,
                                    color: text,
                                }}
                            >
                                {money(total)}
                            </span>
                        </div>
                    </div>
                </div>

                <div style={stickyBar}>
                    <GhostButton
                        label={t.orderAgainCta}
                        onClick={function () {
                            setCart([])
                            go("home")
                        }}
                        border={border}
                        surface="transparent"
                        text={text}
                        radius={radius * 0.7}
                    />
                </div>
            </div>
        )
    }

    /* ---------- pick a screen ---------- */
    let body = null
    if (screen === "welcome") body = renderWelcome()
    else if (screen === "google") body = renderGoogle()
    else if (screen === "login") body = renderLogin()
    else if (screen === "otp") body = renderOtp()
    else if (screen === "detail") body = renderDetail()
    else if (screen === "cart") body = renderCart()
    else if (screen === "address") body = renderAddress()
    else if (screen === "payment") body = renderPayment()
    else if (screen === "success") body = renderSuccess()
    else if (screen === "track") body = renderTrack()
    else body = renderHome()

    const showNav = screen === "home" || screen === "cart" || screen === "track"

    function handleTab(key) {
        if (key === "cart") go("cart")
        else if (key === "account") go("welcome")
        else go("home")
        setTab(key)
    }

    const phoneStyle = {
        width: "100%",
        height: "100%",
        maxWidth: showFrame ? 390 : "none",
        margin: "0 auto",
        background: bg,
        color: text,
        fontFamily: font,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        borderRadius: showFrame ? radius : 0,
        border: showFrame ? "1px solid " + border : "none",
        boxSizing: "border-box",
        position: "relative",
    }

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                background: "transparent",
            }}
        >
            <div style={phoneStyle}>
                {isStatic ? (
                    <div
                        style={{
                            flex: 1,
                            display: "flex",
                            flexDirection: "column",
                            minHeight: 0,
                        }}
                    >
                        {body}
                    </div>
                ) : (
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={screen}
                            initial={{ opacity: 0, x: 14 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -14 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            style={{
                                flex: 1,
                                display: "flex",
                                flexDirection: "column",
                                minHeight: 0,
                            }}
                        >
                            {body}
                        </motion.div>
                    </AnimatePresence>
                )}

                {showNav ? (
                    <BottomNav
                        active={screen === "cart" ? "cart" : tab}
                        onTab={handleTab}
                        cartCount={cartCount}
                        accent={accent}
                        onAccent={onAccent}
                        muted={muted}
                        border={border}
                        surface={surface}
                        labels={{
                            home: t.navHome,
                            search: t.navSearch,
                            cart: t.navCart,
                            account: t.navAccount,
                        }}
                    />
                ) : null}
            </div>
        </div>
    )
}

FoodOrderApp.defaultProps = {
    startScreen: "welcome",
    appName: "Bento",
    tagline: "Great food from the best kitchens near you, delivered hot.",
    phoneCta: "Continue with phone",
    googleCta: "Continue with Google",
    guestCta: "Skip for now",
    legalNote: "By continuing you agree to our Terms and Privacy Policy",
    loginTitle: "Enter your number",
    loginSub: "We will send a {count} digit code to verify",
    dialCode: "+91",
    phonePlaceholder: "98765 43210",
    sendCodeCta: "Send code",
    otpTitle: "Verify your number",
    otpSub: "Code sent to {number}",
    verifyCta: "Verify and continue",
    wrongCode: "That code is not right. Try again.",
    resendLabel: "Resend code in {time}",
    resendReady: "Resend code",
    demoOtp: "1234",
    resendSeconds: 30,
    showOtpHint: true,
    googleTitle: "Choose an account",
    googleSub: "to continue to {app}",
    useAnother: "Use another account",
    deliverTo: "Deliver to",
    searchPlaceholder: "Search dishes",
    allLabel: "All",
    addCta: "Add",
    viewCartCta: "View cart",
    noResults: "Nothing matches that search.",
    quantityLabel: "Quantity",
    addToCartCta: "Add to cart",
    cartTitle: "Your cart",
    emptyCartTitle: "Your cart is empty",
    emptyCartSub: "Add something tasty to get started",
    browseCta: "Browse menu",
    billTitle: "Bill details",
    itemTotalLabel: "Item total",
    deliveryLabel: "Delivery fee",
    freeLabel: "Free",
    taxLabel: "Taxes ({percent}%)",
    toPayLabel: "To pay",
    freeHint: "Add {amount} more for free delivery",
    addressCta: "Choose address",
    addressTitle: "Delivery address",
    newAddressLabel: "+ Add a new address",
    instructionsLabel: "Delivery instructions",
    instructionsPlaceholder: "Ring the bell, leave at door",
    paymentCta: "Continue to payment",
    paymentTitle: "Payment",
    payNowCta: "Pay now",
    successTitle: "Order placed",
    successSub:
        "{amount} paid. Your food is being prepared and will reach {place} soon.",
    orderIdLabel: "Order ID",
    trackCta: "Track order",
    homeCta: "Back to home",
    trackTitle: "Track order",
    etaTitle: "Arriving in 22 minutes",
    riderLine: "Rider: Rahul · 4.9 rating",
    summaryTitle: "Order summary",
    paidLabel: "Paid",
    orderAgainCta: "Order again",
    navHome: "Home",
    navSearch: "Search",
    navCart: "Cart",
    navAccount: "Account",
    currency: "₹",
    currencyAfter: false,
    numberLocale: "en-IN",
    deliveryFee: 39,
    taxPercent: 5,
    freeAbove: 499,
    showVegMarks: true,
    showRatings: true,
    showFrame: true,
    accentColor: "#E8541E",
    onAccentColor: "#FFFFFF",
    backgroundColor: "#FAF8F5",
    surfaceColor: "#FFFFFF",
    textColor: "#1A1614",
    mutedColor: "#8A8078",
    borderColor: "#E6DFD6",
    successColor: "#0A8F3C",
    vegColor: "#0A8F3C",
    nonVegColor: "#C4271A",
    starColor: "#F5A623",
    radius: 22,
    fontFamily: "Inter, sans-serif",
    items: DEMO_ITEMS,
    accounts: DEMO_ACCOUNTS,
    addresses: DEMO_ADDRESSES,
    payments: DEMO_PAYMENTS,
    trackSteps: DEMO_TRACK,
}

addPropertyControls(FoodOrderApp, {
    startScreen: {
        type: ControlType.Enum,
        title: "Start On",
        options: [
            "welcome",
            "google",
            "login",
            "otp",
            "home",
            "detail",
            "cart",
            "address",
            "payment",
            "success",
            "track",
        ],
        optionTitles: [
            "Welcome",
            "Google chooser",
            "Phone login",
            "OTP",
            "Home",
            "Item detail",
            "Cart",
            "Address",
            "Payment",
            "Success",
            "Tracking",
        ],
        defaultValue: "welcome",
        description: "Which screen the flow opens on.",
    },

    /* ---------- data ---------- */
    items: {
        type: ControlType.Array,
        title: "Menu Items",
        control: {
            type: ControlType.Object,
            controls: {
                name: {
                    type: ControlType.String,
                    title: "Name",
                    defaultValue: "New dish",
                },
                desc: {
                    type: ControlType.String,
                    title: "Description",
                    displayTextArea: true,
                    defaultValue: "",
                },
                price: {
                    type: ControlType.Number,
                    title: "Price",
                    min: 0,
                    max: 1000000,
                    step: 10,
                    displayStepper: false,
                    defaultValue: 299,
                },
                category: {
                    type: ControlType.String,
                    title: "Category",
                    defaultValue: "Mains",
                },
                rating: {
                    type: ControlType.Number,
                    title: "Rating",
                    min: 0,
                    max: 5,
                    step: 0.1,
                    displayStepper: false,
                    defaultValue: 4.5,
                },
                time: {
                    type: ControlType.String,
                    title: "Prep Time",
                    defaultValue: "20 min",
                },
                veg: {
                    type: ControlType.Boolean,
                    title: "Vegetarian",
                    defaultValue: true,
                },
                image: { type: ControlType.Image, title: "Photo" },
            },
        },
    },
    accounts: {
        type: ControlType.Array,
        title: "Google Accounts",
        maxCount: 4,
        control: {
            type: ControlType.Object,
            controls: {
                name: {
                    type: ControlType.String,
                    title: "Name",
                    defaultValue: "Dev Sharma",
                },
                email: {
                    type: ControlType.String,
                    title: "Email",
                    defaultValue: "name@gmail.com",
                },
                tint: {
                    type: ControlType.Color,
                    title: "Avatar",
                    defaultValue: "#4285F4",
                },
            },
        },
    },
    addresses: {
        type: ControlType.Array,
        title: "Addresses",
        maxCount: 5,
        control: {
            type: ControlType.Object,
            controls: {
                label: {
                    type: ControlType.String,
                    title: "Label",
                    defaultValue: "Home",
                },
                line: {
                    type: ControlType.String,
                    title: "Address",
                    displayTextArea: true,
                    defaultValue: "",
                },
            },
        },
    },
    payments: {
        type: ControlType.Array,
        title: "Payment Methods",
        maxCount: 6,
        control: {
            type: ControlType.Object,
            controls: {
                label: {
                    type: ControlType.String,
                    title: "Label",
                    defaultValue: "UPI",
                },
                sub: {
                    type: ControlType.String,
                    title: "Sub Label",
                    defaultValue: "",
                },
                icon: {
                    type: ControlType.Enum,
                    title: "Icon",
                    options: ["phone", "card", "wallet", "cash", "bag", "gift"],
                    optionTitles: [
                        "Phone",
                        "Card",
                        "Wallet",
                        "Cash",
                        "Bag",
                        "Gift",
                    ],
                    defaultValue: "phone",
                },
            },
        },
    },
    trackSteps: {
        type: ControlType.Array,
        title: "Tracking Steps",
        maxCount: 6,
        control: {
            type: ControlType.Object,
            controls: {
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "Order confirmed",
                },
                sub: {
                    type: ControlType.String,
                    title: "Sub",
                    defaultValue: "",
                },
            },
        },
    },

    /* ---------- pricing ---------- */
    currency: {
        type: ControlType.String,
        title: "Currency",
        defaultValue: "₹",
        maxLength: 4,
    },
    currencyAfter: {
        type: ControlType.Boolean,
        title: "Symbol After",
        defaultValue: false,
        description: "On for 100 €, off for €100.",
    },
    numberLocale: {
        type: ControlType.String,
        title: "Number Locale",
        defaultValue: "en-IN",
        description: "en-IN, en-US, de-DE and so on.",
    },
    deliveryFee: {
        type: ControlType.Number,
        title: "Delivery Fee",
        min: 0,
        max: 100000,
        step: 5,
        displayStepper: false,
        defaultValue: 39,
    },
    freeAbove: {
        type: ControlType.Number,
        title: "Free Above",
        min: 0,
        max: 1000000,
        step: 50,
        displayStepper: false,
        defaultValue: 499,
    },
    taxPercent: {
        type: ControlType.Number,
        title: "Tax",
        min: 0,
        max: 40,
        step: 1,
        unit: "%",
        defaultValue: 5,
    },

    /* ---------- auth ---------- */
    demoOtp: {
        type: ControlType.String,
        title: "Demo Code",
        defaultValue: "1234",
        maxLength: 6,
        description:
            "The code that unlocks the flow. Length sets the box count.",
    },
    resendSeconds: {
        type: ControlType.Number,
        title: "Resend Timer",
        min: 5,
        max: 180,
        step: 5,
        unit: "s",
        defaultValue: 30,
    },
    showOtpHint: {
        type: ControlType.Boolean,
        title: "Show Code Hint",
        defaultValue: true,
        description: "Displays the demo code on screen so visitors can try it.",
    },
    dialCode: {
        type: ControlType.String,
        title: "Dial Code",
        defaultValue: "+91",
        maxLength: 6,
    },
    phonePlaceholder: {
        type: ControlType.String,
        title: "Phone Hint",
        defaultValue: "98765 43210",
    },

    /* ---------- copy ---------- */
    appName: {
        type: ControlType.String,
        title: "App Name",
        defaultValue: "Bento",
    },
    tagline: {
        type: ControlType.String,
        title: "Tagline",
        displayTextArea: true,
        defaultValue: "",
    },
    phoneCta: {
        type: ControlType.String,
        title: "Phone CTA",
        defaultValue: "Continue with phone",
    },
    googleCta: {
        type: ControlType.String,
        title: "Google CTA",
        defaultValue: "Continue with Google",
    },
    guestCta: {
        type: ControlType.String,
        title: "Guest CTA",
        defaultValue: "Skip for now",
        description: "Leave empty to hide.",
    },
    legalNote: {
        type: ControlType.String,
        title: "Legal Note",
        displayTextArea: true,
        defaultValue: "",
    },
    googleTitle: {
        type: ControlType.String,
        title: "Google Title",
        defaultValue: "Choose an account",
    },
    googleSub: {
        type: ControlType.String,
        title: "Google Sub",
        defaultValue: "to continue to {app}",
    },
    useAnother: {
        type: ControlType.String,
        title: "Other Account",
        defaultValue: "Use another account",
    },
    loginTitle: {
        type: ControlType.String,
        title: "Login Title",
        defaultValue: "Enter your number",
    },
    loginSub: {
        type: ControlType.String,
        title: "Login Sub",
        defaultValue: "We will send a {count} digit code to verify",
    },
    sendCodeCta: {
        type: ControlType.String,
        title: "Send Code CTA",
        defaultValue: "Send code",
    },
    otpTitle: {
        type: ControlType.String,
        title: "OTP Title",
        defaultValue: "Verify your number",
    },
    otpSub: {
        type: ControlType.String,
        title: "OTP Sub",
        defaultValue: "Code sent to {number}",
    },
    verifyCta: {
        type: ControlType.String,
        title: "Verify CTA",
        defaultValue: "Verify and continue",
    },
    wrongCode: {
        type: ControlType.String,
        title: "Wrong Code",
        defaultValue: "That code is not right. Try again.",
    },
    resendLabel: {
        type: ControlType.String,
        title: "Resend Waiting",
        defaultValue: "Resend code in {time}",
    },
    resendReady: {
        type: ControlType.String,
        title: "Resend Ready",
        defaultValue: "Resend code",
    },
    deliverTo: {
        type: ControlType.String,
        title: "Deliver To",
        defaultValue: "Deliver to",
    },
    searchPlaceholder: {
        type: ControlType.String,
        title: "Search Hint",
        defaultValue: "Search dishes",
    },
    allLabel: {
        type: ControlType.String,
        title: "All Chip",
        defaultValue: "All",
    },
    addCta: {
        type: ControlType.String,
        title: "Add Button",
        defaultValue: "Add",
    },
    viewCartCta: {
        type: ControlType.String,
        title: "View Cart",
        defaultValue: "View cart",
    },
    noResults: {
        type: ControlType.String,
        title: "No Results",
        defaultValue: "Nothing matches that search.",
    },
    quantityLabel: {
        type: ControlType.String,
        title: "Quantity Label",
        defaultValue: "Quantity",
    },
    addToCartCta: {
        type: ControlType.String,
        title: "Add To Cart",
        defaultValue: "Add to cart",
    },
    cartTitle: {
        type: ControlType.String,
        title: "Cart Title",
        defaultValue: "Your cart",
    },
    emptyCartTitle: {
        type: ControlType.String,
        title: "Empty Title",
        defaultValue: "Your cart is empty",
    },
    emptyCartSub: {
        type: ControlType.String,
        title: "Empty Sub",
        defaultValue: "Add something tasty to get started",
    },
    browseCta: {
        type: ControlType.String,
        title: "Browse CTA",
        defaultValue: "Browse menu",
    },
    billTitle: {
        type: ControlType.String,
        title: "Bill Title",
        defaultValue: "Bill details",
    },
    itemTotalLabel: {
        type: ControlType.String,
        title: "Item Total",
        defaultValue: "Item total",
    },
    deliveryLabel: {
        type: ControlType.String,
        title: "Delivery Label",
        defaultValue: "Delivery fee",
    },
    freeLabel: {
        type: ControlType.String,
        title: "Free Label",
        defaultValue: "Free",
    },
    taxLabel: {
        type: ControlType.String,
        title: "Tax Label",
        defaultValue: "Taxes ({percent}%)",
    },
    toPayLabel: {
        type: ControlType.String,
        title: "To Pay Label",
        defaultValue: "To pay",
    },
    freeHint: {
        type: ControlType.String,
        title: "Free Hint",
        defaultValue: "Add {amount} more for free delivery",
    },
    addressCta: {
        type: ControlType.String,
        title: "Address CTA",
        defaultValue: "Choose address",
    },
    addressTitle: {
        type: ControlType.String,
        title: "Address Title",
        defaultValue: "Delivery address",
    },
    newAddressLabel: {
        type: ControlType.String,
        title: "New Address",
        defaultValue: "+ Add a new address",
    },
    instructionsLabel: {
        type: ControlType.String,
        title: "Instructions",
        defaultValue: "Delivery instructions",
    },
    instructionsPlaceholder: {
        type: ControlType.String,
        title: "Instructions Hint",
        defaultValue: "Ring the bell, leave at door",
    },
    paymentCta: {
        type: ControlType.String,
        title: "Payment CTA",
        defaultValue: "Continue to payment",
    },
    paymentTitle: {
        type: ControlType.String,
        title: "Payment Title",
        defaultValue: "Payment",
    },
    payNowCta: {
        type: ControlType.String,
        title: "Pay Now",
        defaultValue: "Pay now",
    },
    successTitle: {
        type: ControlType.String,
        title: "Success Title",
        defaultValue: "Order placed",
    },
    successSub: {
        type: ControlType.String,
        title: "Success Sub",
        displayTextArea: true,
        defaultValue: "",
    },
    orderIdLabel: {
        type: ControlType.String,
        title: "Order ID Label",
        defaultValue: "Order ID",
    },
    trackCta: {
        type: ControlType.String,
        title: "Track CTA",
        defaultValue: "Track order",
    },
    homeCta: {
        type: ControlType.String,
        title: "Home CTA",
        defaultValue: "Back to home",
    },
    trackTitle: {
        type: ControlType.String,
        title: "Track Title",
        defaultValue: "Track order",
    },
    etaTitle: {
        type: ControlType.String,
        title: "ETA Line",
        defaultValue: "Arriving in 22 minutes",
    },
    riderLine: {
        type: ControlType.String,
        title: "Rider Line",
        defaultValue: "Rider: Rahul · 4.9 rating",
    },
    summaryTitle: {
        type: ControlType.String,
        title: "Summary Title",
        defaultValue: "Order summary",
    },
    paidLabel: {
        type: ControlType.String,
        title: "Paid Label",
        defaultValue: "Paid",
    },
    orderAgainCta: {
        type: ControlType.String,
        title: "Order Again",
        defaultValue: "Order again",
    },
    navHome: {
        type: ControlType.String,
        title: "Nav Home",
        defaultValue: "Home",
    },
    navSearch: {
        type: ControlType.String,
        title: "Nav Search",
        defaultValue: "Search",
    },
    navCart: {
        type: ControlType.String,
        title: "Nav Cart",
        defaultValue: "Cart",
    },
    navAccount: {
        type: ControlType.String,
        title: "Nav Account",
        defaultValue: "Account",
    },

    /* ---------- display ---------- */
    showVegMarks: {
        type: ControlType.Boolean,
        title: "Veg Marks",
        defaultValue: true,
    },
    showRatings: {
        type: ControlType.Boolean,
        title: "Ratings",
        defaultValue: true,
    },
    showFrame: {
        type: ControlType.Boolean,
        title: "Phone Frame",
        defaultValue: true,
    },

    /* ---------- theme ---------- */
    accentColor: {
        type: ControlType.Color,
        title: "Accent",
        defaultValue: "#E8541E",
    },
    onAccentColor: {
        type: ControlType.Color,
        title: "On Accent",
        defaultValue: "#FFFFFF",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#FAF8F5",
    },
    surfaceColor: {
        type: ControlType.Color,
        title: "Card",
        defaultValue: "#FFFFFF",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#1A1614",
    },
    mutedColor: {
        type: ControlType.Color,
        title: "Muted Text",
        defaultValue: "#8A8078",
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border",
        defaultValue: "#E6DFD6",
    },
    successColor: {
        type: ControlType.Color,
        title: "Success",
        defaultValue: "#0A8F3C",
    },
    vegColor: {
        type: ControlType.Color,
        title: "Veg Mark",
        defaultValue: "#0A8F3C",
    },
    nonVegColor: {
        type: ControlType.Color,
        title: "Non-veg Mark",
        defaultValue: "#C4271A",
    },
    starColor: {
        type: ControlType.Color,
        title: "Star",
        defaultValue: "#F5A623",
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 44,
        step: 2,
        defaultValue: 22,
    },
    fontFamily: {
        type: ControlType.String,
        title: "Font",
        defaultValue: "Inter, sans-serif",
    },
})
