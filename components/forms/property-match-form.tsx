// Property Match Form - Multi-step form for property matching with responsive grid layout
import { useState, useEffect, useCallback, useMemo, useRef, startTransition, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface IntentOption {
    image: { src: string; alt?: string }
    label: string
    subtitle: string
}

interface PropertyTypeOption {
    icon: string
    name: string
    description: string
}

interface TimelineOption {
    label: string
}

interface PropertyMatchFormProps {
    // Configuration
    previewStep: number

    // Global Styles
    colors: {
        surfaceColor: string
        accentColor: string
        accentDark: string
        textColor: string
        mutedColor: string
        borderColor: string
    }
    typography: {
        displayFont: any
        bodyFont: any
    }
    borderThickness: number
    cornerRadius: number

    // Step 1: Intent
    step1Content: {
        s1Headline: string
        s1Sub: string
    }
    intentOptions: IntentOption[]

    // Step 2: Property Type
    step2Content: {
        s2Headline: string
        s2Sub: string
    }
    propertyTypeOptions: PropertyTypeOption[]

    // Step 3: Budget & Timeline
    step3Content: {
        s3Headline: string
        s3Sub: string
    }
    step3Budget: {
        budgetLabel: string
        budgetMin: string
        budgetMax: string
        currency: string
    }
    step3Timeline: {
        timelineLabel: string
        timelineOptions: TimelineOption[]
    }

    // Step 4: Lead Capture
    step4Content: {
        s4Headline: string
        s4Sub: string
    }
    step4Form: {
        namePlaceholder: string
        phonePlaceholder: string
        emailPlaceholder: string
    }
    step4CTA: {
        ctaLabel: string
        trustText: string
    }

    // Step 5: Success
    step5Content: {
        s5Title: string
        s5Sub: string
    }
    homeLinkLabel: string
    homeLinkUrl: string

    // Events
    onSubmit?: (data: any) => void

    style?: CSSProperties
}

function getBudgetLabels(currency: string) {
    return [
        `${currency}250k – ${currency}500k`,
        `${currency}500k – ${currency}750k`,
        `${currency}750k – ${currency}1.5M`,
        `${currency}1.5M – ${currency}3M`,
        `${currency}3M – ${currency}5M`,
        `${currency}5M+`,
    ]
}

function getBudgetRangeLabel(v: number, currency: string) {
    const labels = getBudgetLabels(currency)
    const idx = Math.min(Math.round((v / 100) * (labels.length - 1)), labels.length - 1)
    return labels[idx]
}

// Helper function for keyboard navigation
function handleKeyDown(e: React.KeyboardEvent, onClick: () => void) {
    if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onClick()
    }
}

// Intent Card Component
function IntentCard({ card, isSelected, accentColor, borderColor, onClick, borderThickness = 1, isMobile = false }) {
    const [isHovered, setIsHovered] = useState(false)
    const [imageError, setImageError] = useState(false)
    
    // Safely access image properties with fallback
    const imageSrc = card?.image?.src || "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg"
    const imageAlt = card?.image?.alt || card?.label || "Property image"

    return (
        <div
            role="button"
            tabIndex={0}
            aria-pressed={isSelected}
            aria-label={`${card.label}: ${card.subtitle}`}
            onClick={onClick}
            onKeyDown={(e) => handleKeyDown(e, onClick)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="intent-card"
            style={{
                position: "relative",
                height: isMobile ? "clamp(110px, 22vw, 140px)" : "clamp(180px, 30vw, 220px)",
                borderRadius: "clamp(8px, 2vw, 10px)",
                overflow: "hidden",
                cursor: "pointer",
                border: isSelected
                    ? `${borderThickness * 2}px solid ${accentColor}`
                    : isHovered
                    ? `${borderThickness}px solid ${accentColor}`
                    : `${borderThickness}px solid ${borderColor}`,
                transition: "border 0.25s ease, box-shadow 0.2s ease",
                boxShadow: isHovered ? "0 4px 12px rgba(0,0,0,0.1)" : "0 2px 4px rgba(0,0,0,0.05)",
            }}
        >
            <img
                src={imageSrc}
                alt={imageAlt}
                onError={() => setImageError(true)}
                className="intent-card-img"
                style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    opacity: imageError ? 0.3 : (isSelected || isHovered ? 0.9 : 0.75),
                    transform: isHovered ? "scale(1.05)" : "scale(1)",
                    transition: "transform 0.3s ease, opacity 0.25s ease",
                }}
            />
            <div
                style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: "clamp(0.875rem, 3vw, 1.25rem)",
                    background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.6) 60%, transparent 100%)",
                    color: "#fff",
                }}
            >
                <div style={{ 
                    fontWeight: 600, 
                    fontSize: isMobile ? "clamp(14px, 3.5vw, 16px)" : "clamp(13px, 3vw, 15px)", 
                    marginBottom: "clamp(2px, 0.5vw, 4px)",
                    wordBreak: "break-word", 
                    overflowWrap: "break-word",
                    lineHeight: 1.2,
                }}>{card.label}</div>
                <div style={{ 
                    fontSize: isMobile ? "clamp(12px, 2.8vw, 13px)" : "clamp(11px, 2.4vw, 12px)", 
                    opacity: 0.95, 
                    wordBreak: "break-word", 
                    overflowWrap: "break-word",
                    lineHeight: 1.3,
                }}>{card.subtitle}</div>
            </div>
            {isSelected && (
                <div
                    style={{
                        position: "absolute",
                        top: "clamp(10px, 2.5vw, 14px)",
                        right: "clamp(10px, 2.5vw, 14px)",
                        width: "clamp(20px, 4.5vw, 24px)",
                        height: "clamp(20px, 4.5vw, 24px)",
                        borderRadius: "50%",
                        background: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.25s ease",
                        boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
                    }}
                >
                    <svg
                        width={12}
                        height={12}
                        viewBox="0 0 16 16"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M3 8L6.5 11.5L13 5"
                            stroke={accentColor}
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </div>
            )}
        </div>
    )
}

// Pill Option Component
function PillOption({ pill, isSelected, accentColor, accentDark, borderColor, mutedColor, onClick, borderThickness = 1 }) {
    const [isHovered, setIsHovered] = useState(false)

    return (
        <div
            role="button"
            tabIndex={0}
            aria-pressed={isSelected}
            aria-label={`${pill.name}: ${pill.description}`}
            onClick={onClick}
            onKeyDown={(e) => handleKeyDown(e, onClick)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
                display: "flex",
                alignItems: "center",
                gap: "clamp(0.75rem, 2.5vw, 1rem)",
                padding: "clamp(0.875rem, 2.5vw, 1rem)",
                borderRadius: "8px",
                border: isSelected
                    ? `${borderThickness * 2}px solid ${accentColor}`
                    : isHovered
                    ? `${borderThickness}px solid ${accentColor}`
                    : `${borderThickness}px solid ${borderColor}`,
                cursor: "pointer",
                transition: "all 0.25s ease",
                background: isSelected
                    ? `${accentColor}10`
                    : isHovered
                    ? `${accentDark}0D`
                    : "transparent",
                transform: isHovered ? "translateX(4px)" : "translateX(0)",
            }}
        >
            <div style={{ fontSize: "clamp(22px, 5vw, 28px)", flexShrink: 0 }}>{pill.icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: "clamp(13px, 2.5vw, 14px)", marginBottom: "2px", wordBreak: "break-word", overflowWrap: "break-word" }}>
                    {pill.name}
                </div>
                <div style={{ fontSize: "clamp(11px, 2vw, 12px)", color: mutedColor, wordBreak: "break-word", overflowWrap: "break-word" }}>{pill.description}</div>
            </div>
        </div>
    )
}

