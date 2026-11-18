// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, AnimatePresence, useInView } from "framer-motion"
import * as React from "react"

type Img = { src: string; srcSet?: string; alt?: string }

type ToggleMode = "click" | "button" | "both"

interface ImageScreenToggleProps {
	imageA: Img
	imageB: Img
	mode: ToggleMode

	showHint: boolean
	hintText: string

	backgroundColor: string
	borderRadius: string
	border: any
	shadow: string

	hintBackground: string
	hintTextColor: string
	hintFont: any
	hintPadding: string
	hintRadius: string

	transition: any
	effect: "none" | "softZoom" | "softBlur" | "layerWipe" | "scanGlow"

	scanEnabled: boolean
	scanColor: string
	scanGlowColor: string
	scanOpacity: number
	scanSpeed: number
	effectAmount: number

	style?: React.CSSProperties
}

/**
 * User instructions:
 * “Create an image screen component with a toggle option. When the user clicks on the image, it should switch to a second image. The second image should appear smoothly with a slight visual change or transition effect. Include a clear toggle or clickable area so users can easily switch between the first and second image.”
 */

/**
 * @framerIntrinsicWidth 520
 * @framerIntrinsicHeight 320
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function ImageScreenToggle(props: ImageScreenToggleProps) {
	const {
		imageA = {
			src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
			alt: "Image A",
		},
		imageB = {
			src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
			alt: "Image B",
		},

		mode,
		showHint,
		hintText,

		backgroundColor,
		borderRadius,
		border,
		shadow,

		hintBackground,
		hintTextColor,
		hintFont,
		hintPadding,
		hintRadius,

		transition,
		effect,
		effectAmount,

		scanEnabled,
		scanColor,
		scanGlowColor,
		scanOpacity,
		scanSpeed,

		style,
	} = props

	const isStatic = useIsStaticRenderer()
	const rootRef = React.useRef<HTMLDivElement>(null)
	const inView = useInView(rootRef, { amount: 0.25, once: false })

	const [isB, setIsB] = React.useState(false)
	const [scanning, setScanning] = React.useState(false)
	const scanTimeoutRef = React.useRef<number | null>(null)

	const canClickImage = mode === "click" || mode === "both"
	const canClickButton = mode === "button" || mode === "both"

	const current = isB ? imageB : imageA

	const effectParams = React.useMemo(() => {
		const amt = Math.max(0, Math.min(100, effectAmount))
		if (effect === "softBlur") {
			return {
				enter: { scale: 1 + amt / 1200, filter: `blur(${amt / 22}px)` },
				center: { scale: 1, filter: "blur(0px)" },
				exit: { scale: 1 - amt / 1600, filter: `blur(${amt / 18}px)` },
			}
		}
		if (effect === "softZoom") {
			return {
				enter: { scale: 1 + amt / 900, filter: "blur(0px)" },
				center: { scale: 1, filter: "blur(0px)" },
				exit: { scale: 1 - amt / 1400, filter: "blur(0px)" },
			}
		}
		if (effect === "scanGlow") {
			return {
				enter: { scale: 1, filter: "blur(0px)" },
				center: { scale: 1, filter: "blur(0px)" },
				exit: { scale: 1, filter: "blur(0px)" },
			}
		}
		if (effect === "layerWipe") {
			const inset = (v: number) => `inset(${v}% 0% 0% 0%)`
			const insetExit = (v: number) => `inset(0% 0% ${v}% 0%)`
			const strength = Math.max(10, Math.min(90, amt))
			return {
				enter: { scale: 1, filter: "blur(0px)", clipPath: inset(strength) },
				center: { scale: 1, filter: "blur(0px)", clipPath: inset(0) },
				exit: { scale: 1, filter: "blur(0px)", clipPath: insetExit(strength) },
			}
		}
		return {
			enter: { scale: 1, filter: "blur(0px)" },
			center: { scale: 1, filter: "blur(0px)" },
			exit: { scale: 1, filter: "blur(0px)" },
		}
	}, [effect, effectAmount])

	const motionTransition = React.useMemo(() => {
		return transition ?? { type: "tween", duration: 0.5, ease: "easeOut" }
	}, [transition])

	const scanDurationMs = React.useMemo(() => {
		const t: any = motionTransition
		const d = typeof t?.duration === "number" && isFinite(t.duration) ? Math.max(0.05, t.duration) : 0.5
		return Math.round(d * 1000 + 200)
	}, [motionTransition])

	const toggle = React.useCallback(() => {
		if (scanTimeoutRef.current && typeof window !== "undefined") {
			window.clearTimeout(scanTimeoutRef.current)
			scanTimeoutRef.current = null
		}

		if (!isStatic) {
			React.startTransition(() => setScanning(true))
		}
		React.startTransition(() => setIsB((v) => !v))

		if (!isStatic && typeof window !== "undefined") {
			scanTimeoutRef.current = window.setTimeout(() => {
				React.startTransition(() => setScanning(false))
				scanTimeoutRef.current = null
			}, scanDurationMs)
		}
	}, [isStatic, scanDurationMs])

	React.useEffect(() => {
		if (isStatic) return
		if (!scanning) return
		if (typeof window === "undefined") return

		if (scanTimeoutRef.current) {
			window.clearTimeout(scanTimeoutRef.current)
			scanTimeoutRef.current = null
		}

		scanTimeoutRef.current = window.setTimeout(() => {
			React.startTransition(() => setScanning(false))
			scanTimeoutRef.current = null
		}, scanDurationMs)

		return () => {
			if (scanTimeoutRef.current) {
				window.clearTimeout(scanTimeoutRef.current)
				scanTimeoutRef.current = null
			}
		}
	}, [isStatic, scanning, scanDurationMs])

	const interactive = !isStatic && (canClickImage || canClickButton)

	return (
		<div
			ref={rootRef}
			style={{
				...style,
				position: "relative",
				width: "100%",
				height: "100%",
				overflow: "hidden",
				background: backgroundColor,
				borderRadius,
				boxShadow: shadow,
				...(border ? border : {}),
				cursor: interactive ? "pointer" : "default",
				userSelect: "none",
				touchAction: "manipulation",
			}}
			role={interactive ? "button" : undefined}
			tabIndex={interactive ? 0 : undefined}
			aria-label={interactive ? "Toggle image" : undefined}
			aria-pressed={interactive ? isB : undefined}
			onClick={isStatic || !canClickImage ? undefined : toggle}
			onKeyDown={
				isStatic || !interactive
					? undefined
					: (e) => {
							if (e.key === "Enter" || e.key === " ") {
								e.preventDefault()
								toggle()
							}
					  }
			}
		>
			<AnimatePresence initial={false} mode="popLayout">
				<motion.div
					key={current?.src || (isB ? "b" : "a")}
					style={{
						position: "absolute",
						inset: 0,
						width: "100%",
						height: "100%",
					}}
					initial={
						isStatic || !inView
							? { opacity: 1, ...effectParams.center }
							: { opacity: 0, ...effectParams.enter }
					}
					animate={{ opacity: 1, ...effectParams.center }}
					exit={isStatic || !inView ? { opacity: 0, ...effectParams.center } : { opacity: 0, ...effectParams.exit }}
					transition={motionTransition}
				>
					<img
						src={current?.src}
						srcSet={current?.srcSet}
						alt={current?.alt ?? ""}
						draggable={false}
						style={{
							width: "100%",
							height: "100%",
							objectFit: "cover",
							display: "block",
						}}
					/>
				</motion.div>
			</AnimatePresence>

			<AnimatePresence initial={false}>
				{(scanEnabled || effect === "scanGlow") && !isStatic && inView && scanning && (
					<motion.div
						key={`scan-${isB ? "b" : "a"}`}
						style={{
							position: "absolute",
							inset: 0,
							pointerEvents: "none",
							mixBlendMode: "screen",
							opacity: Math.max(0, Math.min(1, scanOpacity / 100)),
						}}
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ type: "tween", duration: 0.15, ease: "easeOut" }}
					>
						<motion.div
							style={{
								position: "absolute",
								inset: 0,
								backgroundImage: `repeating-linear-gradient(
									0deg,
									transparent 0px,
									transparent 6px,
									${scanColor} 7px,
									transparent 9px
								)` ,
								filter: `drop-shadow(0 0 ${Math.max(2, effectAmount / 8)}px ${scanGlowColor})`,
								opacity: 0.9,
							}}
							initial={{ backgroundPositionY: "0px" }}
							animate={{ backgroundPositionY: ["0px", "80px"] }}
							transition={{
								type: "tween",
								duration: Math.max(0.2, 1.6 / Math.max(0.2, scanSpeed)),
								ease: "linear",
								repeat: Infinity,
							}}
						/>
						<motion.div
							style={{
								position: "absolute",
								left: 0,
								right: 0,
								height: "2px",
								background: `linear-gradient(90deg, transparent, ${scanGlowColor}, transparent)` ,
								filter: `drop-shadow(0 0 ${Math.max(6, effectAmount / 3)}px ${scanGlowColor})`,
							}}
							initial={{ top: "-5%", opacity: 0.0 }}
							animate={{ top: ["-5%", "105%"], opacity: [0.0, 1, 0.0] }}
							transition={{
								type: "tween",
								duration: Math.max(0.2, scanDurationMs / 1000),
								ease: "easeInOut",
							}}
						/>
					</motion.div>
				)}
			</AnimatePresence>

			{showHint && (
				<div
					style={{
						position: "absolute",
						left: 12,
						bottom: 12,
						display: "flex",
						gap: 10,
						alignItems: "center",
						pointerEvents: "none",
					}}
				>
					<div
						style={{
							background: hintBackground,
							color: hintTextColor,
							padding: hintPadding,
							borderRadius: hintRadius,
							backdropFilter: "blur(6px)",
							WebkitBackdropFilter: "blur(6px)",
							...hintFont,
							whiteSpace: "nowrap",
						}}
					>
						{hintText}
					</div>
				</div>
			)}

			{canClickButton && (
				<button
					type="button"
					onClick={isStatic ? undefined : toggle}
					style={{
						position: "absolute",
						right: 12,
						bottom: 12,
						appearance: "none",
						border: "none",
						outline: "none",
						background: "rgba(255,255,255,0.85)",
						color: "#000000",
						borderRadius: "999px",
						padding: "10px 12px",
						cursor: isStatic ? "default" : "pointer",
						boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
						display: "inline-flex",
						alignItems: "center",
						gap: 8,
						pointerEvents: isStatic ? "none" : "auto",
					}}
					aria-label="Toggle image"
				>
					<span
						aria-hidden="true"
						style={{
							width: 10,
							height: 10,
							borderRadius: 999,
							background: isB ? "rgba(0,0,0,0.9)" : "rgba(0,0,0,0.35)",
							display: "inline-block",
						}}
					/>
					<span style={{ fontSize: 13, fontWeight: 600, lineHeight: "1em" }}>{isB ? "Image B" : "Image A"}</span>
				</button>
			)}
		</div>
	)
}

addPropertyControls(ImageScreenToggle, {
	imageA: { type: ControlType.ResponsiveImage, title: "Image A" },
	imageB: { type: ControlType.ResponsiveImage, title: "Image B" },

	mode: {
		type: ControlType.Enum,
		title: "Toggle",
		options: ["click", "button", "both"],
		optionTitles: ["Click Image", "Button", "Both"],
		defaultValue: "both",
	}, 

	effect: {
		type: ControlType.Enum,
		title: "Effect",
		options: ["none", "softZoom", "softBlur", "layerWipe", "scanGlow"],
		optionTitles: ["None", "Soft Zoom", "Soft Blur", "Layer Wipe", "Scan Glow"],
		defaultValue: "scanGlow",
	},
	effectAmount: {
		type: ControlType.Number,
		title: "Effect Amt",
		defaultValue: 35,
		min: 0,
		max: 100,
		step: 1,
	},

	scanEnabled: {
		type: ControlType.Boolean,
		title: "Scan",
		defaultValue: true,
		enabledTitle: "On",
		disabledTitle: "Off",
	},
	scanColor: {
		type: ControlType.Color,
		title: "Scan Line",
		defaultValue: "rgba(255,255,255,0.35)",
		hidden: (p) => !p.scanEnabled,
	},
	scanGlowColor: {
		type: ControlType.Color,
		title: "Scan Glow",
		defaultValue: "rgba(0,255,255,0.9)",
		hidden: (p) => !p.scanEnabled,
	},
	scanOpacity: {
		type: ControlType.Number,
		title: "Scan Op",
		defaultValue: 55,
		min: 0,
		max: 100,
		step: 1,
		hidden: (p) => !p.scanEnabled,
	},
	scanSpeed: {
		type: ControlType.Number,
		title: "Scan Speed",
		defaultValue: 1,
		min: 0.2,
		max: 3,
		step: 0.1,
		hidden: (p) => !p.scanEnabled,
	},

	transition: {
		type: ControlType.Transition,
		title: "Transition",
		defaultValue: { type: "tween", duration: 0.5, ease: "easeOut" },
	},

	backgroundColor: { type: ControlType.Color, title: "Background", defaultValue: "#FFFFFF" },
	borderRadius: { type: ControlType.BorderRadius, title: "Radius", defaultValue: "16px" },
	border: {
		type: ControlType.Border,
		title: "Border",
		defaultValue: { borderWidth: 0, borderStyle: "solid", borderColor: "rgba(0,0,0,0.08)" },
	},
	shadow: { type: ControlType.BoxShadow, title: "Shadow", defaultValue: "0 12px 30px rgba(0,0,0,0.14)" },

	showHint: { type: ControlType.Boolean, title: "Hint", defaultValue: true, enabledTitle: "Show", disabledTitle: "Hide" },
	hintText: {
		type: ControlType.String,
		title: "Hint Text",
		defaultValue: "Click to toggle",
		hidden: (p) => !p.showHint,
	},
	hintBackground: {
		type: ControlType.Color,
		title: "Hint Bg",
		defaultValue: "rgba(0,0,0,0.55)",
		hidden: (p) => !p.showHint,
	},
	hintTextColor: {
		type: ControlType.Color,
		title: "Hint Text",
		defaultValue: "#FFFFFF",
		hidden: (p) => !p.showHint,
	},
	hintFont: {
		type: ControlType.Font,
		title: "Hint Font",
		controls: "extended",
		defaultFontType: "sans-serif",
		defaultValue: {
			fontSize: "12px",
			variant: "Semibold",
			letterSpacing: "-0.01em",
			lineHeight: "1em",
		},
		hidden: (p) => !p.showHint,
	},
	hintPadding: {
		type: ControlType.Padding,
		title: "Hint Pad",
		defaultValue: "10px",
		hidden: (p) => !p.showHint,
	},
	hintRadius: {
		type: ControlType.BorderRadius,
		title: "Hint Radius",
		defaultValue: "999px",
		hidden: (p) => !p.showHint,
	},
})