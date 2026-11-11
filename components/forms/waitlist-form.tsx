// Instructions: Create a multi-step waitlist signup form component in React for Framer. Use the provided HTML/CSS/JS prototype as the reference for design, layout, interactions, and field structure. Fixed 4 steps, dark theme glassmorphism, segmented progress bar, role cards, chips with “Other” reveal, summary, social proof (toggle), terms checkbox, submit triggers nearest form.requestSubmit(), success state in-card. Keep all step panels mounted; hide inactive via CSS, never unmount.

import type { CSSProperties } from "react"
import { startTransition, useEffect, useMemo, useRef, useState, useCallback } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { AnimatePresence, motion } from "framer-motion"

type Step = 1 | 2 | 3 | 4

type RoleOption = {
	label: string
	desc: string
}

type ChipOption = {
	label: string
	isOther?: boolean
}

type PersonImage = {
	src: string
	srcSet?: string
	alt?: string
}

type Props = {
	/** Canvas-only */
	previewStep?: "" | "1" | "2" | "3" | "4" | "success"
	/** Progress indicator */
	indicatorStyle?: "bar" | "dots" | "numbers"
	/** Row 2 (panel) */
	darkMode?: boolean
	/** Row 3 (panel) */
	colors?: {
		accentColor?: string
		cardBackground?: string
		titleColor?: string
		/** Light-mode title override (used by property panel for light defaults) */
		titleColorLight?: string
		subtitleColor?: string
		bodyTextColor?: string
		labelTagBg?: string
	}
	/** Row 4 (panel) */
	fonts?: {
		title?: any
		subtitle?: any
		body1?: any
		body2?: any
	}
	/** Row 5-6-8-10 (panel) */
	step1Text?: { label?: string; title?: string; subtitle?: string }
	step2Text?: { label?: string; title?: string; subtitle?: string }
	step3Text?: { label?: string; title?: string; subtitle?: string }
	step4Text?: {
		label?: string
		title?: string
		subtitle?: string
		buildingLabel?: string
		sourceLabel?: string
	}
	/** Row 7 */
	roleCards?: RoleOption[]
	/** Row 9 */
	useCaseChips?: string[]
	/** Row 11 */
	step4Options?: {
		sourceOptions?: string[]
		showSocialProof?: boolean
		socialProofText?: string
		peopleImages?: PersonImage[]
	}
	/** Step 4 : Privacy Policy */
	step4PrivacyPolicy?: string
	/** Row 12 */
	step5Text?: {
		buttonLabel?: string
		successHeading?: string
		successMessage?: string
		positionBadge?: string
	}

	// Legacy props kept for backward compatibility (no longer surfaced in panel)
	theme?: {
		accentColor?: string
		darkMode?: boolean
		cardRadius?: number
	}
	typography?: {
		font?: any
		headingSize?: number
		bodySize?: number
	}
	steps?: {
		step1Heading?: string
		step1Sub?: string
		step2Heading?: string
		step2Sub?: string
		step3Heading?: string
		step3Sub?: string
		step4Heading?: string
		step4Sub?: string
	}
	submitSuccess?: {
		buttonLabel?: string
		successHeading?: string
		successMessage?: string
		positionBadge?: string
	}
	socialProof?: {
		show?: boolean
		text?: string
	}

	style?: CSSProperties
}

function clamp(n: number, min: number, max: number) {
	return Math.min(max, Math.max(min, n))
}

function normColorString(v: string) {
	return v.replace(/\s+/g, "").toLowerCase()
}

function hexToRgb(hex: string) {
	const h = hex.replace("#", "").trim()
	const len = h.length

	// Support alpha-hex from modern pickers (#RGBA / #RRGGBBAA) by stripping alpha
	if (len === 4 || len === 8) {
		const stripped = len === 4 ? h.slice(0, 3) : h.slice(0, 6)
		return hexToRgb("#" + stripped)
	}

	if (![3, 6].includes(len)) {
		// fallback: parse rgb()/rgba()
		const m = hex.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i)
		if (m) return { r: +m[1], g: +m[2], b: +m[3] }
		return null
	}
	const full = len === 3 ? h.split("").map((c) => c + c).join("") : h
	const int = Number.parseInt(full, 16)
	if (!Number.isFinite(int)) return null
	return {
		r: (int >> 16) & 255,
		g: (int >> 8) & 255,
		b: int & 255,
	}
}

