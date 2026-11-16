// Pricing card with title, subtext, price toggle (monthly/annual), plan benefits, addons dropdown, and CTA button
import { useState, useMemo, startTransition, useEffect, type CSSProperties, type ChangeEvent } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface Addon {
	name: string
	monthlyPrice: number
	annualPrice: number
}

interface Benefit {
	text: string
	useCustomIcon: boolean
	icon: string
	iconSize: number
	iconColor: string
}

interface AddonGroup {
	title: string
	addons: Addon[]
}

interface RegionalPrice {
	currency: string
	monthlyPrice: number
	annualPrice: number
	showDiscount: boolean
	discountType: "percentage" | "amount"
	discountPercentage: number
	discountAmount: number
	addonPrices?: Array<{
		groupIndex: number
		addonIndex: number
		monthlyPrice: number
		annualPrice: number
	}>
}

interface PricingCardProps {
	style?: CSSProperties
	settings: {
		backgroundColor: string
		backgroundType: "solid" | "gradient"
		gradientFrom: string
		gradientTo: string
		gradientDirection: "to right" | "to left" | "to top" | "to bottom" | "to top right" | "to top left" | "to bottom right" | "to bottom left"
		borderRadius: number
		showShadow: boolean
		boxShadow: string
		gap: number
		padding: number
		benefitsGap: number
		showToggle: boolean
		toggleColor: string
		border: {
			borderWidth?: number
			borderStyle?: "solid" | "dashed" | "dotted" | "double"
			borderColor?: string
			borderTopWidth?: number
			borderLeftWidth?: number
			borderRightWidth?: number
			borderBottomWidth?: number
		}
		separatorColor: string
	}
	pricing: {
		isCustomPricing: boolean
		customPricingText: string
		currency: string
		monthlyPrice: number
		annualPrice: number
		showDiscount: boolean
		discountType: "percentage" | "amount"
		discountPercentage: number
		discountAmount: number
	}
	regionalPricing: {
		enableRegionalPricing: boolean
		regionalPrices: RegionalPrice[]
	}
	text: {
		title: string
		subtext: string
		benefits: Benefit[]
		showBenefitsSubheading: boolean
		benefitsSubheading: string
	}
	button: {
		buttonText: string
		buttonDisplayMode: "hover" | "always"
		buttonColor: string
		buttonTextColor: string
		buttonFont: CSSProperties
		buttonStyle: "solid" | "outline"
		buttonBorder: {
			borderWidth: number
			borderStyle: "solid" | "dashed" | "dotted"
			borderColor: string
		}
		buttonHoverColor: string
		isCurrentPlan: boolean
		buttonUrl: string
		buttonRadius: string
		buttonHeight: number
	}
	addonsSettings: {
		toggleAddons: boolean
		showTitle: boolean
		showPrice: boolean
		dropdown: {
			backgroundColor: string
			textColor: string
			borderColor: string
			borderWidth: number
			borderRadius: number
			chevronColor: string
		}
	}
	addons: AddonGroup[]
	icon: {
		iconColor: string
		iconStyle: "checkmark" | "circle-check" | "square-check" | "star" | "check"
	}
	textStyles: {
		titleFont: CSSProperties
		titleColor: string
		subtextFont: CSSProperties
		subtextColor: string
		priceFont: CSSProperties
		priceColor: string
		benefitFont: CSSProperties
		benefitColor: string
		pretextFont: CSSProperties
		pretextColor: string
		discountStrikeoutFont: CSSProperties
		discountStrikeoutColor: string
	}
	sectionOrder: string[]
	planTag: {
		showTag: boolean
		tagText: string
		tagBackgroundColor: string
		tagTextColor: string
		tagFont: CSSProperties
		tagPosition: "top-left" | "top-right" | "top-center"
		tagVerticalPosition: "top" | "bottom"
		tagBorderRadius: string
		tagOffsetTop: number
	}
	onUpgrade?: (data: {
		planName: string
		billingCycle: "monthly" | "annual"
		basePrice: number
		totalPrice: number
		currency: string
		currencySymbol: string
		addons: Array<{ group: string; name: string; price: number }>
		discount?: { type: "percentage" | "amount"; value: number; savedAmount: number }
	}) => void
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 612
 */
export default function GeoPricingCard(props: PricingCardProps) {
	const {
		addonsSettings,
		addons,
		settings,
		pricing = {
			isCustomPricing: false,
			customPricingText: "Contact us",
			currency: "usd",
			monthlyPrice: 29,
			annualPrice: 290,
			showDiscount: false,
			discountType: "percentage",
			discountPercentage: 0,
			discountAmount: 0,
		},
		regionalPricing,
		text,
		textStyles,
		button,
		icon,
		sectionOrder,
		planTag,
	} = props

	const { toggleAddons, showTitle, showPrice, dropdown } = addonsSettings

	const [isAnnual, setIsAnnual] = useState(false)
	const [selectedAddonIndices, setSelectedAddonIndices] = useState<number[]>([])
	const [userRegion, setUserRegion] = useState<string>("")
	const [isHovered, setIsHovered] = useState(false)

	// Initialize addon indices when toggleAddons is enabled or addons structure changes
	useEffect(() => {
		if (!toggleAddons) {
			if (selectedAddonIndices.length > 0) {
				startTransition(() => setSelectedAddonIndices([]))
			}
			return
		}

		if (!addons || addons.length === 0) {
			if (selectedAddonIndices.length > 0) {
				startTransition(() => setSelectedAddonIndices([]))
			}
			return
		}

		// Only initialize if we don't have the right number of indices
		if (selectedAddonIndices.length !== addons.length) {
			startTransition(() => {
				setSelectedAddonIndices(addons.map(() => 0))
			})
		}
	}, [toggleAddons, addons?.length])

	// Currency symbol mapping
	const currencySymbols: Record<string, string> = {
		usd: "$",
		eur: "€",
		gbp: "£",
		jpy: "¥",
		cny: "¥",
		inr: "₹",
		aud: "$",
		cad: "$",
		chf: "Fr",
		sek: "kr",
		nzd: "$",
		mxn: "$",
		sgd: "$",
		hkd: "$",
		nok: "kr",
		krw: "₩",
		try: "₺",
		rub: "₽",
		brl: "R$",
		zar: "R",
		ngn: "₦",
		aed: "د.إ",
		ars: "$",
		clp: "$",
		cop: "$",
		czk: "Kč",
		dkk: "kr",
		egp: "£",
		idr: "Rp",
		ils: "₪",
		myr: "RM",
		php: "₱",
		pln: "zł",
		thb: "฿",
		twd: "$",
		vnd: "₫",
	}

	// Country to currency mapping
	const countryToCurrency: Record<string, string> = {
		US: "usd",
		GB: "gbp",
		NG: "ngn",
		EU: "eur",
		DE: "eur",
		FR: "eur",
		IT: "eur",
		ES: "eur",
		NL: "eur",
		BE: "eur",
		AT: "eur",
		PT: "eur",
		IE: "eur",
		FI: "eur",
		GR: "eur",
		JP: "jpy",
		CN: "cny",
		IN: "inr",
		AU: "aud",
		CA: "cad",
		CH: "chf",
		SE: "sek",
		NZ: "nzd",
		MX: "mxn",
		SG: "sgd",
		HK: "hkd",
		NO: "nok",
		KR: "krw",
		TR: "try",
		RU: "rub",
		BR: "brl",
		ZA: "zar",
		AE: "aed",
		AR: "ars",
		CL: "clp",
		CO: "cop",
		CZ: "czk",
		DK: "dkk",
		EG: "egp",
		ID: "idr",
		IL: "ils",
		MY: "myr",
		PH: "php",
		PL: "pln",
		TH: "thb",
		TW: "twd",
		VN: "vnd",
	}

	// Detect user's region based on IP
	useEffect(() => {
		if (regionalPricing?.enableRegionalPricing && typeof window !== "undefined") {
			// Check cache first
			const CACHE_KEY = "geo_pricing_region"
			const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours in milliseconds
			
			const getCachedRegion = () => {
				try {
					const cached = localStorage.getItem(CACHE_KEY)
					if (cached) {
						const { region, timestamp } = JSON.parse(cached)
						const now = Date.now()
						
						// Check if cache is still valid
						if (now - timestamp < CACHE_DURATION) {
							console.log("Using cached region:", region)
							return region
						} else {
							console.log("Cache expired, will fetch new region")
							localStorage.removeItem(CACHE_KEY)
						}
					}
				} catch (error) {
					console.warn("Error reading cache:", error)
					localStorage.removeItem(CACHE_KEY)
				}
				return null
			}
			
			const setCachedRegion = (region: string) => {
				try {
					const cacheData = {
						region,
						timestamp: Date.now()
					}
					localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData))
					console.log("Cached region:", region)
				} catch (error) {
					console.warn("Error setting cache:", error)
				}
			}
			
			// Try to get cached region first
			const cachedRegion = getCachedRegion()
			if (cachedRegion) {
				// Verify cached region still has a regional price
				const hasRegionalPrice = regionalPricing.regionalPrices?.some(
					(rp) => rp?.currency?.toLowerCase() === cachedRegion.toLowerCase()
				)
				
				if (hasRegionalPrice) {
					startTransition(() => setUserRegion(cachedRegion))
					return
				} else {
					console.log("Cached region no longer has regional price, will fetch new region")
					localStorage.removeItem(CACHE_KEY)
				}
			}
			
			// Try multiple geolocation APIs in sequence
			const detectRegion = async () => {
				// Try ipapi.co first
				try {
					const response = await fetch("https://ipapi.co/json/")
					const data = await response.json()
					const countryCode = data.country_code
					const detectedCurrency = countryToCurrency[countryCode] || "usd"
					console.log("ipapi.co - Detected country:", countryCode, "Currency:", detectedCurrency)
					
					// Check if we have a regional price for this currency
					const hasRegionalPrice = regionalPricing.regionalPrices?.some(
						(rp) => rp?.currency?.toLowerCase() === detectedCurrency.toLowerCase()
					)
					
					if (hasRegionalPrice) {
						console.log("Regional price found for:", detectedCurrency)
						setCachedRegion(detectedCurrency)
						startTransition(() => setUserRegion(detectedCurrency))
						return true
					} else {
						console.log("No regional price found for:", detectedCurrency, "- using default pricing")
						setCachedRegion("")
						startTransition(() => setUserRegion(""))
						return true
					}
				} catch (error) {
					console.warn("ipapi.co failed:", error)
				}

				// Try ip-api.com as fallback
				try {
					const response = await fetch("http://ip-api.com/json/")
					const data = await response.json()
					const countryCode = data.countryCode
					const detectedCurrency = countryToCurrency[countryCode] || "usd"
					console.log("ip-api.com - Detected country:", countryCode, "Currency:", detectedCurrency)
					
					// Check if we have a regional price for this currency
					const hasRegionalPrice = regionalPricing.regionalPrices?.some(
						(rp) => rp?.currency?.toLowerCase() === detectedCurrency.toLowerCase()
					)
					
					if (hasRegionalPrice) {
						console.log("Regional price found for:", detectedCurrency)
						setCachedRegion(detectedCurrency)
						startTransition(() => setUserRegion(detectedCurrency))
						return true
					} else {
						console.log("No regional price found for:", detectedCurrency, "- using default pricing")
						setCachedRegion("")
						startTransition(() => setUserRegion(""))
						return true
					}
				} catch (error) {
					console.warn("ip-api.com failed:", error)
				}

				// Try ipify + ipwhois as final fallback
				try {
					const ipResponse = await fetch("https://api.ipify.org?format=json")
					const ipData = await ipResponse.json()
					const ip = ipData.ip
					
					const geoResponse = await fetch(`https://ipwho.is/${ip}`)
					const geoData = await geoResponse.json()
					const countryCode = geoData.country_code
					const detectedCurrency = countryToCurrency[countryCode] || "usd"
					console.log("ipwhois - Detected country:", countryCode, "Currency:", detectedCurrency)
					
					// Check if we have a regional price for this currency
					const hasRegionalPrice = regionalPricing.regionalPrices?.some(
						(rp) => rp?.currency?.toLowerCase() === detectedCurrency.toLowerCase()
					)
					
					if (hasRegionalPrice) {
						console.log("Regional price found for:", detectedCurrency)
						setCachedRegion(detectedCurrency)
						startTransition(() => setUserRegion(detectedCurrency))
						return true
					} else {
						console.log("No regional price found for:", detectedCurrency, "- using default pricing")
						setCachedRegion("")
						startTransition(() => setUserRegion(""))
						return true
					}
				} catch (error) {
					console.warn("ipwhois failed:", error)
				}

				// All APIs failed
				console.error("All geolocation APIs failed - using default pricing")
				setCachedRegion("")
				startTransition(() => setUserRegion(""))
				return false
			}

			detectRegion()
		} else {
			// Reset user region if regional pricing is disabled
			if (userRegion) {
				startTransition(() => setUserRegion(""))
			}
		}
	}, [regionalPricing?.enableRegionalPricing, regionalPricing?.regionalPrices])

	// Get regional price based on user's region
	const getRegionalPrice = useMemo(() => {
		if (regionalPricing?.enableRegionalPricing && userRegion) {
			const regionalPrice = regionalPricing.regionalPrices?.find(
				(rp) => rp?.currency?.toLowerCase() === userRegion.toLowerCase()
			)
			if (regionalPrice) {
				console.log("Using regional price for:", userRegion, regionalPrice)
				return {
					monthlyPrice: regionalPrice.monthlyPrice,
					annualPrice: regionalPrice.annualPrice,
					currency: regionalPrice.currency,
					showDiscount: regionalPrice.showDiscount,
					discountType: regionalPrice.discountType,
					discountPercentage: regionalPrice.discountPercentage,
					discountAmount: regionalPrice.discountAmount,
				}
			}
		}
		console.log("Using default pricing")
		return {
			monthlyPrice: pricing.monthlyPrice,
			annualPrice: pricing.annualPrice,
			currency: pricing.currency,
			showDiscount: pricing.showDiscount,
			discountType: pricing.discountType,
			discountPercentage: pricing.discountPercentage,
			discountAmount: pricing.discountAmount,
		}
	}, [regionalPricing?.enableRegionalPricing, regionalPricing?.regionalPrices, userRegion, pricing])

	// Get the current price based on billing cycle
	const currentPrice = useMemo(() => {
		if (pricing.isCustomPricing) return 0
		return isAnnual ? getRegionalPrice.annualPrice : getRegionalPrice.monthlyPrice
	}, [pricing.isCustomPricing, isAnnual, getRegionalPrice])

	// Format number with comma separators
	const formatPrice = (price: number): string => {
		return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
	}

	// Get the current currency symbol based on regional pricing
	const displayCurrency = useMemo(() => {
		return currencySymbols[getRegionalPrice.currency.toLowerCase()] || "$"
	}, [getRegionalPrice.currency])

	// Determine if addons should be hidden for regional pricing
	const shouldHideAddonsForRegion = useMemo(() => {
		// Hide addons if custom pricing is enabled
		if (pricing.isCustomPricing) {
			return true
		}
		
		if (!regionalPricing?.enableRegionalPricing || !userRegion) {
			return false
		}
		
		const regionalPrice = regionalPricing.regionalPrices?.find(
			(rp) => rp?.currency?.toLowerCase() === userRegion.toLowerCase()
		)
		
		// Show addons if regional addon prices are configured
		if (regionalPrice?.addonPrices && regionalPrice.addonPrices.length > 0) {
			return false
		}
		
		// Hide addons if we're using regional pricing but no addon prices are configured
		return !!regionalPrice
	}, [pricing.isCustomPricing, regionalPricing, userRegion])

	// Get addons for the current region (either regional or default)
	const getAddonsForRegion = useMemo(() => {
		if (!toggleAddons || !addons || addons.length === 0) {
			return []
		}

		// If regional pricing is NOT active, return default addons
		if (!regionalPricing?.enableRegionalPricing || !userRegion) {
			return addons
		}

		// Find the regional price configuration
		const regionalPrice = regionalPricing.regionalPrices?.find(
			(rp) => rp?.currency?.toLowerCase() === userRegion.toLowerCase()
		)
		
		// If no regional price found or no addon prices configured, return default addons
		if (!regionalPrice || !regionalPrice.addonPrices || regionalPrice.addonPrices.length === 0) {
			return addons
		}

		// Create a map of regional addon prices for faster lookup
		// Convert from 1-based to 0-based indexing
		const regionalPriceMap = new Map<string, { monthlyPrice: number; annualPrice: number }>()
		regionalPrice.addonPrices.forEach((ap) => {
			const key = `${ap.groupIndex - 1}-${ap.addonIndex - 1}`
			regionalPriceMap.set(key, {
				monthlyPrice: ap.monthlyPrice,
				annualPrice: ap.annualPrice,
			})
		})

		// Create a new array with regional prices applied
		const regionalAddons = addons.map((group, groupIndex) => {
			const newAddons = group.addons.map((addon, addonIndex) => {
				const key = `${groupIndex}-${addonIndex}`
				const regionalAddonPrice = regionalPriceMap.get(key)
				
				// If regional price exists, use it; otherwise use default
				if (regionalAddonPrice) {
					return {
						name: addon.name,
						monthlyPrice: regionalAddonPrice.monthlyPrice,
						annualPrice: regionalAddonPrice.annualPrice,
					}
				}
				
				return {
					name: addon.name,
					monthlyPrice: addon.monthlyPrice,
					annualPrice: addon.annualPrice,
				}
			})
			
			return {
				title: group.title,
				addons: newAddons,
			}
		})
		
		return regionalAddons
	}, [toggleAddons, addons, regionalPricing?.enableRegionalPricing, regionalPricing?.regionalPrices, userRegion])

	// Calculate total addon price
	const calculateAddonTotal = useMemo(() => {
		if (!toggleAddons || !addons || addons.length === 0 || selectedAddonIndices.length === 0) {
			return 0
		}

		// Don't calculate addons if regional pricing is active and no regional addon prices are configured
		if (regionalPricing?.enableRegionalPricing && userRegion) {
			const regionalPrice = regionalPricing.regionalPrices?.find(
				(rp) => rp?.currency?.toLowerCase() === userRegion.toLowerCase()
			)
			
			// Only calculate addons if regional addon prices are configured
			if (!regionalPrice?.addonPrices || regionalPrice.addonPrices.length === 0) {
				return 0
			}
		}

		const activeAddons = getAddonsForRegion

		let addonTotal = 0
		activeAddons.forEach((group, groupIndex) => {
			if (group && group.addons && group.addons.length > 0) {
				const selectedIndex = selectedAddonIndices[groupIndex]
				if (selectedIndex !== undefined && selectedIndex >= 0 && selectedIndex < group.addons.length) {
					const addon = group.addons[selectedIndex]
					if (addon) {
						const addonPrice = isAnnual ? addon.annualPrice : addon.monthlyPrice
						addonTotal += addonPrice
					}
				}
			}
		})

		return addonTotal
	}, [regionalPricing, userRegion, toggleAddons, addons, selectedAddonIndices, isAnnual, getAddonsForRegion])

	// Calculate total price with discount
	const totalPrice = useMemo(() => {
		const basePrice = currentPrice
		
		// Determine which discount settings to use
		const activeDiscount = regionalPricing?.enableRegionalPricing && userRegion 
			? getRegionalPrice 
			: pricing
		
		// Apply discount to base price if enabled
		let discountedBasePrice = basePrice
		if (activeDiscount.showDiscount) {
			if (activeDiscount.discountType === "percentage" && activeDiscount.discountPercentage > 0) {
				discountedBasePrice = basePrice * (1 - activeDiscount.discountPercentage / 100)
			} else if (activeDiscount.discountType === "amount" && activeDiscount.discountAmount > 0) {
				discountedBasePrice = Math.max(0, basePrice - activeDiscount.discountAmount)
			}
		}
		
		// Add addon prices (addons are not discounted and use base currency)
		const total = discountedBasePrice + calculateAddonTotal
		
		return total
	}, [currentPrice, calculateAddonTotal, regionalPricing, userRegion, getRegionalPrice, pricing])

	// Calculate original total price (without discount)
	const originalTotalPrice = useMemo(() => {
		const basePrice = currentPrice
		return basePrice + calculateAddonTotal
	}, [currentPrice, calculateAddonTotal])

	// Prepare selection data for transmission
	const getSelectionData = () => {
		const basePrice = currentPrice
		const activeCurrency = getRegionalPrice.currency
		
		// Determine which discount settings to use
		const activeDiscount = regionalPricing?.enableRegionalPricing && userRegion 
			? getRegionalPrice 
			: pricing

		// Collect selected addons
		const selectedAddons: Array<{ group: string; name: string; price: number }> = []
		if (toggleAddons && addons && addons.length > 0) {
			addons.forEach((group, groupIndex) => {
				if (group && group.addons && group.addons.length > 0 && selectedAddonIndices[groupIndex] !== undefined) {
					const selectedIndex = selectedAddonIndices[groupIndex]
					const addon = group.addons[selectedIndex]
					if (addon) {
						const addonPrice = isAnnual ? addon.annualPrice : addon.monthlyPrice
						if (addonPrice > 0) {
							selectedAddons.push({
								group: group.title,
								name: addon.name,
								price: addonPrice,
							})
						}
					}
				}
			})
		}

		// Calculate discount info
		let discountInfo: { type: "percentage" | "amount"; value: number; savedAmount: number } | undefined
		if (activeDiscount.showDiscount) {
			if (activeDiscount.discountType === "percentage" && activeDiscount.discountPercentage > 0) {
				discountInfo = {
					type: "percentage",
					value: activeDiscount.discountPercentage,
					savedAmount: basePrice * (activeDiscount.discountPercentage / 100),
				}
			} else if (activeDiscount.discountType === "amount" && activeDiscount.discountAmount > 0) {
				discountInfo = {
					type: "amount",
					value: activeDiscount.discountAmount,
					savedAmount: activeDiscount.discountAmount,
				}
			}
		}

		return {
			planName: text.title,
			billingCycle: isAnnual ? ("annual" as const) : ("monthly" as const),
			basePrice,
			totalPrice,
			currency: activeCurrency,
			currencySymbol: displayCurrency,
			addons: selectedAddons,
			discount: discountInfo,
		}
	}

	// Handle button click
	const handleButtonClick = (e: React.MouseEvent) => {
		if (button.isCurrentPlan) {
			e.preventDefault()
			return
		}

		const selectionData = getSelectionData()

		// Call the event handler if provided
		if (props.onUpgrade) {
			props.onUpgrade(selectionData)
		}

		// If there's a URL, append query parameters
		if (button.buttonUrl) {
			e.preventDefault()
			
			try {
				// Check if the URL is absolute or relative
				let url: URL
				if (button.buttonUrl.startsWith('http://') || button.buttonUrl.startsWith('https://')) {
					url = new URL(button.buttonUrl)
				} else {
					// For relative URLs, use current origin if available
					if (typeof window !== 'undefined') {
						url = new URL(button.buttonUrl, window.location.origin)
					} else {
						// Fallback: just use the URL as-is
						console.warn('Cannot construct absolute URL in server context')
						return
					}
				}
				
				url.searchParams.set("plan", selectionData.planName)
				url.searchParams.set("billing", selectionData.billingCycle)
				url.searchParams.set("price", selectionData.totalPrice.toFixed(2))
				url.searchParams.set("currency", selectionData.currency)
				
				// Add addons as JSON
				if (selectionData.addons.length > 0) {
					url.searchParams.set("addons", JSON.stringify(selectionData.addons))
				}
				
				// Add discount info
				if (selectionData.discount) {
					url.searchParams.set("discount", JSON.stringify(selectionData.discount))
				}

				// Open the URL
				if (typeof window !== 'undefined') {
					window.open(url.toString(), "_blank", "noopener,noreferrer")
				}
			} catch (error) {
				console.error('Error constructing URL:', error)
			}
		}
	}

	const handleToggle = () => {
		startTransition(() => setIsAnnual(!isAnnual))
	}

	const handleAddonChange = (groupIndex: number, e: ChangeEvent<HTMLSelectElement>) => {
		const newIndex = Number(e.target.value)
		startTransition(() => {
			setSelectedAddonIndices(prev => {
				const newIndices = [...prev]
				newIndices[groupIndex] = newIndex
				return newIndices
			})
		})
	}

	const renderSection = (sectionName: string) => {
		switch (sectionName) {
			case "header":
				return (
					<div key="header" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
						<h2
							style={{
								margin: 0,
								color: textStyles.titleColor,
								...textStyles.titleFont,
							}}
						>
							{text.title}
						</h2>
						<p
							style={{
								margin: 0,
								color: textStyles.subtextColor,
								opacity: 0.7,
								...textStyles.subtextFont,
							}}
						>
							{text.subtext}
						</p>
					</div>
				)
			case "price":
				return (
					<div key="price" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
						{pricing.isCustomPricing ? (
							<span
								style={{
									color: textStyles.priceColor,
									...textStyles.priceFont,
								}}
							>
								{pricing.customPricingText}
							</span>
						) : (
							(() => {
								// Determine which discount settings to use
								const activeDiscount = regionalPricing?.enableRegionalPricing && userRegion 
									? getRegionalPrice 
									: pricing
								
								const hasDiscount = activeDiscount.showDiscount && (
									(activeDiscount.discountType === "percentage" && activeDiscount.discountPercentage > 0) || 
									(activeDiscount.discountType === "amount" && activeDiscount.discountAmount > 0)
								)
								
								return hasDiscount ? (
									<>
										<div style={{ display: "flex", alignItems: "center", gap: 12 }}>
											<span
												style={{
													color: textStyles.priceColor,
													...textStyles.priceFont,
												}}
											>
												{displayCurrency}
												{formatPrice(totalPrice)}
											</span>
											<span
												style={{
													color: textStyles.discountStrikeoutColor,
													...textStyles.discountStrikeoutFont,
													textDecoration: "line-through",
													opacity: 0.5,
												}}
											>
												{displayCurrency}
												{formatPrice(originalTotalPrice)}
											</span>
										</div>
										<span
											style={{
												color: textStyles.subtextColor,
												...textStyles.subtextFont,
												opacity: 0.6,
											}}
										>
											{totalPrice === 0 ? "Free Forever" : isAnnual ? "billed yearly" : "billed monthly"}
										</span>
									</>
								) : (
									<>
										<span
											style={{
												color: textStyles.priceColor,
												...textStyles.priceFont,
											}}
										>
											{displayCurrency}
											{formatPrice(totalPrice)}
										</span>
										<span
											style={{
												color: textStyles.subtextColor,
												...textStyles.subtextFont,
												opacity: 0.6,
											}}
										>
											{totalPrice === 0 ? "Free Forever" : isAnnual ? "billed yearly" : "billed monthly"}
										</span>
									</>
								)
							})()
						)}
					</div>
				)
			case "toggle":
				if (!settings.showToggle || pricing.isCustomPricing) return null
				return (
					<div key="toggle" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
						<div style={{ display: "flex", alignItems: "center", gap: 12 }}>
							<button
								onClick={handleToggle}
								style={{
									width: 48,
									height: 24,
									borderRadius: 12,
									border: "none",
									backgroundColor: isAnnual ? settings.toggleColor : "#CCCCCC",
									position: "relative",
									cursor: "pointer",
									transition: "background-color 0.2s",
									padding: 0,
								}}
								aria-label={`Switch to ${isAnnual ? "monthly" : "annual"} billing`}
							>
								<div
									style={{
										width: 20,
										height: 20,
										borderRadius: "50%",
										backgroundColor: "#FFFFFF",
										position: "absolute",
										top: 2,
										left: isAnnual ? 26 : 2,
										transition: "left 0.2s",
									}}
								/>
							</button>
							<span
								style={{
									color: textStyles.benefitColor,
									...textStyles.benefitFont,
									opacity: isAnnual ? 1 : 0.5,
								}}
							>
								Annual
							</span>
						</div>
					</div>
				)
			case "separator":
				return (
					<div
						key="separator"
						style={{
							width: "100%",
							height: 1,
							backgroundColor: settings.separatorColor,
						}}
					/>
				)
			case "separator2":
				return (
					<div
						key="separator2"
						style={{
							width: "100%",
							height: 1,
							backgroundColor: settings.separatorColor,
						}}
					/>
				)
			case "benefits":
				return (
					<div key="benefits" style={{ display: "flex", flexDirection: "column", gap: settings.benefitsGap }}>
						{text.showBenefitsSubheading && (
							<span
								style={{
									color: textStyles.pretextColor,
									...textStyles.pretextFont,
									marginBottom: 4,
								}}
							>
								{text.benefitsSubheading}
							</span>
						)}
						{text.benefits.map((benefit, index) => {
							return (
								<div key={index} style={{ display: "flex", alignItems: "center", gap: 12 }}>
									{benefit.useCustomIcon && benefit.icon ? (
										<div 
											dangerouslySetInnerHTML={{ __html: benefit.icon }}
											style={{ 
												width: benefit.iconSize, 
												height: benefit.iconSize, 
												display: "flex", 
												alignItems: "center", 
												justifyContent: "center",
												flexShrink: 0,
												color: benefit.iconColor,
											}}
										/>
									) : (
										<>
											{icon.iconStyle === "check" && (
												<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
													<path
														d="M4 10L8 14L16 6"
														stroke={icon.iconColor}
														strokeWidth="2"
														strokeLinecap="round"
														strokeLinejoin="round"
													/>
												</svg>
											)}
											{icon.iconStyle === "checkmark" && (
												<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
													<circle cx="10" cy="10" r="10" fill={icon.iconColor} />
													<path
														d="M6 10L9 13L14 7"
														stroke="#FFFFFF"
														strokeWidth="2"
														strokeLinecap="round"
														strokeLinejoin="round"
													/>
												</svg>
											)}
											{icon.iconStyle === "circle-check" && (
												<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
													<circle cx="10" cy="10" r="9" stroke={icon.iconColor} strokeWidth="2" fill="none" />
													<path
														d="M6 10L9 13L14 7"
														stroke={icon.iconColor}
														strokeWidth="2"
														strokeLinecap="round"
														strokeLinejoin="round"
													/>
												</svg>
											)}
											{icon.iconStyle === "square-check" && (
												<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
													<rect x="1" y="1" width="18" height="18" rx="4" fill={icon.iconColor} />
													<path
														d="M6 10L9 13L14 7"
														stroke="#FFFFFF"
														strokeWidth="2"
														strokeLinecap="round"
														strokeLinejoin="round"
													/>
												</svg>
											)}
											{icon.iconStyle === "star" && (
												<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
													<path
														d="M10 2L12.245 7.905L18 8.645L14 12.855L15.09 18.5L10 15.905L4.91 18.5L6 12.855L2 8.645L7.755 7.905L10 2Z"
														fill={icon.iconColor}
													/>
												</svg>
											)}
										</>
									)}
									<span
										style={{
											color: textStyles.benefitColor,
											...textStyles.benefitFont,
										}}
									>
										{benefit.text}
									</span>
								</div>
							)
						})}
					</div>
				)
			case "addons":
				// Hide addons if regional pricing is enabled and active
				if (shouldHideAddonsForRegion) return null
				if (!toggleAddons || !addons || addons.length === 0) return null
				
				const activeAddons = getAddonsForRegion
				
				return (
					<div key="addons" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
						{activeAddons.map((group, groupIndex) => {
							if (!group || !group.addons || group.addons.length === 0) return null
							
							const selectedIndex = selectedAddonIndices[groupIndex] ?? 0
							
							return (
								<div key={groupIndex} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
									{showTitle && (
										<label
											htmlFor={`addon-select-${groupIndex}`}
											style={{
												color: textStyles.benefitColor,
												...textStyles.benefitFont,
											}}
										>
											{group.title}
										</label>
									)}
									<select
										id={`addon-select-${groupIndex}`}
										value={selectedIndex}
										onChange={(e) => handleAddonChange(groupIndex, e)}
										style={{
											padding: "12px 16px",
											paddingRight: "40px",
											borderRadius: dropdown?.borderRadius || 8,
											border: `${dropdown?.borderWidth || 1}px solid ${dropdown?.borderColor || "#CCCCCC"}`,
											backgroundColor: dropdown?.backgroundColor || "#FFFFFF",
											color: dropdown?.textColor || "#000000",
											...textStyles.benefitFont,
											cursor: "pointer",
											appearance: "none",
											backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L6 6L11 1' stroke='${encodeURIComponent(dropdown?.chevronColor || "#000000")}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
											backgroundRepeat: "no-repeat",
											backgroundPosition: "right 16px center",
										}}
									>
										{group.addons.map((addon, addonIndex) => {
											const addonPrice = isAnnual ? addon.annualPrice : addon.monthlyPrice
											const addonCurrency = displayCurrency
											
										 return (
												<option key={addonIndex} value={addonIndex}>
													{addon.name}
													{showPrice && addonPrice > 0 && ` (+${addonCurrency}${formatPrice(addonPrice)}/${isAnnual ? "year" : "month"})`}
												</option>
											)
										})}
									</select>
								</div>
							)
						})}
					</div>
				)
			case "addons2":
				return null
			case "button":
				const isFixedButton = button.buttonDisplayMode === "hover"
				const shouldShowButton = button.buttonDisplayMode === "always" || (button.buttonDisplayMode === "hover")
				
				if (!shouldShowButton) return null
				
				const buttonBaseStyles = {
					...(isFixedButton ? {
						position: "absolute" as const,
						bottom: 0,
						left: 0,
						right: 0,
						width: "100%",
						transform: isHovered ? "translateY(0)" : "translateY(100%)",
						transition: "transform 0.3s ease-in-out, background-color 0.2s, border-color 0.2s",
					} : {}),
					padding: `${button.buttonDisplayMode === "always" ? 18 : button.buttonHeight / 2}px ${isFixedButton ? 0 : 24}px`,
					borderRadius: button.buttonDisplayMode === "always" ? "16px" : button.buttonRadius,
					border: button.buttonStyle === "outline" 
						? `${button.buttonBorder.borderWidth}px ${button.buttonBorder.borderStyle} ${button.isCurrentPlan ? "#CCCCCC" : button.buttonBorder.borderColor}`
						: "none",
					backgroundColor: button.isCurrentPlan 
						? (button.buttonStyle === "solid" ? "#E0E0E0" : "transparent")
						: button.buttonStyle === "solid" 
							? button.buttonColor 
							: "transparent",
					color: button.isCurrentPlan 
						? (button.buttonStyle === "solid" ? "#999999" : "#CCCCCC")
						: button.buttonStyle === "solid" 
							? button.buttonTextColor 
							: button.buttonColor,
					cursor: button.isCurrentPlan ? "not-allowed" : "pointer",
					...(!isFixedButton && { transition: "background-color 0.2s, border-color 0.2s" }),
					textDecoration: "none",
					display: "block",
					textAlign: "center" as const,
					...button.buttonFont,
				}
				
				return button.buttonUrl ? (
					<a
						key="button"
						href={button.buttonUrl}
						target="_blank"
						rel="noopener noreferrer"
						style={{
							...buttonBaseStyles,
							pointerEvents: button.isCurrentPlan ? "none" : "auto",
						}}
						onMouseEnter={(e) => {
							if (!button.isCurrentPlan) {
								if (button.buttonStyle === "solid") {
									e.currentTarget.style.backgroundColor = button.buttonHoverColor
								} else {
									e.currentTarget.style.borderColor = button.buttonHoverColor
									e.currentTarget.style.color = button.buttonHoverColor
								}
							}
						}}
						onMouseLeave={(e) => {
							if (!button.isCurrentPlan) {
								if (button.buttonStyle === "solid") {
									e.currentTarget.style.backgroundColor = button.buttonColor
								} else {
									e.currentTarget.style.borderColor = button.buttonBorder.borderColor
									e.currentTarget.style.color = button.buttonColor
								}
							}
						}}
						onClick={handleButtonClick}
					>
						{button.buttonText}
					</a>
				) : (
					<button
						key="button"
						disabled={button.isCurrentPlan}
						style={buttonBaseStyles}
						onMouseEnter={(e) => {
							if (!button.isCurrentPlan) {
								if (button.buttonStyle === "solid") {
									e.currentTarget.style.backgroundColor = button.buttonHoverColor
								} else {
									e.currentTarget.style.borderColor = button.buttonHoverColor
									e.currentTarget.style.color = button.buttonHoverColor
								}
							}
						}}
						onMouseLeave={(e) => {
							if (!button.isCurrentPlan) {
								if (button.buttonStyle === "solid") {
									e.currentTarget.style.backgroundColor = button.buttonColor
								} else {
									e.currentTarget.style.borderColor = button.buttonBorder.borderColor
									e.currentTarget.style.color = button.buttonColor
								}
							}
						}}
						onClick={handleButtonClick}
					>
						{button.buttonText}
					</button>
				)
			default:
				return null
		}
	}

	return (
		<div
			style={{
				...props.style,
				position: "relative",
				backgroundColor: settings.backgroundType === "solid" ? settings.backgroundColor : "transparent",
				background: settings.backgroundType === "gradient" 
					? `linear-gradient(${settings.gradientDirection}, ${settings.gradientFrom}, ${settings.gradientTo})`
					: settings.backgroundColor,
				color: textStyles.benefitColor,
				borderRadius: settings.borderRadius,
				padding: settings.padding,
				display: "flex",
				flexDirection: "column",
				gap: settings.gap,
				boxShadow: settings.showShadow ? settings.boxShadow : "none",
				// Apply border from Border control
				...(settings.border && {
					borderWidth: settings.border.borderWidth || 0,
					borderStyle: settings.border.borderStyle || "solid",
					borderColor: settings.border.borderColor || "transparent",
					// Apply individual border widths if specified
					...(settings.border.borderTopWidth !== undefined && { borderTopWidth: settings.border.borderTopWidth }),
					...(settings.border.borderLeftWidth !== undefined && { borderLeftWidth: settings.border.borderLeftWidth }),
					...(settings.border.borderRightWidth !== undefined && { borderRightWidth: settings.border.borderRightWidth }),
					...(settings.border.borderBottomWidth !== undefined && { borderBottomWidth: settings.border.borderBottomWidth }),
				}),
				zIndex: 0,
				overflow: button.buttonDisplayMode === "hover" ? "hidden" : "visible",
			}}
			onMouseEnter={() => startTransition(() => setIsHovered(true))}
			onMouseLeave={() => startTransition(() => setIsHovered(false))}
		>
			{planTag.showTag && (
				<div
					style={{
						position: "absolute",
						top: planTag.tagVerticalPosition === "top" ? -planTag.tagOffsetTop : "auto",
						bottom: planTag.tagVerticalPosition === "bottom" ? -planTag.tagOffsetTop : "auto",
						left: planTag.tagPosition === "top-left" ? 0 : planTag.tagPosition === "top-center" ? 0 : "auto",
						right: planTag.tagPosition === "top-right" ? 0 : planTag.tagPosition === "top-center" ? 0 : "auto",
						width: planTag.tagPosition === "top-center" ? "100%" : "auto",
						backgroundColor: planTag.tagBackgroundColor,
						color: planTag.tagTextColor,
						padding: "8px 16px",
						borderRadius: planTag.tagBorderRadius,
						textAlign: "center",
						zIndex: 1,
						...planTag.tagFont,
					}}
				>
					{planTag.tagText}
				</div>
			)}
			{sectionOrder.map((section) => renderSection(section))}
		</div>
	)
}

