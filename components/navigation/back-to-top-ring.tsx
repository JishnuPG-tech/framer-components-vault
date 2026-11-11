// Back to Top floating action button with progress ring that fills as you scroll down the page
import { useEffect, useState, useCallback, useMemo, useRef, startTransition } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface ScrollProgressButtonProps {
	buttonColor: string
	iconColor: string
	ringColor: string
	ringWidth: number
	buttonSize: number
	bottomOffset: number
	rightOffset: number
	showThreshold: number
	visibilityMode: "always" | "scroll" | "hidden"
	showShadow: boolean
	enableHoverEffect: boolean
	enableAnimation: boolean
	animationSpeed: number
	glowColor: string
	enableGlow: boolean
	glowIntensity: number
	useGradientRing: boolean
	useGradientGlow: boolean
}

/**
 * Back to Top Button with Progress Ring
 *
 * @framerIntrinsicWidth 60
 * @framerIntrinsicHeight 60
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function ScrollProgressButton(props: ScrollProgressButtonProps) {
	const {
		buttonColor,
		iconColor,
		ringColor,
		ringWidth,
		buttonSize,
		bottomOffset,
		rightOffset,
		showThreshold,
		visibilityMode,
		showShadow,
		enableHoverEffect,
		enableAnimation,
		animationSpeed,
		glowColor,
		enableGlow,
		glowIntensity,
		useGradientRing,
		useGradientGlow,
	} = props

	const [scrollProgress, setScrollProgress] = useState(0)
	const [isVisible, setIsVisible] = useState(false)
	const isStatic = useIsStaticRenderer()
	const shouldAlwaysShow = isStatic
	const scrollTimeoutRef = useRef<number | null>(null)
	const lastScrollProgressRef = useRef(0)
	const lastVisibilityRef = useRef(false)

	// Calculate dynamic stroke color based on scroll progress
	const getStrokeColor = useCallback((progress: number) => {
		if (progress < 0.5) {
			// Purple to Blue (0% to 50%)
			const localProgress = progress * 2
			const r = Math.round(91 + (59 - 91) * localProgress)
			const g = Math.round(33 + (130 - 33) * localProgress)
			const b = Math.round(182 + (246 - 182) * localProgress)
			return `rgb(${r}, ${g}, ${b})`
		} else {
			// Blue to Teal (50% to 100%)
			const localProgress = (progress - 0.5) * 2
			const r = Math.round(59 + (20 - 59) * localProgress)
			const g = Math.round(130 + (184 - 130) * localProgress)
			const b = Math.round(246 + (166 - 246) * localProgress)
			return `rgb(${r}, ${g}, ${b})`
		}
	}, [])

	const dynamicStrokeColorMemo = useMemo(() => getStrokeColor(scrollProgress), [scrollProgress, getStrokeColor])
	const glowIntensityMemo = useMemo(() => scrollProgress * 15 * glowIntensity, [scrollProgress, glowIntensity])

	// Determine which color to use for the ring
	const activeRingColor = useGradientRing ? dynamicStrokeColorMemo : ringColor

	// Determine which color to use for the glow
	const activeGlowColor = useGradientGlow ? dynamicStrokeColorMemo : glowColor

	const handleScroll = useCallback(() => {
		if (typeof window === "undefined") return

		requestAnimationFrame(() => {
			// Throttle updates - only update if there's a meaningful change
			if (scrollTimeoutRef.current !== null) return

			scrollTimeoutRef.current = window.setTimeout(() => {
				scrollTimeoutRef.current = null

				requestAnimationFrame(() => {
					const scrollTop = window.scrollY
					const docHeight = document.documentElement.scrollHeight - window.innerHeight
					const progress = docHeight <= 0 ? 0 : Math.min(Math.max(scrollTop / docHeight, 0), 1)

					const newIsVisible = scrollTop > showThreshold

					// Only update state if values have meaningfully changed
					const progressChanged = Math.abs(progress - lastScrollProgressRef.current) > 0.001
					const visibilityChanged = newIsVisible !== lastVisibilityRef.current

					if (progressChanged || visibilityChanged) {
						lastScrollProgressRef.current = progress
						lastVisibilityRef.current = newIsVisible

						startTransition(() => {
							if (progressChanged) setScrollProgress(progress)
							if (visibilityChanged) setIsVisible(newIsVisible)
						})
					}
				})
			}, 16) // ~60fps throttle
		})
	}, [showThreshold])

	useEffect(() => {
		if (typeof window === "undefined") return
		if (shouldAlwaysShow) return

		handleScroll()
		window.addEventListener("scroll", handleScroll, { passive: true })

		return () => {
			window.removeEventListener("scroll", handleScroll)
			if (scrollTimeoutRef.current !== null) {
				clearTimeout(scrollTimeoutRef.current)
			}
		}
	}, [handleScroll, shouldAlwaysShow])

	const scrollToTop = () => {
		if (typeof window === "undefined") return

		window.scrollTo({
			top: 0,
			behavior: "smooth",
		})
	}

	const radiusMemo = useMemo(() => (buttonSize - ringWidth) / 2, [buttonSize, ringWidth])
	const circumferenceMemo = useMemo(() => 2 * Math.PI * radiusMemo, [radiusMemo])
	const strokeDashoffsetMemo = useMemo(() => circumferenceMemo - scrollProgress * circumferenceMemo, [circumferenceMemo, scrollProgress])

	// Gap between inner circle and outer ring
	const gap = 2
	const innerCircleSize = buttonSize - ringWidth * 2 - gap * 2

	const showButton = shouldAlwaysShow || visibilityMode === "always" || (visibilityMode === "scroll" && isVisible)
	const hideButton = visibilityMode === "hidden" && !shouldAlwaysShow

	const containerStyle = useMemo(
		() => ({
			position: shouldAlwaysShow ? ("relative" as const) : ("fixed" as const),
			bottom: shouldAlwaysShow ? undefined : bottomOffset,
			right: shouldAlwaysShow ? undefined : rightOffset,
			width: buttonSize,
			height: buttonSize,
			pointerEvents: hideButton ? ("none" as const) : ("auto" as const),
			zIndex: 9999,
			opacity: showButton ? 1 : 0,
			transform: shouldAlwaysShow ? undefined : showButton ? "scale(1)" : "scale(0.8)",
			transition:
				enableAnimation && !shouldAlwaysShow
					? `opacity ${animationSpeed}s ease, transform ${animationSpeed}s ease`
					: "none",
			touchAction: "manipulation",
		}),
		[shouldAlwaysShow, bottomOffset, rightOffset, buttonSize, hideButton, showButton, enableAnimation, animationSpeed]
	)

	const buttonStyle = useMemo(
		() => ({
			position: "relative" as const,
			width: "100%",
			height: "100%",
			borderRadius: "50%",
			backgroundColor: "transparent",
			border: "none",
			cursor: "pointer",
			display: "flex",
			alignItems: "center" as const,
			justifyContent: "center" as const,
			transition: "transform 0.2s ease",
			WebkitTransform: "translateZ(0)",
			willChange: "transform",
			touchAction: "manipulation",
			WebkitTapHighlightColor: "transparent",
		}),
		[]
	)

	const innerCircleStyle = useMemo(
		() => ({
			position: "absolute" as const,
			top: "50%",
			left: "50%",
			transform: "translate(-50%, -50%)",
			width: innerCircleSize,
			height: innerCircleSize,
			borderRadius: "50%",
			backgroundColor: buttonColor,
			boxShadow: showShadow ? "0 4px 12px rgba(0, 0, 0, 0.15)" : "none",
			pointerEvents: "none" as const,
		}),
		[innerCircleSize, buttonColor, showShadow]
	)

	const svgStyle = useMemo(
		() => ({
			position: "absolute" as const,
			top: 0,
			left: 0,
			width: "100%",
			height: "100%",
			transform: "rotate(-90deg)",
			filter: enableGlow ? `drop-shadow(0 0 ${glowIntensityMemo}px ${activeGlowColor})` : "none",
			pointerEvents: "none" as const,
		}),
		[enableGlow, glowIntensityMemo, activeGlowColor]
	)

	const circleStyle = useMemo(
		() => ({
			transition: "stroke-dashoffset 0.1s linear",
		}),
		[]
	)

	return (
		<div style={containerStyle}>
			<button
				onClick={scrollToTop}
				style={buttonStyle}
				onMouseEnter={(e) => {
					if (enableHoverEffect) {
						e.currentTarget.style.transform = "scale(1.05)"
					}
				}}
				onMouseLeave={(e) => {
					if (enableHoverEffect) {
						e.currentTarget.style.transform = "scale(1)"
					}
				}}
				aria-label="Back to top"
			>
				<div style={innerCircleStyle} />
				<svg
					width={buttonSize * 0.4}
					height={buttonSize * 0.4}
					viewBox="0 0 24 24"
					fill="none"
					stroke={iconColor}
					strokeWidth="2.5"
					strokeLinecap="round"
					strokeLinejoin="round"
					style={{ position: "relative", zIndex: 1 }}
				>
					<title>Arrow up</title>
					<path d="M12 19V5M5 12l7-7 7 7" />
				</svg>

				<svg style={svgStyle}>
					{/* Colored progress stroke - sits outside the transparent stroke */}
					<circle
						cx={buttonSize / 2}
						cy={buttonSize / 2}
						r={radiusMemo}
						stroke={activeRingColor}
						strokeWidth={ringWidth}
						fill="none"
						strokeDasharray={circumferenceMemo}
						strokeDashoffset={strokeDashoffsetMemo}
						strokeLinecap="round"
						style={circleStyle}
					/>
				</svg>
			</button>
		</div>
	)
}

