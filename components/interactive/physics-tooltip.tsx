// Instructions: Create a Framer component named "PhysicsTooltip" as an inline-block keyword that shows a modern tooltip above on hover, positioned absolutely, following mouse X with useMotionValue/useSpring, adding tilt based on movement velocity (inertia), and animating appearance/disappearance with fade + slight scale. Expose property controls for Label, Definition, Spring Stiffness, Spring Damping, Tilt Strength, Y Offset.

import * as React from "react"
import { startTransition, useCallback, useMemo, useRef, useState, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import {
	AnimatePresence,
	motion,
	useMotionValue,
	useSpring,
	useTransform,
	useVelocity,
	useInView,
} from "framer-motion"

type PhysicsTooltipProps = {
	label: string
	definition: string
	physics: {
		springStiffness: number
		springDamping: number
		tiltStrength: number
		maxTiltDeg: number
	}
	yOffset: number
	tooltipWidth: number
	cursor: string
	enableMobileA11y: boolean
	labelColor: string
	tooltipBackground: string
	tooltipTextColor: string
	tooltipBorderColor: string
	tooltipShadow: string
	labelFont: any
	definitionFont: any
	style?: CSSProperties
}

function clamp(n: number, min: number, max: number) {
	return Math.min(max, Math.max(min, n))
}

/**
 * @framerIntrinsicWidth 140
 * @framerIntrinsicHeight 26
 *
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function KineticTooltip(props: PhysicsTooltipProps) {
	const {
		label,
		definition,
		physics,
		yOffset,
		tooltipWidth,
		cursor,
		enableMobileA11y,
		labelColor,
		tooltipBackground,
		tooltipTextColor,
		tooltipBorderColor,
		tooltipShadow,
		labelFont,
		definitionFont,
		style,
	} = props

	const { springStiffness, springDamping, tiltStrength, maxTiltDeg } = physics

	const isStatic = useIsStaticRenderer()

	const wrapRef = useRef<HTMLSpanElement | null>(null)
	const viewportRef = useRef<HTMLSpanElement | null>(null)
	const tooltipRef = useRef<HTMLDivElement | null>(null)
	const inView = useInView(viewportRef, { amount: 0.01 })

	const [open, setOpen] = useState(false)
	const [isTouch, setIsTouch] = useState(false)
	const [touchClampX, setTouchClampX] = useState(0)

	const touchA11yActive = enableMobileA11y && isTouch

	// Tooltip follow X: raw target from pointer, then spring.
	const xTarget = useMotionValue(0)
	const x = useSpring(xTarget, { stiffness: springStiffness, damping: springDamping, mass: 1 })

	// Tilt: based on velocity of the spring (smoothed), invert direction (move right -> tilt left).
	const xVel = useVelocity(x)
	const rawTilt = useTransform(xVel, (v) => {
		// v is px/s; keep predictable by normalizing
		const normalized = v / 1200 // 1200 px/s ~= strong movement
		const deg = -normalized * tiltStrength
		return clamp(deg, -maxTiltDeg, maxTiltDeg)
	})
	const tilt = useSpring(rawTilt, { stiffness: springStiffness, damping: springDamping, mass: 0.6 })

	const setOpenSafe = useCallback((next: boolean) => {
		startTransition(() => setOpen(next))
	}, [])

	const updateFromMouse = useCallback(
		(e: React.MouseEvent) => {
			if (!wrapRef.current) return
			const rect = wrapRef.current.getBoundingClientRect()
			const localX = e.clientX - rect.left
			const centered = localX - rect.width / 2

			// Clamp to avoid excessive drift near edges (still feels responsive).
			const max = Math.max(0, rect.width * 0.5)
			const clamped = clamp(centered, -max, max)

			xTarget.set(clamped)
		},
		[xTarget]
	)

	React.useEffect(() => {
		if (!enableMobileA11y) return
		if (typeof window === "undefined") return
		const mq = typeof window.matchMedia === "function" ? window.matchMedia("(pointer: coarse)") : null
		const coarse = mq?.matches ?? false
		const maxPoints = (navigator as any)?.maxTouchPoints ?? 0
		const touch = coarse || maxPoints > 0 || "ontouchstart" in window
		startTransition(() => setIsTouch(!!touch))
	}, [enableMobileA11y])

	React.useEffect(() => {
		if (!enableMobileA11y) return
		if (!touchA11yActive) return
		if (!open) return
		if (typeof window === "undefined") return
		const onPointerDown = (e: PointerEvent | MouseEvent) => {
			const target = e.target as Node | null
			if (!target) return
			if (wrapRef.current && wrapRef.current.contains(target)) return
			setOpenSafe(false)
		}
		// Use capture to reliably catch early
		document.addEventListener("pointerdown", onPointerDown as any, true)
		document.addEventListener("mousedown", onPointerDown as any, true)
		return () => {
			document.removeEventListener("pointerdown", onPointerDown as any, true)
			document.removeEventListener("mousedown", onPointerDown as any, true)
		}
	}, [enableMobileA11y, touchA11yActive, open, setOpenSafe])

	React.useEffect(() => {
		if (!enableMobileA11y) return
		if (!touchA11yActive) return
		if (!open) return
		if (typeof window === "undefined") return

		const updateClamp = () => {
			if (!wrapRef.current || !tooltipRef.current) return

			const wrapRect = wrapRef.current.getBoundingClientRect()
			const tipRect = tooltipRef.current.getBoundingClientRect()
			const viewportW = window.innerWidth || document.documentElement.clientWidth || 0
			if (!viewportW) return

			const margin = 8
			const desiredCenterX = wrapRect.left + wrapRect.width / 2

			// Tooltip is positioned with left:50% + translateX(-50%) relative to the wrap.
			// Adding x shifts it within the same coordinate space. Clamp so it stays in viewport.
			const desiredLeft = desiredCenterX - tipRect.width / 2
			const desiredRight = desiredCenterX + tipRect.width / 2

			let dx = 0
			if (desiredLeft < margin) dx = margin - desiredLeft
			else if (desiredRight > viewportW - margin) dx = viewportW - margin - desiredRight

			startTransition(() => setTouchClampX(dx))
		}

		updateClamp()
		window.addEventListener("resize", updateClamp)
		window.addEventListener("scroll", updateClamp, true)

		return () => {
			window.removeEventListener("resize", updateClamp)
			window.removeEventListener("scroll", updateClamp, true)
		}
	}, [enableMobileA11y, touchA11yActive, open, label, definition])

	const ariaLabel = useMemo(() => {
		const cleanLabel = (label || "").trim()
		const cleanDef = (definition || "").trim()
		if (!cleanLabel && !cleanDef) return "Tooltip"
		if (!cleanDef) return cleanLabel || "Tooltip"
		return `${cleanLabel}: ${cleanDef}`
	}, [label, definition])

	const containerStyle: CSSProperties = useMemo(
		() => ({
			...style,
			position: "relative",
			display: "inline-block",
			verticalAlign: "baseline",
			lineHeight: 1.1,
		}),
		[style]
	)

	const keywordStyle: CSSProperties = useMemo(
		() => ({
			position: "relative",
			display: "inline-block",
			color: labelColor,
			cursor: isStatic ? "default" : cursor,
			textDecorationSkipInk: "auto",
			WebkitFontSmoothing: "antialiased",
			MozOsxFontSmoothing: "grayscale",
			...labelFont,
		}),
		[labelColor, isStatic, cursor, labelFont]
	)

	const tooltipBaseStyle: CSSProperties = useMemo(
		() => ({
			position: "absolute",
			left: "50%",
			bottom: `calc(100% + ${yOffset}px)`,
			zIndex: 10,
			pointerEvents: "none",
			whiteSpace: "normal",
			width: "max-content",
			maxWidth: tooltipWidth,
		}),
		[yOffset, tooltipWidth]
	)

	const bubbleStyle: CSSProperties = useMemo(
		() => ({
			position: "relative",
			background: tooltipBackground,
			color: tooltipTextColor,
			borderRadius: 12,
			padding: "10px 12px",
			border: `1px solid ${tooltipBorderColor}`,
			boxShadow: tooltipShadow,
			WebkitFontSmoothing: "antialiased",
			MozOsxFontSmoothing: "grayscale",
			...definitionFont,
		}),
		[tooltipBackground, tooltipTextColor, tooltipBorderColor, tooltipShadow, definitionFont]
	)

	const caretStyle: CSSProperties = useMemo(
		() => ({
			position: "absolute",
			left: touchA11yActive ? `calc(50% - ${touchClampX}px)` : "50%",
			bottom: -6,
			width: 12,
			height: 12,
			transform: "translateX(-50%) rotate(45deg)",
			background: tooltipBackground,
			borderRight: `1px solid ${tooltipBorderColor}`,
			borderBottom: `1px solid ${tooltipBorderColor}`,
		}),
		[tooltipBackground, tooltipBorderColor, touchA11yActive, touchClampX]
	)

	const hasDefinition = (definition || "").trim().length > 0
	const showStaticTooltip = isStatic && RenderTarget.current() === RenderTarget.canvas && hasDefinition
	const shouldShow = (showStaticTooltip || (!isStatic && inView && open)) && hasDefinition

	return (
		<span ref={viewportRef} style={containerStyle}>
			<span
				ref={wrapRef}
				style={keywordStyle}
				onMouseEnter={isStatic || touchA11yActive ? undefined : () => setOpenSafe(true)}
				onMouseLeave={isStatic || touchA11yActive ? undefined : () => setOpenSafe(false)}
				onMouseMove={isStatic || touchA11yActive ? undefined : updateFromMouse}
				onClick={
					!enableMobileA11y || isStatic || !isTouch
						? undefined
						: () => {
								// Disable physics on touch by keeping tooltip centered
								xTarget.set(0)
								setOpenSafe(!open)
						  }
				}
				onFocus={enableMobileA11y && !isStatic && !isTouch ? () => setOpenSafe(true) : undefined}
				onBlur={enableMobileA11y && !isStatic && !isTouch ? () => setOpenSafe(false) : undefined}
				onKeyDown={
					enableMobileA11y && !isStatic
						? (e) => {
								if (e.key === "Escape") setOpenSafe(false)
						  }
						: undefined
				}
				tabIndex={enableMobileA11y && !isStatic ? 0 : undefined}
				role="button"
				aria-label={ariaLabel}
				aria-expanded={shouldShow}
			>
				{label}

				<AnimatePresence initial={false}>
					{shouldShow && (
						<motion.div
							ref={tooltipRef}
							key="tooltip"
							style={{
								...tooltipBaseStyle,
								translateX: "-50%",
								x: showStaticTooltip ? 0 : touchA11yActive ? touchClampX : x,
								rotateZ: showStaticTooltip || touchA11yActive ? 0 : tilt,
								transformOrigin: "50% 100%",
							}}
							initial={showStaticTooltip ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.95, y: 4 }}
							animate={{ opacity: 1, scale: 1, y: 0 }}
							exit={showStaticTooltip ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.97, y: 2 }}
							transition={showStaticTooltip ? { duration: 0 } : { duration: 0.16, ease: "easeOut" }}
							role="tooltip"
							aria-hidden={!shouldShow}
						>
							<div style={bubbleStyle}>
								{definition}
								<div style={caretStyle} aria-hidden="true" />
							</div>
						</motion.div>
					)}
				</AnimatePresence>
			</span>
		</span>
	)
}

addPropertyControls(KineticTooltip, {
	label: {
		type: ControlType.String,
		title: "Label",
		defaultValue: "Mot-clé",
	},
	definition: {
		type: ControlType.String,
		title: "Definition",
		defaultValue: "Une définition courte et utile qui apparaît au survol.",
		displayTextArea: true,
	},
	physics: {
		type: ControlType.Object,
		title: "Physics",
		controls: {
			springStiffness: {
				type: ControlType.Number,
				title: "Spring Stiffness",
				defaultValue: 520,
				min: 50,
				max: 2000,
				step: 10,
			},
			springDamping: {
				type: ControlType.Number,
				title: "Spring Damping",
				defaultValue: 34,
				min: 1,
				max: 200,
				step: 1,
			},
			tiltStrength: {
				type: ControlType.Number,
				title: "Tilt Strength",
				defaultValue: 10,
				min: 0,
				max: 40,
				step: 1,
			},
			maxTiltDeg: {
				type: ControlType.Number,
				title: "Max Tilt",
				defaultValue: 14,
				min: 0,
				max: 45,
				step: 1,
				unit: "°",
			},
		},
		defaultValue: {
			springStiffness: 520,
			springDamping: 34,
			tiltStrength: 10,
			maxTiltDeg: 14,
		},
	},
	yOffset: {
		type: ControlType.Number,
		title: "Y Offset",
		defaultValue: 10,
		min: 0,
		max: 60,
		step: 1,
		unit: "px",
	},
	tooltipWidth: {
		type: ControlType.Number,
		title: "Tooltip Width",
		defaultValue: 280,
		min: 100,
		max: 600,
		step: 10,
		unit: "px",
	},
	cursor: {
		type: ControlType.Enum,
		title: "Cursor",
		defaultValue: "help",
		options: ["auto", "default", "pointer", "help", "text", "crosshair", "move", "grab", "grabbing", "not-allowed"],
	},
	enableMobileA11y: {
		type: ControlType.Boolean,
		title: "Enable Mobile A11y",
		defaultValue: true,
		enabledTitle: "On",
		disabledTitle: "Off",
	},
	labelColor: {
		type: ControlType.Color,
		title: "Label Color",
		defaultValue: "#000000",
	},
	tooltipBackground: {
		type: ControlType.Color,
		title: "Tooltip BG",
		defaultValue: "#FFFFFF",
	},
	tooltipTextColor: {
		type: ControlType.Color,
		title: "Tooltip Text",
		defaultValue: "#000000",
	},
	tooltipBorderColor: {
		type: ControlType.Color,
		title: "Tooltip Border",
		defaultValue: "#EEEEEE",
	},
	tooltipShadow: {
		type: ControlType.BoxShadow,
		title: "Tooltip Shadow",
		defaultValue: "0px 10px 30px rgba(0,0,0,0.14)",
	},
	labelFont: {
		type: ControlType.Font,
		title: "Label Font",
		controls: "extended",
		defaultFontType: "sans-serif",
		defaultValue: {
			fontSize: "15px",
			variant: "Semibold",
			letterSpacing: "-0.01em",
			lineHeight: "1.2em",
		},
	},
	definitionFont: {
		type: ControlType.Font,
		title: "Definition Font",
		controls: "extended",
		defaultFontType: "sans-serif",
		defaultValue: {
			fontSize: "14px",
			variant: "Medium",
			letterSpacing: "-0.01em",
			lineHeight: "1.3em",
		},
	},
})