addPropertyControls(GeoPricingCard, {
	text: {
		type: ControlType.Object,
		title: "Text",
		description: "Configure title, subtext, and benefits.",
		controls: {
			title: {
				type: ControlType.String,
				title: "Title",
				defaultValue: "Professional",
			},
			subtext: {
				type: ControlType.String,
				title: "Subtext",
				defaultValue: "Perfect for growing teams",
			},
			showBenefitsSubheading: {
				type: ControlType.Boolean,
				title: "Pre-benefit",
				defaultValue: false,
				enabledTitle: "Show",
				disabledTitle: "Hide",
			},
			benefitsSubheading: {
				type: ControlType.String,
				title: "Pre-text",
				defaultValue: "What's included",
			},
			benefits: {
				type: ControlType.Array,
				title: "Benefits",
				control: {
					type: ControlType.Object,
					controls: {
						text: {
							type: ControlType.String,
							defaultValue: "Feature",
						},
						useCustomIcon: {
							type: ControlType.Boolean,
							title: "Icon Mode",
							defaultValue: false,
							enabledTitle: "Custom",
							disabledTitle: "General",
						},
						icon: {
							type: ControlType.String,
							title: "SVG Code",
							displayTextArea: true,
							placeholder: "Paste SVG code here...",
							hidden: ({ useCustomIcon }) => !useCustomIcon,
						},
						iconSize: {
							type: ControlType.Number,
							title: "Icon Size",
							defaultValue: 20,
							min: 10,
							max: 50,
							step: 1,
							unit: "px",
							hidden: ({ useCustomIcon }) => !useCustomIcon,
						},
						iconColor: {
							type: ControlType.Color,
							title: "Icon Color",
							defaultValue: "#FFFFFF",
							hidden: ({ useCustomIcon }) => !useCustomIcon,
						},
					},
				},
				defaultValue: [
					{ text: "Unlimited projects", useCustomIcon: false, icon: "", iconSize: 20, iconColor: "#FFFFFF" },
					{ text: "Advanced analytics", useCustomIcon: false, icon: "", iconSize: 20, iconColor: "#FFFFFF" },
					{ text: "Priority support", useCustomIcon: false, icon: "", iconSize: 20, iconColor: "#FFFFFF" },
					{ text: "Custom integrations", useCustomIcon: false, icon: "", iconSize: 20, iconColor: "#FFFFFF" },
				],
			},
		},
		defaultValue: {
			title: "Professional",
			subtext: "Perfect for growing teams",
			showBenefitsSubheading: false,
			benefitsSubheading: "What's included",
			benefits: [
				{ text: "Unlimited projects", useCustomIcon: false, icon: "", iconSize: 20, iconColor: "#FFFFFF" },
				{ text: "Advanced analytics", useCustomIcon: false, icon: "", iconSize: 20, iconColor: "#FFFFFF" },
				{ text: "Priority support", useCustomIcon: false, icon: "", iconSize: 20, iconColor: "#FFFFFF" },
				{ text: "Custom integrations", useCustomIcon: false, icon: "", iconSize: 20, iconColor: "#FFFFFF" },
			],
		},
	},
	icon: {
		type: ControlType.Object,
		title: "Icon",
		description: "Customize benefit list icons.",
		controls: {
			iconColor: {
				type: ControlType.Color,
				title: "Icon Color",
				defaultValue: "#FFFFFF",
			},
			iconStyle: {
				type: ControlType.Enum,
				title: "Icon Style",
				options: ["checkmark", "circle-check", "square-check", "star", "check"],
				optionTitles: ["Checkmark", "Circle Check", "Square Check", "Star", "Check"],
				defaultValue: "check",
			},
		},
		defaultValue: {
			iconColor: "#FFFFFF",
			iconStyle: "check",
		},
	},
	pricing: {
		type: ControlType.Object,
		title: "Pricing",
		description: "Set currency, prices, and discounts.",
		controls: {
			isCustomPricing: {
				type: ControlType.Boolean,
				title: "Custom Pricing",
				description: "Enable for Enterprise/Custom pricing (hides price and addons)",
				defaultValue: false,
				enabledTitle: "Custom",
				disabledTitle: "Standard",
			},
			customPricingText: {
				type: ControlType.String,
				title: "Custom Text",
				description: "Text to display instead of price (e.g., 'Contact us', 'Custom')",
				defaultValue: "Contact us",
				hidden: ({ isCustomPricing }) => !isCustomPricing,
			},
			currency: {
				type: ControlType.Enum,
				title: "Currency",
				options: ["usd", "eur", "gbp", "jpy", "cny", "inr", "aud", "cad", "chf", "sek", "nzd", "mxn", "sgd", "hkd", "nok", "krw", "try", "rub", "brl", "zar", "ngn", "aed", "ars", "clp", "cop", "czk", "dkk", "egp", "idr", "ils", "myr", "php", "pln", "thb", "twd", "vnd"],
				optionTitles: ["USD ($)", "EUR (€)", "GBP (£)", "JPY (¥)", "CNY (¥)", "INR (₹)", "AUD ($)", "CAD ($)", "CHF (Fr)", "SEK (kr)", "NZD ($)", "MXN ($)", "SGD ($)", "HKD ($)", "NOK (kr)", "KRW (₩)", "TRY (₺)", "RUB (₽)", "BRL (R$)", "ZAR (R)", "NGN (₦)", "AED (د.إ)", "ARS ($)", "CLP ($)", "COP ($)", "CZK (Kč)", "DKK (kr)", "EGP (£)", "IDR (Rp)", "ILS (₪)", "MYR (RM)", "PHP (₱)", "PLN (zł)", "THB (฿)", "TWD ($)", "VND (₫)"],
				defaultValue: "usd",
				hidden: ({ isCustomPricing }) => isCustomPricing,
			},
			monthlyPrice: {
				type: ControlType.Number,
				title: "M/Price",
				defaultValue: 29,
				min: 0,
				step: 0.01,
				hidden: ({ isCustomPricing }) => isCustomPricing,
			},
			annualPrice: {
				type: ControlType.Number,
				title: "A/Price",
				defaultValue: 290,
				min: 0,
				step: 0.01,
				hidden: ({ isCustomPricing }) => isCustomPricing,
			},
			showDiscount: {
				type: ControlType.Boolean,
				title: "Discount",
				defaultValue: false,
				enabledTitle: "Show",
				disabledTitle: "Hide",
				hidden: ({ isCustomPricing }) => isCustomPricing,
			},
			discountType: {
				type: ControlType.Enum,
				title: "Type",
				options: ["percentage", "amount"],
				optionTitles: ["Percentage", "Amount"],
				defaultValue: "percentage",
				displaySegmentedControl: true,
				hidden: ({ showDiscount, isCustomPricing }) => isCustomPricing || !showDiscount,
			},
			discountPercentage: {
				type: ControlType.Number,
				title: "Discount %",
				defaultValue: 20,
				min: 0,
				max: 100,
				step: 0.1,
				unit: "%",
				hidden: ({ showDiscount, discountType, isCustomPricing }) => isCustomPricing || !showDiscount || discountType !== "percentage",
			},
			discountAmount: {
				type: ControlType.Number,
				title: "Discount Amount",
				defaultValue: 5,
				min: 0,
				step: 0.01,
				hidden: ({ showDiscount, discountType, isCustomPricing }) => isCustomPricing || !showDiscount || discountType !== "amount",
			},
		},
		defaultValue: {
			isCustomPricing: false,
			customPricingText: "Contact us",
			currency: "usd",
			monthlyPrice: 29,
			annualPrice: 290,
			showDiscount: false,
			discountType: "percentage",
			discountPercentage: 20,
			discountAmount: 5,
		},
	},
	regionalPricing: {
		type: ControlType.Object,
		title: "Regional Pricing",
		description: "Configure region-specific pricing.",
		controls: {
			enableRegionalPricing: {
				type: ControlType.Boolean,
				title: "Enable",
				defaultValue: false,
				enabledTitle: "On",
				disabledTitle: "Off",
			},
			regionalPrices: {
				type: ControlType.Array,
				title: "Regions",
				control: {
					type: ControlType.Object,
					controls: {
						currency: {
							type: ControlType.Enum,
							title: "Currency",
							options: ["usd", "eur", "gbp", "jpy", "cny", "inr", "aud", "cad", "chf", "sek", "nzd", "mxn", "sgd", "hkd", "nok", "krw", "try", "rub", "brl", "zar", "ngn", "aed", "ars", "clp", "cop", "czk", "dkk", "egp", "idr", "ils", "myr", "php", "pln", "thb", "twd", "vnd"],
							optionTitles: ["USD ($) - United States", "EUR (€) - Europe", "GBP (£) - United Kingdom", "JPY (¥) - Japan", "CNY (¥) - China", "INR (₹) - India", "AUD ($) - Australia", "CAD ($) - Canada", "CHF (Fr) - Switzerland", "SEK (kr) - Sweden", "NZD ($)", "MXN ($)", "SGD ($)", "HKD ($)", "NOK (kr)", "KRW (₩)", "TRY (₺)", "RUB (₽)", "BRL (R$)", "ZAR (R)", "NGN (₦)", "AED (د.إ)", "ARS ($)", "CLP ($)", "COP ($)", "CZK (Kč)", "DKK (kr)", "EGP (£)", "IDR (Rp)", "ILS (₪)", "MYR (RM)", "PHP (₱)", "PLN (zł)", "THB (฿)", "TWD ($)", "VND (₫)"],
							defaultValue: "usd",
						},
						monthlyPrice: {
							type: ControlType.Number,
							title: "M/Price",
							defaultValue: 29,
							min: 0,
							step: 0.01,
						},
						annualPrice: {
							type: ControlType.Number,
							title: "A/Price",
							defaultValue: 290,
							min: 0,
							step: 0.01,
						},
						showDiscount: {
							type: ControlType.Boolean,
							title: "Discount",
							defaultValue: false,
							enabledTitle: "Show",
							disabledTitle: "Hide",
						},
						discountType: {
							type: ControlType.Enum,
							title: "Type",
							options: ["percentage", "amount"],
							optionTitles: ["Percentage", "Amount"],
							defaultValue: "percentage",
							displaySegmentedControl: true,
							hidden: ({ showDiscount }) => !showDiscount,
						},
						discountPercentage: {
							type: ControlType.Number,
							title: "Discount %",
							defaultValue: 20,
							min: 0,
							max: 100,
							step: 0.1,
							unit: "%",
							hidden: ({ showDiscount, discountType }) => !showDiscount || discountType !== "percentage",
						},
						discountAmount: {
							type: ControlType.Number,
							title: "Discount Amount",
							defaultValue: 5,
							min: 0,
							step: 0.01,
							hidden: ({ showDiscount, discountType }) => !showDiscount || discountType !== "amount",
						},
						addonPrices: {
							type: ControlType.Array,
							title: "Addon Prices",
							control: {
								type: ControlType.Object,
								controls: {
									groupIndex: {
										type: ControlType.Number,
										title: "Group Index",
										description: "Position of addon group (1 = first group, 2 = second group, etc.)",
										defaultValue: 1,
										min: 1,
										step: 1,
									},
									addonIndex: {
										type: ControlType.Number,
										title: "Addon Index",
										description: "Position of addon within group (1 = first item, 2 = second item, etc.)",
										defaultValue: 1,
										min: 1,
										step: 1,
									},
									monthlyPrice: {
										type: ControlType.Number,
										title: "M/Price",
										defaultValue: 0,
										min: 0,
										step: 0.01,
									},
									annualPrice: {
										type: ControlType.Number,
										title: "A/Price",
										defaultValue: 0,
										min: 0,
										step: 0.01,
									},
								},
							},
							defaultValue: [],
						},
					},
				},
				defaultValue: [
					{ 
						currency: "usd", 
						monthlyPrice: 29, 
						annualPrice: 290, 
						showDiscount: false, 
						discountType: "percentage", 
						discountPercentage: 20, 
						discountAmount: 5,
						addonPrices: [],
					},
					{ 
						currency: "gbp", 
						monthlyPrice: 25, 
						annualPrice: 250, 
						showDiscount: false, 
						discountType: "percentage", 
						discountPercentage: 20, 
						discountAmount: 5,
						addonPrices: [],
					},
					{ 
						currency: "ngn", 
						monthlyPrice: 15000, 
						annualPrice: 150000, 
						showDiscount: false, 
						discountType: "percentage", 
						discountPercentage: 20, 
						discountAmount: 5,
						addonPrices: [],
					},
				],
			},
		},
		defaultValue: {
			enableRegionalPricing: false,
			regionalPrices: [
				{ 
					currency: "usd", 
					monthlyPrice: 29, 
					annualPrice: 290, 
					showDiscount: false, 
					discountType: "percentage", 
					discountPercentage: 20, 
					discountAmount: 5,
					addonPrices: [],
				},
				{ 
					currency: "gbp", 
					monthlyPrice: 25, 
					annualPrice: 250, 
					showDiscount: false, 
					discountType: "percentage", 
					discountPercentage: 20, 
					discountAmount: 5,
					addonPrices: [],
				},
				{ 
					currency: "ngn", 
					monthlyPrice: 15000, 
					annualPrice: 150000, 
					showDiscount: false, 
					discountType: "percentage", 
					discountPercentage: 20, 
					discountAmount: 5,
					addonPrices: [],
				},
			],
		},
	},
	addonsSettings: {
		type: ControlType.Object,
		title: "Addons Settings",
		description: "Configure addons appearance.",
		controls: {
			toggleAddons: {
				type: ControlType.Boolean,
				title: "Enable",
				defaultValue: false,
				enabledTitle: "On",
				disabledTitle: "Off",
			},
			showTitle: {
				type: ControlType.Boolean,
				title: "Show Title",
				defaultValue: true,
				enabledTitle: "Show",
				disabledTitle: "Hide",
			},
			showPrice: {
				type: ControlType.Boolean,
				title: "Show Price",
				defaultValue: true,
				enabledTitle: "Show",
				disabledTitle: "Hide",
			},
			dropdown: {
				type: ControlType.Object,
				title: "Dropdown",
				controls: {
					backgroundColor: {
						type: ControlType.Color,
						title: "Background",
						defaultValue: "#3B4054",
					},
					textColor: {
						type: ControlType.Color,
						title: "Text",
						defaultValue: "#FFFFFF",
					},
					borderColor: {
						type: ControlType.Color,
						title: "Border",
						defaultValue: "#333333",
					},
					borderWidth: {
						type: ControlType.Number,
						title: "Width",
						defaultValue: 1,
						min: 0,
						max: 10,
						step: 1,
					},
					borderRadius: {
						type: ControlType.Number,
						title: "Radius",
						defaultValue: 8,
						min: 0,
						max: 50,
						step: 1,
					},
					chevronColor: {
						type: ControlType.Color,
						title: "Chevron",
						defaultValue: "#FFFFFF",
					},
				},
			},
		},
	},
	addons: {
		type: ControlType.Array,
		title: "Addons",
		description: "Manage addon groups and items.",
		control: {
			type: ControlType.Object,
			controls: {
				title: {
					type: ControlType.String,
					title: "Group Title",
					defaultValue: "Users",
				},
				addons: {
					type: ControlType.Array,
					title: "Items",
					control: {
						type: ControlType.Object,
						controls: {
							name: {
								type: ControlType.String,
								title: "Name",
								defaultValue: "Add-on",
							},
							monthlyPrice: {
								type: ControlType.Number,
								title: "M/Price",
								defaultValue: 0,
								min: 0,
								step: 0.01,
							},
							annualPrice: {
								type: ControlType.Number,
								title: "A/Price",
								defaultValue: 0,
								min: 0,
								step: 0.01,
							},
						},
					},
					defaultValue: [],
				},
			},
		},
		defaultValue: [],
	},
	button: {
		type: ControlType.Object,
		title: "Button",
		description: "Customize button text, style, and link.",
		controls: {
			buttonText: {
				type: ControlType.String,
				title: "Text",
				defaultValue: "Upgrade",
			},
			buttonDisplayMode: {
				type: ControlType.Enum,
				title: "Display",
				options: ["hover", "always"],
				optionTitles: ["Hover", "Always"],
				defaultValue: "hover",
			},
			buttonColor: {
				type: ControlType.Color,
				title: "Color",
				defaultValue: "#00D9FF",
			},
			buttonTextColor: {
				type: ControlType.Color,
				title: "Text Color",
				defaultValue: "#000000",
			},
			buttonFont: {
				type: ControlType.Font,
				title: "Font",
				controls: "extended",
				defaultFontType: "sans-serif",
				defaultValue: {
					variant: "Semibold",
					fontSize: "16px",
					letterSpacing: "-0.01em",
					lineHeight: "1em",
				},
			},
			buttonStyle: {
				type: ControlType.Enum,
				title: "Style",
				options: ["solid", "outline"],
				optionTitles: ["Solid", "Outline"],
				defaultValue: "solid",
			},
			buttonBorder: {
				type: ControlType.Object,
				title: "Border",
				controls: {
					borderWidth: {
						type: ControlType.Number,
						title: "Width",
						defaultValue: 2,
						min: 0,
						max: 10,
						step: 1,
					},
					borderStyle: {
						type: ControlType.Enum,
						title: "Style",
						options: ["solid", "dashed", "dotted"],
						optionTitles: ["Solid", "Dashed", "Dotted"],
						defaultValue: "solid",
					},
					borderColor: {
						type: ControlType.Color,
						title: "Color",
						defaultValue: "#FFFFFF",
					},
				},
			},
			buttonHoverColor: {
				type: ControlType.Color,
				title: "Hover Color",
				defaultValue: "#009EBA",
			},
			isCurrentPlan: {
				type: ControlType.Boolean,
				title: "Current Plan",
				defaultValue: false,
				enabledTitle: "Yes",
				disabledTitle: "No",
			},
			buttonUrl: {
				type: ControlType.String,
				title: "URL",
				defaultValue: "",
				placeholder: "https://example.com",
			},
			buttonRadius: {
				type: ControlType.BorderRadius,
				title: "Radius",
				defaultValue: "0px 0px 16px 16px",
			},
			buttonHeight: {
				type: ControlType.Number,
				title: "Height",
				defaultValue: 48,
				min: 20,
				max: 100,
				step: 1,
			},
		},
	},
	textStyles: {
		type: ControlType.Object,
		title: "Text Styles",
		description: "Adjust typography and colors.",
		controls: {
			titleFont: {
				type: ControlType.Font,
				title: "Title Font",
				controls: "extended",
				defaultFontType: "sans-serif",
				defaultValue: {
					fontSize: "32px",
					variant: "Semibold",
					letterSpacing: "-0.03em",
					lineHeight: "1em",
				},
			},
			titleColor: {
				type: ControlType.Color,
				title: "Title Color",
				defaultValue: "#FFFFFF",
			},
			subtextFont: {
				type: ControlType.Font,
				title: "Subtext Font",
				controls: "extended",
				defaultFontType: "sans-serif",
				defaultValue: {
					fontSize: "15px",
					variant: "Medium",
					letterSpacing: "-0.01em",
					lineHeight: "1.3em",
				},
			},
			subtextColor: {
				type: ControlType.Color,
				title: "Subtext Color",
				defaultValue: "#CCCCCC",
			},
			priceFont: {
				type: ControlType.Font,
				title: "Price Font",
				controls: "extended",
				defaultFontType: "sans-serif",
				defaultValue: {
					fontSize: "40px",
					variant: "Bold",
					letterSpacing: "-0.04em",
					lineHeight: "1em",
				},
			},
			priceColor: {
				type: ControlType.Color,
				title: "Price Color",
				defaultValue: "#FFFFFF",
			},
			benefitFont: {
				type: ControlType.Font,
				title: "Benefit Font",
				controls: "extended",
				defaultFontType: "sans-serif",
				defaultValue: {
					fontSize: "15px",
					variant: "Medium",
					letterSpacing: "-0.01em",
					lineHeight: "1.3em",
				},
			},
			benefitColor: {
				type: ControlType.Color,
				title: "Benefit Color",
				defaultValue: "#FFFFFF",
			},
			pretextFont: {
				type: ControlType.Font,
				title: "Pre-text Font",
				controls: "extended",
				defaultFontType: "sans-serif",
				defaultValue: {
					fontSize: "16px",
					variant: "Semibold",
					letterSpacing: "-0.01em",
					lineHeight: "1.3em",
				},
			},
			pretextColor: {
				type: ControlType.Color,
				title: "Pre-text Color",
				defaultValue: "#FFFFFF",
			},
			discountStrikeoutFont: {
				type: ControlType.Font,
				title: "Discount Strikeout Font",
				controls: "extended",
				defaultFontType: "sans-serif",
				defaultValue: {
					fontSize: "24px",
					variant: "Bold",
					letterSpacing: "-0.04em",
					lineHeight: "1em",
				},
			},
			discountStrikeoutColor: {
				type: ControlType.Color,
				title: "Discount Strikeout Color",
				defaultValue: "#CCCCCC",
			},
		},
	},
	sectionOrder: {
		type: ControlType.Array,
		title: "Order",
		description: "Reorder card sections.",
		control: {
			type: ControlType.Enum,
			options: ["header", "price", "toggle", "separator", "separator2", "benefits", "addons", "button"],
			optionTitles: ["Header", "Price", "Toggle", "Separator", "Separator 2", "Benefits", "Add-ons", "Button"],
		},
		defaultValue: ["header", "price", "toggle", "separator", "benefits", "addons", "button"],
	},
	settings: {
		type: ControlType.Object,
		title: "Settings",
		description: "Adjust background, borders, and spacing.",
		controls: {
			backgroundType: {
				type: ControlType.Enum,
				title: "Background Type",
				options: ["solid", "gradient"],
				optionTitles: ["Solid", "Gradient"],
				defaultValue: "gradient",
				displaySegmentedControl: true,
			},
			backgroundColor: {
				type: ControlType.Color,
				title: "Background",
				defaultValue: "#0A0A0A",
				hidden: ({ backgroundType }) => backgroundType === "gradient",
			},
			gradientFrom: {
				type: ControlType.Color,
				title: "Gradient From",
				defaultValue: "#494F75",
				hidden: ({ backgroundType }) => backgroundType === "solid",
			},
			gradientTo: {
				type: ControlType.Color,
				title: "Gradient To",
				defaultValue: "#23272E",
				hidden: ({ backgroundType }) => backgroundType === "solid",
			},
			gradientDirection: {
				type: ControlType.Enum,
				title: "Gradient Direction",
				options: ["to right", "to left", "to top", "to bottom", "to top right", "to top left", "to bottom right", "to bottom left"],
				optionTitles: ["Right", "Left", "Top", "Bottom", "Top Right", "Top Left", "Bottom Right", "Bottom Left"],
				defaultValue: "to bottom",
				hidden: ({ backgroundType }) => backgroundType === "solid",
			},
			borderRadius: {
				type: ControlType.BorderRadius,
				title: "Border Radius",
				defaultValue: "16px",
			},
			showShadow: {
				type: ControlType.Boolean,
				title: "Shadow",
				defaultValue: true,
				enabledTitle: "Show",
				disabledTitle: "Hide",
			},
			boxShadow: {
				type: ControlType.BoxShadow,
				title: "Box Shadow",
				defaultValue: "0px 4px 20px 0px rgba(0,0,0,0.5)",
			},
			gap: {
				type: ControlType.Number,
				title: "Gap",
				defaultValue: 24,
				min: 0,
				max: 100,
				step: 1,
				unit: "px",
			},
			benefitsGap: {
				type: ControlType.Number,
				title: "Benefits Gap",
				defaultValue: 12,
				min: 0,
				max: 50,
				step: 1,
				unit: "px",
			},
			showToggle: {
				type: ControlType.Boolean,
				title: "Toggle",
				defaultValue: true,
				enabledTitle: "Show",
				disabledTitle: "Hide",
			},
			toggleColor: {
				type: ControlType.Color,
				title: "Toggle Color",
				defaultValue: "#00D9FF",
			},
			padding: {
				type: ControlType.Padding,
				title: "Padding",
				defaultValue: "48px 32px 32px 32px",
			},
			border: {
				type: ControlType.Border,
				title: "Border",
				defaultValue: {
					borderWidth: 0,
					borderStyle: "solid",
					borderColor: "#333333",
				},
			},
			separatorColor: {
				type: ControlType.Color,
				title: "Separator Color",
				defaultValue: "#4F4F4F",
			},
		},
	},
	planTag: {
		type: ControlType.Object,
		title: "Plan Tag",
		description: "Customize promotional tag.",
		controls: {
			showTag: {
				type: ControlType.Boolean,
				title: "Show Tag",
				defaultValue: true,
				enabledTitle: "Show",
				disabledTitle: "Hide",
			},
			tagText: {
				type: ControlType.String,
				title: "Tag Text",
				defaultValue: "Popular",
			},
			tagBackgroundColor: {
				type: ControlType.Color,
				title: "Tag Background",
				defaultValue: "#99FFB6",
			},
			tagTextColor: {
				type: ControlType.Color,
				title: "Tag Text Color",
				defaultValue: "#01780F",
			},
			tagFont: {
				type: ControlType.Font,
				title: "Tag Font",
				controls: "extended",
				defaultFontType: "sans-serif",
				defaultValue: {
					variant: "Semibold",
					fontSize: "14px",
					letterSpacing: "-0.01em",
					lineHeight: "1em",
				},
			},
			tagPosition: {
				type: ControlType.Enum,
				title: "Tag Position",
				options: ["top-left", "top-right", "top-center"],
				optionTitles: ["Top Left", "Top Right", "Top Center"],
				defaultValue: "top-right",
			},
			tagVerticalPosition: {
				type: ControlType.Enum,
				title: "Vertical Position",
				options: ["top", "bottom"],
				optionTitles: ["Top", "Bottom"],
				defaultValue: "top",
				displaySegmentedControl: true,
			},
			tagBorderRadius: {
				type: ControlType.BorderRadius,
				title: "Tag Radius",
				defaultValue: "20px",
			},
			tagOffsetTop: {
				type: ControlType.Number,
				title: "Offset Top",
				defaultValue: 0,
				min: 0,
				max: 100,
				step: 1,
				unit: "px",
			},
		},
	},
	onUpgrade: {
		type: ControlType.EventHandler,
		title: "On Upgrade",
	},
})