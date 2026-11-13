// Create a Framer component that allows users to set calendar reminders for price hike dates
import { useState, startTransition, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface AddToYourCalendarProps {
	buttonText: string
	showText: boolean
	iconSize: number
	iconGap: number
	iconSelection: "bell" | "calendar" | "clock" | "plus" | "star" | "heart" | "none"
	defaultTitle: string
	defaultUrl: string
	defaultDate: string
	buttonColor: string
	buttonTextColor: string
	panelBackground: string
	panelBorder: string
	inputBorder: string
	labelColor: string
	cancelButtonColor: string
	cancelButtonTextColor: string
	buttonFont: CSSProperties
	labelFont: CSSProperties
	inputFont: CSSProperties
	subTitleFont: CSSProperties
	titleFont: CSSProperties
	buttonBorderRadius: string
	buttonPadding: string
	popupButtonBorderRadius: string
	popupButtonPadding: string
	panelWidth: number
	panelAlignment: "left" | "center" | "right"
	hoverButtonColor: string
	remindLabel: string
	subTitle: string
	eventDescription: string
	style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function AddToYourCalendar(props: AddToYourCalendarProps) {
	const {
		buttonText,
		showText = true,
		iconSize = 16,
		iconGap = 10,
		iconSelection = "bell",
		defaultTitle,
		defaultUrl,
		defaultDate,
		buttonColor,
		buttonTextColor,
		panelBackground,
		panelBorder,
		inputBorder,
		labelColor,
		cancelButtonColor,
		cancelButtonTextColor,
		buttonFont,
		labelFont,
		inputFont,
		subTitleFont,
		titleFont,
		buttonBorderRadius,
		buttonPadding,
		popupButtonBorderRadius,
		popupButtonPadding,
		panelWidth = 320,
		panelAlignment = "left",
		hoverButtonColor,
		remindLabel,
		subTitle,
		eventDescription = "Reminder to buy your ticket before the price increases.",
	} = props

	const [isPanelOpen, setIsPanelOpen] = useState(false)
	const [hikeDate, setHikeDate] = useState(() => {
		if (defaultDate) {
			const d = new Date(defaultDate)
			return formatDateLocal(d)
		}
		const now = new Date()
		const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate())
		if (nextMonth.getMonth() !== (now.getMonth() + 1) % 12) {
			const lastDay = new Date(now.getFullYear(), now.getMonth() + 2, 0)
			return formatDateLocal(lastDay)
		}
		return formatDateLocal(nextMonth)
	})
	const [leadTime, setLeadTime] = useState("7d")
	const [title, setTitle] = useState(defaultTitle)
	const [url, setUrl] = useState(defaultUrl)
	const [status, setStatus] = useState("")
	const [isButtonHovered, setIsButtonHovered] = useState(false)

	function formatDateLocal(d: Date): string {
		const pad = (n: number) => String(n).padStart(2, "0")
		return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
	}

	function escapeICSText(s: string): string {
		return String(s || "")
			.replace(/\\/g, "\\\\")
			.replace(/\n/g, "\\n")
			.replace(/,/g, "\\,")
			.replace(/;/g, "\\;")
	}

	function toUTCStamp(dateObj: Date): string {
		const pad = (n: number) => String(n).padStart(2, "0")
		return (
			dateObj.getUTCFullYear() +
			pad(dateObj.getUTCMonth() + 1) +
			pad(dateObj.getUTCDate()) +
			"T" +
			pad(dateObj.getUTCHours()) +
			pad(dateObj.getUTCMinutes()) +
			pad(dateObj.getUTCSeconds()) +
			"Z"
		)
	}

	function buildICS({
		title,
		description,
		startLocal,
		endLocal,
		alarmMinutes,
	}: {
		title: string
		description: string
		startLocal: Date
		endLocal: Date
		alarmMinutes: number
	}): string {
		const uid = "reminder-" + Math.random().toString(16).slice(2) + "@framer"
		const now = new Date()
		const dtstamp = toUTCStamp(now)
		const dtstart = toUTCStamp(startLocal)
		const dtend = toUTCStamp(endLocal)

		return [
			"BEGIN:VCALENDAR",
			"VERSION:2.0",
			"PRODID:-//Framer//Ticket Reminder//EN",
			"CALSCALE:GREGORIAN",
			"METHOD:PUBLISH",
			"BEGIN:VEVENT",
			"UID:" + uid,
			"DTSTAMP:" + dtstamp,
			"SUMMARY:" + escapeICSText(title),
			"DESCRIPTION:" + escapeICSText(description),
			"DTSTART:" + dtstart,
			"DTEND:" + dtend,
			"BEGIN:VALARM",
			"ACTION:DISPLAY",
			"DESCRIPTION:" + escapeICSText(title),
			"TRIGGER:-PT" + Math.max(1, alarmMinutes) + "M",
			"END:VALARM",
			"END:VEVENT",
			"END:VCALENDAR",
		].join("\r\n")
	}

	function leadToMinutes(value: string): number {
		const num = parseInt(value, 10)
		if (value.endsWith("d")) return num * 24 * 60
		if (value.endsWith("h")) return num * 60
		return 60
	}

	const iconPaths = {
		bell: (
			<>
				<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
				<path d="M13.73 21a2 2 0 0 1-3.46 0" />
			</>
		),
		calendar: (
			<>
				<rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
				<line x1="16" y1="2" x2="16" y2="6" />
				<line x1="8" y1="2" x2="8" y2="6" />
				<line x1="3" y1="10" x2="21" y2="10" />
			</>
		),
		clock: (
			<>
				<circle cx="12" cy="12" r="10" />
				<polyline points="12 6 12 12 16 14" />
			</>
		),
		plus: (
			<>
				<line x1="12" y1="5" x2="12" y2="19" />
				<line x1="5" y1="12" x2="19" y2="12" />
			</>
		),
		star: (
			<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
		),
		heart: (
			<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
		),
	}

	function handleAddToCalendar() {
		startTransition(() => setStatus(""))

		if (!hikeDate) {
			startTransition(() => setStatus("Please choose a price hike date."))
			return
		}

		const alarmMinutes = leadToMinutes(leadTime)
		const [y, m, d] = hikeDate.split("-").map(Number)
		const startLocal = new Date(y, m - 1, d, 10, 0, 0)
		const endLocal = new Date(y, m - 1, d, 10, 15, 0)

		const description = defaultUrl
			? `${eventDescription}\n\nTicket page: ${defaultUrl}`
			: eventDescription

		const ics = buildICS({ title: defaultTitle, description, startLocal, endLocal, alarmMinutes })

		if (typeof window !== "undefined") {
			const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" })
			const a = document.createElement("a")
			a.href = URL.createObjectURL(blob)
			a.download = "ticket-price-reminder.ics"
			document.body.appendChild(a)
			a.click()
			a.remove()
		}
	}

	const isFixedWidth = props?.style && props.style.width === "100%"

	return (
		<div
			style={{
				...props.style,
				position: "relative",
				...(isFixedWidth ? {} : { width: "max-content" }),
			}}
		>
			<button
				onClick={() => startTransition(() => setIsPanelOpen(!isPanelOpen))}
				onMouseEnter={() => startTransition(() => setIsButtonHovered(true))}
				onMouseLeave={() => startTransition(() => setIsButtonHovered(false))}
				style={{
					display: "inline-flex",
					alignItems: "center",
					gap: iconGap,
					padding: buttonPadding,
					borderRadius: buttonBorderRadius,
					border: "none",
					background: isButtonHovered && hoverButtonColor ? hoverButtonColor : buttonColor,
					color: buttonTextColor,
					cursor: "pointer",
					boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
					...(isFixedWidth ? { width: "100%", justifyContent: "center" } : {}),
					...buttonFont,
				}}
			>
				{iconSelection !== "none" && (
					<svg
						width={iconSize}
						height={iconSize}
						viewBox="0 0 24 24"
						fill={isButtonHovered || isPanelOpen ? "currentColor" : "none"}
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						{iconPaths[iconSelection]}
					</svg>
				)}
				{showText && buttonText}
			</button>

			{isPanelOpen && (
				<div
					style={{
						position: "absolute",
						top: "calc(100% + 12px)",
						left: panelAlignment === "left" ? 0 : panelAlignment === "center" ? "50%" : "auto",
						right: panelAlignment === "right" ? 0 : "auto",
						transform: panelAlignment === "center" ? "translateX(-50%)" : "none",
						zIndex: 1000,
						padding: 20,
						borderRadius: 12,
						border: `1px solid ${panelBorder}`,
						background: panelBackground,
						width: panelWidth,
						boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
					}}
				>
					<button
						onClick={() => startTransition(() => setIsPanelOpen(false))}
						style={{
							position: "absolute",
							top: 12,
							right: 12,
							background: "transparent",
							border: "none",
							cursor: "pointer",
							padding: 4,
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							opacity: 0.5,
							transition: "opacity 0.2s",
						}}
						onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
						onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.5")}
					>
						<svg
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<line x1="18" y1="6" x2="6" y2="18" />
							<line x1="6" y1="6" x2="18" y2="18" />
						</svg>
					</button>

					<div
						style={{
							marginBottom: 6,
							...titleFont,
						}}
					>
						{defaultTitle}
					</div>

					<div
						style={{
							marginBottom: 16,
							fontSize: 12,
							opacity: 0.5,
							lineHeight: 1.5,
							...subTitleFont,
						}}
					>
						{subTitle}
					</div>

					<div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "end" }}>
						<label style={{ flex: "1 1 100%", width: "100%" }}>
							<div
								style={{
									fontSize: 12,
									opacity: 0.6,
									marginBottom: 8,
									color: labelColor,
									...labelFont,
								}}
							>
								{remindLabel}
							</div>
							<select
								value={leadTime}
								onChange={(e) => startTransition(() => setLeadTime(e.target.value))}
								style={{
									width: "100%",
									padding: "10px 16px",
									paddingRight: 48,
									borderRadius: 10,
									border: `1px solid ${inputBorder}`,
									background: "white",
									appearance: "none",
									WebkitAppearance: "none",
									backgroundImage: `url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22black%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%2F%3E%3C%2Fsvg%3E')`,
									backgroundRepeat: "no-repeat",
									backgroundPosition: "right 16px center",
									backgroundSize: "16px",
									cursor: "pointer",
									...inputFont,
								}}
							>
								<option value="2h">2 hours before</option>
								<option value="12h">12 hours before</option>
								<option value="24h">24 hours before</option>
								<option value="3d">3 days before</option>
								<option value="7d">7 days before</option>
							</select>
						</label>
					</div>

					<div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
						<button
							onClick={handleAddToCalendar}
							style={{
								padding: popupButtonPadding,
								borderRadius: popupButtonBorderRadius,
								border: "none",
								background: buttonColor,
								color: buttonTextColor,
								cursor: "pointer",
								boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
								height: "fit-content",
								...buttonFont,
							}}
						>
							Add to calendar
						</button>

						<button
							onClick={() => {
								startTransition(() => {
									setIsPanelOpen(false)
									setStatus("")
								})
							}}
							style={{
								padding: popupButtonPadding,
								borderRadius: popupButtonBorderRadius,
								border: `1px solid ${panelBorder}`,
								background: cancelButtonColor,
								color: cancelButtonTextColor,
								cursor: "pointer",
								height: "fit-content",
								boxSizing: "border-box",
								...buttonFont,
							}}
						>
							Cancel
						</button>

						{status && (
							<div
								style={{
									alignSelf: "center",
									fontSize: 13,
									opacity: 0.75,
									...subTitleFont,
								}}
							>
								{status}
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	)
}

addPropertyControls(AddToYourCalendar, {
	defaultDate: {
		type: ControlType.Date,
		title: "Default Date",
	},
	defaultUrl: {
		type: ControlType.String,
		title: "Default URL",
		defaultValue: "",
	},
	eventDescription: {
		type: ControlType.String,
		title: "Event Note",
		defaultValue: "Reminder to buy your ticket before the price increases.",
		displayTextArea: true,
	},
	showText: {
		type: ControlType.Boolean,
		title: "Show Text",
		defaultValue: true,
	},
	buttonText: {
		type: ControlType.String,
		title: "Button Text",
		defaultValue: "Set reminder",
		hidden: ({ showText }) => !showText,
	},
	iconSelection: {
		type: ControlType.Enum,
		title: "Icon",
		options: ["bell", "calendar", "clock", "plus", "star", "heart", "none"],
		optionTitles: ["Bell", "Calendar", "Clock", "Plus", "Star", "Heart", "None"],
		defaultValue: "bell",
	},
	iconSize: {
		type: ControlType.Number,
		title: "Icon Size",
		defaultValue: 16,
		min: 8,
		max: 64,
		step: 1,
		hidden: ({ iconSelection }) => iconSelection === "none",
	},
	iconGap: {
		type: ControlType.Number,
		title: "Icon Gap",
		defaultValue: 10,
		min: 0,
		max: 50,
		step: 1,
		hidden: ({ iconSelection, showText }) => iconSelection === "none" || !showText,
	},
	buttonFont: {
		type: ControlType.Font,
		title: "Button Font",
		controls: "extended",
		defaultFontType: "sans-serif",
		defaultValue: {
			fontSize: "14px",
			variant: "Semibold",
			letterSpacing: "-0.01em",
			lineHeight: "1em",
		},
	},
	buttonColor: {
		type: ControlType.Color,
		title: "Button Color",
		defaultValue: "#000000",
	},
	buttonTextColor: {
		type: ControlType.Color,
		title: "Button Text",
		defaultValue: "#FFFFFF",
	},
	hoverButtonColor: {
		type: ControlType.Color,
		title: "Button Hover",
		defaultValue: "#111111",
	},
	buttonBorderRadius: {
		type: ControlType.BorderRadius,
		title: "Button Radius",
		defaultValue: "10px",
	},
	buttonPadding: {
		type: ControlType.Padding,
		title: "Button Padding",
		defaultValue: "12px 18px",
	},
	defaultTitle: {
		type: ControlType.String,
		title: "Panel Title",
		defaultValue: "Ticket price increases soon",
	},
	titleFont: {
		type: ControlType.Font,
		title: "Title Font",
		controls: "extended",
		defaultFontType: "sans-serif",
		defaultValue: {
			fontSize: "16px",
			variant: "Semibold",
			letterSpacing: "-0.01em",
			lineHeight: "1.2em",
		},
	},
	subTitle: {
		type: ControlType.String,
		title: "Subtitle",
		defaultValue: "Tip: This creates a calendar event with an alarm. Your calendar app may ask for permission to add it.",
		displayTextArea: true,
	},
	subTitleFont: {
		type: ControlType.Font,
		title: "Sub Title Font",
		controls: "extended",
		defaultFontType: "sans-serif",
		defaultValue: {
			fontSize: "12px",
			variant: "Medium",
			letterSpacing: "-0.01em",
			lineHeight: "1.4em",
		},
	},
	remindLabel: {
		type: ControlType.String,
		title: "Remind Label",
		defaultValue: "Remind me",
	},
	labelFont: {
		type: ControlType.Font,
		title: "Label Font",
		controls: "extended",
		defaultFontType: "sans-serif",
		defaultValue: {
			fontSize: "12px",
			variant: "Medium",
			letterSpacing: "-0.01em",
			lineHeight: "1em",
		},
	},
	panelBackground: {
		type: ControlType.Color,
		title: "Panel Background",
		defaultValue: "#FFFFFF",
	},
	panelBorder: {
		type: ControlType.Color,
		title: "Panel Border",
		defaultValue: "rgba(0,0,0,.12)",
	},
	panelWidth: {
		type: ControlType.Number,
		title: "Panel Width",
		defaultValue: 320,
		min: 200,
		max: 800,
		step: 10,
		displayStepper: true,
	},
	panelAlignment: {
		type: ControlType.Enum,
		title: "Panel Align",
		options: ["left", "center", "right"],
		optionTitles: ["Left", "Center", "Right"],
		defaultValue: "left",
		displaySegmentedControl: true,
	},
	inputBorder: {
		type: ControlType.Color,
		title: "Input Border",
		defaultValue: "rgba(0,0,0,.15)",
	},
	inputFont: {
		type: ControlType.Font,
		title: "Input Font",
		controls: "extended",
		defaultFontType: "sans-serif",
		defaultValue: {
			fontSize: "14px",
			variant: "Medium",
			letterSpacing: "-0.01em",
			lineHeight: "1em",
		},
	},
	labelColor: {
		type: ControlType.Color,
		title: "Label Color",
		defaultValue: "#000000",
	},
	cancelButtonColor: {
		type: ControlType.Color,
		title: "Cancel Button",
		defaultValue: "#FFFFFF",
	},
	cancelButtonTextColor: {
		type: ControlType.Color,
		title: "Cancel Text",
		defaultValue: "#000000",
	},
	popupButtonBorderRadius: {
		type: ControlType.BorderRadius,
		title: "Popup Button Radius",
		defaultValue: "10px",
	},
	popupButtonPadding: {
		type: ControlType.Padding,
		title: "Popup Button Padding",
		defaultValue: "12px 18px",
	},
})