addPropertyControls(ScrollProgressButton, {
	visibilityMode: {
		type: ControlType.Enum,
		title: "Visibility",
		description: "Choose when the button should be visible.",
		options: ["always", "scroll", "hidden"],
		optionTitles: ["Always Show", "Show on Scroll", "Hidden"],
		defaultValue: "scroll",
		displaySegmentedControl: false,
	},
	showThreshold: {
		type: ControlType.Number,
		title: "Show Threshold",
		description: "Scroll distance in pixels before the button appears.",
		defaultValue: 300,
		min: 0,
		max: 1000,
		step: 50,
		unit: "px",
		hidden: ({ visibilityMode }) => visibilityMode !== "scroll",
	},
	buttonColor: {
		type: ControlType.Color,
		title: "Button Color",
		description: "Background color of the button.",
		defaultValue: "#FFFFFF",
	},
	iconColor: {
		type: ControlType.Color,
		title: "Icon Color",
		description: "Color of the arrow icon.",
		defaultValue: "#5B21B6",
	},
	useGradientRing: {
		type: ControlType.Boolean,
		title: "Ring Style",
		description: "Use a dynamic gradient color for the progress ring.",
		defaultValue: true,
		enabledTitle: "Gradient",
		disabledTitle: "Custom",
	},
	ringColor: {
		type: ControlType.Color,
		title: "Ring Color",
		description: "Custom color for the progress ring.",
		defaultValue: "#5B21B6",
		hidden: ({ useGradientRing }) => useGradientRing,
	},
	ringWidth: {
		type: ControlType.Number,
		title: "Ring Width",
		description: "Thickness of the progress ring.",
		defaultValue: 3,
		min: 1,
		max: 10,
		step: 1,
		unit: "px",
	},
	enableGlow: {
		type: ControlType.Boolean,
		title: "Glow Effect",
		description: "Add a glow effect to the progress ring.",
		defaultValue: true,
		enabledTitle: "On",
		disabledTitle: "Off",
	},
	useGradientGlow: {
		type: ControlType.Boolean,
		title: "Glow Style",
		description: "Use a dynamic gradient color for the glow effect.",
		defaultValue: true,
		enabledTitle: "Gradient",
		disabledTitle: "Custom",
		hidden: ({ enableGlow }) => !enableGlow,
	},
	glowColor: {
		type: ControlType.Color,
		title: "Glow Color",
		description: "Custom color for the glow effect.",
		defaultValue: "#5B21B6",
		hidden: ({ enableGlow, useGradientGlow }) => !enableGlow || useGradientGlow,
	},
	glowIntensity: {
		type: ControlType.Number,
		title: "Glow Intensity",
		description: "Intensity of the glow effect.",
		defaultValue: 1,
		min: 0.1,
		max: 3,
		step: 0.1,
		hidden: ({ enableGlow }) => !enableGlow,
	},
	buttonSize: {
		type: ControlType.Number,
		title: "Button Size",
		description: "Diameter of the button in pixels.",
		defaultValue: 60,
		min: 40,
		max: 100,
		step: 5,
		unit: "px",
	},
	showShadow: {
		type: ControlType.Boolean,
		title: "Shadow",
		description: "Show a shadow behind the button.",
		defaultValue: true,
		enabledTitle: "Show",
		disabledTitle: "Hide",
	},
	enableHoverEffect: {
		type: ControlType.Boolean,
		title: "Hover Effect",
		description: "Scale up the button on hover.",
		defaultValue: true,
		enabledTitle: "On",
		disabledTitle: "Off",
	},
	enableAnimation: {
		type: ControlType.Boolean,
		title: "Animation",
		description: "Animate the button appearance and disappearance.",
		defaultValue: true,
		enabledTitle: "On",
		disabledTitle: "Off",
	},
	animationSpeed: {
		type: ControlType.Number,
		title: "Animation Speed",
		description: "Duration of the appearance animation in seconds.",
		defaultValue: 0.2,
		min: 0.1,
		max: 1,
		step: 0.1,
		unit: "s",
		hidden: ({ enableAnimation }) => !enableAnimation,
	},
	bottomOffset: {
		type: ControlType.Number,
		title: "Bottom Offset",
		description: "Distance from the bottom of the screen.",
		defaultValue: 40,
		min: 0,
		max: 200,
		step: 5,
		unit: "px",
	},
	rightOffset: {
		type: ControlType.Number,
		title: "Right Offset",
		description: "Distance from the right of the screen.",
		defaultValue: 40,
		min: 0,
		max: 200,
		step: 5,
		unit: "px",
	},
})