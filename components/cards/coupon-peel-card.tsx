import * as React from "react"
import { useEffect, useRef, useState } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, AnimatePresence, useReducedMotion } from "framer-motion"

interface Props {
    eyebrow: string
    discount: string
    discountUnit: string
    headline: string
    description: string
    codeLabel: string
    code: string
    copyLabel: string
    copiedLabel: string
    finePrint: string
    offerLabel: string
    offerLink: string
    accentColor: string
    paperColor: string
    inkColor: string
    highlightColor: string
    radius: number
    style?: React.CSSProperties
}

const defaults = {
    eyebrow: "A LITTLE SOMETHING FOR YOU",
    discount: "25",
    discountUnit: "%",
    headline: "A good deal looks good on you.",
    description: "A little treat for your next order.",
    codeLabel: "YOUR DISCOUNT CODE",
    code: "HELLO25",
    copyLabel: "CLICK TO COPY",
    copiedLabel: "COPIED TO CLIPBOARD",
    finePrint: "Sample code · Set up a matching discount in your store.",
    offerLabel: "Explore Offer",
    offerLink: "",
    accentColor: "#4535EC",
    paperColor: "#FAF9F3",
    inkColor: "#17171B",
    highlightColor: "#D9FF64",
    radius: 26,
}

const Arrow = ({ size = 18 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4.5 12h14M12.5 5.5 19 12l-6.5 6.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
)

const Copy = ({ done }: { done: boolean }) => (
    <svg width="23" height="23" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        {done ? (
            <path d="m5 12 4.5 4.5L19 7" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
        ) : (
            <>
                <rect x="8.5" y="8.5" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.8" />
                <path d="M15.5 8V6.5A2.5 2.5 0 0 0 13 4H6.5A2.5 2.5 0 0 0 4 6.5V13a2.5 2.5 0 0 0 2.5 2.5H8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </>
        )}
    </svg>
)

/**
 * Coupon Peel Card — a compact coupon card with one-click copy.
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 980
 * @framerIntrinsicHeight 365
 */
export default function CouponPeelCard(props: Props) {
    const p = { ...defaults, ...props }
    const isStatic = useIsStaticRenderer()
    const reducedMotion = useReducedMotion()
    const [copied, setCopied] = useState(false)
    const [focused, setFocused] = useState(false)
    const [hovered, setHovered] = useState(false)
    const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

    useEffect(() => () => {
        if (resetTimer.current) clearTimeout(resetTimer.current)
    }, [])

    useEffect(() => {
        setCopied(false)
        if (resetTimer.current) clearTimeout(resetTimer.current)
    }, [p.code])

    const doCopy = async () => {
        if (!p.code.trim()) return
        let didCopy = false
        try {
            if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(p.code)
                didCopy = true
            }
        } catch (_) {}
        if (!didCopy && typeof document !== "undefined") {
            const area = document.createElement("textarea")
            area.value = p.code
            area.style.position = "fixed"
            area.style.opacity = "0"
            area.style.pointerEvents = "none"
            document.body.appendChild(area)
            area.focus()
            area.select()
            try { didCopy = document.execCommand("copy") } catch (_) {}
            document.body.removeChild(area)
        }
        if (!didCopy) return
        setCopied(true)
        if (resetTimer.current) clearTimeout(resetTimer.current)
        resetTimer.current = setTimeout(() => setCopied(false), 2200)
    }

    const quick = isStatic || !!reducedMotion
    const ease = [0.22, 1, 0.36, 1] as const

    return (
        <div
            style={{
                ...p.style,
                width: "100%",
                height: "auto",
                display: "flex",
                flexWrap: "wrap",
                overflow: "hidden",
                borderRadius: p.radius,
                background: p.paperColor,
                color: p.inkColor,
                fontFamily: '"Inter", "Helvetica Neue", sans-serif',
                boxSizing: "border-box",
                border: "1px solid rgba(20,20,25,0.06)",
                boxShadow: "0 20px 60px rgba(25,25,45,0.10), 0 3px 12px rgba(25,25,45,0.05)",
            }}
        >
            <div
                style={{
                    position: "relative",
                    flex: "1 1 455px",
                    minWidth: 0,
                    minHeight: 330,
                    background: p.accentColor,
                    color: "#FFFFFF",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    padding: "31px clamp(28px, 4.3vw, 46px) 35px",
                    boxSizing: "border-box",
                }}
            >
                <div aria-hidden="true" style={{ position: "absolute", width: 300, height: 300, border: "1px solid rgba(255,255,255,.21)", borderRadius: "50%", right: -110, top: -205, pointerEvents: "none" }} />
                <div aria-hidden="true" style={{ position: "absolute", width: 235, height: 235, border: "1px solid rgba(255,255,255,.17)", borderRadius: "50%", right: -78, top: -175, pointerEvents: "none" }} />
                <div aria-hidden="true" style={{ position: "absolute", right: 36, bottom: -95, fontSize: 300, fontWeight: 800, letterSpacing: -25, color: "rgba(255,255,255,0.045)", userSelect: "none", lineHeight: 1 }}>✳</div>

                <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: p.highlightColor, flexShrink: 0 }} />
                    <span style={{ fontSize: 10.5, lineHeight: 1.4, fontWeight: 750, letterSpacing: 1.7 }}>{p.eyebrow}</span>
                </div>
                <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "baseline", gap: 14, marginTop: 24, marginBottom: 17, lineHeight: .84 }}>
                    <div style={{ fontSize: "clamp(108px, 14vw, 165px)", fontWeight: 790, letterSpacing: "-0.095em", lineHeight: .78, whiteSpace: "nowrap", paddingRight: 12, fontVariantNumeric: "tabular-nums" }}>{p.discount}</div>
                    <div style={{ fontSize: "clamp(51px, 7vw, 78px)", fontWeight: 740, letterSpacing: "-0.07em", transform: "translateY(-15%)" }}>{p.discountUnit}</div>
                </div>
                <div style={{ position: "relative", zIndex: 1, maxWidth: 440 }}>
                    <div style={{ height: 1, background: "rgba(255,255,255,.42)", marginBottom: 17 }} />
                    <div style={{ fontSize: 22, lineHeight: 1.16, letterSpacing: "-.04em", fontWeight: 680, marginBottom: 8 }}>{p.headline}</div>
                    <div style={{ fontSize: 12.5, lineHeight: 1.5, opacity: .8 }}>{p.description}</div>
                </div>
            </div>

            <div
                style={{
                    flex: "1 1 280px",
                    minWidth: 0,
                    minHeight: 330,
                    padding: "31px clamp(26px, 4vw, 43px) 25px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    boxSizing: "border-box",
                    position: "relative",
                    background: p.paperColor,
                }}
            >
                <div aria-hidden="true" style={{ position: "absolute", left: -1, top: 0, bottom: 0, width: 1, borderLeft: "1px dashed rgba(27,27,31,.25)", pointerEvents: "none" }} />
                <div aria-hidden="true" style={{ position: "absolute", left: -10, top: -10, width: 20, height: 20, borderRadius: "50%", background: "#FFFFFF", boxShadow: "inset 0 -1px 2px rgba(0,0,0,.05)" }} />
                <div aria-hidden="true" style={{ position: "absolute", left: -10, bottom: -10, width: 20, height: 20, borderRadius: "50%", background: "#FFFFFF" }} />
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 14 }}>
                    <div style={{ fontSize: 10.5, letterSpacing: 1.6, lineHeight: 1.5, fontWeight: 760 }}>{p.codeLabel}</div>
                    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 33, height: 33, border: "1px solid rgba(0,0,0,.16)", borderRadius: "50%", fontSize: 18 }} aria-hidden="true">↗</span>
                </div>
                <div style={{ marginTop: 16, marginBottom: 14 }}>
                    <div style={{ fontWeight: 640, letterSpacing: "-.045em", fontSize: "clamp(25px, 3vw, 37px)", lineHeight: 1.09, maxWidth: 265 }}>Your little extra.</div>
                    <div style={{ height: 2, background: p.inkColor, width: 38, marginTop: 16 }} />
                </div>
                <motion.button
                    type="button"
                    aria-label={p.code.trim() ? "Copy discount code " + p.code : "No discount code set"}
                    disabled={!p.code.trim()}
                    onClick={doCopy}
                    onHoverStart={() => setHovered(true)}
                    onHoverEnd={() => setHovered(false)}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    whileTap={quick ? undefined : { scale: 0.985 }}
                    animate={quick ? undefined : { y: hovered ? -5 : 0, rotate: hovered ? -0.7 : 0 }}
                    transition={{ duration: .34, ease }}
                    style={{
                        width: "100%",
                        position: "relative",
                        cursor: p.code.trim() ? "pointer" : "default",
                        appearance: "none",
                        outline: focused ? "3px solid " + p.accentColor : "none",
                        outlineOffset: 4,
                        borderRadius: 15,
                        border: "1.5px dashed rgba(22,22,22,.72)",
                        background: p.highlightColor,
                        color: p.inkColor,
                        padding: "16px 18px",
                        textAlign: "left",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 16,
                        boxShadow: hovered && !quick ? "0 13px 22px rgba(0,0,0,.13)" : "0 5px 0 rgba(0,0,0,.12)",
                        boxSizing: "border-box",
                    }}
                >
                    <div style={{ minWidth: 0, overflow: "hidden" }}>
                        <div style={{ fontSize: 10, fontWeight: 750, letterSpacing: 1.2, opacity: .65, marginBottom: 8, height: 13 }}>
                            <AnimatePresence mode="wait" initial={false}>
                                <motion.span
                                    key={copied ? "copied" : "copy"}
                                    initial={quick ? false : { y: 9, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    exit={quick ? undefined : { y: -9, opacity: 0 }}
                                    transition={{ duration: .18 }}
                                    style={{ display: "block", whiteSpace: "nowrap" }}
                                >{copied ? p.copiedLabel : p.copyLabel}</motion.span>
                            </AnimatePresence>
                        </div>
                        <div style={{ fontSize: "clamp(23px, 3vw, 32px)", fontWeight: 800, letterSpacing: "-.045em", lineHeight: 1.1, overflowWrap: "anywhere" }}>{p.code || "ADD A CODE"}</div>
                    </div>
                    <div style={{ flexShrink: 0, width: 38, height: 38, borderRadius: 10, border: "1px solid rgba(20,20,20,.2)", background: copied ? p.inkColor : "rgba(255,255,255,.55)", color: copied ? p.highlightColor : p.inkColor, display: "grid", placeItems: "center", transition: quick ? "none" : "background .2s ease, color .2s ease" }}>
                        <Copy done={copied} />
                    </div>
                </motion.button>

                {p.offerLink?.trim() ? (
                    <a
                        href={p.offerLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ marginTop: 16, display: "inline-flex", alignItems: "center", justifyContent: "space-between", gap: 12, fontSize: 13, fontWeight: 750, color: p.inkColor, textDecoration: "none", padding: "9px 0", borderBottom: "1px solid currentColor" }}
                    >
                        <span>{p.offerLabel}</span><Arrow />
                    </a>
                ) : null}
                <div style={{ fontSize: 10.5, lineHeight: 1.45, color: p.inkColor, opacity: .54, marginTop: 15 }}>{p.finePrint}</div>
                <span aria-live="polite" style={{ position: "absolute", height: 1, width: 1, overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap" }}>{copied ? p.copiedLabel : ""}</span>
            </div>
        </div>
    )
}

CouponPeelCard.defaultProps = defaults

addPropertyControls(CouponPeelCard, {
    eyebrow: { type: ControlType.String, title: "Eyebrow" },
    discount: { type: ControlType.String, title: "Discount" },
    discountUnit: { type: ControlType.String, title: "Unit" },
    headline: { type: ControlType.String, title: "Headline" },
    description: { type: ControlType.String, title: "Description", displayTextArea: true },
    codeLabel: { type: ControlType.String, title: "Code Label" },
    code: { type: ControlType.String, title: "Coupon Code" },
    copyLabel: { type: ControlType.String, title: "Copy Label" },
    copiedLabel: { type: ControlType.String, title: "Copied Label" },
    finePrint: { type: ControlType.String, title: "Footnote", displayTextArea: true },
    offerLabel: { type: ControlType.String, title: "Link Text" },
    offerLink: { type: ControlType.Link, title: "Offer Link", defaultValue: "" },
    accentColor: { type: ControlType.Color, title: "Main Color" },
    paperColor: { type: ControlType.Color, title: "Paper" },
    inkColor: { type: ControlType.Color, title: "Ink" },
    highlightColor: { type: ControlType.Color, title: "Code Color" },
    radius: { type: ControlType.Number, title: "Radius", min: 0, max: 48, step: 1, unit: "px" },
})