// Timeline Button Component
function TimelineButton({ timeline, isSelected, accentColor, borderColor, textColor, onClick, borderThickness = 1 }) {
    const [isHovered, setIsHovered] = useState(false)

    return (
        <button
            type="button"
            aria-pressed={isSelected}
            onClick={onClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
                padding: "clamp(0.625rem, 2vw, 0.75rem)",
                borderRadius: "8px",
                border: isSelected
                    ? `${borderThickness * 2}px solid ${accentColor}`
                    : isHovered
                    ? `${borderThickness}px solid ${accentColor}`
                    : `${borderThickness}px solid ${borderColor}`,
                background: isSelected ? `${accentColor}10` : "transparent",
                color: textColor,
                fontSize: "clamp(12px, 2.5vw, 13px)",
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.2s ease",
                wordBreak: "break-word",
                overflowWrap: "break-word",
                whiteSpace: "normal",
            }}
        >
            {timeline.label}
        </button>
    )
}

// Return Home Link Component
function ReturnHomeLink({ href, label, accentDark, accentColor }) {
    const [isHovered, setIsHovered] = useState(false)

    return (
        <a
            href={href}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
                display: "inline-block",
                padding: "clamp(0.75rem, 2vw, 0.875rem) clamp(1.5rem, 4vw, 2rem)",
                borderRadius: "8px",
                border: "none",
                background: `linear-gradient(135deg, ${accentDark}, ${accentColor})`,
                color: "#fff",
                fontSize: "clamp(13px, 2.5vw, 14px)",
                fontWeight: 600,
                textDecoration: "none",
                cursor: "pointer",
                transition: "all 0.2s ease",
                transform: isHovered ? "translateY(-2px)" : "translateY(0)",
                boxShadow: isHovered ? "0 4px 12px rgba(0,0,0,0.15)" : "0 2px 8px rgba(0,0,0,0.1)",
            }}
        >
            {label}
        </a>
    )
}

// Back Button Component
function BackButton({ onClick, borderColor, textColor, accentColor }) {
    const [isHovered, setIsHovered] = useState(false)

    return (
        <button
            type="button"
            onClick={onClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
                flex: 1,
                minWidth: "120px",
                padding: "clamp(0.75rem, 2vw, 0.875rem)",
                borderRadius: "8px",
                border: `1px solid ${borderColor}`,
                background: isHovered ? `${accentColor}08` : "transparent",
                color: textColor,
                fontSize: "clamp(13px, 2.5vw, 14px)",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s ease",
                transform: isHovered ? "translateY(-2px)" : "translateY(0)",
                boxShadow: isHovered ? "0 4px 12px rgba(0,0,0,0.1)" : "0 2px 4px rgba(0,0,0,0.05)",
            }}
        >
            Back
        </button>
    )
}

/**
 * @framerIntrinsicWidth 600
 * @framerIntrinsicHeight 700
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerDisableUnlink
 */
