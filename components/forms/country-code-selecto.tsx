import { useState, useMemo, useRef, useEffect, startTransition } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


// Minimal country data
const countries = [
    { code: "BR", name: "Brazil", prefix: "+55", flag: "🇧🇷" },
    { code: "CA", name: "Canada", prefix: "+1", flag: "🇨🇦" },
    { code: "CN", name: "China", prefix: "+86", flag: "🇨🇳" },
    { code: "FR", name: "France", prefix: "+33", flag: "🇫🇷" },
    { code: "DE", name: "Germany", prefix: "+49", flag: "🇩🇪" },
    { code: "IN", name: "India", prefix: "+91", flag: "🇮🇳" },
    { code: "JP", name: "Japan", prefix: "+81", flag: "🇯🇵" },
    { code: "SK", name: "Slovakia", prefix: "+421", flag: "🇸🇰" },
    { code: "GB", name: "United Kingdom", prefix: "+44", flag: "🇬🇧" },
    { code: "US", name: "United States", prefix: "+1", flag: "🇺🇸" },
]

// CSV parser
function parseCSV(csvContent) {
    try {
        const lines = csvContent.trim().split("\n")
        const headers = lines[0].split(",").map((h) => h.trim().toLowerCase())
        const codeIndex = headers.findIndex((h) => h.includes("code"))
        const nameIndex = headers.findIndex((h) => h.includes("name"))
        const prefixIndex = headers.findIndex((h) => h.includes("prefix"))
        const flagIndex = headers.findIndex((h) => h.includes("flag"))

        if (codeIndex === -1 || nameIndex === -1 || prefixIndex === -1)
            return countries

        const parsed = []
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i]
                .split(",")
                .map((v) => v.trim().replace(/"/g, ""))
            parsed.push({
                code: values[codeIndex] || `C${i}`,
                name: values[nameIndex] || "Unknown",
                prefix: values[prefixIndex] || "+1",
                flag: flagIndex !== -1 ? values[flagIndex] : "🏳️",
            })
        }
        return parsed.length ? parsed : countries
    } catch {
        return countries
    }
}

function getCountryByCode(code, list) {
    return list.find((c) => c.code === code) || list[0]
}