function rgba(input: string, a: number) {
	const raw = (input ?? "").trim()
	if (!raw) return `rgba(15,212,180,${a})`

	// If already rgb/rgba, preserve channels and override alpha
	if (/^rgba?\(/i.test(raw)) {
		const nums = raw
			.replace(/rgba?\(/i, "")
			.replace(/\)\s*$/, "")
			.split(/\s*,\s*/g)
			.map((n) => Number.parseFloat(n))
		const r = nums[0]
		const g = nums[1]
		const b = nums[2]
		if ([r, g, b].every((n) => Number.isFinite(n))) return `rgba(${r},${g},${b},${a})`
	}

	// Hex fallback
	const rgb = hexToRgb(raw)
	if (!rgb) return `rgba(15,212,180,${a})`
	return `rgba(${rgb.r},${rgb.g},${rgb.b},${a})`
}

function mixHex(hexA: string, hexB: string, t: number) {
	const a = hexToRgb(hexA)
	const b = hexToRgb(hexB)
	if (!a || !b) return hexA
	const tt = clamp(t, 0, 1)
	const r = Math.round(a.r + (b.r - a.r) * tt)
	const g = Math.round(a.g + (b.g - a.g) * tt)
	const b2 = Math.round(a.b + (b.b - a.b) * tt)
	const toHex = (n: number) => n.toString(16).padStart(2, "0")
	return `#${toHex(r)}${toHex(g)}${toHex(b2)}`
}

function isValidEmail(v: string) {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
}

function toPx(v: unknown, fallbackPx: number): string {
	if (typeof v === "number" && Number.isFinite(v)) return `${v}px`
	if (typeof v === "string") {
		const s = v.trim()
		if (!s) return `${fallbackPx}px`
		if (/^\d+(\.\d+)?px$/i.test(s)) return s
		const n = Number(s)
		if (Number.isFinite(n)) return `${n}px`
		return `${fallbackPx}px`
	}
	return `${fallbackPx}px`
}

function getFontFamily(v: any): string | undefined {
	const candidate = v?.fontFamily ?? v?.font?.fontFamily ?? v?.fontFamilyName ?? v?.family
	return typeof candidate === "string" && candidate.trim() ? candidate : undefined
}

function variantToWeight(variant?: string): number | undefined {
	if (!variant) return undefined
	const v = String(variant)
	if (v.includes("Thin")) return 100
	if (v.includes("Extra Light")) return 200
	if (v.includes("Light")) return 300
	if (v.includes("Regular")) return 400
	if (v.includes("Medium")) return 500
	if (v.includes("Semibold")) return 600
	if (v.includes("Extra Bold")) return 800
	if (v.includes("Bold")) return 700
	if (v.includes("Black")) return 900
	return undefined
}

function getFontWeight(v: any): number | undefined {
	return v?.fontWeight ?? variantToWeight(v?.variant) ?? v?.font?.fontWeight ?? variantToWeight(v?.font?.variant)
}

function getFontSizePx(v: any, fallback: number): string {
	const raw = v?.fontSize ?? v?.font?.fontSize
	const resolved =
		typeof raw === "object" && raw ? (raw as any)?.value ?? (raw as any)?.size ?? (raw as any)?.px : raw
	if (typeof resolved === "number" && Number.isFinite(resolved)) return `${resolved}px`
	if (typeof resolved === "string") return toPx(resolved, fallback)
	return `${fallback}px`
}

const PAGE_STYLE_BASE: CSSProperties = { width: "100%" }

const DEFAULT_ROLE_OPTIONS: RoleOption[] = [
	{ label: "Founder", desc: "Building a product or startup" },
	{ label: "Designer", desc: "UX, product, or visual design" },
	{ label: "Engineer", desc: "Frontend, backend, full-stack" },
	{ label: "Product", desc: "Product management & strategy" },
	{ label: "Marketing", desc: "Growth, content, or brand" },
	{ label: "Other", desc: "Something else entirely" },
]

const DEFAULT_USE_CASE_OPTIONS: string[] = [
	"Manage projects",
	"Track sales",
	"Internal wiki",
	"Client portal",
	"User onboarding",
	"Analytics",
	"Automations",
]

const DEFAULT_SOURCE_OPTIONS: string[] = [
	"Twitter / X",
	"Product Hunt",
	"A friend or colleague",
	"Google search",
	"Newsletter",
	"Other",
]

/**
 * @framerIntrinsicWidth 440
 * @framerIntrinsicHeight 580
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 *
 * @framerDisableUnlink
 */
export default function MultiStepWaitlistForm(props: Props) {
	const { style } = props

	const theme = props.theme
	const typography = props.typography
	const steps = props.steps
	const submitSuccess = props.submitSuccess
	const socialProof = props.socialProof

	const colors = props.colors
	const fonts = props.fonts
	const labelTagBg = (colors?.labelTagBg ?? "").trim()
	const step1Text = props.step1Text
	const step2Text = props.step2Text
	const step3Text = props.step3Text
	const step4Text = props.step4Text
	const step4Options = props.step4Options
	const step4PrivacyPolicy = props.step4PrivacyPolicy
	const step5Text = props.step5Text

	const darkMode = props.darkMode ?? theme?.darkMode ?? true
	const accentColorRaw = colors?.accentColor ?? theme?.accentColor
	const accentColor = useMemo(() => {
		const v = (accentColorRaw ?? "").trim()
		if (v) return v
		return darkMode ? "#0fd4b4" : "#0aaf96"
	}, [accentColorRaw, darkMode])
	const cardRadius = theme?.cardRadius ?? 20

	const body1FontAny = fonts?.body1
	const body2FontAny = fonts?.body2
	const titleFontAny = fonts?.title
	const subtitleFontAny = fonts?.subtitle

	// Body 1 applies to most text. Body 2 applies to form controls & buttons.
	const resolvedBody1FontFamily =
		getFontFamily(body1FontAny) ??
		getFontFamily(typography?.font) ??
		getFontFamily((typography?.font as any)?.font) ??
		"Manrope"
	const resolvedBody2FontFamily = getFontFamily(body2FontAny) ?? resolvedBody1FontFamily
	const resolvedTitleFontFamily = getFontFamily(titleFontAny) ?? resolvedBody1FontFamily
	const resolvedSubtitleFontFamily = getFontFamily(subtitleFontAny) ?? resolvedBody1FontFamily

	const resolvedBody1Weight = getFontWeight(body1FontAny) ?? 400
	const resolvedBody2Weight = getFontWeight(body2FontAny) ?? resolvedBody1Weight
	const resolvedBody1Size = getFontSizePx(body1FontAny, 13)
	const resolvedBody2Size = getFontSizePx(body2FontAny, 14)

	const body1SizeNum = useMemo(() => {
		const n = Number.parseFloat(String(resolvedBody1Size))
		return Number.isFinite(n) ? n : 13
	}, [resolvedBody1Size])
	const body2SizeNum = useMemo(() => {
		const n = Number.parseFloat(String(resolvedBody2Size))
		return Number.isFinite(n) ? n : 14
	}, [resolvedBody2Size])
	const metaSizePx = useMemo(() => `${Math.max(9, body1SizeNum - 2)}px`, [body1SizeNum])
	const labelSizePx = useMemo(() => `${Math.max(9, body1SizeNum - 2)}px`, [body1SizeNum])
	const smallSizePx = useMemo(() => `${Math.max(10, body1SizeNum - 1)}px`, [body1SizeNum])
	const chipSizePx = useMemo(() => `${Math.max(11, Math.round(body1SizeNum - 0.5))}px`, [body1SizeNum])
	const buttonSizePx = useMemo(() => `${Math.max(12, body2SizeNum)}px`, [body2SizeNum])

	const resolvedHeadingSize = getFontSizePx(titleFontAny, 26)
	const resolvedBodySize = getFontSizePx(subtitleFontAny ?? body1FontAny, 13)
	const resolvedHeadingWeight = getFontWeight(titleFontAny) ?? 800
	const resolvedSubtitleWeight = getFontWeight(subtitleFontAny) ?? 300

	// Back-compat local aliases used by CSS variable wiring
	const headingSize = resolvedHeadingSize
	const bodySize = resolvedBodySize

	const step1HeadingResolved =
		(step1Text?.title ?? steps?.step1Heading ?? "Create your account").trim() || "Create your account"
	const step1SubResolved =
		(step1Text?.subtitle ?? steps?.step1Sub ?? "Free for 14 days. No credit card required.").trim() ||
		"Free for 14 days. No credit card required."
	const step2HeadingResolved = (step2Text?.title ?? steps?.step2Heading ?? "What best describes you?").trim() || "What best describes you?"
	const step2SubResolved =
		(step2Text?.subtitle ?? steps?.step2Sub ?? "We'll personalise your setup based on how you work.").trim() ||
		"We'll personalise your setup based on how you work."
	const step3HeadingResolved = (step3Text?.title ?? steps?.step3Heading ?? "What are you here to do?").trim() || "What are you here to do?"
	const step3SubResolved =
		(step3Text?.subtitle ?? steps?.step3Sub ?? "Select all that apply — we'll tailor your experience.").trim() ||
		"Select all that apply — we'll tailor your experience."
	const step4HeadingResolved = (step4Text?.title ?? steps?.step4Heading ?? "Join the waitlist").trim() || "Join the waitlist"
	const step4SubResolved =
		(step4Text?.subtitle ?? steps?.step4Sub ?? "We're onboarding in batches — your spot is almost reserved.").trim() ||
		"We're onboarding in batches — your spot is almost reserved."

	const previewStep = props.previewStep ?? ""
	const effectivePreviewStep = previewStep

	const ctaLabel = (step5Text?.buttonLabel ?? submitSuccess?.buttonLabel ?? "Join the waitlist").trim() || "Join the waitlist"
	const successTitle = (step5Text?.successHeading ?? submitSuccess?.successHeading ?? "You're on the list").trim() || "You're on the list"
	const successSub =
		(step5Text?.successMessage ??
			submitSuccess?.successMessage ??
			"We'll email {{email}} when your spot opens up. Usually within 1–2 weeks.").trim() ||
		"We'll email {{email}} when your spot opens up. Usually within 1–2 weeks."
	const positionLabel =
		(step5Text?.positionBadge ?? submitSuccess?.positionBadge ?? "Position #2,401 secured").trim() || "Position #2,401 secured"

	const showSocialProof = step4Options?.showSocialProof ?? socialProof?.show ?? true
	const socialProofText =
		(step4Options?.socialProofText ?? socialProof?.text ?? "2,400+ people already on the list. New batch opening soon.").trim() ||
		"2,400+ people already on the list. New batch opening soon."
	const privacyPolicyLink = (step4PrivacyPolicy ?? "").trim() || "#"

	const peopleImages = useMemo(() => {
		const defaults: PersonImage[] = [
			{ src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg", alt: "Person 1" },
			{ src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg", alt: "Person 2" },
			{ src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg", alt: "Person 3" },
		]

		const incoming = Array.isArray(step4Options?.peopleImages) ? step4Options?.peopleImages : []
		const cleaned = incoming.filter((img) => img && typeof img.src === "string" && img.src.trim().length > 0)

		const filled: PersonImage[] = [0, 1, 2].map((i) => cleaned[i] ?? defaults[i])
		return filled
	}, [step4Options?.peopleImages])

	const step1Label = (step1Text?.label ?? "Account setup").trim() || "Account setup"
	const step2Label = (step2Text?.label ?? "Your role").trim() || "Your role"
	const step3Label = (step3Text?.label ?? "Use case").trim() || "Use case"
	const step4Label = (step4Text?.label ?? "Final step").trim() || "Final step"

	const buildingLabel = (step4Text?.buildingLabel ?? "What are you building?").trim() || "What are you building?"
	const sourceLabel = (step4Text?.sourceLabel ?? "How did you hear about us?").trim() || "How did you hear about us?"

	// Keep existing defaults for visual settings not exposed in the panel
	const cardBlur = 24
	const headingWeight = String(resolvedHeadingWeight)
	const bodyWeight = String(resolvedSubtitleWeight)
	const labelWeight = "600"
	const inputSize = 14
	const cardPaddingX = 36
	const cardPaddingY = 36
	const fieldGap = 13
	const inputRadius = 11
	const buttonRadius = 11
	const chipRadius = 100
	const roleCardRadius = 13
	const shimmerVisible = true
	const indicatorStyle = (props.indicatorStyle ?? "bar") as "bar" | "dots" | "numbers"
	const DEFAULT_DARK_SUBTITLE = "rgba(200,230,225,0.55)"
	const DEFAULT_DARK_BODY = "rgba(200,230,225,0.7)"
	const DEFAULT_DARK_CARD = "rgba(8,15,36,0.72)"

	// Detects whether the buyer has a dark mode default loaded in the Colors panel
	// and clears it when switching to light mode so the built-in light fallbacks apply.
	// Note: relies on hex string comparison — if Framer normalises to rgb() format
	// this detection will fail silently and the dark color will bleed into light mode.
	const rawColorHeading = (
		darkMode
			? (colors?.titleColor ?? "")
			: (colors?.titleColorLight ?? colors?.titleColor ?? "")
	).trim()
	const rawColorBody = (colors?.subtitleColor ?? "").trim()
	const rawBodyTextColor = (colors?.bodyTextColor ?? "").trim()
	const rawColorCard = (colors?.cardBackground ?? "").trim()

	// If the buyer switches to Light mode without touching the Colors panel, ignore the dark defaults
	// so the component can use the built-in light fallbacks.
	const colorHeading = rawColorHeading
	const colorBody = !darkMode && rawColorBody && normColorString(rawColorBody) === normColorString(DEFAULT_DARK_SUBTITLE) ? "" : rawColorBody
	const bodyTextColor = !darkMode && rawBodyTextColor && normColorString(rawBodyTextColor) === normColorString(DEFAULT_DARK_BODY) ? "" : rawBodyTextColor
	const colorCard = !darkMode && rawColorCard && normColorString(rawColorCard) === normColorString(DEFAULT_DARK_CARD) ? "" : rawColorCard

	const rootRef = useRef<HTMLDivElement | null>(null)
	const transitionTimerRef = useRef<number | null>(null)
	const isRestartingRef = useRef(false)

	const roles: RoleOption[] = useMemo(() => {
		const list = Array.isArray(props.roleCards) && props.roleCards.length > 0 ? props.roleCards : DEFAULT_ROLE_OPTIONS
		return list
	}, [props.roleCards])

	const chipsList: ChipOption[] = useMemo(() => {
		const base =
			Array.isArray(props.useCaseChips) && props.useCaseChips.length > 0 ? props.useCaseChips : DEFAULT_USE_CASE_OPTIONS
		return [...base.filter((label) => label !== "Other").map((label) => ({ label })), { label: "Other", isOther: true }]
	}, [props.useCaseChips])

	const teal = accentColor
	const teal2 = useMemo(() => mixHex(teal, "#000000", 0.12), [teal])
	const tealDark15 = useMemo(() => mixHex(teal, "#000000", 0.15), [teal])
	const tealDim = useMemo(() => rgba(teal, 0.18), [teal])
	const tealGlow = useMemo(() => rgba(teal, 0.08), [teal])
	const tealBorder = useMemo(() => rgba(teal, 0.25), [teal])
	const borderFocus = useMemo(() => rgba(teal, 0.45), [teal])
	const cardBg = useMemo(() => {
		const override = (colorCard || "").trim()
		if (override) return override
		return darkMode ? "rgba(8,15,36,0.72)" : "rgba(255,255,255,0.82)"
	}, [colorCard, darkMode])

	const [currentStep, setCurrentStep] = useState<Step>(1)
	const [prevStep, setPrevStep] = useState<Step | null>(null)
	const [direction, setDirection] = useState<"fwd" | "bk">("fwd")

	const [role, setRole] = useState<string>("")
	const [otherOn, setOtherOn] = useState(false)
	const [chips, setChips] = useState<string[]>([])
	const [terms, setTerms] = useState(false)
	const [otherText, setOtherText] = useState("")

	const [success, setSuccess] = useState(false)

	useEffect(() => {
		if (RenderTarget.current() !== RenderTarget.canvas) return
		if (isRestartingRef.current) return
		if (!effectivePreviewStep) return

		startTransition(() => {
			setPrevStep(null)
			setDirection("fwd")

			if (effectivePreviewStep === "success") {
				setCurrentStep(4)
				setSuccess(true)
				return
			}

			const s = Number(effectivePreviewStep) as Step
			if (s >= 1 && s <= 4) {
				setSuccess(false)
				setCurrentStep(s)
			}
		})
	}, [effectivePreviewStep, setCurrentStep, setPrevStep, setDirection, setSuccess])

	const [email, setEmail] = useState("")
	const emailErr = useMemo(() => email.length > 5 && !isValidEmail(email), [email])

	const [source, setSource] = useState("")

	const [firstName, setFirstName] = useState("")
	const [lastName, setLastName] = useState("")
	const [company, setCompany] = useState("")
	const [building, setBuilding] = useState("")
	const otherInputRef = useRef<HTMLInputElement | null>(null)

	const summaryName = useMemo(() => {
		const nm = `${firstName} ${lastName}`.trim()
		return nm || "—"
	}, [firstName, lastName])

	const summaryCompany = useMemo(() => company.trim() || "—", [company])
	const summaryRole = useMemo(() => role || "—", [role])
	const summaryUseCases = useMemo(() => {
		const all = [...chips]
		if (otherOn) {
			const ot = (otherText || "").trim()
			all.push(ot || "Other")
		}
		return all
	}, [chips, otherOn, otherText])

	const successEmail = useMemo(() => email.trim() || "you", [email])

	const computedChipCount = useMemo(() => chips.length + (otherOn ? 1 : 0), [chips.length, otherOn])

	const hiddenRoleValue = role || ""
	const hiddenUseCasesValue = useMemo(() => {
		const all = [...chips]
		if (otherOn) {
			const txt = (otherText || "").trim()
			all.push(txt || "Other")
		}
		return all.join(", ")
	}, [chips, otherOn, otherText])

	const goTo = useCallback(
		(next: Step) => {
			if (success) return
			if (next === currentStep) return

			const dir: "fwd" | "bk" = next > currentStep ? "fwd" : "bk"

			startTransition(() => {
				setPrevStep(currentStep)
				setDirection(dir)
				setCurrentStep(next)
			})

			if (typeof window !== "undefined") {
				if (transitionTimerRef.current) window.clearTimeout(transitionTimerRef.current)
				transitionTimerRef.current = window.setTimeout(() => {
					transitionTimerRef.current = null
					startTransition(() => setPrevStep(null))
				}, 320)
			} else {
				startTransition(() => setPrevStep(null))
			}
		},
		[currentStep, success]
	)

	useEffect(() => {
		return () => {
			if (transitionTimerRef.current && typeof window !== "undefined") {
				window.clearTimeout(transitionTimerRef.current)
			}
		}
	}, [])

	const toggleChip = useCallback((label: string) => {
		startTransition(() => {
			setChips((prev) => {
				const on = prev.includes(label)
				return on ? prev.filter((c) => c !== label) : [...prev, label]
			})
		})
	}, [])

	const toggleOther = useCallback(() => {
		startTransition(() => setOtherOn((v) => !v))
	}, [])

	useEffect(() => {
		if (!otherOn) return
		if (typeof window === "undefined") return
		window.setTimeout(() => otherInputRef.current?.focus(), 0)
	}, [otherOn])

	const pickRole = useCallback((r: string) => {
		startTransition(() => setRole(r))
	}, [])

	const toggleTerms = useCallback(() => {
		startTransition(() => setTerms((t) => !t))
	}, [])

	const doSubmit = useCallback(() => {
		if (typeof window === "undefined") return
		const form = rootRef.current?.closest("form") as HTMLFormElement | null
		if (!form) return
		if ("requestSubmit" in form && typeof form.requestSubmit === "function") {
			try {
				form.requestSubmit()
			} catch (_) {
				// Form Stack validation may reject — don't show success
				return
			}
		}
		startTransition(() => setSuccess(true))
	}, [])

	const restart = useCallback(() => {
		isRestartingRef.current = true
		// isRestartingRef is cleared in setTimeout to allow startTransition to commit
		// before the preview effect can re-fire. Race condition is mitigated by the
		// effectivePreviewStep dependency not changing during restart.
		startTransition(() => {
			setRole("")
			setChips([])
			setOtherOn(false)
			setOtherText("")
			setTerms(false)
			setEmail("")
			setSource("")
			setBuilding("")
			setFirstName("")
			setLastName("")
			setCompany("")
			setSuccess(false)
			setPrevStep(null)
			setDirection("fwd")
			setCurrentStep(1)
		})
		if (typeof window !== "undefined") {
			window.setTimeout(() => {
				isRestartingRef.current = false
			}, 0)
		} else {
			isRestartingRef.current = false
		}
	}, [])

	const pageMotion = useMemo(() => {
		const duration = 0.3
		const ease: any = [0.4, 0, 0.2, 1]
		return { duration, ease }
	}, [])

	const renderPageStyle = useCallback(
		(step: Step): CSSProperties => {
			const isActive = currentStep === step
			const isPrev = prevStep === step
			const isVisible = isActive || isPrev

			return {
				position: isActive ? "relative" : "absolute",
				top: 0,
				left: 0,
				width: "100%",
				opacity: isVisible ? 1 : 0,
				pointerEvents: isActive ? "auto" : "none",
				visibility: isVisible ? "visible" : "hidden",
			}
		},
		[currentStep, prevStep]
	)

	const renderMotionState = useCallback(
		(step: Step) => {
			// Avoid Step 4 being animated as active under the success overlay
			if (success && step === 4) return { opacity: 0, x: 0 }

			const isActive = currentStep === step
			const isPrev = prevStep === step
			const delta = 16

			if (isActive) {
				return { opacity: 1, x: 0 }
			}
			if (isPrev) {
				return { opacity: 0, x: direction === "bk" ? delta : -delta }
			}
			return { opacity: 0, x: direction === "bk" ? -delta : delta }
		},
		[currentStep, prevStep, direction, success]
	)

	const progressSegClass = useCallback(
		(i: Step) => {
			if (i < currentStep) return "pseg done"
			if (i === currentStep) return "pseg now"
			return "pseg"
		},
		[currentStep]
	)

	const step4Style = renderPageStyle(4)

	const isRoleLocked = !role
	const step2HintText = role ? `${role} — ready to continue` : "Select a role to continue"
	const step2HintOk = !!role

	const canContinueFromStep1 = useMemo(
		() => firstName.trim().length > 0 && isValidEmail(email),
		[firstName, email]
	)

	return (
		<div
			ref={rootRef}
			className="fw"
			style={{
				...style,
				position: "relative",
				width: "100%",
				maxWidth: "100%",
				color: "var(--t1)",

				["--card-blur" as any]: `${cardBlur}px`,
				["--card-radius" as any]: `${cardRadius}px`,
				["--card-padding-x" as any]: `${cardPaddingX}px`,
				["--card-padding-y" as any]: `${cardPaddingY}px`,
				["--body1-family" as any]: resolvedBody1FontFamily,
				["--body2-family" as any]: resolvedBody2FontFamily,
				["--body1-weight" as any]: String(resolvedBody1Weight),
				["--body2-weight" as any]: String(resolvedBody2Weight),
				["--body1-size" as any]: resolvedBody1Size,
				["--body2-size" as any]: resolvedBody2Size,
				["--meta-size" as any]: metaSizePx,
				["--label-size" as any]: labelSizePx,
				["--small-size" as any]: smallSizePx,
				["--chip-size" as any]: chipSizePx,
				["--button-size" as any]: buttonSizePx,
				["--font-family" as any]: resolvedBody1FontFamily,
				["--title-family" as any]: resolvedTitleFontFamily,
				["--subtitle-family" as any]: resolvedSubtitleFontFamily,
				["--heading-weight" as any]: headingWeight,
				["--body-weight" as any]: bodyWeight,
				["--label-weight" as any]: labelWeight,
				["--heading-size" as any]: headingSize,
				["--body-size" as any]: bodySize,
				["--input-size" as any]: `${inputSize}px`,
				["--field-gap" as any]: `${fieldGap}px`,
				["--input-radius" as any]: `${inputRadius}px`,
				["--button-radius" as any]: `${buttonRadius}px`,
				["--chip-radius" as any]: `${chipRadius}px`,
				["--role-card-radius" as any]: `${roleCardRadius}px`,

				["--teal" as any]: teal,
				["--teal2" as any]: teal2,	// accent darkened ~12%
				["--tealDim" as any]: tealDim,
				["--tealGlow" as any]: tealGlow,
				["--tealBorder" as any]: tealBorder,
				["--borderFocus" as any]: borderFocus,
				["--labelTagBg" as any]: labelTagBg || (darkMode ? "rgba(15,212,180,0.12)" : "rgba(10,175,150,0.14)"),
				["--labelTagText" as any]: darkMode ? teal : tealDark15,

				["--color-heading" as any]: (colorHeading || "").trim() || (darkMode ? "#f0f7f5" : "#0d1a18"),
				["--color-body" as any]: (colorBody || "").trim() || (darkMode ? "rgba(200,230,225,0.55)" : "rgba(13,26,24,0.55)"),
				["--btnText" as any]: darkMode ? "#030d1a" : "#ffffff",
				["--card-bg" as any]: cardBg,

				// Text
				["--t1" as any]: darkMode ? "#f0f7f5" : "#0d1a18",
				["--t2" as any]: bodyTextColor ? rgba(bodyTextColor, 0.75) : darkMode ? "rgba(200,230,225,0.7)" : "rgba(13,26,24,0.68)",
				["--t3" as any]: bodyTextColor ? rgba(bodyTextColor, 0.45) : darkMode ? "rgba(200,230,225,0.45)" : "rgba(13,26,24,0.48)",
				["--t4" as any]: darkMode ? "rgba(200,230,225,0.18)" : "rgba(13,26,24,0.22)",
				["--tMuted" as any]: bodyTextColor ? rgba(bodyTextColor, 0.3) : darkMode ? "rgba(200,230,225,0.28)" : "rgba(13,26,24,0.28)",
				["--tHint" as any]: bodyTextColor ? rgba(bodyTextColor, 0.22) : darkMode ? "rgba(200,230,225,0.18)" : "rgba(13,26,24,0.18)",

				// Card
				["--cardBg" as any]: cardBg,
				["--cardBorder" as any]: darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
				["--cardShadow" as any]: darkMode
					? "0 0 0 1px rgba(255,255,255,0.03) inset, 0 32px 64px rgba(0,0,0,0.4)"
					: "0 0 0 1px rgba(0,0,0,0.04) inset, 0 24px 48px rgba(0,0,0,0.10)",
				["--cardShimmer" as any]: darkMode
					? `linear-gradient(90deg,transparent,${rgba(teal, 0.4)},${rgba(teal, 0.2)},transparent)`
					: `linear-gradient(90deg,transparent,${rgba(teal, 0.3)},transparent)`,

				// Progress
				["--pEmpty" as any]: darkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)",
				["--pNow" as any]: darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",

				// Inputs
				["--inputBg" as any]: darkMode ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
				["--inputBorder" as any]: darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)",
				["--inputText" as any]: darkMode ? "#e8f4f2" : "#0d1a18",
				["--inputPlaceholder" as any]: darkMode ? "rgba(232,244,242,0.18)" : "rgba(15,14,13,0.28)",
				["--inputFocusBorder" as any]: darkMode ? borderFocus : rgba(teal, 0.55),
				["--inputFocusBg" as any]: darkMode ? tealGlow : rgba(teal, 0.05),
				["--inputFocusShadow" as any]: darkMode ? tealGlow : rgba(teal, 0.1),
				["--inputErrBorder" as any]: darkMode ? "rgba(239,68,68,.45)" : "rgba(220,38,38,0.6)",

				// Select
				["--selectUnfilled" as any]: darkMode ? "rgba(232,244,242,0.35)" : "rgba(13,26,24,0.4)",
				["--selectFilled" as any]: darkMode ? "#e8f4f2" : "#0d1a18",
				["--selectOptionBg" as any]: darkMode ? "#07152e" : "#ffffff",
				["--selectOptionText" as any]: darkMode ? "#e8f4f2" : "#0d1a18",

				// Role cards
				["--roleBg" as any]: darkMode ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
				["--roleBorder" as any]: darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
				["--roleHoverBg" as any]: darkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
				["--roleHoverBorder" as any]: darkMode ? "rgba(255,255,255,0.13)" : "rgba(0,0,0,0.14)",
				["--roleOnBg" as any]: darkMode ? tealGlow : rgba(teal, 0.08),
				["--roleOnBorder" as any]: darkMode ? tealBorder : rgba(teal, 0.4),
				["--roleName" as any]: darkMode ? "rgba(232,244,242,0.6)" : "rgba(15,14,13,0.65)",
				["--roleNameOn" as any]: darkMode ? "#e8f4f2" : "#0d1a18",
				["--roleDesc" as any]: darkMode ? "rgba(232,244,242,0.18)" : "rgba(15,14,13,0.35)",
				["--roleRadioBorder" as any]: darkMode ? "rgba(232,244,242,0.18)" : "rgba(15,14,13,0.22)",

				// Chips
				["--chipBg" as any]: darkMode ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
				["--chipBorder" as any]: darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.09)",
				["--chipText" as any]: darkMode ? "rgba(232,244,242,0.6)" : "rgba(15,14,13,0.6)",
				["--chipHoverBg" as any]: darkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.07)",
				["--chipHoverBorder" as any]: darkMode ? "rgba(255,255,255,0.13)" : "rgba(0,0,0,0.15)",
				["--chipOnBg" as any]: darkMode ? tealGlow : rgba(teal, 0.08),
				["--chipOnBorder" as any]: darkMode ? tealBorder : rgba(teal, 0.35),
				["--chipOnText" as any]: darkMode ? teal : teal,
				["--chipPip" as any]: darkMode ? "rgba(232,244,242,0.18)" : "rgba(15,14,13,0.22)",
				["--chipPipOn" as any]: darkMode ? teal : teal,
				["--chipsNote" as any]: darkMode ? "rgba(232,244,242,0.18)" : "rgba(15,14,13,0.3)",

				// Summary
				["--sumBg" as any]: darkMode ? tealGlow : rgba(teal, 0.06),
				["--sumBorder" as any]: darkMode ? tealBorder : rgba(teal, 0.18),
				["--sumHead" as any]: darkMode ? "rgba(232,244,242,0.18)" : "rgba(15,14,13,0.3)",
				["--sumRowBorder" as any]: darkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.07)",
				["--sumKey" as any]: darkMode ? "rgba(232,244,242,0.35)" : "rgba(15,14,13,0.45)",
				["--sumValue" as any]: darkMode ? "#e8f4f2" : "#0d1a18",
				["--sumChipBg" as any]: darkMode ? tealGlow : rgba(teal, 0.08),
				["--sumChipBorder" as any]: darkMode ? tealBorder : rgba(teal, 0.2),
				["--sumChipText" as any]: darkMode ? teal : tealDark15,
				["--noneSelected" as any]: darkMode ? "rgba(232,244,242,0.18)" : "rgba(15,14,13,0.3)",

				// Social proof
				["--socialBg" as any]: darkMode ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.03)",
				["--socialBorder" as any]: darkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.07)",
				["--socialText" as any]: darkMode ? "rgba(232,244,242,0.35)" : "rgba(15,14,13,0.4)",
				["--socialStrong" as any]: darkMode ? "rgba(232,244,242,0.6)" : "rgba(15,14,13,0.65)",
				["--avatarBorder" as any]: darkMode ? "rgba(4,13,26,0.8)" : "rgba(255,255,255,0.9)",
				["--a4Bg" as any]: darkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
				["--a4Text" as any]: darkMode ? "rgba(232,244,242,0.35)" : "rgba(15,14,13,0.4)",
				["--a4Border" as any]: darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",

				// Terms
				["--termsText" as any]: darkMode ? "rgba(232,244,242,0.35)" : "rgba(15,14,13,0.4)",
				["--termsLink" as any]: darkMode ? teal : tealDark15,
				["--termsBoxBorder" as any]: darkMode ? "rgba(232,244,242,0.18)" : "rgba(15,14,13,0.22)",
				["--termsBoxOn" as any]: darkMode ? teal2 : teal,

				// Divider
				["--divider" as any]: darkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.07)",

				// Back button
				["--backBg" as any]: darkMode ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
				["--backBorder" as any]: darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.09)",
				["--backText" as any]: darkMode ? "rgba(232,244,242,0.35)" : "rgba(15,14,13,0.4)",
				["--backHoverBg" as any]: darkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.07)",
				["--backHoverBorder" as any]: darkMode ? "rgba(255,255,255,0.13)" : "rgba(0,0,0,0.18)",
				["--backHoverText" as any]: darkMode ? "rgba(232,244,242,0.6)" : "rgba(15,14,13,0.7)",

				// Role hint
				["--roleHint" as any]: darkMode ? "rgba(232,244,242,0.18)" : "rgba(15,14,13,0.3)",
				["--roleHintOk" as any]: darkMode ? teal : tealDark15,

				// Error text
				["--errText" as any]: darkMode ? "rgba(239,100,100,.8)" : "rgba(185,28,28,0.85)",

				// Success
				["--successRingBg" as any]: darkMode ? tealGlow : rgba(teal, 0.1),
				["--successRingBorder" as any]: darkMode ? tealBorder : rgba(teal, 0.3),
				["--successRingIcon" as any]: darkMode ? teal : teal,
				["--successSub" as any]: darkMode ? "rgba(232,244,242,0.6)" : "rgba(13,26,24,0.55)",
				["--successEm" as any]: darkMode ? teal : tealDark15,
				["--posPillBg" as any]: darkMode ? tealGlow : rgba(teal, 0.08),
				["--posPillBorder" as any]: darkMode ? tealBorder : rgba(teal, 0.22),
				["--posPillText" as any]: darkMode ? teal : tealDark15,
			}}
		>
			
			<style>{`
				.fw *,.fw *::before,.fw *::after{box-sizing:border-box;margin:0;padding:0}
				.fw{font-family:var(--body1-family, var(--font-family)),sans-serif;-webkit-font-smoothing:antialiased}

				.step-meta{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}
				.step-tag{display:inline-flex;align-items:center;padding:3px 10px;border-radius:100px;background: var(--labelTagBg);color: var(--labelTagText);font-family:var(--body1-family, var(--font-family)),sans-serif;font-size:var(--meta-size, 11px);font-weight:var(--label-weight);letter-spacing:0.09em;text-transform:uppercase;opacity:1}
				.step-n{font-family:var(--body1-family, var(--font-family)),sans-serif;font-size:var(--meta-size, 11px);font-weight:600;color: var(--t4)}
				.step-title{font-family:var(--title-family, var(--font-family)),sans-serif;font-size:var(--heading-size);font-weight:var(--heading-weight);letter-spacing:-0.03em;color: var(--color-heading);line-height:1.12;margin-bottom:8px}
				.step-sub{font-family:var(--subtitle-family, var(--font-family)),sans-serif;font-size:var(--body-size);color: var(--color-body);font-weight:var(--body-weight);line-height:1.65;margin-bottom:28px}

				.glass-card{
					background: var(--card-bg);
					border: 1px solid var(--cardBorder);
					border-radius: var(--card-radius);
					padding: var(--card-padding-y) var(--card-padding-x);
					backdrop-filter: blur(var(--card-blur));
					-webkit-backdrop-filter: blur(var(--card-blur));
					position: relative;
					box-shadow: var(--cardShadow);
					width: 100%;
					max-height: min(92svh, 100%);
					overflow-y: auto;
					touch-action: pan-y;
					overscroll-behavior: contain;
					scrollbar-width: none;
					-ms-overflow-style: none;
				}
				.glass-card::-webkit-scrollbar{display:none}

				.pages-wrap{min-height:0}

				/* Responsive tweaks */
				@media(max-width: 420px){
					.glass-card{padding: 28px 20px 24px;border-radius: var(--card-radius)}
					.prog{margin-bottom: 28px}
					.frow{flex-direction: column}
					.role-grid{grid-template-columns: 1fr}
					.footer{flex-direction: column}
					.btn-back,.btn-main{width: 100%}
				}

				.card-shimmer{
					position:absolute;top:0;left:44px;right:44px;height:1px;
					background: var(--cardShimmer);
				}

				.prog{display:flex;gap:5px;margin-bottom:36px;align-items:center;width:100%}
				.pdots{display:flex;flex:1;justify-content:center;gap:clamp(8px, 2vw, 12px);align-items:center;min-width:0;flex-wrap:nowrap}
				.pdot{flex:0 0 auto;width:clamp(10px, 1.3vw, 10px);height:clamp(10px, 1.3vw, 10px);border-radius:50%;background: var(--pEmpty);outline:1px solid rgba(255,255,255,0.12);outline-offset:-1px;transition: background .18s, transform .18s}
				.pdot.done{background: var(--teal);outline-color: transparent}
				.pdot.now{background: var(--teal2);outline-color: rgba(255,255,255,0.22);transform: scale(1.15)}
				.pnums{display:flex;flex:1;justify-content:center;gap:clamp(8px, 2vw, 12px);align-items:center;min-width:0;flex-wrap:nowrap}
				.pnum{flex:0 0 auto;width:clamp(22px, 3.2vw, 26px);height:clamp(22px, 3.2vw, 26px);border-radius:50%;display:flex;align-items:center;justify-content:center;background: var(--pEmpty);color: var(--t2);font-size:clamp(11px, 1.4vw, 12px);font-weight:600;transition: background .18s, color .18s, transform .18s}
				.pnum.done{background: var(--teal);color: #fff}
				.pnum.now{background: var(--teal2);color: #fff;transform: scale(1.05)}
				.pseg{flex:1;height:2px;border-radius:2px;background: var(--pEmpty);position:relative;overflow:hidden}

				@media(min-width: 421px) and (max-width: 768px){
					.pdots,.pnums{gap:clamp(10px, 2.4vw, 14px)}
					.pdot{width:clamp(10px, 1.4vw, 11px);height:clamp(10px, 1.4vw, 11px)}
					.pnum{width:clamp(22px, 3vw, 28px);height:clamp(22px, 3vw, 28px);font-size:clamp(11px, 1.2vw, 12px)}
				}

				.pseg.done{background: var(--teal)}
				.pseg.now{background: var(--pNow)}
				.pseg.now::after{content:'';position:absolute;inset:0;background: linear-gradient(90deg,var(--teal2), var(--teal));border-radius:2px;animation: pf .5s cubic-bezier(.4,0,.2,1) forwards}
				@keyframes pf{from{width:0}to{width:100%}}

				.fields{display:flex;flex-direction:column;gap:var(--field-gap);margin-bottom:24px}
				.frow{display:flex;gap:10px}
				.frow .field{flex:1;min-width:0}

				.field label{font-family:var(--body1-family, var(--font-family)),sans-serif;display:block;font-size:var(--label-size, 11px);font-weight:var(--label-weight);color: var(--t3);margin-bottom:7px;letter-spacing:0.05em;text-transform:uppercase}
				.field label .opt{font-weight:400;color: var(--t4);text-transform:none;letter-spacing:0}

				.field input,.field select,.field textarea{
					width:100%;
					background: var(--inputBg);
					border: 1px solid var(--inputBorder);
					border-radius: var(--input-radius);
					padding: 11px 14px;
					font-family:var(--body2-family, var(--body1-family, var(--font-family))),sans-serif;
					font-size:var(--body2-size, var(--input-size));font-weight:var(--body2-weight, 400);
					color: var(--inputText);
					outline:none;
					backdrop-filter: blur(8px);
					transition: border-color .18s, background .18s, box-shadow .18s;
					appearance:none;
				}
				.field input::placeholder,.field textarea::placeholder{color: var(--inputPlaceholder)}
				.field select{color: var(--selectUnfilled);cursor:pointer}
				.field select.filled{color: var(--selectFilled)}
				.field select option{background: var(--selectOptionBg);color: var(--selectOptionText)}

				.field input:focus,.field select:focus,.field textarea:focus{
					border-color: var(--inputFocusBorder);
					background: var(--inputFocusBg);
					box-shadow: 0 0 0 3px var(--inputFocusShadow);
				}

				.field input.err{border-color: var(--inputErrBorder)}
				.err-txt{font-size:11px;color: var(--errText);margin-top:5px;display:none}
				.field input.err ~ .err-txt{display:block}
				.field textarea{resize:none;line-height:1.65}

				.role-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px}

				.rcard{
					background: var(--roleBg);
					border: 1px solid var(--roleBorder);
					border-radius: var(--role-card-radius);
					padding: 14px;
					cursor:pointer;user-select:none;
					display:flex;flex-direction:column;gap:10px;
					backdrop-filter: blur(8px);
					transition: border-color .18s, background .18s;
				}
				.rcard:hover{border-color: var(--roleHoverBorder);background: var(--roleHoverBg)}
				.rcard.on{border-color: var(--roleOnBorder);background: var(--roleOnBg)}
				.rcard-top{display:flex;justify-content:space-between;align-items:flex-start}

				.rcard-radio{width:16px;height:16px;border-radius:50%;border: 1.5px solid var(--roleRadioBorder);display:flex;align-items:center;justify-content:center;transition:border-color .18s;flex-shrink:0}
				.rcard.on .rcard-radio{border-color: var(--teal)}

				.rcard-dot{width:7px;height:7px;border-radius:50%;background: var(--teal);opacity:0;transform: scale(0);transition: opacity .14s, transform .14s}
				.rcard.on .rcard-dot{opacity:1;transform: scale(1)}

				.rcard-name{font-size:13px;font-weight:600;color: var(--roleName);transition: color .18s}
				.rcard.on .rcard-name{color: var(--roleNameOn)}
				.rcard-desc{font-size:11px;color: var(--roleDesc);line-height:1.5;font-weight:400}

				.role-hint{font-family:var(--body1-family, var(--font-family)),sans-serif;font-size:var(--small-size, 12px);color: var(--roleHint);margin-bottom:20px;min-height:16px;transition: color .2s}
				.role-hint.ok{color: var(--roleHintOk)}

				.chips{display:flex;flex-wrap:wrap;gap:7px;margin-bottom:12px}
				.chip{
					display:inline-flex;align-items:center;gap:6px;
					padding:7px 13px;
					background: var(--chipBg);
					border:1px solid var(--chipBorder);
					border-radius:var(--chip-radius);
					font-size:var(--chip-size, 12.5px);font-weight:500;
					color: var(--chipText);
					cursor:pointer;user-select:none;
					backdrop-filter: blur(8px);
					transition: all .16s;
				}
				.chip:hover{border-color: var(--chipHoverBorder);background: var(--chipHoverBg)}
				.chip.on{background: var(--chipOnBg);border-color: var(--chipOnBorder);color: var(--chipOnText)}
				.chip-pip{width:5px;height:5px;border-radius:50%;background: var(--chipPip);flex-shrink:0;transition: background .16s}
				.chip.on .chip-pip{background: var(--chipPipOn)}

				.chips-foot{display:flex;justify-content:space-between;align-items:center;margin-bottom:24px}
				.chips-note{font-family:var(--body1-family, var(--font-family)),sans-serif;font-size:var(--small-size, 12px);color: var(--chipsNote)}
				.chips-badge{
					font-size:10.5px;font-weight:600;
					color: var(--teal);
					background: var(--tealGlow);
					border: 1px solid var(--tealBorder);
					border-radius:4px;padding:2px 8px;
				}

				.other-drop{max-height:0;overflow:hidden;opacity:0;transition: max-height .28s ease, opacity .28s ease, margin .28s;margin-bottom:0}
				.other-drop.open{max-height:60px;opacity:1;margin-bottom:12px}
				.other-drop input{
					width:100%;
					background: var(--inputBg);
					border: 1px solid var(--inputFocusBorder);
					border-radius: var(--input-radius);
					padding: 11px 14px;
					font-family:var(--body2-family, var(--body1-family, var(--font-family))),sans-serif;
					font-size:var(--body2-size, var(--input-size));color: var(--inputText);
					outline:none;backdrop-filter: blur(8px);
				}
				.other-drop input::placeholder{color: var(--inputPlaceholder)}
				.other-drop input:focus{box-shadow: 0 0 0 3px var(--inputFocusShadow)}

				.summary{
					background: var(--sumBg);
					border: 1px solid var(--sumBorder);
					border-radius: 13px;
					padding: 15px;
					margin-bottom: 18px;
					backdrop-filter: blur(8px);
				}
				.sum-head{font-size:10px;font-weight:700;letter-spacing:0.09em;text-transform:uppercase;color: var(--sumHead);margin-bottom:12px}
				.sum-row{display:flex;justify-content:space-between;align-items:flex-start;padding: 7px 0;border-bottom:1px solid var(--sumRowBorder);gap:12px}
				.sum-row:last-child{border-bottom:none;padding-bottom:0}
				.sum-k{font-family:var(--body1-family, var(--font-family)),sans-serif;font-size:12px;color: var(--sumKey);white-space:nowrap;flex-shrink:0}
				.sum-v{font-family:var(--body1-family, var(--font-family)),sans-serif;font-size:12px;color: var(--sumValue);font-weight:600;text-align:right;line-height:1.5}
				.sum-chips{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:4px}
				.sum-chip{font-size:11px;padding:2px 9px;background: var(--sumChipBg);border:1px solid var(--sumChipBorder);border-radius:20px;color: var(--sumChipText)}

				.social{
					display:flex;align-items:center;gap:11px;
					padding: 11px 14px;
					background: var(--socialBg);
					border:1px solid var(--socialBorder);
					border-radius:10px;margin-bottom:18px;
					backdrop-filter: blur(8px);
				}
				.avs{display:flex}
				.av{width:24px;height:24px;border-radius:50%;border:1.5px solid var(--avatarBorder);display:flex;align-items:center;justify-content:center;font-size:8.5px;font-weight:700;margin-left:-6px;color: rgba(255,255,255,0.85)}
				.av:first-child{margin-left:0}
				.av img{width:100%;height:100%;border-radius:50%;object-fit:cover;display:block}
				.a1{background:#0d5a4e}
				.a2{background:#0a7a68}
				.a3{background:#0d9e88}
				.a4{background: var(--a4Bg);color: var(--a4Text);border-color: var(--a4Border)}
				.social-txt{font-family:var(--body1-family, var(--font-family)),sans-serif;font-size:var(--small-size, 12px);color: var(--socialText);line-height:1.5}
				.social-txt strong{color: var(--socialStrong);font-weight:600}

				.terms-row{display:flex;align-items:flex-start;gap:10px;cursor:pointer;margin-bottom:24px}
				.terms-box{width:16px;height:16px;border-radius:5px;border: 1.5px solid var(--termsBoxBorder);display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px;transition: background .15s,border-color .15s;font-size:9px;color:#fff;backdrop-filter: blur(4px)}
				.terms-row.on .terms-box{background: var(--termsBoxOn);border-color: var(--termsBoxOn)}
				.terms-copy{font-family:var(--body1-family, var(--font-family)),sans-serif;font-size:var(--small-size, 12px);color: var(--termsText);line-height:1.65;font-weight:400}
				.terms-copy a{color: var(--termsLink);text-decoration:none;opacity:0.8}
				.terms-copy a:hover{opacity:1}

				.divider{height:1px;background: var(--divider);margin: 2px 0 18px}

				.footer{display:flex;gap:8px}
				.btn-back{
					display:flex;align-items:center;gap:5px;
					background: var(--backBg);
					border:1px solid var(--backBorder);
					border-radius:var(--button-radius);padding: 11px 18px;
					font-family:var(--body2-family, var(--body1-family, var(--font-family))),sans-serif;
					font-size:var(--button-size, var(--body2-size, 13.5px));font-weight:var(--body2-weight, 500);
					color: var(--backText);
					cursor:pointer;
					backdrop-filter: blur(8px);
					transition: border-color .18s,color .18s,background .18s;
					white-space:nowrap;
				}
				.btn-back:hover{border-color: var(--backHoverBorder);color: var(--backHoverText);background: var(--backHoverBg)}

				.btn-main{
					flex:1;display:flex;align-items:center;justify-content:center;gap:7px;
					background: var(--teal2);
					border:none;border-radius:var(--button-radius);
					padding: 12px 24px;
					font-family:var(--body2-family, var(--body1-family, var(--font-family))),sans-serif;
					font-size:var(--button-size, var(--body2-size, 14px));font-weight:var(--body2-weight, 700);
					color: var(--btnText);
					cursor:pointer;
					transition: background .18s, transform .12s, opacity .18s;
					letter-spacing:-0.01em;
					position:relative;overflow:hidden;
				}
				.btn-main::before{content:'';position:absolute;inset:0;background: linear-gradient(135deg, rgba(255,255,255,0.12), transparent);pointer-events:none}
				.btn-main:hover{background: var(--teal)}
				.btn-main:active{transform: scale(0.985)}
				.btn-main.locked{opacity:0.28;pointer-events:none}
				.arr{display:inline-block;transition: transform .18s}
				.btn-main:hover .arr{transform: translateX(3px)}

				.success-ring{width:56px;height:56px;border-radius:50%;background: var(--successRingBg);border:1px solid var(--successRingBorder);display:flex;align-items:center;justify-content:center;margin-bottom:22px;font-size:22px;color: var(--successRingIcon)}
				.success-title{font-family:var(--title-family, var(--font-family)),sans-serif;font-size:var(--heading-size);font-weight:var(--heading-weight);letter-spacing:-0.03em;color: var(--color-heading);margin-bottom:10px;line-height:1.1}
				.success-sub{font-size:14px;color: var(--successSub);font-weight:300;line-height:1.65;margin-bottom:22px}
				.success-sub em{color: var(--successEm);font-style:normal;font-weight:600}
				.pos-pill{display:inline-flex;align-items:center;gap:7px;padding: 7px 18px;background: var(--posPillBg);border:1px solid var(--posPillBorder);border-radius:100px;font-size:12px;color: var(--posPillText);font-weight:600;margin-bottom:28px}

				.success-wrap{position:absolute;inset:0;width:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;z-index:10}
			`}</style>

			<div className="glass-card">
				{shimmerVisible && <div className="card-shimmer" style={{ background: "var(--cardShimmer)" }} />}

				<div className="prog" style={{ display: success ? "none" : "flex" }} aria-hidden={success ? true : undefined}>
					{(() => {
						if (indicatorStyle === "dots") {
							return (
								<div className="pdots" aria-label="Progress">
									{([1, 2, 3, 4] as Step[]).map((s) => {
										const done = s < currentStep
										const now = s === currentStep
										return <span key={s} className={"pdot" + (done ? " done" : now ? " now" : "")} />
									})}
								</div>
							)
						}
						if (indicatorStyle === "numbers") {
							return (
								<div className="pnums" aria-label="Progress">
									{([1, 2, 3, 4] as Step[]).map((s) => {
										const done = s < currentStep
										const now = s === currentStep
										return (
											<span key={s} className={"pnum" + (done ? " done" : now ? " now" : "")}>
												{s}
											</span>
										)
									})}
								</div>
							)
						}
						return (
							<>
								<div className={progressSegClass(1)} />
								<div className={progressSegClass(2)} />
								<div className={progressSegClass(3)} />
								<div className={progressSegClass(4)} />
							</>
						)
					})()}</div>

				<input type="hidden" name="Role" value={hiddenRoleValue} />
				<input type="hidden" name="Use-Cases" value={hiddenUseCasesValue} />
				<input type="hidden" name="Use-Cases-Count" value={String(computedChipCount)} />

				<div
					className="pages-wrap"
					style={{ position: "relative", overflow: "hidden" }}
				>
					<motion.div
						style={{ ...PAGE_STYLE_BASE, ...renderPageStyle(1) }}
						animate={renderMotionState(1)}
						transition={pageMotion}
					>
						<div className="step-meta">
							<span className="step-tag">{step1Label}</span>
							<span className="step-n">1 / 4</span>
						</div>
						<div className="step-title">{step1HeadingResolved}</div>
						<div className="step-sub">{step1SubResolved}</div>

						<div className="fields">
							<div className="frow">
								<div className="field">
									<label>First name</label>
									<input
										name="First-Name"
										type="text"
										placeholder="Alex"
										autoComplete="given-name"
										value={firstName}
										onChange={(e) => setFirstName(e.currentTarget.value)}
									/>
								</div>
								<div className="field">
									<label>Last name</label>
									<input
										name="Last-Name"
										type="text"
										placeholder="Morgan"
										autoComplete="family-name"
										value={lastName}
										onChange={(e) => setLastName(e.currentTarget.value)}
									/>
								</div>
							</div>

							<div className="field">
								<label>Work email</label>
								<input
									name="Email"
									type="email"
									placeholder="alex@company.com"
									value={email}
									onChange={(e) => setEmail(e.currentTarget.value)}
									className={emailErr ? "err" : undefined}
									inputMode="email"
									autoComplete="email"
								/>
								<p className="err-txt">Please enter a valid work email.</p>
							</div>

							<div className="field">
								<label>Company</label>
								<input
									name="Company"
									type="text"
									placeholder="Acme Inc."
									value={company}
									onChange={(e) => setCompany(e.currentTarget.value)}
								/>
							</div>
						</div>

						<div className="footer">
							<button
								type="button"
								className={`btn-main ${canContinueFromStep1 ? "" : "locked"}`}
								onClick={() => (canContinueFromStep1 ? goTo(2) : null)}
								aria-disabled={canContinueFromStep1 ? "false" : "true"}
							>
								Continue <span className="arr">→</span>
							</button>
						</div>
					</motion.div>

					<motion.div
						style={{ ...PAGE_STYLE_BASE, ...renderPageStyle(2) }}
						animate={renderMotionState(2)}
						transition={pageMotion}
					>
						<div className="step-meta">
							<span className="step-tag">{step2Label}</span>
							<span className="step-n">2 / 4</span>
						</div>
						<div className="step-title">{step2HeadingResolved}</div>
						<div className="step-sub">{step2SubResolved}</div>

						<div className="role-grid" role="radiogroup" aria-label="Role">
							{roles.map((r) => {
								const on = role === r.label
								return (
									<motion.div
										key={r.label}
										className={`rcard ${on ? "on" : ""}`}
										role="radio"
										aria-checked={on}
										tabIndex={0}
										whileHover={{ y: -1 }}
										onClick={() => pickRole(r.label)}
										onKeyDown={(e) => {
											if (e.key === "Enter" || e.key === " ") {
												e.preventDefault()
												pickRole(r.label)
											}
										}}
									>
										<div className="rcard-top">
											<div className="rcard-radio" aria-hidden="true">
												<div className="rcard-dot" />
											</div>
										</div>
										<div className="rcard-name">{r.label}</div>
										<div className="rcard-desc">{r.desc}</div>
									</motion.div>
								)
							})}
						</div>

						<p className={`role-hint ${step2HintOk ? "ok" : ""}`}>{step2HintText}</p>

						<div className="footer">
							<button type="button" className="btn-back" onClick={() => goTo(1)}>
								← Back
							</button>
							<button
								type="button"
								className={`btn-main ${isRoleLocked ? "locked" : ""}`}
								onClick={() => (!isRoleLocked ? goTo(3) : null)}
								aria-disabled={isRoleLocked ? "true" : "false"}
							>
								Continue <span className="arr">→</span>
							</button>
						</div>
					</motion.div>

					<motion.div
						style={{ ...PAGE_STYLE_BASE, ...renderPageStyle(3) }}
						animate={renderMotionState(3)}
						transition={pageMotion}
					>
						<div className="step-meta">
							<span className="step-tag">{step3Label}</span>
							<span className="step-n">3 / 4</span>
						</div>
						<div className="step-title">{step3HeadingResolved}</div>
						<div className="step-sub">{step3SubResolved}</div>

						<div className="chips" aria-label="Use cases">
							{chipsList.map((c) => {
								const on = c.isOther ? otherOn : chips.includes(c.label)
								return (
									<div
										key={c.label}
										className={`chip ${on ? "on" : ""}`}
										role="checkbox"
										aria-checked={on}
										tabIndex={0}
										onClick={() => (c.isOther ? toggleOther() : toggleChip(c.label))}
										onKeyDown={(e) => {
											if (e.key === "Enter" || e.key === " ") {
												e.preventDefault()
												c.isOther ? toggleOther() : toggleChip(c.label)
											}
										}}
									>
										<div className="chip-pip" aria-hidden="true" />
										{c.label}
									</div>
								)
							})}
						</div>

						<div className={`other-drop ${otherOn ? "open" : ""}`}>
							<input
								ref={otherInputRef}
								aria-label="Other use case"
								name="Other-Use-Case"
								type="text"
								placeholder="Describe your use case…"
								value={otherText}
								onChange={(e) => setOtherText(e.currentTarget.value)}
							/>
						</div>

						<div className="chips-foot">
							<span className="chips-note">Select all that apply</span>
							<span className="chips-badge">{computedChipCount} selected</span>
						</div>

						<div className="footer">
							<button type="button" className="btn-back" onClick={() => goTo(2)}>
								← Back
							</button>
							<button type="button" className="btn-main" onClick={() => goTo(4)}>
								Continue <span className="arr">→</span>
							</button>
						</div>
					</motion.div>

					<motion.div
						style={{
							...PAGE_STYLE_BASE,
							...step4Style,
							position: step4Style.position as CSSProperties["position"],
							opacity: success ? 0 : (step4Style.opacity as number),
							pointerEvents: success ? "none" : step4Style.pointerEvents,
							visibility: success ? "hidden" : step4Style.visibility,
						}}
						animate={renderMotionState(4)}
						transition={pageMotion}
					>
						<div className="step-meta">
							<span className="step-tag">{step4Label}</span>
							<span className="step-n">4 / 4</span>
						</div>
						<div className="step-title">{step4HeadingResolved}</div>
						<div className="step-sub">{step4SubResolved}</div>

						<div className="summary" aria-label="Summary">
							<div className="sum-head">Your details</div>
							<div className="sum-row">
								<span className="sum-k">Name</span>
								<span className="sum-v">{summaryName}</span>
							</div>
							<div className="sum-row">
								<span className="sum-k">Company</span>
								<span className="sum-v">{summaryCompany}</span>
							</div>
							<div className="sum-row">
								<span className="sum-k">Role</span>
								<span className="sum-v">{summaryRole}</span>
							</div>
							<div className="sum-row">
								<span className="sum-k">Use cases</span>
								<div className="sum-chips">
									{summaryUseCases.length ? (
										summaryUseCases.map((c) => (
											<span key={c} className="sum-chip">
												{c}
											</span>
										))
									) : (
										<span style={{ fontSize: 12, color: "var(--noneSelected)" }}>None selected</span>
									)}
								</div>
							</div>
						</div>

						<div className="fields">
							<div className="field">
								<label>
									{buildingLabel} <span className="opt">(optional)</span>
								</label>
								<textarea
									name="What-Are-You-Building"
									rows={2}
									placeholder="e.g. A SaaS tool for freelance designers…"
									value={building}
									onChange={(e) => setBuilding(e.currentTarget.value)}
								/>
							</div>

							<div className="field">
								<label>{sourceLabel}</label>
								<select
									name="How-Did-You-Hear"
									value={source}
									onChange={(e) => setSource(e.currentTarget.value)}
									className={source ? "filled" : undefined}
								>
									<option value="" disabled>
										Select an option
									</option>
									{(Array.isArray(step4Options?.sourceOptions) && step4Options?.sourceOptions.length > 0
										? step4Options?.sourceOptions
										: DEFAULT_SOURCE_OPTIONS
									).map((opt) => (
										<option key={opt} value={opt}>
											{opt}
										</option>
									))}
								</select>
							</div>
						</div>

						<div className="divider" />

						{showSocialProof && (
							<div className="social" aria-label="Social proof">
								<div className="avs" aria-hidden="true">
									<div className="av a1">
										<img
											src={peopleImages[0].src}
											srcSet={peopleImages[0].srcSet}
											alt={peopleImages[0].alt || ""}
											onError={(e) => {
												;(e.currentTarget as HTMLImageElement).style.display = "none"
											}}
										/>
									</div>
									<div className="av a2">
										<img
											src={peopleImages[1].src}
											srcSet={peopleImages[1].srcSet}
											alt={peopleImages[1].alt || ""}
											onError={(e) => {
												;(e.currentTarget as HTMLImageElement).style.display = "none"
											}}
										/>
									</div>
									<div className="av a3">
										<img
											src={peopleImages[2].src}
											srcSet={peopleImages[2].srcSet}
											alt={peopleImages[2].alt || ""}
											onError={(e) => {
												;(e.currentTarget as HTMLImageElement).style.display = "none"
											}}
										/>
									</div>
									<div className="av a4">+</div>
								</div>
								<p className="social-txt">{socialProofText}</p>
							</div>
						)}

						<div
							className={`terms-row ${terms ? "on" : ""}`}
							role="checkbox"
							aria-checked={terms}
							tabIndex={0}
							onClick={toggleTerms}
							onKeyDown={(e) => {
								if (e.key === "Enter" || e.key === " ") {
									e.preventDefault()
									toggleTerms()
								}
							}}
						>
							<input
								type="checkbox"
								name="Terms-Accepted"
								checked={terms}
								readOnly
								style={{ position: "absolute", opacity: 0, pointerEvents: "none" }}
								tabIndex={-1}
								aria-hidden="true"
							/>
							<div className="terms-box" aria-hidden="true">
								{terms ? "✓" : ""}
							</div>
							<p className="terms-copy">
								I agree to receive product updates and early access emails. No spam — unsubscribe anytime.{" "}
								<a
									href={privacyPolicyLink}
									onClick={privacyPolicyLink === "#" ? (e) => e.preventDefault() : undefined}
								>
									Privacy policy →
								</a>
							</p>
						</div>

						<div className="footer">
							<button type="button" className="btn-back" onClick={() => goTo(3)}>
								← Back
							</button>
							<button
								type="submit"
								className={`btn-main ${!terms ? "locked" : ""}`}
								onClick={(e) => {
									e.preventDefault()
									if (!terms) return
									doSubmit()
								}}
								aria-disabled={!terms ? "true" : "false"}
							>
								{ctaLabel} <span className="arr">→</span>
							</button>
						</div>
					</motion.div>

					<AnimatePresence>
						{success && (
							<motion.div
								key="success"
								className="success-wrap"
								role="status"
								aria-live="polite"
								aria-label="Success"
								initial={{ opacity: 0, scale: 0.93 }}
								animate={{ opacity: 1, scale: 1 }}
								exit={{ opacity: 0, scale: 0.97 }}
								transition={{ duration: 0.45, ease: [0.34, 1.3, 0.64, 1] }}
							>
								<div className="success-ring" aria-hidden="true">
									✓
								</div>
								<div className="success-title">{successTitle}</div>
								<div className="success-sub">
									{(() => {
										const parts = (successSub || "").split("{{email}}")
										if (parts.length === 1) return <>{successSub}</>
										return (
											<>
												{parts[0]}
												<em>{successEmail}</em>
												{parts.slice(1).join("{{email}}")} 
											</>
										)
									})()}
								</div>
								<div className="pos-pill">✓ &nbsp;{positionLabel}</div>
								<button type="button" className="btn-main" style={{ width: "100%", justifyContent: "center" }} onClick={restart}>
									Start over ↗
								</button>
							</motion.div>
						)}
					</AnimatePresence>
				</div>
			</div>
		</div>
	)
}