function PropertyMatchForm(props: PropertyMatchFormProps) {
    const {
        previewStep,
        colors = {
            surfaceColor: "#FFFFFF",
            accentColor: "#C9A96E",
            accentDark: "#A07840",
            textColor: "#000000",
            mutedColor: "#666666",
            borderColor: "#EEEEEE",
        },
        typography = {
            displayFont: {
                fontSize: "32px",
                variant: "Semibold",
                letterSpacing: "-0.03em",
                lineHeight: "1em",
            },
            bodyFont: {
                fontSize: "15px",
                variant: "Medium",
                letterSpacing: "-0.01em",
                lineHeight: "1.3em",
            },
        },
        borderThickness = 1,
        cornerRadius = 12,
        step1Content = {
            s1Headline: "What brings you here today?",
            s1Sub: "Select your primary interest to get started.",
        },
        intentOptions = [
            {
                image: {
                    src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                    alt: "Buy",
                },
                label: "Buy",
                subtitle: "Find your dream home",
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                    alt: "Sell",
                },
                label: "Sell",
                subtitle: "Get the best price",
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                    alt: "Rent",
                },
                label: "Rent",
                subtitle: "Flexible living",
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
                    alt: "Invest",
                },
                label: "Invest",
                subtitle: "Build your portfolio",
            },
        ],
        step2Content = {
            s2Headline: "What type of property?",
            s2Sub: "Choose the property type that matches your needs.",
        },
        propertyTypeOptions = [
            { icon: "🏠", name: "Family Home", description: "3-5 bedrooms, garden" },
            { icon: "🏢", name: "Penthouse", description: "Luxury city living" },
            { icon: "🏪", name: "Commercial", description: "Office or retail space" },
            { icon: "🌳", name: "Land", description: "Development opportunity" },
        ],
        step3Content = {
            s3Headline: "Budget & Timeline",
            s3Sub: "Help us understand your investment range and timeframe.",
        },
        step3Budget = {
            budgetLabel: "Your Budget Range",
            budgetMin: "€250k",
            budgetMax: "€5M+",
            currency: "€",
        },
        step3Timeline = {
            timelineLabel: "When are you looking to move?",
            timelineOptions: [
                { label: "Immediately" },
                { label: "1-3 months" },
                { label: "6+ months" },
                { label: "Just exploring" },
            ],
        },
        step4Content = {
            s4Headline: "Almost there!",
            s4Sub: "Enter your details and we'll match you with the perfect properties.",
        },
        step4Form = {
            namePlaceholder: "Full Name",
            phonePlaceholder: "Phone Number",
            emailPlaceholder: "Email Address",
        },
        step4CTA = {
            ctaLabel: "Get My Matches",
            trustText: "🔒 Your information is secure and will never be shared.",
        },
        step5Content = {
            s5Title: "Thank you!",
            s5Sub: "We've received your information and will be in touch shortly with your personalized property matches.",
        },
        homeLinkLabel = "Return Home",
        homeLinkUrl = "/",
        onSubmit,
    } = props

    // Destructure nested objects for easier access
    const { surfaceColor, accentColor, accentDark, textColor, mutedColor, borderColor } = colors
    const { displayFont, bodyFont } = typography
    const { s1Headline, s1Sub } = step1Content
    const { s2Headline, s2Sub } = step2Content
    const { s3Headline, s3Sub } = step3Content
    const { budgetLabel: budgetLabelText, budgetMin, budgetMax, currency: currencySymbol } = step3Budget
    const { timelineLabel, timelineOptions: timelineOpts } = step3Timeline
    const { s4Headline, s4Sub } = step4Content
    const { namePlaceholder, phonePlaceholder, emailPlaceholder } = step4Form
    const { ctaLabel, trustText } = step4CTA
    const { s5Title, s5Sub } = step5Content

    const [step, setStep] = useState(previewStep ?? 1)
    const [intent, setIntent] = useState<string | null>(null)
    const [propType, setPropType] = useState<string | null>(null)
    const [sliderVal, setSliderVal] = useState(40)
    const [timeline, setTimeline] = useState<string | null>(null)
    const [fname, setFname] = useState("")
    const [fphone, setFphone] = useState("")
    const [femail, setFemail] = useState("")
    const [focusedField, setFocusedField] = useState<string | null>(null)
    const [validationErrors, setValidationErrors] = useState<{ name?: string; phone?: string; email?: string }>({})
    const isStatic = useIsStaticRenderer()
    
    // Add hover states for Continue buttons
    const [step2ContinueHovered, setStep2ContinueHovered] = useState(false)
    const [step3ContinueHovered, setStep3ContinueHovered] = useState(false)
    const [step4SubmitHovered, setStep4SubmitHovered] = useState(false)
    
    // Sync previewStep changes from Framer UI
    useEffect(() => {
        if (isStatic && previewStep !== undefined && previewStep !== null) {
            setStep(previewStep)
        }
    }, [previewStep, isStatic])

    // Calculate budget label during render (derived state)
    const budget = useMemo(() => getBudgetRangeLabel(sliderVal, currencySymbol), [sliderVal, currencySymbol])

    const progress = step === 5 ? 100 : Math.round((step / 4) * 100)
    // Enhanced validation
    const validatePhone = (phone: string) => {
        const cleaned = phone.replace(/\D/g, '')
        return cleaned.length >= 10 && cleaned.length <= 15
    }

    const validateEmail = (email: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    }

    const leadValid =
        fname.trim().length > 1 && validatePhone(fphone) && validateEmail(femail)

    const intentCards = useMemo(() => {
        const defaultImage = {
            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
            alt: "Property image"
        }
        
        return intentOptions.map((option, index) => {
            // Safely extract image with proper fallback
            let imageData = defaultImage
            
            if (option?.image) {
                if (typeof option.image === 'string') {
                    // Handle case where image is just a string URL
                    imageData = { src: option.image, alt: option.label || "Property image" }
                } else if (typeof option.image === 'object' && option.image !== null) {
                    // Handle case where image is an object
                    imageData = {
                        src: option.image.src || defaultImage.src,
                        alt: option.image.alt || option.label || "Property image"
                    }
                }
            }
            
            return {
                key: `${(option?.label || "Option").toLowerCase().replace(/\s+/g, '-')}-${index}`,
                label: option?.label || "Option",
                subtitle: option?.subtitle || "Description",
                image: imageData,
            }
        })
    }, [intentOptions])

    const pills = useMemo(() => propertyTypeOptions.map((option, index) => ({
        key: `${(option.name || "Property Type").toLowerCase().replace(/\s+/g, '-')}-${index}`,
        icon: option.icon || "🏠",
        name: option.name || "Property Type",
        description: option.description || "Description",
    })), [propertyTypeOptions])

    const timelineBtns = useMemo(() => timelineOpts.map((option, index) => ({
        key: `${(option.label || "Timeline").toLowerCase().replace(/\s+/g, '-')}-${index}`,
        label: option.label,
    })), [timelineOpts])

    const goTo = useCallback((n: number) => {
        startTransition(() => setStep(n))
    }, [])

    const handlePillClick = useCallback((pillKey: string) => {
        // Guard: if already selected, do nothing
        if (propType === pillKey) return
        startTransition(() => setPropType(pillKey))
    }, [propType])

    const handleTimelineClick = useCallback((timelineKey: string) => {
        startTransition(() => setTimeline(timelineKey))
    }, [])

    const handleSlider = (v: number) => {
        startTransition(() => setSliderVal(v))
    }

    return (
        <div
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                minWidth: "280px",
                maxWidth: "800px",
                minHeight: "500px",
                maxHeight: "900px",
                margin: "0 auto",
                backgroundColor: surfaceColor,
                color: textColor,
                border: `1px solid ${borderColor}`,
                borderRadius: `${cornerRadius}px`,
                overflowY: "auto",
                boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                ...bodyFont,
                ...props.style,
            }}
        >
            {/* Screen Reader Announcement */}
            <div
                role="status"
                aria-live="polite"
                aria-atomic="true"
                style={{
                    position: "absolute",
                    width: "1px",
                    height: "1px",
                    padding: 0,
                    margin: "-1px",
                    overflow: "hidden",
                    clip: "rect(0, 0, 0, 0)",
                    whiteSpace: "nowrap",
                    border: 0,
                }}
            >
                {step === 5 ? "Step 5: Complete" : `Step ${step} of 4`}
            </div>

            {/* Progress Bar */}
            <div
                style={{
                    position: "sticky",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: "2px",
                    background: `${accentColor}20`,
                    zIndex: 10,
                }}
            >
                <div
                    style={{
                        height: "100%",
                        background: `linear-gradient(90deg, ${accentDark}, ${accentColor})`,
                        width: `${progress}%`,
                        transition: "width 0.55s cubic-bezier(0.4,0,0.2,1)",
                    }}
                />
            </div>

            {/* Step 1 */}
            {step === 1 && (
                <Step1Content
                    accentColor={accentColor}
                    accentDark={accentDark}
                    textColor={textColor}
                    mutedColor={mutedColor}
                    borderColor={borderColor}
                    displayFont={displayFont}
                    s1Headline={s1Headline}
                    s1Sub={s1Sub}
                    intentCards={intentCards}
                    intent={intent}
                    setIntent={setIntent}
                    goTo={goTo}
                    borderThickness={borderThickness}
                    isStatic={isStatic}
                />
            )}

            {/* Step 2 */}
            {step === 2 && (
                <div
                    style={{
                        padding: "clamp(1.5rem, 4vw, 2.5rem) clamp(1.25rem, 4vw, 2.5rem) clamp(1.25rem, 3vw, 2rem)",
                        animation: isStatic ? "none" : "fadeUp 0.4s ease both",
                    }}
                >
                    <div
                        style={{
                            fontSize: "clamp(10px, 2vw, 11px)",
                            letterSpacing: "0.2em",
                            textTransform: "uppercase",
                            color: accentColor,
                            fontWeight: 500,
                            marginBottom: "clamp(0.5rem, 2vw, 0.75rem)",
                        }}
                    >
                        STEP 2 OF 4
                    </div>
                    <h1
                        style={{
                            ...displayFont,
                            color: textColor,
                            marginBottom: "clamp(0.375rem, 1.5vw, 0.5rem)",
                            wordBreak: "break-word",
                            overflowWrap: "break-word",
                        }}
                    >
                        {s2Headline}
                    </h1>
                    <p
                        style={{
                            fontSize: "clamp(13px, 2.5vw, 14px)",
                            color: mutedColor,
                            lineHeight: 1.6,
                            marginBottom: "clamp(1.25rem, 3vw, 2rem)",
                            wordBreak: "break-word",
                            overflowWrap: "break-word",
                        }}
                    >
                        {s2Sub}
                    </p>

                    <div style={{ display: "flex", flexDirection: "column", gap: "clamp(8px, 2vw, 10px)", marginBottom: "clamp(1.25rem, 3vw, 2rem)" }}>
                        {pills.map((p) => {
                            const isSelected = propType === p.key
                            return (
                                <PillOption
                                    key={p.key}
                                    pill={p}
                                    isSelected={isSelected}
                                    accentColor={accentColor}
                                    accentDark={accentDark}
                                    borderColor={borderColor}
                                    mutedColor={mutedColor}
                                    borderThickness={borderThickness}
                                    onClick={() => handlePillClick(p.key)}
                                />
                            )
                        })}
                    </div>

                    <div style={{ display: "flex", gap: "clamp(8px, 2vw, 10px)", flexWrap: "wrap" }}>
                        <BackButton
                            onClick={() => goTo(1)}
                            borderColor={borderColor}
                            textColor={textColor}
                            accentColor={accentColor}
                        />
                        <button
                            type="button"
                            onClick={() => propType && goTo(3)}
                            onMouseEnter={() => startTransition(() => setStep2ContinueHovered(true))}
                            onMouseLeave={() => startTransition(() => setStep2ContinueHovered(false))}
                            disabled={!propType}
                            style={{
                                flex: 1,
                                minWidth: "120px",
                                padding: "clamp(0.75rem, 2vw, 0.875rem)",
                                borderRadius: "8px",
                                border: "none",
                                background: propType ? `linear-gradient(135deg, ${accentDark}, ${accentColor})` : "#D4D4D4",
                                color: propType ? "#fff" : "#999999",
                                fontSize: "clamp(13px, 2.5vw, 14px)",
                                fontWeight: 600,
                                cursor: propType ? "pointer" : "not-allowed",
                                transition: "all 0.2s ease",
                                transform: (propType && step2ContinueHovered) ? "translateY(-2px)" : "translateY(0)",
                                boxShadow: (propType && step2ContinueHovered) ? "0 4px 12px rgba(0,0,0,0.15)" : "0 2px 8px rgba(0,0,0,0.1)",
                            }}
                        >
                            Continue
                        </button>
                    </div>
                </div>
            )}

            {/* Step 3 */}
            {step === 3 && (
                <div
                    style={{
                        padding: "clamp(1.5rem, 4vw, 2.5rem) clamp(1.25rem, 4vw, 2.5rem) clamp(1.25rem, 3vw, 2rem)",
                        animation: isStatic ? "none" : "fadeUp 0.4s ease both",
                    }}
                >
                    <div
                        style={{
                            fontSize: "clamp(10px, 2vw, 11px)",
                            letterSpacing: "0.2em",
                            textTransform: "uppercase",
                            color: accentColor,
                            fontWeight: 500,
                            marginBottom: "clamp(0.5rem, 2vw, 0.75rem)",
                        }}
                    >
                        STEP 3 OF 4
                    </div>
                    <h1
                        style={{
                            ...displayFont,
                            color: textColor,
                            marginBottom: "clamp(0.375rem, 1.5vw, 0.5rem)",
                            wordBreak: "break-word",
                            overflowWrap: "break-word",
                        }}
                    >
                        {s3Headline}
                    </h1>
                    <p
                        style={{
                            fontSize: "clamp(13px, 2.5vw, 14px)",
                            color: mutedColor,
                            lineHeight: 1.6,
                            marginBottom: "clamp(1.25rem, 3vw, 2rem)",
                            wordBreak: "break-word",
                            overflowWrap: "break-word",
                        }}
                    >
                        {s3Sub}
                    </p>

                    <div style={{ marginBottom: "clamp(1.25rem, 3vw, 2rem)" }}>
                        <label
                            style={{
                                display: "block",
                                fontSize: "clamp(12px, 2.5vw, 13px)",
                                fontWeight: 600,
                                marginBottom: "clamp(0.5rem, 2vw, 0.75rem)",
                                color: textColor,
                            }}
                        >
                            {budgetLabelText}
                        </label>
                        <div
                            style={{
                                padding: "clamp(0.875rem, 2.5vw, 1rem)",
                                borderRadius: "8px",
                                border: `1px solid ${borderColor}`,
                                background: `${accentColor}05`,
                                marginBottom: "clamp(0.75rem, 2vw, 1rem)",
                            }}
                        >
                            <div
                                style={{
                                    fontSize: "clamp(16px, 4vw, 20px)",
                                    fontWeight: 600,
                                    color: accentColor,
                                    textAlign: "center",
                                }}
                            >
                                {budget}
                            </div>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={sliderVal}
                            onChange={(e) => handleSlider(Number(e.target.value))}
                            aria-label={budgetLabelText}
                            aria-valuetext={budget}
                            style={{
                                width: "100%",
                                accentColor: accentColor,
                            }}
                        />
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                fontSize: "clamp(10px, 2vw, 11px)",
                                color: mutedColor,
                                marginTop: "clamp(0.375rem, 1.5vw, 0.5rem)",
                            }}
                        >
                            <span>{budgetMin}</span>
                            <span>{budgetMax}</span>
                        </div>
                    </div>

                    <div style={{ marginBottom: "clamp(1.25rem, 3vw, 2rem)" }}>
                        <label
                            style={{
                                display: "block",
                                fontSize: "clamp(12px, 2.5vw, 13px)",
                                fontWeight: 600,
                                marginBottom: "clamp(0.5rem, 2vw, 0.75rem)",
                                color: textColor,
                            }}
                        >
                            {timelineLabel}
                        </label>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "clamp(8px, 2vw, 10px)" }}>
                            {timelineBtns.map((t) => {
                                const isSelected = timeline === t.key
                                return (
                                    <TimelineButton
                                        key={t.key}
                                        timeline={t}
                                        isSelected={isSelected}
                                        accentColor={accentColor}
                                        borderColor={borderColor}
                                        textColor={textColor}
                                        borderThickness={borderThickness}
                                        onClick={() => handleTimelineClick(t.key)}
                                    />
                                )
                            })}
                        </div>
                    </div>

                    <div style={{ display: "flex", gap: "clamp(8px, 2vw, 10px)", flexWrap: "wrap" }}>
                        <BackButton
                            onClick={() => goTo(2)}
                            borderColor={borderColor}
                            textColor={textColor}
                            accentColor={accentColor}
                        />
                        <button
                            type="button"
                            onClick={() => timeline && goTo(4)}
                            onMouseEnter={() => startTransition(() => setStep3ContinueHovered(true))}
                            onMouseLeave={() => startTransition(() => setStep3ContinueHovered(false))}
                            disabled={!timeline}
                            style={{
                                flex: 1,
                                minWidth: "120px",
                                padding: "clamp(0.75rem, 2vw, 0.875rem)",
                                borderRadius: "8px",
                                border: "none",
                                background: timeline ? `linear-gradient(135deg, ${accentDark}, ${accentColor})` : "#D4D4D4",
                                color: timeline ? "#fff" : "#999999",
                                fontSize: "clamp(13px, 2.5vw, 14px)",
                                fontWeight: 600,
                                cursor: timeline ? "pointer" : "not-allowed",
                                transition: "all 0.2s ease",
                                transform: (timeline && step3ContinueHovered) ? "translateY(-2px)" : "translateY(0)",
                                boxShadow: (timeline && step3ContinueHovered) ? "0 4px 12px rgba(0,0,0,0.15)" : "0 2px 8px rgba(0,0,0,0.1)",
                            }}
                        >
                            Continue
                        </button>
                    </div>
                </div>
            )}

            {/* Step 4 */}
            {step === 4 && (
                <div
                    style={{
                        padding: "clamp(1.5rem, 4vw, 2.5rem) clamp(1.25rem, 4vw, 2.5rem)",
                        paddingBottom: "clamp(1.5rem, 4vw, 2.5rem)",
                        animation: isStatic ? "none" : "fadeUp 0.4s ease both",
                    }}
                >
                    <div
                        style={{
                            fontSize: "clamp(10px, 2vw, 11px)",
                            letterSpacing: "0.2em",
                            textTransform: "uppercase",
                            color: accentColor,
                            fontWeight: 500,
                            marginBottom: "clamp(0.5rem, 2vw, 0.75rem)",
                        }}
                    >
                        STEP 4 OF 4
                    </div>
                    <h1
                        style={{
                            ...displayFont,
                            color: textColor,
                            marginBottom: "clamp(0.375rem, 1.5vw, 0.5rem)",
                            wordBreak: "break-word",
                            overflowWrap: "break-word",
                        }}
                    >
                        {s4Headline}
                    </h1>
                    <p
                        style={{
                            fontSize: "clamp(13px, 2.5vw, 14px)",
                            color: mutedColor,
                            lineHeight: 1.6,
                            marginBottom: "clamp(1.25rem, 3vw, 2rem)",
                            wordBreak: "break-word",
                            overflowWrap: "break-word",
                        }}
                    >
                        {s4Sub}
                    </p>

                    {/* Selection Summary */}
                    {(intent || propType || timeline) && (
                        <div
                            style={{
                                padding: "clamp(0.75rem, 2vw, 1rem)",
                                borderRadius: "6px",
                                background: `${accentColor}08`,
                                border: `1px solid ${borderColor}`,
                                marginBottom: "clamp(1rem, 2.5vw, 1.5rem)",
                            }}
                        >
                            <div
                                style={{
                                    fontSize: "clamp(9px, 1.8vw, 10px)",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.08em",
                                    color: mutedColor,
                                    marginBottom: "clamp(0.375rem, 1.5vw, 0.5rem)",
                                    fontWeight: 500,
                                }}
                            >
                                Selection Summary
                            </div>
                            <div
                                style={{
                                    fontSize: "clamp(10px, 2vw, 11px)",
                                    color: mutedColor,
                                    lineHeight: 1.5,
                                }}
                            >
                                {intent && (
                                    <div style={{ marginBottom: "2px" }}>
                                        <span style={{ opacity: 0.7 }}>Intent:</span>{" "}
                                        <span style={{ color: textColor, fontWeight: 500 }}>
                                            {intentCards.find((c) => c.key === intent)?.label || "—"}
                                        </span>
                                    </div>
                                )}
                                {propType && (
                                    <div style={{ marginBottom: "2px" }}>
                                        <span style={{ opacity: 0.7 }}>Property:</span>{" "}
                                        <span style={{ color: textColor, fontWeight: 500 }}>
                                            {pills.find((p) => p.key === propType)?.name || "—"}
                                        </span>
                                    </div>
                                )}
                                {budget && (
                                    <div style={{ marginBottom: "2px" }}>
                                        <span style={{ opacity: 0.7 }}>Budget:</span>{" "}
                                        <span style={{ color: textColor, fontWeight: 500 }}>{budget}</span>
                                    </div>
                                )}
                                {timeline && (
                                    <div>
                                        <span style={{ opacity: 0.7 }}>Timeline:</span>{" "}
                                        <span style={{ color: textColor, fontWeight: 500 }}>
                                            {timelineBtns.find((t) => t.key === timeline)?.label || "—"}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Hidden inputs for Framer form system */}
                    <input
                        type="hidden"
                        name="Intent"
                        value={intentCards.find(c => c.key === intent)?.label || ""}
                    />
                    <input
                        type="hidden"
                        name="Property Type"
                        value={pills.find(p => p.key === propType)?.name || ""}
                    />
                    <input
                        type="hidden"
                        name="Budget"
                        value={budget}
                    />
                    <input
                        type="hidden"
                        name="Timeline"
                        value={timelineBtns.find(t => t.key === timeline)?.label || ""}
                    />

                    <div style={{ display: "flex", flexDirection: "column", gap: "clamp(10px, 2.5vw, 12px)", marginBottom: "clamp(1rem, 2.5vw, 1.5rem)" }}>
                        <div style={{ width: "100%" }}>
                            <input
                                type="text"
                                name="Full Name"
                                placeholder={namePlaceholder}
                                value={fname}
                                onChange={(e) => {
                                    setFname(e.target.value)
                                    if (validationErrors.name) {
                                        setValidationErrors(prev => ({ ...prev, name: undefined }))
                                    }
                                }}
                                onFocus={() => startTransition(() => setFocusedField("name"))}
                                onBlur={() => startTransition(() => setFocusedField(null))}
                                aria-label={namePlaceholder}
                                aria-invalid={!!validationErrors.name}
                                aria-describedby={validationErrors.name ? "name-error" : undefined}
                                style={{
                                    padding: "clamp(0.75rem, 2vw, 0.875rem)",
                                    borderRadius: "8px",
                                    border: validationErrors.name 
                                        ? `1px solid #EF4444` 
                                        : focusedField === "name"
                                        ? `1px solid ${accentColor}`
                                        : `1px solid ${borderColor}`,
                                    fontSize: "clamp(13px, 2.5vw, 14px)",
                                    background: surfaceColor,
                                    color: textColor,
                                    width: "100%",
                                    boxShadow: focusedField === "name" ? `0 0 0 3px ${accentColor}4D` : "none",
                                    transition: "box-shadow 0.2s ease, border-color 0.2s ease",
                                }}
                            />
                            {validationErrors.name && (
                                <div id="name-error" style={{ fontSize: "clamp(10px, 2vw, 11px)", color: "#EF4444", marginTop: "4px" }}>
                                    {validationErrors.name}
                                </div>
                            )}
                        </div>
                        <div style={{ width: "100%" }}>
                            <input
                                type="tel"
                                name="Phone Number"
                                placeholder={phonePlaceholder}
                                value={fphone}
                                onChange={(e) => {
                                    setFphone(e.target.value)
                                    if (validationErrors.phone) {
                                        setValidationErrors(prev => ({ ...prev, phone: undefined }))
                                    }
                                }}
                                onFocus={() => startTransition(() => setFocusedField("phone"))}
                                onBlur={() => startTransition(() => setFocusedField(null))}
                                aria-label={phonePlaceholder}
                                aria-invalid={!!validationErrors.phone}
                                aria-describedby={validationErrors.phone ? "phone-error" : undefined}
                                required
                                style={{
                                    padding: "clamp(0.75rem, 2vw, 0.875rem)",
                                    borderRadius: "8px",
                                    border: validationErrors.phone 
                                        ? `1px solid #EF4444` 
                                        : focusedField === "phone"
                                        ? `1px solid ${accentColor}`
                                        : `1px solid ${borderColor}`,
                                    fontSize: "clamp(13px, 2.5vw, 14px)",
                                    background: surfaceColor,
                                    color: textColor,
                                    width: "100%",
                                    boxShadow: focusedField === "phone" ? `0 0 0 3px ${accentColor}4D` : "none",
                                    transition: "box-shadow 0.2s ease, border-color 0.2s ease",
                                }}
                            />
                            {validationErrors.phone && (
                                <div id="phone-error" style={{ fontSize: "clamp(10px, 2vw, 11px)", color: "#EF4444", marginTop: "4px" }}>
                                    {validationErrors.phone}
                                </div>
                            )}
                        </div>
                        <div style={{ width: "100%" }}>
                            <input
                                type="email"
                                name="Email Address"
                                placeholder={emailPlaceholder}
                                value={femail}
                                onChange={(e) => {
                                    setFemail(e.target.value)
                                    if (validationErrors.email) {
                                        setValidationErrors(prev => ({ ...prev, email: undefined }))
                                    }
                                }}
                                onFocus={() => startTransition(() => setFocusedField("email"))}
                                onBlur={() => startTransition(() => setFocusedField(null))}
                                aria-label={emailPlaceholder}
                                aria-invalid={!!validationErrors.email}
                                aria-describedby={validationErrors.email ? "email-error" : undefined}
                                required
                                style={{
                                    padding: "clamp(0.75rem, 2vw, 0.875rem)",
                                    borderRadius: "8px",
                                    border: validationErrors.email 
                                        ? `1px solid #EF4444` 
                                        : focusedField === "email"
                                        ? `1px solid ${accentColor}`
                                        : `1px solid ${borderColor}`,
                                    fontSize: "clamp(13px, 2.5vw, 14px)",
                                    background: surfaceColor,
                                    color: textColor,
                                    width: "100%",
                                    boxShadow: focusedField === "email" ? `0 0 0 3px ${accentColor}4D` : "none",
                                    transition: "box-shadow 0.2s ease, border-color 0.2s ease",
                                }}
                            />
                            {validationErrors.email && (
                                <div id="email-error" style={{ fontSize: "clamp(10px, 2vw, 11px)", color: "#EF4444", marginTop: "4px" }}>
                                    {validationErrors.email}
                                </div>
                            )}
                        </div>
                    </div>

                    <p
                        style={{
                            fontSize: "clamp(10px, 2vw, 11px)",
                            color: mutedColor,
                            lineHeight: 1.5,
                            marginBottom: "clamp(1rem, 2.5vw, 1.5rem)",
                            textAlign: "center",
                        }}
                    >
                        {trustText}
                    </p>

                    <div style={{ display: "flex", gap: "clamp(10px, 2.5vw, 12px)", flexWrap: "wrap" }}>
                        <BackButton
                            onClick={() => goTo(3)}
                            borderColor={borderColor}
                            textColor={textColor}
                            accentColor={accentColor}
                        />
                        <button
                            type="submit"
                            onClick={(e) => {
                                if (!leadValid) {
                                    e.preventDefault()
                                    const errors: { name?: string; phone?: string; email?: string } = {}
                                    if (fname.trim().length < 2) errors.name = "Name must be at least 2 characters"
                                    if (!validatePhone(fphone)) errors.phone = "Please enter a valid phone number (10-15 digits)"
                                    if (!validateEmail(femail)) errors.email = "Please enter a valid email address"
                                    setValidationErrors(errors)
                                    return
                                }
                                setTimeout(() => {
                                    goTo(5)
                                    if (onSubmit) {
                                        onSubmit({
                                            intent: intentCards.find(c => c.key === intent)?.label || "",
                                            propertyType: pills.find(p => p.key === propType)?.name || "",
                                            budget: budget,
                                            timeline: timelineBtns.find(t => t.key === timeline)?.label || "",
                                            name: fname,
                                            phone: fphone,
                                            email: femail,
                                        })
                                    }
                                }, 300)
                            }}
                            onMouseEnter={() => startTransition(() => setStep4SubmitHovered(true))}
                            onMouseLeave={() => startTransition(() => setStep4SubmitHovered(false))}
                            style={{
                                flex: 1,
                                minWidth: "120px",
                                padding: "clamp(0.75rem, 2vw, 0.875rem)",
                                borderRadius: "8px",
                                border: "none",
                                background: leadValid ? `linear-gradient(135deg, ${accentDark}, ${accentColor})` : "#D4D4D4",
                                color: leadValid ? "#fff" : "#999999",
                                fontSize: "clamp(13px, 2.5vw, 14px)",
                                fontWeight: 600,
                                cursor: leadValid ? "pointer" : "not-allowed",
                                transition: "all 0.2s ease",
                                transform: (step4SubmitHovered && leadValid) ? "translateY(-2px)" : "translateY(0)",
                                boxShadow: (step4SubmitHovered && leadValid) ? "0 4px 12px rgba(0,0,0,0.15)" : "0 2px 8px rgba(0,0,0,0.1)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "8px",
                            }}
                        >
                            {ctaLabel}
                        </button>
                    </div>
                </div>
            )}

            {/* Step 5 */}
            {step === 5 && (
                <div
                    style={{
                        padding: "clamp(2.5rem, 6vw, 4rem) clamp(1.5rem, 5vw, 3rem)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        textAlign: "center",
                        animation: isStatic ? "none" : "fadeUp 0.4s ease both",
                        minHeight: "400px",
                    }}
                >
                    <div
                        style={{
                            width: "clamp(64px, 14vw, 80px)",
                            height: "clamp(64px, 14vw, 80px)",
                            borderRadius: "50%",
                            background: `${accentColor}15`,
                            border: `2px solid ${accentColor}`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            margin: "0 auto clamp(1.5rem, 4vw, 2rem)",
                        }}
                    >
                        <div style={{ width: "clamp(28px, 6vw, 36px)", height: "clamp(28px, 6vw, 36px)" }}>
                            <svg
                                width="100%"
                                height="100%"
                                viewBox="0 0 36 36"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M8 18L15 25L28 12"
                                    stroke={accentColor}
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </div>
                    </div>
                    <h1
                        style={{
                            ...displayFont,
                            color: textColor,
                            marginBottom: "clamp(0.75rem, 2.5vw, 1rem)",
                            wordBreak: "break-word",
                            overflowWrap: "break-word",
                            maxWidth: "100%",
                        }}
                    >
                        {s5Title}
                    </h1>
                    <p
                        style={{
                            fontSize: "clamp(14px, 2.8vw, 15px)",
                            color: mutedColor,
                            lineHeight: 1.65,
                            marginBottom: "clamp(1.75rem, 4vw, 2.5rem)",
                            wordBreak: "break-word",
                            overflowWrap: "break-word",
                            maxWidth: "clamp(280px, 85%, 480px)",
                            margin: "0 auto clamp(1.75rem, 4vw, 2.5rem)",
                        }}
                    >
                        {s5Sub}
                    </p>
                    <ReturnHomeLink
                        href={homeLinkUrl}
                        label={homeLinkLabel}
                        accentDark={accentDark}
                        accentColor={accentColor}
                    />
                </div>
            )}

            <style>{`
                @keyframes fadeUp {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                @keyframes spin {
                    from {
                        transform: rotate(0deg);
                    }
                    to {
                        transform: rotate(360deg);
                    }
                }
                @media (prefers-reduced-motion: reduce) {
                    * {
                        animation: none !important;
                        transition: none !important;
                    }
                }
            `}</style>
        </div>
    )
}

// Step 1 Component with responsive grid detection
function Step1Content({ accentColor, accentDark, textColor, mutedColor, borderColor, displayFont, s1Headline, s1Sub, intentCards, intent, setIntent, goTo, borderThickness, isStatic }) {
    const [containerWidth, setContainerWidth] = useState(0)
    const [continueHovered, setContinueHovered] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    // Detect container width for responsive layout
    useEffect(() => {
        if (!containerRef.current) return
        
        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                startTransition(() => setContainerWidth(entry.contentRect.width))
            }
        })
        
        resizeObserver.observe(containerRef.current)
        return () => {
            resizeObserver.disconnect()
        }
    }, [])

    // Determine if we're in mobile view (single column) based on container width
    // Use 600px threshold to include tablets in portrait mode
    const isMobile = containerWidth > 0 && containerWidth < 600

    return (
        <div
            ref={containerRef}
            style={{
                padding: isMobile 
                    ? "clamp(1.25rem, 4vw, 1.75rem) clamp(1rem, 3.5vw, 1.5rem) clamp(1.25rem, 3.5vw, 1.75rem)"
                    : "clamp(1.5rem, 5vw, 2.5rem) clamp(1.25rem, 4.5vw, 2.5rem) clamp(1.5rem, 4vw, 2.5rem)",
                animation: isStatic ? "none" : "fadeUp 0.4s ease both",
            }}
        >
            <div
                style={{
                    fontSize: "clamp(10px, 2.2vw, 11px)",
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    color: accentColor,
                    fontWeight: 600,
                    marginBottom: "clamp(0.625rem, 2.5vw, 0.875rem)",
                }}
            >
                STEP 1 OF 4
            </div>
            <h1
                style={{
                    ...displayFont,
                    color: textColor,
                    marginBottom: "clamp(0.5rem, 2vw, 0.625rem)",
                    wordBreak: "break-word",
                    overflowWrap: "break-word",
                }}
            >
                {s1Headline}
            </h1>
            <p
                style={{
                    fontSize: "clamp(13px, 2.8vw, 15px)",
                    color: mutedColor,
                    lineHeight: 1.65,
                    marginBottom: "clamp(1.5rem, 4vw, 2.25rem)",
                    wordBreak: "break-word",
                    overflowWrap: "break-word",
                }}
            >
                {s1Sub}
            </p>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)",
                    gap: isMobile ? "clamp(12px, 3vw, 16px)" : "clamp(10px, 2.5vw, 14px)",
                    marginBottom: "clamp(1.5rem, 4vw, 2rem)",
                }}
            >
                {intentCards.map((c) => {
                    const isSelected = intent === c.key
                    return (
                        <IntentCard
                            key={c.key}
                            card={c}
                            isSelected={isSelected}
                            accentColor={accentColor}
                            borderColor={borderColor}
                            borderThickness={borderThickness}
                            isMobile={isMobile}
                            onClick={() => {
                                // Guard: if already selected, do nothing
                                if (intent === c.key) return
                                
                                startTransition(() => setIntent(c.key))
                            }}
                        />
                    )
                })}
            </div>

            <button
                type="button"
                onClick={() => intent && goTo(2)}
                onMouseEnter={() => intent && startTransition(() => setContinueHovered(true))}
                onMouseLeave={() => startTransition(() => setContinueHovered(false))}
                disabled={!intent}
                style={{
                    width: "100%",
                    padding: "clamp(0.75rem, 2vw, 0.875rem)",
                    borderRadius: "8px",
                    border: "none",
                    background: intent ? `linear-gradient(135deg, ${accentDark}, ${accentColor})` : "#D4D4D4",
                    color: intent ? "#fff" : "#999999",
                    fontSize: "clamp(13px, 2.5vw, 14px)",
                    fontWeight: 600,
                    cursor: intent ? "pointer" : "not-allowed",
                    transition: "all 0.2s ease",
                    transform: continueHovered ? "translateY(-2px)" : "translateY(0)",
                    boxShadow: continueHovered ? "0 4px 12px rgba(0,0,0,0.15)" : "0 2px 8px rgba(0,0,0,0.1)",
                }}
            >
                Continue
            </button>
        </div>
    )
}

