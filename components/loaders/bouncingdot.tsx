// Kinetic Dots Loader - Animated bouncing dots with gravity physics and ripple effects
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import type { CSSProperties } from "react"

interface BouncingDotProps {
	dotCount: number
	dotSize: number
	bounceHeight: number
	animationDuration: number
	dotSpacing: number
	showRipple: boolean
	showShadow: boolean
	backgroundColor: string
	dotGradientStart: string
	dotGradientEnd: string
	glowColor: string
	rippleColor: string
	shadowColor: string
	style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function BouncingDot(props: BouncingDotProps) {
	const {
		dotCount = 4,
		dotSize = 24,
		bounceHeight = 50,
		animationDuration = 1.4,
		dotSpacing = 16,
		showRipple = true,
		showShadow = true,
		backgroundColor = "#0A0A0A",
		dotGradientStart = "#67E8F9",
		dotGradientEnd = "#3B82F6",
		glowColor = "rgba(6, 182, 212, 0.8)",
		rippleColor = "rgba(6, 182, 212, 0.3)",
		shadowColor = "rgba(6, 182, 212, 0.4)",
	} = props

	const containerHeight = bounceHeight + dotSize + 40

	return (
		<div
			style={{
				...props.style,
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				minHeight: containerHeight + 64,
				padding: 32,
				overflow: "visible",
				backgroundColor: backgroundColor,
			}}
		>
			<div
				style={{
					display: "flex",
					gap: dotSpacing,
					alignItems: "flex-end",
					height: containerHeight,
				}}
			>
				{[...Array(dotCount)].map((_, i) => (
					<div
						key={i}
						style={{
							position: "relative",
							display: "flex",
							flexDirection: "column",
							alignItems: "center",
							justifyContent: "flex-end",
							height: "100%",
							width: dotSize + 4,
						}}
					>
						{/* Bouncing Dot */}
						<div
							style={{
								position: "relative",
								width: dotSize,
								height: dotSize,
								zIndex: 10,
								animation: `gravity-bounce ${animationDuration}s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite`,
								animationDelay: `${i * 0.15}s`,
								willChange: "transform",
							}}
						>
							<div
								style={{
									width: "100%",
									height: "100%",
									borderRadius: "50%",
									background: `linear-gradient(to bottom, ${dotGradientStart}, ${dotGradientEnd})`,
									boxShadow: `0 0 20px ${glowColor}, 0 0 40px ${glowColor.replace(/[\d.]+\)$/g, '0.4)')}`,
									animation: `rubber-morph ${animationDuration}s linear infinite`,
									animationDelay: `${i * 0.15}s`,
									willChange: "transform",
								}}
							/>

							{/* Specular highlight */}
							<div
								style={{
									position: "absolute",
									top: 4,
									left: 4,
									width: 6,
									height: 6,
									backgroundColor: "rgba(255, 255, 255, 0.8)",
									borderRadius: "50%",
									filter: "blur(0.5px)",
								}}
							/>
						</div>

						{/* Floor Ripple */}
						{showRipple && (
							<div
								style={{
									position: "absolute",
									bottom: 0,
									width: dotSize * 2,
									height: 12,
									border: `1px solid ${rippleColor}`,
									borderRadius: "100%",
									opacity: 0,
									animation: `ripple-expand ${animationDuration}s linear infinite`,
									animationDelay: `${i * 0.15}s`,
								}}
							/>
						)}

						{/* Reflective Shadow */}
						{showShadow && (
							<div
								style={{
									position: "absolute",
									bottom: -4,
									width: dotSize,
									height: 6,
									borderRadius: "100%",
									backgroundColor: shadowColor,
									filter: "blur(4px)",
									animation: `shadow-breathe ${animationDuration}s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite`,
									animationDelay: `${i * 0.15}s`,
								}}
							/>
						)}
					</div>
				))}
			</div>

			<style>
				{`
          @keyframes gravity-bounce {
            0% { transform: translateY(0); animation-timing-function: cubic-bezier(0.33, 1, 0.68, 1); }
            50% { transform: translateY(-${bounceHeight}px); animation-timing-function: cubic-bezier(0.32, 0, 0.67, 0); }
            100% { transform: translateY(0); }
          }

          @keyframes rubber-morph {
            0% { transform: scale(1.4, 0.6); }
            5% { transform: scale(0.9, 1.1); }
            15% { transform: scale(1, 1); }
            50% { transform: scale(1, 1); }
            85% { transform: scale(0.9, 1.1); }
            100% { transform: scale(1.4, 0.6); }
          }

          @keyframes shadow-breathe {
            0% { transform: scale(1.4); opacity: 0.6; }
            50% { transform: scale(0.5); opacity: 0.1; }
            100% { transform: scale(1.4); opacity: 0.6; }
          }

          @keyframes ripple-expand {
            0% { transform: scale(0.5); opacity: 0; border-width: 4px; }
            5% { opacity: 0.8; }
            30% { transform: scale(1.5); opacity: 0; border-width: 0px; }
            100% { transform: scale(1.5); opacity: 0; }
          }
        `}
			</style>
		</div>
	)
}

addPropertyControls(BouncingDot, {
	dotCount: {
		type: ControlType.Number,
		title: "Dot Count",
		defaultValue: 4,
		min: 1,
		max: 8,
		step: 1,
		displayStepper: true,
	},
	dotSize: {
		type: ControlType.Number,
		title: "Dot Size",
		defaultValue: 24,
		min: 10,
		max: 80,
		step: 1,
		unit: "px",
	},
	bounceHeight: {
		type: ControlType.Number,
		title: "Bounce Height",
		defaultValue: 50,
		min: 20,
		max: 100,
		step: 5,
		unit: "px",
	},
	animationDuration: {
		type: ControlType.Number,
		title: "Duration",
		defaultValue: 1.4,
		min: 0.5,
		max: 3,
		step: 0.1,
		unit: "s",
	},
	dotSpacing: {
		type: ControlType.Number,
		title: "Dot Spacing",
		defaultValue: 16,
		min: 5,
		max: 50,
		step: 5,
		unit: "px",
	},
	showRipple: {
		type: ControlType.Boolean,
		title: "Show Ripple",
		defaultValue: true,
		enabledTitle: "Show",
		disabledTitle: "Hide",
	},
	showShadow: {
		type: ControlType.Boolean,
		title: "Show Shadow",
		defaultValue: true,
		enabledTitle: "Show",
		disabledTitle: "Hide",
	},
	backgroundColor: {
		type: ControlType.Color,
		title: "Background",
		defaultValue: "#0A0A0A",
	},
	dotGradientStart: {
		type: ControlType.Color,
		title: "Dot Color Start",
		defaultValue: "#67E8F9",
	},
	dotGradientEnd: {
		type: ControlType.Color,
		title: "Dot Color End",
		defaultValue: "#3B82F6",
	},
	glowColor: {
		type: ControlType.Color,
		title: "Glow Color",
		defaultValue: "#06B6D4",
	},
	rippleColor: {
		type: ControlType.Color,
		title: "Ripple Color",
		defaultValue: "#06B6D4",
	},
	shadowColor: {
		type: ControlType.Color,
		title: "Shadow Color",
		defaultValue: "#06B6D4",
	},
})