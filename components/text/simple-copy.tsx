// Copy to clipboard component with customizable button and option to use icon or text
import { useState, useEffect, startTransition, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface CopyToClipboardProps {
	textToCopy: string
	buttonType: "text" | "icon"
	buttonText: string
	copiedText: string
	iconColor: string
	backgroundColor: string
	textColor: string
	buttonFont: any
	borderRadius: number
	showFeedback: boolean
	feedbackDuration: number
	style?: CSSProperties
}

/**
 * Copy to Clipboard
 *
 * @framerIntrinsicWidth 120
 * @framerIntrinsicHeight 40
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function CopyToClipboard(props: CopyToClipboardProps) {
	const {
		textToCopy,
		buttonType,
		buttonText,
		copiedText,
		iconColor,
		backgroundColor,
		textColor,
		buttonFont,
		borderRadius,
		showFeedback,
		feedbackDuration,
	} = props

	const [isCopied, setIsCopied] = useState(false)

	useEffect(() => {
		if (isCopied && showFeedback) {
			const timer = setTimeout(() => {
				startTransition(() => setIsCopied(false))
			}, feedbackDuration)
			return () => clearTimeout(timer)
		}
	}, [isCopied, showFeedback, feedbackDuration])

	const handleCopy = async () => {
		if (typeof window !== "undefined" && navigator.clipboard) {
			try {
				await navigator.clipboard.writeText(textToCopy)
				startTransition(() => setIsCopied(true))
			} catch (err) {
				console.error("Failed to copy text: ", err)
			}
		}
	}

	const isFixedWidth = props?.style && props.style.width === "100%"
	const isFixedHeight = props?.style && props.style.height === "100%"

	return (
		<button
			onClick={handleCopy}
			style={{
				...props.style,
				position: "relative",
				...(isFixedWidth ? {} : { minWidth: "max-content" }),
				...(isFixedHeight ? {} : { minHeight: "max-content" }),
				backgroundColor,
				color: textColor,
				border: "none",
				borderRadius,
				padding: buttonType === "icon" ? "10px" : "10px 20px",
				cursor: "pointer",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				gap: 8,
				transition: "opacity 0.2s ease",
				...buttonFont,
			}}
			onMouseEnter={(e) => {
				e.currentTarget.style.opacity = "0.8"
			}}
			onMouseLeave={(e) => {
				e.currentTarget.style.opacity = "1"
			}}
			aria-label={isCopied ? "Copied to clipboard" : "Copy to clipboard"}
		>
			{buttonType === "icon" ? (
				<svg
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke={iconColor}
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
				>
					{isCopied && showFeedback ? (
						<>
							<polyline points="20 6 9 17 4 12" />
						</>
					) : (
						<>
							<rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
							<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
						</>
					)}
				</svg>
			) : (
				<span style={{ whiteSpace: "nowrap" }}>
					{isCopied && showFeedback ? copiedText : buttonText}
				</span>
			)}
		</button>
	)
}

addPropertyControls(CopyToClipboard, {
	textToCopy: {
		type: ControlType.String,
		title: "Text to Copy",
		defaultValue: "Hello, World!",
		displayTextArea: true,
	},
	buttonType: {
		type: ControlType.Enum,
		title: "Button Type",
		options: ["text", "icon"],
		optionTitles: ["Text", "Icon"],
		defaultValue: "text",
		displaySegmentedControl: true,
	},
	buttonText: {
		type: ControlType.String,
		title: "Button Text",
		defaultValue: "Copy",
		hidden: ({ buttonType }) => buttonType === "icon",
	},
	copiedText: {
		type: ControlType.String,
		title: "Copied Text",
		defaultValue: "Copied!",
		hidden: ({ buttonType }) => buttonType === "icon",
	},
	iconColor: {
		type: ControlType.Color,
		title: "Icon Color",
		defaultValue: "#FFFFFF",
		hidden: ({ buttonType }) => buttonType === "text",
	},
	backgroundColor: {
		type: ControlType.Color,
		title: "Background",
		defaultValue: "#000000",
	},
	textColor: {
		type: ControlType.Color,
		title: "Text Color",
		defaultValue: "#FFFFFF",
		hidden: ({ buttonType }) => buttonType === "icon",
	},
	buttonFont: {
		type: ControlType.Font,
		title: "Button Font",
		controls: "extended",
		defaultFontType: "sans-serif",
		defaultValue: {
			variant: "Semibold",
			fontSize: "14px",
			letterSpacing: "-0.01em",
			lineHeight: "1em",
		},
		hidden: ({ buttonType }) => buttonType === "icon",
	},
	borderRadius: {
		type: ControlType.Number,
		title: "Radius",
		defaultValue: 8,
		min: 0,
		max: 50,
		step: 1,
		unit: "px",
	},
	showFeedback: {
		type: ControlType.Boolean,
		title: "Show Feedback",
		defaultValue: true,
		enabledTitle: "Show",
		disabledTitle: "Hide",
	},
	feedbackDuration: {
		type: ControlType.Number,
		title: "Feedback Duration",
		defaultValue: 2000,
		min: 500,
		max: 5000,
		step: 100,
		unit: "ms",
		hidden: ({ showFeedback }) => !showFeedback,
	},
})