export default PropertyMatchForm

addPropertyControls(PropertyMatchForm, {
    // ═══════════════════════════════════════════════════════════
    // PREVIEW CONFIGURATION
    // ═══════════════════════════════════════════════════════════
    previewStep: {
        type: ControlType.Enum,
        title: "Preview Step",
        description: "Preview any step while designing. Does not affect the live form.",
        options: [1, 2, 3, 4, 5],
        optionTitles: ["Step 1: Intent", "Step 2: Property Type", "Step 3: Budget & Timeline", "Step 4: Lead Capture", "Step 5: Success"],
        defaultValue: 1,
        displaySegmentedControl: false,
    },



    // ═══════════════════════════════════════════════════════════
    // GLOBAL STYLES
    // ═══════════════════════════════════════════════════════════
    colors: {
        type: ControlType.Object,
        title: "🎨 Colors",
        description: "Open to adjust all colors of the form in one place.",
        controls: {
            surfaceColor: {
                type: ControlType.Color,
                title: "Card Background",
                defaultValue: "#FFFFFF",
            },
            accentColor: {
                type: ControlType.Color,
                title: "Accent Color",
                defaultValue: "#C9A96E",
            },
            accentDark: {
                type: ControlType.Color,
                title: "Accent Dark",
                defaultValue: "#A07840",
            },
            textColor: {
                type: ControlType.Color,
                title: "Text Color",
                defaultValue: "#000000",
            },
            mutedColor: {
                type: ControlType.Color,
                title: "Muted Text",
                defaultValue: "#666666",
            },
            borderColor: {
                type: ControlType.Color,
                title: "Border Color",
                defaultValue: "#EEEEEE",
            },
        },
        defaultValue: {
            surfaceColor: "#FFFFFF",
            accentColor: "#C9A96E",
            accentDark: "#A07840",
            textColor: "#000000",
            mutedColor: "#666666",
            borderColor: "#EEEEEE",
        },
    },

    typography: {
        type: ControlType.Object,
        title: "✏️ Fonts",
        description: "Open to adjust fonts for headings and body text.",
        controls: {
            displayFont: {
                type: ControlType.Font,
                title: "Display Font",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: "32px",
                    variant: "Semibold",
                    letterSpacing: "-0.03em",
                    lineHeight: "1em",
                },
            },
            bodyFont: {
                type: ControlType.Font,
                title: "Body Font",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: "15px",
                    variant: "Medium",
                    letterSpacing: "-0.01em",
                    lineHeight: "1.3em",
                },
            },
        },
        defaultValue: {
            displayFont: {
                fontSize: "32px",
                variant: "Semibold",
                letterSpacing: "-0.03em",
                lineHeight: "1em",
            },
            bodyFont: {
                fontSize: "15px",
                variant: "Medium",
                letterSpacing: "-0.01em",
                lineHeight: "1.3em",
            },
        },
    },

    borderThickness: {
        type: ControlType.Number,
        title: "Border Width",
        description: "Controls the thickness of selection borders on cards and options.",
        defaultValue: 1,
        min: 1,
        max: 5,
        step: 0.5,
        unit: "px",
    },
    cornerRadius: {
        type: ControlType.Number,
        title: "Rounded Corners",
        description: "Controls how rounded the outer corners of the form card are.",
        defaultValue: 12,
        min: 0,
        max: 32,
        step: 1,
        unit: "px",
    },



    // ═══════════════════════════════════════════════════════════
    // STEP 1 - INTENT
    // ═══════════════════════════════════════════════════════════
    step1Content: {
        type: ControlType.Object,
        title: "1: Intent",
        description: "Edit the headline and subtext shown at the top of Step 1.",
        controls: {
            s1Headline: {
                type: ControlType.String,
                title: "Headline",
                defaultValue: "What brings you here today?",
            },
            s1Sub: {
                type: ControlType.String,
                title: "Subtext",
                defaultValue: "Select your primary interest to get started.",
                displayTextArea: true,
            },
        },
        defaultValue: {
            s1Headline: "What brings you here today?",
            s1Sub: "Select your primary interest to get started.",
        },
    },
    intentOptions: {
        type: ControlType.Array,
        title: "1: Intent Cards",
        description: "Add, remove, or edit the intent cards. Each card needs an image, a label, and a subtitle.",
        control: {
            type: ControlType.Object,
            controls: {
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                },
                label: {
                    type: ControlType.String,
                    title: "Label",
                    defaultValue: "Option",
                },
                subtitle: {
                    type: ControlType.String,
                    title: "Subtitle",
                    defaultValue: "Description",
                },
            },
        },
        defaultValue: [
            {
                image: {
                    src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                    alt: "Buy",
                },
                label: "Buy",
                subtitle: "Find your dream home",
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                    alt: "Sell",
                },
                label: "Sell",
                subtitle: "Get the best price",
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                    alt: "Rent",
                },
                label: "Rent",
                subtitle: "Flexible living",
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
                    alt: "Invest",
                },
                label: "Invest",
                subtitle: "Build your portfolio",
            },
        ],
    },



    // ═══════════════════════════════════════════════════════════
    // STEP 2 - PROPERTY TYPE
    // ═══════════════════════════════════════════════════════════
    step2Content: {
        type: ControlType.Object,
        title: "2: Property Type",
        description: "Edit the headline and subtext shown at the top of Step 2.",
        controls: {
            s2Headline: {
                type: ControlType.String,
                title: "Headline",
                defaultValue: "What type of property?",
            },
            s2Sub: {
                type: ControlType.String,
                title: "Subtext",
                defaultValue: "Choose the property type that matches your needs.",
                displayTextArea: true,
            },
        },
        defaultValue: {
            s2Headline: "What type of property?",
            s2Sub: "Choose the property type that matches your needs.",
        },
    },
    propertyTypeOptions: {
        type: ControlType.Array,
        title: "2: Property Options",
        description: "Add, remove, or edit the property type options. Each option needs an icon, a name, and a description.",
        control: {
            type: ControlType.Object,
            controls: {
                icon: {
                    type: ControlType.String,
                    title: "Icon",
                    defaultValue: "🏠",
                },
                name: {
                    type: ControlType.String,
                    title: "Name",
                    defaultValue: "Property Type",
                },
                description: {
                    type: ControlType.String,
                    title: "Description",
                    defaultValue: "Description",
                },
            },
        },
        defaultValue: [
            { icon: "🏠", name: "Family Home", description: "3-5 bedrooms, garden" },
            { icon: "🏢", name: "Penthouse", description: "Luxury city living" },
            { icon: "🏪", name: "Commercial", description: "Office or retail space" },
            { icon: "🌳", name: "Land", description: "Development opportunity" },
        ],
    },



    // ═══════════════════════════════════════════════════════════
    // STEP 3 - BUDGET & TIMELINE
    // ═══════════════════════════════════════════════════════════
    step3Content: {
        type: ControlType.Object,
        title: "3: Budget & Timeline",
        description: "Edit the headline and subtext shown at the top of Step 3.",
        controls: {
            s3Headline: {
                type: ControlType.String,
                title: "Headline",
                defaultValue: "Budget & Timeline",
            },
            s3Sub: {
                type: ControlType.String,
                title: "Subtext",
                defaultValue: "Help us understand your investment range and timeframe.",
                displayTextArea: true,
            },
        },
        defaultValue: {
            s3Headline: "Budget & Timeline",
            s3Sub: "Help us understand your investment range and timeframe.",
        },
    },
    step3Budget: {
        type: ControlType.Object,
        title: "3: Budget Settings",
        description: "Set the currency symbol and the min and max labels shown below the budget slider.",
        controls: {
            budgetLabel: {
                type: ControlType.String,
                title: "Section Label",
                defaultValue: "Your Budget Range",
            },
            budgetMin: {
                type: ControlType.String,
                title: "Min Text",
                defaultValue: "€250k",
            },
            budgetMax: {
                type: ControlType.String,
                title: "Max Text",
                defaultValue: "€5M+",
            },
            currency: {
                type: ControlType.String,
                title: "Currency Symbol",
                defaultValue: "€",
            },
        },
        defaultValue: {
            budgetLabel: "Your Budget Range",
            budgetMin: "€250k",
            budgetMax: "€5M+",
            currency: "€",
        },
    },
    step3Timeline: {
        type: ControlType.Object,
        title: "3: Timeline Settings",
        description: "Edit the section label and add or remove timeline options.",
        controls: {
            timelineLabel: {
                type: ControlType.String,
                title: "Section Label",
                defaultValue: "When are you looking to move?",
            },
            timelineOptions: {
                type: ControlType.Array,
                title: "Timeline Options",
                control: {
                    type: ControlType.Object,
                    controls: {
                        label: {
                            type: ControlType.String,
                            title: "Label",
                            defaultValue: "Timeline Option",
                        },
                    },
                },
                defaultValue: [
                    { label: "Immediately" },
                    { label: "1-3 months" },
                    { label: "6+ months" },
                    { label: "Just exploring" },
                ],
            },
        },
        defaultValue: {
            timelineLabel: "When are you looking to move?",
            timelineOptions: [
                { label: "Immediately" },
                { label: "1-3 months" },
                { label: "6+ months" },
                { label: "Just exploring" },
            ],
        },
    },



    // ═══════════════════════════════════════════════════════════
    // STEP 4 - LEAD CAPTURE
    // ═══════════════════════════════════════════════════════════
    step4Content: {
        type: ControlType.Object,
        title: "4: Lead Capture",
        description: "Edit the headline and subtext shown at the top of Step 4.",
        controls: {
            s4Headline: {
                type: ControlType.String,
                title: "Headline",
                defaultValue: "Almost there!",
            },
            s4Sub: {
                type: ControlType.String,
                title: "Subtext",
                defaultValue: "Enter your details and we'll match you with the perfect properties.",
                displayTextArea: true,
            },
        },
        defaultValue: {
            s4Headline: "Almost there!",
            s4Sub: "Enter your details and we'll match you with the perfect properties.",
        },
    },
    step4Form: {
        type: ControlType.Object,
        title: "4: Form Fields",
        description: "Edit the placeholder text shown inside each input field.",
        controls: {
            namePlaceholder: {
                type: ControlType.String,
                title: "Name Placeholder",
                defaultValue: "Full Name",
            },
            phonePlaceholder: {
                type: ControlType.String,
                title: "Phone Placeholder",
                defaultValue: "Phone Number",
            },
            emailPlaceholder: {
                type: ControlType.String,
                title: "Email Placeholder",
                defaultValue: "Email Address",
            },
        },
        defaultValue: {
            namePlaceholder: "Full Name",
            phonePlaceholder: "Phone Number",
            emailPlaceholder: "Email Address",
        },
    },
    step4CTA: {
        type: ControlType.Object,
        title: "4: Submit Button",
        description: "Edit the submit button label and the trust message shown above it.",
        controls: {
            ctaLabel: {
                type: ControlType.String,
                title: "Button Text",
                defaultValue: "Get My Matches",
            },
            trustText: {
                type: ControlType.String,
                title: "Trust Message",
                defaultValue: "🔒 Your information is secure and will never be shared.",
                displayTextArea: true,
            },
        },
        defaultValue: {
            ctaLabel: "Get My Matches",
            trustText: "🔒 Your information is secure and will never be shared.",
        },
    },



    // ═══════════════════════════════════════════════════════════
    // STEP 5 - SUCCESS
    // ═══════════════════════════════════════════════════════════
    step5Content: {
        type: ControlType.Object,
        title: "5: Success Screen",
        description: "Edit the success title and message shown after the form is submitted.",
        controls: {
            s5Title: {
                type: ControlType.String,
                title: "Success Title",
                defaultValue: "Thank you!",
            },
            s5Sub: {
                type: ControlType.String,
                title: "Success Message",
                defaultValue: "We've received your information and will be in touch shortly with your personalized property matches.",
                displayTextArea: true,
            },
        },
        defaultValue: {
            s5Title: "Thank you!",
            s5Sub: "We've received your information and will be in touch shortly with your personalized property matches.",
        },
    },
    homeLinkLabel: {
        type: ControlType.String,
        title: "Return Button Text",
        description: "The text shown on the return button on the success screen.",
        defaultValue: "Return Home",
    },
    homeLinkUrl: {
        type: ControlType.Link,
        title: "Return Button Link",
        description: "The page or URL the return button links to.",
        defaultValue: "/",
    },



    // ═══════════════════════════════════════════════════════════
    // EVENTS
    // ═══════════════════════════════════════════════════════════
    onSubmit: {
        type: ControlType.EventHandler,
        description: "Optional. Connect to a Framer interaction to trigger something after the form is submitted.",
    },
})
