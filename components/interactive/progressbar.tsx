// Animated progress bar that fills to a target percentage when it appears in viewport
import { motion, useInView } from "framer-motion"
import { useRef, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface ProgressBarProps {
	percentage: number
	backgroundColor: string
	fillColor: string
	borderRadius: number
	showLabel: boolean
	labelColor: string
	labelFont: CSSProperties
	animationDuration: number
	animationDelay: number
	style?: CSSProperties
}

/**
 * Animated Progress Bar
 *
 * @framerIntrinsicWidth 300
 * @framerIntrinsicHeight 12
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function ProgressBar(props: ProgressBarProps) {
	const {
		percentage = 75,
		backgroundColor = "#EEEEEE",
		fillColor = "#000000",
		borderRadius = 8,
		showLabel = true,
		labelColor = "#FFFFFF",
		labelFont,
		animationDuration = 1.5,
		animationDelay = 0,
	} = props

	const ref = useRef(null)
	const isInView = useInView(ref, { once: true, amount: 0.3 })

	const clampedPercentage = Math.max(0, Math.min(100, percentage))

	return (
		<div
			ref={ref}
			style={{
				width: "100%",
				height: "100%",
				position: "relative",
			}}
		>
			<div
				style={{
					width: "100%",
					height: "100%",
					backgroundColor,
					borderRadius,
					overflow: "hidden",
					position: "relative",
				}}
			>
				<motion.div
					initial={{ width: "0%" }}
					animate={{
						width: isInView ? `${clampedPercentage}%` : "0%",
					}}
					transition={{
						duration: animationDuration,
						delay: animationDelay,
						ease: "easeOut",
					}}
					style={{
						height: "100%",
						backgroundColor: fillColor,
						borderRadius,
						display: "flex",
						alignItems: "center",
						justifyContent: "flex-end",
						paddingRight: showLabel ? 16 : 0,
					}}
				>
					{showLabel && (
						<motion.span
							initial={{ opacity: 0 }}
							animate={{
								opacity: isInView ? 1 : 0,
							}}
							transition={{
								duration: 0.3,
								delay: animationDelay + animationDuration * 0.5,
							}}
							style={{
								color: labelColor,
								...labelFont,
								whiteSpace: "nowrap",
							}}
						>
							{Math.round(clampedPercentage)}%
						</motion.span>
					)}
				</motion.div>
			</div>
		</div>
	)
}

addPropertyControls(ProgressBar, {
	percentage: {
		type: ControlType.Number,
		title: "Percentage",
		defaultValue: 75,
		min: 0,
		max: 100,
		step: 1,
		unit: "%",
	},
	backgroundColor: {
		type: ControlType.Color,
		title: "Background",
		defaultValue: "#2A2A2A",
	},
	fillColor: {
		type: ControlType.Color,
		title: "Fill Color",
		defaultValue: "#5DCCCC",
	},
	borderRadius: {
		type: ControlType.Number,
		title: "Radius",
		defaultValue: 20,
		min: 0,
		max: 50,
		step: 1,
		unit: "px",
	},
	showLabel: {
		type: ControlType.Boolean,
		title: "Show Label",
		defaultValue: false,
		enabledTitle: "Show",
		disabledTitle: "Hide",
	},
	labelColor: {
		type: ControlType.Color,
		title: "Label Color",
		defaultValue: "#FFFFFF",
		hidden: ({ showLabel }) => !showLabel,
	},
	labelFont: {
		type: ControlType.Font,
		title: "Label Font",
		controls: "extended",
		defaultFontType: "sans-serif",
		defaultValue: {
			fontSize: "14px",
			variant: "Semibold",
			letterSpacing: "-0.01em",
			lineHeight: "1em",
		},
		hidden: ({ showLabel }) => !showLabel,
	},
	animationDuration: {
		type: ControlType.Number,
		title: "Duration",
		defaultValue: 1.5,
		min: 0.1,
		max: 5,
		step: 0.1,
		unit: "s",
	},
	animationDelay: {
		type: ControlType.Number,
		title: "Delay",
		defaultValue: 0,
		min: 0,
		max: 3,
		step: 0.1,
		unit: "s",
	},
})