addPropertyControls(MultiStepWaitlistForm, {
	previewStep: {
		type: ControlType.Enum,
		title: "Preview Step",
		description: "Preview a specific step on the canvas.",
		options: ["", "1", "2", "3", "4", "success"],
		optionTitles: ["— Live —", "Step 1", "Step 2", "Step 3", "Step 4", "Success"],
		defaultValue: "",
	},
	indicatorStyle: {
		type: ControlType.Enum,
		title: "Progress Style",
		description: "Choose how the progress indicator is displayed.",
		options: ["bar", "dots", "numbers"],
		optionTitles: ["Bar", "Dots", "Numbers"],
		defaultValue: "bar",
	},
	darkMode: {
		type: ControlType.Boolean,
		title: "Theme",
		description: "Toggle the form between dark and light mode.",
		defaultValue: true,
		enabledTitle: "Dark",
		disabledTitle: "Light",
	},
	colors: {
		type: ControlType.Object,
		title: "Colors",
		description: "Open to adjust key colors.",
		controls: {
			accentColor: {
				type: ControlType.Color,
				title: "Accent",
				defaultValue: "#0fd4b4",
			},
			cardBackground: {
				type: ControlType.Color,
				title: "Card Background",
				defaultValue: "rgba(8, 15, 36, 0.72)",
			},
			titleColor: {
				type: ControlType.Color,
				title: "Title",
				defaultValue: "#f0f7f5",
				hidden: (props) => props.darkMode === false,
			},
			titleColorLight: {
				type: ControlType.Color,
				title: "Title",
				defaultValue: "#0d1a18",
				hidden: (props) => props.darkMode !== false,
			},
			subtitleColor: {
				type: ControlType.Color,
				title: "Subtitle",
				defaultValue: "rgba(200, 230, 225, 0.55)",
			},
			bodyTextColor: {
				type: ControlType.Color,
				title: "Body Text",
				defaultValue: "rgba(200, 230, 225, 0.7)",
			},
			labelTagBg: {
				type: ControlType.Color,
				title: "Label Tag",
				defaultValue: "rgba(15,212,180,0.12)",
			},
		},
	},
	fonts: {
		type: ControlType.Object,
		title: "Fonts",
		description: "Open to adjust fonts of title, subtitle, body.",
		controls: {
			title: {
				type: ControlType.Font,
				title: "Title",
				controls: "extended",
				defaultFontType: "sans-serif",
				defaultValue: { fontSize: 26, variant: "Extra Bold", letterSpacing: "-0.03em", lineHeight: "1.12em" },
			},
			subtitle: {
				type: ControlType.Font,
				title: "Subtitle",
				controls: "extended",
				defaultFontType: "sans-serif",
				defaultValue: { fontSize: 13, variant: "Light", letterSpacing: "-0.01em", lineHeight: "1.65em" },
			},
			body1: {
				type: ControlType.Font,
				title: "Body 1",
				controls: "extended",
				defaultFontType: "sans-serif",
				defaultValue: { fontSize: 13, variant: "Regular", letterSpacing: "-0.01em", lineHeight: "1.3em" },
			},
			body2: {
				type: ControlType.Font,
				title: "Body 2",
				controls: "extended",
				defaultFontType: "sans-serif",
				defaultValue: { fontSize: 14, variant: "Regular", letterSpacing: "-0.01em", lineHeight: "1.3em" },
			},
		},
	},
	step1Text: {
		type: ControlType.Object,
		title: "Step 1 : Text",
		description: "Edit the step label, title, and subtitle shown on Step 1.",
		controls: {
			label: { type: ControlType.String, title: "Step Label", defaultValue: "Account setup" },
			title: { type: ControlType.String, title: "Title", defaultValue: "Create your account" },
			subtitle: {
				type: ControlType.String,
				title: "Subtitle",
				defaultValue: "Free for 14 days. No credit card required.",
			},
		},
	},
	step2Text: {
		type: ControlType.Object,
		title: "Step 2 : Text",
		description: "Edit the step label, title, and subtitle shown on Step 2.",
		controls: {
			label: { type: ControlType.String, title: "Step Label", defaultValue: "Your role" },
			title: { type: ControlType.String, title: "Title", defaultValue: "What best describes you?" },
			subtitle: {
				type: ControlType.String,
				title: "Subtitle",
				defaultValue: "We'll personalise your setup based on how you work.",
			},
		},
	},
	roleCards: {
		type: ControlType.Array,
		title: "Step 2 : Role Cards",
		description: "Configure the selectable role options shown on Step 2.",
		maxCount: 8,
		control: {
			type: ControlType.Object,
			controls: {
				label: { type: ControlType.String, title: "Label", defaultValue: "Founder" },
				desc: { type: ControlType.String, title: "Description", defaultValue: "Building a product or startup" },
			},
		},
		defaultValue: DEFAULT_ROLE_OPTIONS,
	},
	step3Text: {
		type: ControlType.Object,
		title: "Step 3 : Text",
		description: "Edit the step label, title, and subtitle shown on Step 3.",
		controls: {
			label: { type: ControlType.String, title: "Step Label", defaultValue: "Use case" },
			title: { type: ControlType.String, title: "Title", defaultValue: "What are you here to do?" },
			subtitle: {
				type: ControlType.String,
				title: "Subtitle",
				defaultValue: "Select all that apply — we'll tailor your experience.",
			},
		},
	},
	useCaseChips: {
		type: ControlType.Array,
		title: "Step 3 : Chips",
		description: "Configure the selectable chips shown on Step 3 (\"Other\" is appended automatically).",
		maxCount: 12,
		control: { type: ControlType.String, title: "Label", defaultValue: "Manage projects" },
		defaultValue: DEFAULT_USE_CASE_OPTIONS,
	},
	step4Text: {
		type: ControlType.Object,
		title: "Step 4 : Text",
		description: "Edit the step label, title, subtitle, and question labels shown on Step 4.",
		controls: {
			label: { type: ControlType.String, title: "Step Label", defaultValue: "Final step" },
			title: { type: ControlType.String, title: "Title", defaultValue: "Join the waitlist" },
			subtitle: {
				type: ControlType.String,
				title: "Subtitle",
				defaultValue: "We're onboarding in batches — your spot is almost reserved.",
			},
			buildingLabel: {
				type: ControlType.String,
				title: "Building Question",
				defaultValue: "What are you building?",
			},
			sourceLabel: {
				type: ControlType.String,
				title: "Source Question",
				defaultValue: "How did you hear about us?",
			},
		},
	},
	step4Options: {
		type: ControlType.Object,
		title: "Step 4 : Options",
		description: "Configure source dropdown options and the social proof row on Step 4.",
		controls: {
			sourceOptions: {
				type: ControlType.Array,
				title: "Source Options",
				description: "Edit the dropdown options for the \"How did you hear about us?\" field.",
				maxCount: 10,
				control: { type: ControlType.String, title: "Label", defaultValue: "Twitter / X" },
				defaultValue: DEFAULT_SOURCE_OPTIONS,
			},
			showSocialProof: {
				type: ControlType.Boolean,
				title: "Show Social Proof",
				defaultValue: true,
				enabledTitle: "Show",
				disabledTitle: "Hide",
			},
			socialProofText: {
				type: ControlType.String,
				title: "Social Proof Text",
				defaultValue: "2,400+ people already on the list. New batch opening soon.",
				displayTextArea: true,
			},
			peopleImages: {
				type: ControlType.Array,
				title: "People Images",
				description: "Replace the 3 avatar circles in the social proof row.",
				maxCount: 3,
				control: {
					type: ControlType.ResponsiveImage,
					title: "Image",
				},
			},
		},
	},
	step4PrivacyPolicy: {
		type: ControlType.Link,
		title: "Step 4 : Privacy Policy",
		description: "Set the Privacy Policy link used in the terms row on Step 4.",
		defaultValue: "#",
	},
	step5Text: {
		type: ControlType.Object,
		title: "Step 5 : Text",
		description: "Edit the submit button label and the success state copy.",
		controls: {
			buttonLabel: { type: ControlType.String, title: "Button Label", defaultValue: "Join the waitlist" },
			successHeading: { type: ControlType.String, title: "Success Heading", defaultValue: "You're on the list" },
			successMessage: {
				type: ControlType.String,
				title: "Success Message",
				description: "Use {{email}} to insert the user's email address into the message.",
				defaultValue: "We'll email {{email}} when your spot opens up. Usually within 1–2 weeks.",
				displayTextArea: true,
			},
			positionBadge: { type: ControlType.String, title: "Position Badge", defaultValue: "Position #2,401 secured" },
		},
	},
})