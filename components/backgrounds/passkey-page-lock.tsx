// Password protection component for specific pages with enhanced client-side security
import { useState, useEffect, useRef, startTransition, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface PageLockProps {
	password: string
	pageId: string
	backgroundImage: { src: string; alt?: string }
	imageBorderRadius: number
	fillType: "color" | "image"
	fillColor: string
	fillImage: { src: string; alt?: string }
	inputBackgroundColor: string
	inputTextColor: string
	buttonColor: string
	buttonTextColor: string
	errorColor: string
	heading: string
	subheading: string
	placeholder: string
	buttonText: string
	errorMessage: string
	lockoutMessage: string
	maxAttempts: number
	lockoutDuration: number
	accessDuration: number
	showPasswordToggle: boolean
	enableRedirect: boolean
	redirectUrl: string
	headingFont: any
	subheadingFont: any
	inputFont: any
	buttonFont: any
	errorFont: any
	borderRadius: number
	bottomImage: { src: string; alt?: string }
	showBottomImage: boolean
	requestAccessText: string
	requestAccessFont: any
	secondRequestAccessText: string
	secondRequestAccessFont: any
	secondRequestAccessLink: string
	style?: CSSProperties
}

/**
 * Password Protection Component
 *
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 300
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function Passkey_PageLock(props: PageLockProps) {
	const {
		password,
		pageId,
		backgroundImage = {
			src: "https://framerusercontent.com/images/bBvimYCzXAfm4VegfPqJgEKJBNo.png",
			alt: "Gradient 1 - Blue",
		},
		imageBorderRadius,
		fillType = "color",
		fillColor,
		fillImage = {
			src: "https://framerusercontent.com/images/mfd7VpOPc1H6AXAZaHszMnd4LIM.png",
			alt: "Gradient 1 - Blue",
		},
		inputBackgroundColor,
		inputTextColor,
		buttonColor,
		buttonTextColor,
		errorColor,
		heading,
		subheading,
		placeholder,
		buttonText,
		errorMessage,
		lockoutMessage,
		maxAttempts,
		lockoutDuration,
		accessDuration = 0,
		showPasswordToggle,
		enableRedirect,
		redirectUrl,
		headingFont,
		subheadingFont,
		inputFont,
		buttonFont,
		errorFont,
		borderRadius,
		bottomImage = {
			src: "https://framerusercontent.com/images/O2fbJNcPPWTm675J4vF3Jjp0jc8.png",
			alt: "Gradient 1 - Blue",
		},
		showBottomImage = true,
		requestAccessText,
		requestAccessFont,
		secondRequestAccessText,
		secondRequestAccessFont,
		secondRequestAccessLink,
		style,
	} = props

	const [inputValue, setInputValue] = useState("")
	const [isUnlocked, setIsUnlocked] = useState(false)
	const [showError, setShowError] = useState(false)
	const [failedAttempts, setFailedAttempts] = useState(0)
	const [isLockedOut, setIsLockedOut] = useState(false)
	const [lockoutEndTime, setLockoutEndTime] = useState<number | null>(null)
	const [remainingTime, setRemainingTime] = useState(0)
	const [showPassword, setShowPassword] = useState(false)
	const [sessionKey] = useState(() => {
		if (typeof window !== "undefined") {
			return `password_protected_${window.location.pathname}`
		}
		return `password_protected_${pageId}`
	})
	const [passwordHashKey] = useState(() => {
		if (typeof window !== "undefined") {
			return `password_hash_${window.location.pathname}`
		}
		return `password_hash_${pageId}`
	})
	const [attemptsKey] = useState(() => {
		if (typeof window !== "undefined") {
			return `password_attempts_${window.location.pathname}`
		}
		return `password_attempts_${pageId}`
	})
	const [lockoutKey] = useState(() => {
		if (typeof window !== "undefined") {
			return `password_lockout_${window.location.pathname}`
		}
		return `password_lockout_${pageId}`
	})
	const [expirationKey] = useState(() => {
		if (typeof window !== "undefined") {
			return `password_expiration_${window.location.pathname}`
		}
		return `password_expiration_${pageId}`
	})
	const inputRef = useRef<HTMLInputElement>(null)
	const errorRef = useRef<HTMLParagraphElement>(null)

	// Simple hash function for password verification
	const hashPassword = (pwd: string): string => {
		let hash = 0
		for (let i = 0; i < pwd.length; i++) {
			const char = pwd.charCodeAt(i)
			hash = (hash << 5) - hash + char
			hash = hash & hash
		}
		return hash.toString()
	}

	useEffect(() => {
		if (typeof window !== "undefined") {
			const currentPasswordHash = hashPassword(password)
			const storedPasswordHash = localStorage.getItem(passwordHashKey)
			const stored = localStorage.getItem(sessionKey)
			const storedExpiration = localStorage.getItem(expirationKey)

			// Check if password has changed
			if (storedPasswordHash && storedPasswordHash !== currentPasswordHash) {
				// Password changed - invalidate session and clear all stored data
				localStorage.removeItem(sessionKey)
				localStorage.removeItem(passwordHashKey)
				localStorage.removeItem(attemptsKey)
				localStorage.removeItem(lockoutKey)
				localStorage.removeItem(expirationKey)
				startTransition(() => {
					setIsUnlocked(false)
					setFailedAttempts(0)
					setIsLockedOut(false)
					setLockoutEndTime(null)
					setRemainingTime(0)
					setShowError(false)
				})
				return
			}

			// Check if already unlocked with correct password
			if (stored === "unlocked" && storedPasswordHash === currentPasswordHash) {
				// If accessDuration is 0, require password every time (clear session)
				if (accessDuration === 0) {
					localStorage.removeItem(sessionKey)
					localStorage.removeItem(expirationKey)
					startTransition(() => setIsUnlocked(false))
					return
				}
				
				// If accessDuration > 0, check if access has expired
				if (accessDuration > 0 && storedExpiration) {
					const expirationTime = parseInt(storedExpiration, 10)
					const now = Date.now()
					
					if (expirationTime <= now) {
						// Access expired - clear session
						localStorage.removeItem(sessionKey)
						localStorage.removeItem(expirationKey)
						startTransition(() => setIsUnlocked(false))
						return
					}
				}
				
				startTransition(() => setIsUnlocked(true))
			}

			// Check for existing failed attempts
			const storedAttempts = localStorage.getItem(attemptsKey)
			if (storedAttempts) {
				const attempts = parseInt(storedAttempts, 10)
				startTransition(() => setFailedAttempts(attempts))
			}

			// Check for existing lockout
			const storedLockout = localStorage.getItem(lockoutKey)
			if (storedLockout) {
				const lockoutEnd = parseInt(storedLockout, 10)
				const now = Date.now()
				if (lockoutEnd > now) {
					startTransition(() => {
						setIsLockedOut(true)
						setLockoutEndTime(lockoutEnd)
						setRemainingTime(Math.ceil((lockoutEnd - now) / 1000))
					})
				} else {
					// Lockout expired, clear it
					localStorage.removeItem(lockoutKey)
					localStorage.removeItem(attemptsKey)
				}
			}
		}
	}, [sessionKey, passwordHashKey, attemptsKey, lockoutKey, expirationKey, password, accessDuration])

	// Timer for lockout countdown
	useEffect(() => {
		if (!isLockedOut || !lockoutEndTime) return

		const interval = setInterval(() => {
			const now = Date.now()
			const remaining = Math.ceil((lockoutEndTime - now) / 1000)

			if (remaining <= 0) {
				// Lockout expired
				if (typeof window !== "undefined") {
					localStorage.removeItem(lockoutKey)
					localStorage.removeItem(attemptsKey)
				}
				startTransition(() => {
					setIsLockedOut(false)
					setLockoutEndTime(null)
					setFailedAttempts(0)
					setRemainingTime(0)
					setShowError(false)
				})
			} else {
				startTransition(() => setRemainingTime(remaining))
			}
		}, 1000)

		return () => clearInterval(interval)
	}, [isLockedOut, lockoutEndTime, lockoutKey, attemptsKey])

	useEffect(() => {
		if (!isUnlocked && inputRef.current) {
			inputRef.current.focus()
		}
	}, [isUnlocked])

	useEffect(() => {
		if (showError && errorRef.current) {
			errorRef.current.focus()
		}
	}, [showError])

	// Prevent right-click context menu
	useEffect(() => {
		if (typeof window === "undefined" || isUnlocked) return

		const preventContextMenu = (e: MouseEvent) => {
			e.preventDefault()
			return false
		}

		document.addEventListener("contextmenu", preventContextMenu)

		return () => {
			document.removeEventListener("contextmenu", preventContextMenu)
		}
	}, [isUnlocked])

	// Block keyboard shortcuts for inspecting
	useEffect(() => {
		if (typeof window === "undefined" || isUnlocked) return

		const blockShortcuts = (e: KeyboardEvent) => {
			// F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+U
			if (
				e.key === "F12" ||
				(e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "J" || e.key === "C")) ||
				(e.ctrlKey && e.key === "U")
			) {
				e.preventDefault()
				return false
			}
		}

		document.addEventListener("keydown", blockShortcuts)

		return () => {
			document.removeEventListener("keydown", blockShortcuts)
		}
	}, [isUnlocked])

	// Clear console periodically
	useEffect(() => {
		if (typeof window === "undefined" || isUnlocked) return

		const clearConsole = () => {
			if (console.clear) {
				console.clear()
			}
		}

		// Clear immediately
		clearConsole()

		// Clear every 2 seconds
		const interval = window.setInterval(clearConsole, 2000)

		return () => {
			window.clearInterval(interval)
		}
	}, [isUnlocked])

	// Prevent copy/paste in password field
	const handleCopyPaste = (e: React.ClipboardEvent) => {
		e.preventDefault()
		return false
	}

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault()

		if (isLockedOut) return

		if (inputValue === password) {
			if (typeof window !== "undefined") {
				const currentPasswordHash = hashPassword(password)
				localStorage.setItem(sessionKey, "unlocked")
				localStorage.setItem(passwordHashKey, currentPasswordHash)
				localStorage.removeItem(attemptsKey)
				localStorage.removeItem(lockoutKey)
				
				// Set expiration time if accessDuration > 0
				if (accessDuration > 0) {
					const expirationTime = Date.now() + accessDuration * 24 * 60 * 60 * 1000
					localStorage.setItem(expirationKey, expirationTime.toString())
				} else {
					// If accessDuration is 0, remove any existing expiration
					localStorage.removeItem(expirationKey)
				}
			}
			
			// Handle redirect if enabled
			if (enableRedirect && redirectUrl) {
				if (typeof window !== "undefined") {
					window.location.href = redirectUrl
				}
				return
			}
			
			startTransition(() => {
				setIsUnlocked(true)
				setShowError(false)
				setFailedAttempts(0)
			})
		} else {
			const newAttempts = failedAttempts + 1

			if (newAttempts >= maxAttempts) {
				// Lock out the user
				const lockoutEnd = Date.now() + lockoutDuration * 60 * 1000
				if (typeof window !== "undefined") {
					localStorage.setItem(lockoutKey, lockoutEnd.toString())
					localStorage.setItem(attemptsKey, newAttempts.toString())
				}
				startTransition(() => {
					setIsLockedOut(true)
					setLockoutEndTime(lockoutEnd)
					setRemainingTime(lockoutDuration * 60)
					setShowError(false)
					setInputValue("")
				})
			} else {
				// Increment failed attempts
				if (typeof window !== "undefined") {
					localStorage.setItem(attemptsKey, newAttempts.toString())
				}
				startTransition(() => {
					setFailedAttempts(newAttempts)
					setShowError(true)
					setInputValue("")
				})
			}
		}
	}

	if (isUnlocked) {
		return (
			<div
				style={{
					...style,
					width: style?.width || "100%",
					height: style?.height || "100%",
					minWidth: 5,
					minHeight: 5,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					backgroundColor: "#f0f0f0",
					borderRadius,
				}}
			>
				<p
					style={{
						...subheadingFont,
						color: "#999",
						textAlign: "center",
					}}
				>
					Content unlocked
				</p>
			</div>
		)
	}

	const backgroundStyle =
		fillType === "color"
			? { backgroundColor: fillColor }
			: {
					backgroundImage: `url(${fillImage.src})`,
					backgroundSize: "cover",
					backgroundPosition: "center",
			  }

	return (
		<div
			style={{
				...style,
				position: "fixed",
				top: 0,
				left: 0,
				right: 0,
				bottom: 0,
				zIndex: 999999,
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				...backgroundStyle,
				minWidth: 5,
				minHeight: 5,
			}}
			role="main"
			aria-label="Password protected content"
			onCopy={(e) => e.preventDefault()}
			onCut={(e) => e.preventDefault()}
			onPaste={(e) => e.preventDefault()}
		>
			<form
				onSubmit={handleSubmit}
				style={{
					display: "flex",
					flexDirection: "column",
					gap: 20,
					padding: 40,
					maxWidth: 400,
					width: "100%",
				}}
				aria-labelledby="password-heading"
				aria-describedby={showError ? "password-error" : isLockedOut ? "password-lockout" : undefined}
			>
				<img
					{...backgroundImage}
					style={{
						width: 48,
						height: 48,
						borderRadius: imageBorderRadius,
						objectFit: "contain",
					}}
					alt={backgroundImage.alt || ""}
				/>

				<h2
					id="password-heading"
					style={{
						margin: 0,
						...headingFont,
						color: inputTextColor,
					}}
				>
					{heading}
				</h2>

				<p
					style={{
						margin: 0,
						...subheadingFont,
						color: inputTextColor,
					}}
				>
					{subheading}
				</p>

				<div style={{ position: "relative" }}>
					<input
						ref={inputRef}
						type={showPassword ? "text" : "password"}
						value={inputValue}
						onChange={(e) => {
							setInputValue(e.target.value)
							if (showError) {
								startTransition(() => setShowError(false))
							}
						}}
						onCopy={handleCopyPaste}
						onCut={handleCopyPaste}
						onPaste={handleCopyPaste}
						placeholder={placeholder}
						style={{
							padding: "12px 16px",
							paddingRight: showPasswordToggle ? "48px" : "16px",
							borderRadius,
							border: `1px solid ${showError || isLockedOut ? errorColor : inputBackgroundColor}`,
							backgroundColor: inputBackgroundColor,
							color: inputTextColor,
							outline: "none",
							width: "100%",
							boxSizing: "border-box",
							...inputFont,
							opacity: isLockedOut ? 0.5 : 1,
						}}
						aria-label="Password input"
						aria-required="true"
						aria-invalid={showError || isLockedOut}
						aria-describedby={showError ? "password-error" : isLockedOut ? "password-lockout" : undefined}
						disabled={isLockedOut}
						autoComplete="off"
						spellCheck="false"
					/>

					{showPasswordToggle && (
						<button
							type="button"
							onClick={() => startTransition(() => setShowPassword(!showPassword))}
							style={{
								position: "absolute",
								right: 12,
								top: "50%",
								transform: "translateY(-50%)",
								background: "none",
								border: "none",
								cursor: isLockedOut ? "not-allowed" : "pointer",
								padding: 4,
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								opacity: isLockedOut ? 0.5 : 0.6,
								transition: "opacity 0.2s",
							}}
							aria-label={showPassword ? "Hide password" : "Show password"}
							disabled={isLockedOut}
							onMouseEnter={(e) => {
								if (!isLockedOut) {
									e.currentTarget.style.opacity = "1"
								}
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.opacity = isLockedOut ? "0.5" : "0.6"
							}}
						>
							<svg
								width="20"
								height="20"
								viewBox="0 0 24 24"
								fill="none"
								stroke={inputTextColor}
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
							>
								{showPassword ? (
									<>
										<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
										<line x1="1" y1="1" x2="23" y2="23" />
									</>
								) : (
									<>
										<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
										<circle cx="12" cy="12" r="3" />
									</>
								)}
							</svg>
						</button>
					)}
				</div>

				{showError && !isLockedOut && (
					<p
						ref={errorRef}
						id="password-error"
						role="alert"
						aria-live="assertive"
						tabIndex={-1}
						style={{
							margin: 0,
							color: errorColor,
							...errorFont,
							outline: "none",
						}}
					>
						{errorMessage}
						{maxAttempts - failedAttempts > 0 && (
							<span style={{ display: "block", marginTop: 4 }}>
								{maxAttempts - failedAttempts} attempt{maxAttempts - failedAttempts !== 1 ? "s" : ""}{" "}
								remaining.
							</span>
						)}
					</p>
				)}

				{isLockedOut && (
					<p
						ref={errorRef}
						id="password-lockout"
						role="alert"
						aria-live="assertive"
						tabIndex={-1}
						style={{
							margin: 0,
							color: errorColor,
							...errorFont,
							outline: "none",
						}}
					>
						{lockoutMessage.replace("{time}", formatTime(remainingTime))}
					</p>
				)}

				<button
					type="submit"
					style={{
						padding: "12px 24px",
						borderRadius,
						border: "none",
						backgroundColor: buttonColor,
						color: buttonTextColor,
						cursor: isLockedOut ? "not-allowed" : "pointer",
						...buttonFont,
						opacity: isLockedOut || !inputValue.trim() ? 0.5 : 1,
					}}
					aria-label={`${buttonText} - Submit password to access protected content`}
					disabled={!inputValue.trim() || isLockedOut}
					onKeyDown={(e) => {
						if (e.key === "Enter" && !isLockedOut) {
							handleSubmit(e as any)
						}
					}}
				>
					{buttonText}
				</button>

				{showBottomImage && (
					<img
						{...bottomImage}
						style={{
							width: "100%",
							aspectRatio: "3 / 2",
							objectFit: "cover",
							borderRadius,
						}}
					/>
				)}

				<div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
					<p
						style={{
							margin: 0,
							...requestAccessFont,
							color: inputTextColor,
							textAlign: "left",
						}}
					>
						{requestAccessText}
					</p>

					<a
						href={secondRequestAccessLink || "#"}
						style={{
							margin: 0,
							...secondRequestAccessFont,
							color: inputTextColor,
							textAlign: "left",
							textDecoration: "none",
						}}
						onMouseEnter={(e) => {
							e.currentTarget.style.textDecoration = "underline"
						}}
						onMouseLeave={(e) => {
							e.currentTarget.style.textDecoration = "none"
						}}
					>
						{secondRequestAccessText}
					</a>
				</div>
			</form>
			<style>{`
				@media (max-width: 768px) {
					form {
						padding-left: 16px !important;
						padding-right: 16px !important;
						max-width: 100% !important;
					}
				}
				
				/* Prevent text selection on password form */
				form {
					-webkit-user-select: none;
					-moz-user-select: none;
					-ms-user-select: none;
					user-select: none;
				}
				
				/* Allow selection only in input field */
				input {
					-webkit-user-select: text;
					-moz-user-select: text;
					-ms-user-select: text;
					user-select: text;
				}
			`}</style>
		</div>
	)
}

function formatTime(seconds: number): string {
	const minutes = Math.floor(seconds / 60)
	const secs = seconds % 60
	if (minutes > 0) {
		return `${minutes}:${secs.toString().padStart(2, "0")}`
	}
	return `${secs} second${secs !== 1 ? "s" : ""}`
}

addPropertyControls(Passkey_PageLock, {
	password: {
		type: ControlType.String,
		title: "PIN / PassKey",
		defaultValue: "secret123",
	},
	accessDuration: {
		type: ControlType.Number,
		title: "Access Duration",
		defaultValue: 0,
		min: 0,
		max: 365,
		step: 1,
		unit: "days",
		displayStepper: true,
	},
	enableRedirect: {
		type: ControlType.Boolean,
		title: "Redirect on Success",
		defaultValue: false,
		enabledTitle: "Yes",
		disabledTitle: "No",
	},
	redirectUrl: {
		type: ControlType.String,
		title: "Redirect URL",
		defaultValue: "/",
		placeholder: "https://example.com or /page",
		hidden: ({ enableRedirect }) => !enableRedirect,
	},
	fillType: {
		type: ControlType.Enum,
		title: "Fill Type",
		options: ["color", "image"],
		optionTitles: ["Color", "Image"],
		defaultValue: "color",
		displaySegmentedControl: true,
	},
	fillColor: {
		type: ControlType.Color,
		title: "Fill Color",
		defaultValue: "#FFFFFF",
		hidden: ({ fillType }) => fillType !== "color",
	},
	fillImage: {
		type: ControlType.ResponsiveImage,
		title: "Fill Image",
		hidden: ({ fillType }) => fillType !== "image",
	},
	showPasswordToggle: {
		type: ControlType.Boolean,
		title: "Show Password Toggle",
		defaultValue: true,
		enabledTitle: "Show",
		disabledTitle: "Hide",
	},
	maxAttempts: {
		type: ControlType.Number,
		title: "Max Attempts",
		defaultValue: 3,
		min: 1,
		max: 10,
		step: 1,
		displayStepper: true,
	},
	lockoutDuration: {
		type: ControlType.Number,
		title: "Lockout Duration",
		defaultValue: 5,
		min: 1,
		max: 60,
		step: 1,
		unit: "min",
		displayStepper: true,
	},
	backgroundImage: {
		type: ControlType.ResponsiveImage,
		title: "Image",
	},
	imageBorderRadius: {
		type: ControlType.Number,
		title: "Image Border Radius",
		defaultValue: 8,
		min: 0,
		max: 32,
	},
	heading: {
		type: ControlType.String,
		title: "Heading",
		defaultValue: "Password Required",
	},
	subheading: {
		type: ControlType.String,
		title: "Subheading",
		defaultValue: "Enter your password to access this content",
	},
	placeholder: {
		type: ControlType.String,
		title: "Placeholder",
		defaultValue: "Enter password",
	},
	buttonText: {
		type: ControlType.String,
		title: "Button Text",
		defaultValue: "Unlock",
	},
	errorMessage: {
		type: ControlType.String,
		title: "Error Message",
		defaultValue: "Incorrect password. Please try again.",
	},
	lockoutMessage: {
		type: ControlType.String,
		title: "Lockout Message",
		defaultValue: "Too many failed attempts. Please try again in {time}.",
	},
	bottomImage: {
		type: ControlType.ResponsiveImage,
		title: "Bottom Image",
	},
	borderRadius: {
		type: ControlType.Number,
		title: "Border Radius",
		defaultValue: 8,
		min: 0,
		max: 32,
	},
	showBottomImage: {
		type: ControlType.Boolean,
		title: "Show Bottom Image",
		defaultValue: true,
		enabledTitle: "Show",
		disabledTitle: "Hide",
	},
	requestAccessText: {
		type: ControlType.String,
		title: "Bottom Heading Text",
		defaultValue: "Need access? Contact the page owner.",
		displayTextArea: true,
	},
	requestAccessFont: {
		type: ControlType.Font,
		title: "Bottom Heading Font",
		controls: "extended",
		defaultFontType: "sans-serif",
		defaultValue: {
			fontSize: "14px",
			variant: "Medium",
			letterSpacing: "-0.01em",
			lineHeight: "1.3em",
		},
	},
	secondRequestAccessText: {
		type: ControlType.String,
		title: "Bottom Link Text",
		defaultValue: "Additional information here.",
		displayTextArea: true,
	},
	secondRequestAccessFont: {
		type: ControlType.Font,
		title: "Bottom Link Font",
		controls: "extended",
		defaultFontType: "sans-serif",
		defaultValue: {
			fontSize: "14px",
			variant: "Medium",
			letterSpacing: "-0.01em",
			lineHeight: "1.3em",
		},
	},
	secondRequestAccessLink: {
		type: ControlType.Link,
		title: "Bottom Link",
	},
	inputBackgroundColor: {
		type: ControlType.Color,
		title: "Input Background",
		defaultValue: "#F5F5F5",
	},
	inputTextColor: {
		type: ControlType.Color,
		title: "Text Color",
		defaultValue: "#000000",
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
	errorColor: {
		type: ControlType.Color,
		title: "Error Color",
		defaultValue: "#FF5588",
	},
	headingFont: {
		type: ControlType.Font,
		title: "Heading Font",
		controls: "extended",
		defaultFontType: "sans-serif",
		defaultValue: {
			fontSize: "32px",
			variant: "Semibold",
			letterSpacing: "-0.03em",
			lineHeight: "1em",
		},
	},
	subheadingFont: {
		type: ControlType.Font,
		title: "Subheading Font",
		controls: "extended",
		defaultFontType: "sans-serif",
		defaultValue: {
			fontSize: "15px",
			variant: "Medium",
			letterSpacing: "-0.01em",
			lineHeight: "1.3em",
		},
	},
	inputFont: {
		type: ControlType.Font,
		title: "Input Font",
		controls: "extended",
		defaultFontType: "sans-serif",
		defaultValue: {
			fontSize: "15px",
			variant: "Medium",
			letterSpacing: "-0.01em",
			lineHeight: "1.3em",
		},
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
	errorFont: {
		type: ControlType.Font,
		title: "Error Font",
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

Passkey_PageLock.displayName = "PassKey PageLock"