export default function PhoneNumberInput(props) {
    const {
        font,
        inputBackground,
        inputTextColor,
        valueTextColor,
        optionBackground,
        optionTextColor,
        borderColor,
        borderRadius,
        radiusInner,
        focusColor,
        dropdownSelectedColor,
        dropdownTextColor,
        dropdownSelectedTextColor,
        focusBackground,
        defaultCountry,
        placeholder,
        style,
        ariaLabelInput,
        ariaLabelSelect,
        useCustomCSV,
        csvFile = "https://framerusercontent.com/assets/8w3IUatLX9a5JVJ6XPCVuHi94.mp3",
        gap,
        fieldPadding,
        customIcon = { src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg", alt: "Dropdown icon" },
        ...rest
    } = props

    const [customCountries, setCustomCountries] = useState(countries)
    const [csvLoaded, setCsvLoaded] = useState(false)
    const [initialCountrySet, setInitialCountrySet] = useState(false)

    useEffect(() => {
        if (useCustomCSV && csvFile && !csvLoaded) {
            fetch(csvFile)
                .then((res) => res.text())
                .then((csv) => {
                    const parsed = parseCSV(csv)
                    startTransition(() => {
                        setCustomCountries(parsed)
                        setCsvLoaded(true)
                    })
                })
                .catch(() =>
                    startTransition(() => setCustomCountries(countries))
                )
        } else if (!useCustomCSV) {
            startTransition(() => {
                setCustomCountries(countries)
                setCsvLoaded(false)
            })
        }
    }, [useCustomCSV, csvFile, csvLoaded])

    const activeCountries = useCustomCSV ? customCountries : countries

    const [phone, setPhone] = useState("")
    const [selectedCountry, setSelectedCountry] = useState(
        getCountryByCode(defaultCountry, activeCountries)
    )
    const [dropdownOpen, setDropdownOpen] = useState(false)
    const [filter, setFilter] = useState("")
    const [highlighted, setHighlighted] = useState(0)
    const [inputFocused, setInputFocused] = useState(false)
    const [selectFocused, setSelectFocused] = useState(false)
    const inputRef = useRef(null)
    const selectRef = useRef(null)
    const dropdownRef = useRef(null)

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (selectRef.current && !selectRef.current.contains(event.target)) {
                startTransition(() => setDropdownOpen(false))
            }
        }

        if (dropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside)
            return () => document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [dropdownOpen])

    useEffect(() => {
        if (!initialCountrySet && activeCountries.length) {
            startTransition(() => {
                setSelectedCountry(
                    getCountryByCode(defaultCountry, activeCountries)
                )
                setInitialCountrySet(true)
            })
        }
    }, [activeCountries, defaultCountry, initialCountrySet])

    const filteredCountries = useMemo(() => {
        if (!filter) return activeCountries
        return activeCountries.filter((c) =>
            c.name.toLowerCase().includes(filter.toLowerCase())
        )
    }, [filter, activeCountries])

    // Form integration
    useEffect(() => {
        if (props.onValueChange)
            props.onValueChange(selectedCountry.prefix + phone || "")
    }, [phone, selectedCountry])

    const isMobile = typeof window !== "undefined" && window.innerWidth < 600

    const baseFont = { fontFamily: "inherit", fontSize: 16, lineHeight: 1.3 }
    const inputStyles = {
        ...baseFont,
        ...font,
        background: inputFocused ? focusBackground : inputBackground,
        color: valueTextColor,
        border: `1px solid ${inputFocused ? focusColor : borderColor}`,
        borderRadius,
        outline: "none",
        padding: fieldPadding,
        flex: 1,
        minWidth: 0,
        width: "100%",
        boxSizing: "border-box",
        transition: "border-color 0.2s, background 0.2s",
    }

    const selectStyles = {
        ...baseFont,
        ...font,
        background: selectFocused ? focusBackground : inputBackground,
        color: inputTextColor,
        border: `1px solid ${selectFocused ? focusColor : borderColor}`,
        borderRadius,
        outline: "none",
        padding: fieldPadding,
        minWidth: 0,
        display: "flex",
        alignItems: "center",
        cursor: "pointer",
        gap: 8,
        transition: "border-color 0.2s, background 0.2s",
        userSelect: "none",
        width: isMobile ? "100%" : 120,
        position: "relative",
    }

    const dropdownStyles = {
        position: "absolute" as const,
        top: "100%",
        left: 0,
        width: 240,
        background: optionBackground,
        color: optionTextColor,
        border: `1px solid ${borderColor}`,
        borderRadius: borderRadius,
        zIndex: 1000,
        height: 240,
        overflowY: "auto" as const,
        boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
        marginTop: 4,
        padding: "2px",
    }

    const optionStyles = (active: boolean) => ({
        ...baseFont,
        ...font,
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "12px 16px",
        height: "48px",
        background: active ? dropdownSelectedColor : optionBackground,
        color: active ? dropdownSelectedTextColor : dropdownTextColor,
        fontWeight: 400,
        cursor: "pointer",
        borderRadius: active ? radiusInner : 0,
    })

    return (
        <div
            style={{
                ...style,
                width: "100%",
                minWidth: 0,
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                gap: gap,
                alignItems: "stretch",
                position: "relative",
            }}
        >
            {/* Selectbox */}
            <div
                ref={selectRef}
                tabIndex={0}
                aria-label={ariaLabelSelect || "Country code selector"}
                aria-haspopup="listbox"
                aria-expanded={dropdownOpen}
                style={selectStyles}
                onClick={() => setDropdownOpen((v) => !v)}
                onKeyDown={(e) => {
                    if (["Enter", " ", "ArrowDown"].includes(e.key))
                        setDropdownOpen(true)
                }}
                onFocus={() => startTransition(() => setSelectFocused(true))}
                onBlur={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget))
                        startTransition(() => setSelectFocused(false))
                }}
                role="combobox"
                aria-controls="country-listbox"
            >
                <span style={{ fontSize: 18 }}>
                    {selectedCountry.flag}
                </span>
                <span>{selectedCountry.prefix}</span>
                {customIcon ? (
                    <img
                        src={customIcon.src}
                        alt={customIcon.alt || "Dropdown icon"}
                        style={{
                            position: "absolute",
                            right: 16,
                            width: 12,
                            height: 12,
                            objectFit: "contain",
                        }}
                        aria-hidden
                    />
                ) : (
                    <span
                        style={{
                            position: "absolute",
                            right: 16,
                            fontSize: 14,
                            opacity: 0.6,
                        }}
                        aria-hidden
                    >
                        ▼
                    </span>
                )}

                {dropdownOpen && (
                    <div
                        ref={dropdownRef}
                        style={dropdownStyles}
                        id="country-listbox"
                        role="listbox"
                    >
                        <input
                            autoFocus
                            type="text"
                            placeholder="Type to filter…"
                            value={filter}
                            onChange={(e) => {
                                setFilter(e.target.value)
                                setHighlighted(0)
                            }}
                            onKeyDown={(e) => {
                                if (e.key === "ArrowDown") {
                                    e.preventDefault()
                                    setHighlighted((prev) => 
                                        prev < filteredCountries.length - 1 ? prev + 1 : 0
                                    )
                                } else if (e.key === "ArrowUp") {
                                    e.preventDefault()
                                    setHighlighted((prev) => 
                                        prev > 0 ? prev - 1 : filteredCountries.length - 1
                                    )
                                } else if (e.key === "Enter" && filteredCountries[highlighted]) {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    const selectedCountryItem = filteredCountries[highlighted]
                                    setSelectedCountry(selectedCountryItem)
                                    setDropdownOpen(false)
                                    setFilter("")
                                    setHighlighted(0)
                                    setTimeout(() => selectRef.current?.focus(), 0)
                                } else if (e.key === "Escape") {
                                    e.preventDefault()
                                    startTransition(() => {
                                        setDropdownOpen(false)
                                        setFilter("")
                                        setHighlighted(0)
                                    })
                                    setTimeout(() => selectRef.current?.focus(), 0)
                                }
                            }}
                            style={{
                                ...baseFont,
                                ...font,
                                width: "100%",
                                boxSizing: "border-box",
                                padding: fieldPadding,
                                border: "none",
                                outline: "none",
                                background: optionBackground,
                                color: valueTextColor,
                                marginBottom: 2,
                                borderRadius: `${radiusInner}px ${radiusInner}px 0 0`,
                                lineHeight: "1.5em",
                            }}
                            aria-label="Filter countries"
                        />
                        {filteredCountries.length === 0 && (
                            <div style={{ padding: 12, color: "#888" }}>
                                No countries found
                            </div>
                        )}
                        {filteredCountries.map((c, i) => (
                            <div
                                key={c.code}
                                style={optionStyles(i === highlighted)}
                                role="option"
                                aria-selected={i === highlighted}
                                tabIndex={-1}
                                onMouseEnter={() => setHighlighted(i)}
                                onMouseDown={() => {
                                    startTransition(() => {
                                        setSelectedCountry(c)
                                        setDropdownOpen(false)
                                        setFilter("")
                                        setHighlighted(0)
                                    })
                                    selectRef.current?.focus()
                                }}
                            >
                                <span style={{ fontSize: 18, marginRight: 6 }}>
                                    {c.flag}
                                </span>
                                <span
                                    style={{
                                        flex: 1,
                                        minWidth: 0,
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                    }}
                                >
                                    {c.name}
                                </span>
                                <span
                                    style={{ fontWeight: 400, marginLeft: 6, color: valueTextColor }}
                                >
                                    {c.prefix}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Phone input */}
            <input
                ref={inputRef}
                type="tel"
                aria-label={ariaLabelInput || "Phone number input"}
                style={inputStyles}
                placeholder={placeholder}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
                inputMode="tel"
                pattern="[0-9\s\-]*"
                onFocus={() => startTransition(() => setInputFocused(true))}
                onBlur={() => startTransition(() => setInputFocused(false))}
                formNoValidate
            />

            {/* Hidden input for form submission */}
            <input
                type="hidden"
                name="Phone"
                value={selectedCountry.prefix + (phone || "")}
            />
        </div>
    )
}

addPropertyControls(PhoneNumberInput, {
    gap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 10,
        min: 0,
        max: 50,
        unit: "px",
    },
    fieldPadding: {
        type: ControlType.String,
        title: "Padding",
        defaultValue: "12px 16px",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        defaultValue: {
            fontSize: 16,
            variant: "Regular",
            letterSpacing: "-0.01em",
            lineHeight: "1.3em",
        },
        controls: "extended",
        defaultFontType: "sans-serif",
    },
    inputBackground: {
        type: ControlType.Color,
        title: "Input BG",
        defaultValue: "#FFFFFF",
    },
    inputTextColor: {
        type: ControlType.Color,
        title: "Input Text",
        defaultValue: "#000000",
    },
    valueTextColor: {
        type: ControlType.Color,
        title: "Value Text Color",
        defaultValue: "#FFFFFF",
    },
    optionBackground: {
        type: ControlType.Color,
        title: "Option BG",
        defaultValue: "#FFFFFF",
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border",
        defaultValue: "#EEEEEE",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 8,
        min: 0,
        max: 32,
    },
    radiusInner: {
        type: ControlType.Number,
        title: "Radius Inner",
        defaultValue: 6,
        min: 0,
        max: 32,
    },
    focusColor: {
        type: ControlType.Color,
        title: "Focus",
        defaultValue: "#0099FF",
    },
    focusBackground: {
        type: ControlType.Color,
        title: "Focus Background",
        defaultValue: "#F5F5F5",
    },
    dropdownSelectedColor: {
        type: ControlType.Color,
        title: "Dropdown Selected",
        defaultValue: "#000000",
    },
    dropdownTextColor: {
        type: ControlType.Color,
        title: "Dropdown Text",
        defaultValue: "#999999",
    },
    dropdownSelectedTextColor: {
        type: ControlType.Color,
        title: "Dropdown Selected Text",
        defaultValue: "#FFFFFF",
    },
    defaultCountry: {
        type: ControlType.Enum,
        title: "Default Country",
        options: countries.map((c) => c.code),
        optionTitles: countries.map((c) => `${c.flag} ${c.name} ${c.prefix}`),
        defaultValue: "US",
    },
    placeholder: {
        type: ControlType.String,
        title: "Placeholder",
        defaultValue: "Phone number",
    },
    ariaLabelInput: {
        type: ControlType.String,
        title: "Input ARIA Label",
        defaultValue: "Phone number input",
    },
    ariaLabelSelect: {
        type: ControlType.String,
        title: "Select ARIA Label",
        defaultValue: "Country code selector",
    },
    useCustomCSV: {
        type: ControlType.Boolean,
        title: "Custom Countries",
        defaultValue: false,
        enabledTitle: "CSV File",
        disabledTitle: "Default",
    },
    csvFile: {
        type: ControlType.File,
        title: "CSV File",
        allowedFileTypes: ["csv"],
        hidden: ({ useCustomCSV }) => !useCustomCSV,
    },
    customIcon: {
        type: ControlType.ResponsiveImage,
        title: "Dropdown Icon (12x12px)",
    },
})