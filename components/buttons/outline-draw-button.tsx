// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useState, type CSSProperties } from "react"

interface DotOutlineButtonProps {
	buttonText: string
	textColor: string
	hoverTextColor: string
	outlineColor: string
	outlineWidth: number
	paddingX: number
	paddingY: number
	animationDuration: number
	animationDelay: number
	buttonFont: CSSProperties
	style?: CSSProperties
}

interface DrawOutlineButtonProps {
	buttonText: string
	textColor: string
	hoverTextColor: string
	outlineColor: string
	outlineWidth: number
	paddingX: number
	paddingY: number
	animationDuration: number
	animationDelay: number
	buttonFont: CSSProperties
	style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function DrawOutlineButton(props: DrawOutlineButtonProps) {
	const {
		buttonText = "Hover me",
		textColor = "#FFFFFF",
		hoverTextColor = "#0099FF",
		outlineColor = "#0099FF",
		outlineWidth = 2,
		paddingX = 16,
		paddingY = 8,
		animationDuration = 100,
		animationDelay = 100,
		buttonFont,
		style,
	} = props

	const [isHovered, setIsHovered] = useState(false)

	const handleMouseEnter = () => setIsHovered(true)
	const handleMouseLeave = () => setIsHovered(false)

	return (
		<div
			style={{
				...style,
				display: "flex",
				justifyContent: "center",
				alignItems: "center",
				width: "100%",
				height: "100%",
			}}
		>
			<button
				onMouseEnter={handleMouseEnter}
				onMouseLeave={handleMouseLeave}
				style={{
					position: "relative",
					paddingLeft: paddingX,
					paddingRight: paddingX,
					paddingTop: paddingY,
					paddingBottom: paddingY,
					color: isHovered ? hoverTextColor : textColor,
					transition: `color ${animationDuration * 4}ms`,
					cursor: "pointer",
					backgroundColor: "transparent",
					border: "none",
					width: "max-content",
					minWidth: "max-content",
					...buttonFont,
				}}
			>
				<span style={{ whiteSpace: "nowrap" }}>{buttonText}</span>

				{/* TOP */}
				<span
					style={{
						position: "absolute",
						left: 0,
						top: 0,
						height: `${outlineWidth}px`,
						width: isHovered ? "100%" : 0,
						backgroundColor: outlineColor,
						transition: `all ${animationDuration}ms`,
					}}
				/>

				{/* RIGHT */}
				<span
					style={{
						position: "absolute",
						right: 0,
						top: 0,
						height: isHovered ? "100%" : 0,
						width: `${outlineWidth}px`,
						backgroundColor: outlineColor,
						transition: `all ${animationDuration}ms ${animationDelay}ms`,
					}}
				/>

				{/* BOTTOM */}
				<span
					style={{
						position: "absolute",
						bottom: 0,
						right: 0,
						height: `${outlineWidth}px`,
						width: isHovered ? "100%" : 0,
						backgroundColor: outlineColor,
						transition: `all ${animationDuration}ms ${animationDelay * 2}ms`,
					}}
				/>

				{/* LEFT */}
				<span
					style={{
						position: "absolute",
						bottom: 0,
						left: 0,
						height: isHovered ? "100%" : 0,
						width: `${outlineWidth}px`,
						backgroundColor: outlineColor,
						transition: `all ${animationDuration}ms ${animationDelay * 3}ms`,
					}}
				/>
			</button>
		</div>
	)
}

addPropertyControls(DrawOutlineButton, {
	buttonText: {
		type: ControlType.String,
		title: "Text",
		defaultValue: "Hover me",
	},
	buttonFont: {
		type: ControlType.Font,
		title: "Font",
		controls: "extended",
		defaultFontType: "sans-serif",
		defaultValue: {
			fontSize: "16px",
			variant: "Medium",
			letterSpacing: "0em",
			lineHeight: "1em",
		},
	},
	textColor: {
		type: ControlType.Color,
		title: "Text Color",
		defaultValue: "#FFFFFF",
	},
	hoverTextColor: {
		type: ControlType.Color,
		title: "Hover Text",
		defaultValue: "#0099FF",
	},
	outlineColor: {
		type: ControlType.Color,
		title: "Outline Color",
		defaultValue: "#0099FF",
	},
	outlineWidth: {
		type: ControlType.Number,
		title: "Outline Width",
		defaultValue: 2,
		min: 1,
		max: 8,
		step: 1,
		unit: "px",
	},
	paddingX: {
		type: ControlType.Number,
		title: "Padding X",
		defaultValue: 16,
		min: 0,
		max: 64,
		step: 1,
		unit: "px",
	},
	paddingY: {
		type: ControlType.Number,
		title: "Padding Y",
		defaultValue: 8,
		min: 0,
		max: 64,
		step: 1,
		unit: "px",
	},
	animationDuration: {
		type: ControlType.Number,
		title: "Animation Duration",
		defaultValue: 100,
		min: 50,
		max: 500,
		step: 10,
		unit: "ms",
	},
	animationDelay: {
		type: ControlType.Number,
		title: "Animation Delay",
		defaultValue: 100,
		min: 0,
		max: 500,
		step: 10,
		unit: "ms",
	},
})