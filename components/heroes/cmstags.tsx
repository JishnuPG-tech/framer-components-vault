// Display comma-separated CMS tags as clickable pills with rounded corners
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { startTransition, useState, type CSSProperties } from "react"

interface CMSTagsProps {
	tags: string
	separator: string
	backgroundColor: string
	textColor: string
	hoverBackgroundColor: string
	hoverTextColor: string
	borderRadius: number
	padding: string
	gap: number
	layout: "horizontal" | "vertical"
	alignment: "flex-start" | "center" | "flex-end" | "space-between"
	font: any
	textTransform: "none" | "uppercase" | "lowercase" | "capitalize"
	onTagClick?: (tag: string) => void
	style?: CSSProperties
}

/**
 * CMS Tags Component
 * 
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function CMSTags(props: CMSTagsProps) {
	const {
		tags = "Design, Development, Marketing",
		separator = ",",
		backgroundColor = "#F5F5F5",
		textColor = "#000000",
		hoverBackgroundColor = "#000000",
		hoverTextColor = "#FFFFFF",
		borderRadius = 20,
		padding = "8px 16px",
		gap = 8,
		layout = "horizontal",
		alignment = "flex-start",
		font,
		textTransform = "none",
		onTagClick,
		style,
	} = props

	const [hoveredTag, setHoveredTag] = useState<string | null>(null)

	const tagArray = tags
		.split(separator)
		.map((tag) => tag.trim())
		.filter((tag) => tag.length > 0)

	const handleTagClick = (tag: string) => {
		if (onTagClick) {
			onTagClick(tag)
		}
	}

	return (
		<div
			style={{
				...style,
				display: "flex",
				flexDirection: layout === "vertical" ? "column" : "row",
				flexWrap: layout === "horizontal" ? "wrap" : "nowrap",
				justifyContent: alignment,
				alignItems: layout === "vertical" ? "stretch" : "center",
				gap: `${gap}px`,
				width: "100%",
			}}
		>
			{tagArray.map((tag, index) => {
				const isHovered = hoveredTag === tag
				return (
					<button
						key={`${tag}-${index}`}
						onClick={() => handleTagClick(tag)}
						onMouseEnter={() => startTransition(() => setHoveredTag(tag))}
						onMouseLeave={() => startTransition(() => setHoveredTag(null))}
						style={{
							backgroundColor: isHovered ? hoverBackgroundColor : backgroundColor,
							color: isHovered ? hoverTextColor : textColor,
							borderRadius: `${borderRadius}px`,
							padding: padding,
							...font,
							textTransform: textTransform,
							border: "none",
							cursor: "pointer",
							transition: "all 0.2s ease",
							whiteSpace: "nowrap",
							outline: "none",
						}}
						aria-label={`Tag: ${tag}`}
					>
						{tag}
					</button>
				)
			})}
		</div>
	)
}

addPropertyControls(CMSTags, {
	tags: {
		type: ControlType.String,
		title: "Tags",
		defaultValue: "Design, Development, Marketing",
		displayTextArea: true,
	},
	separator: {
		type: ControlType.String,
		title: "Separator",
		defaultValue: ",",
	},
	layout: {
		type: ControlType.Enum,
		title: "Layout",
		options: ["horizontal", "vertical"],
		optionTitles: ["Horizontal", "Vertical"],
		defaultValue: "horizontal",
		displaySegmentedControl: true,
	},
	alignment: {
		type: ControlType.Enum,
		title: "Alignment",
		options: ["flex-start", "center", "flex-end", "space-between"],
		optionTitles: ["Start", "Center", "End", "Space Between"],
		defaultValue: "flex-start",
		displaySegmentedControl: true,
	},
	backgroundColor: {
		type: ControlType.Color,
		title: "Background",
		defaultValue: "#F5F5F5",
	},
	textColor: {
		type: ControlType.Color,
		title: "Text Color",
		defaultValue: "#000000",
	},
	hoverBackgroundColor: {
		type: ControlType.Color,
		title: "Hover Background",
		defaultValue: "#000000",
	},
	hoverTextColor: {
		type: ControlType.Color,
		title: "Hover Text",
		defaultValue: "#FFFFFF",
	},
	borderRadius: {
		type: ControlType.Number,
		title: "Border Radius",
		defaultValue: 20,
		min: 0,
		max: 50,
		step: 1,
		unit: "px",
	},
	padding: {
		type: ControlType.String,
		title: "Padding",
		defaultValue: "8px 16px",
	},
	gap: {
		type: ControlType.Number,
		title: "Gap",
		defaultValue: 8,
		min: 0,
		max: 32,
		step: 1,
		unit: "px",
	},
	font: {
		type: ControlType.Font,
		title: "Font",
		controls: "extended",
		defaultFontType: "sans-serif",
		defaultValue: {
			fontSize: "14px",
			variant: "Medium",
			letterSpacing: "-0.01em",
			lineHeight: "1em",
		},
	},
	textTransform: {
		type: ControlType.Enum,
		title: "Text Transform",
		options: ["none", "uppercase", "lowercase", "capitalize"],
		optionTitles: ["None", "UPPERCASE", "lowercase", "Capitalize"],
		defaultValue: "none",
	},
	onTagClick: {
		type: ControlType.EventHandler,
	},
})