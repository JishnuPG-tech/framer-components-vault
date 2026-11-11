// Searchable dropdown component with customizable options and styling
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion } from "framer-motion"
import React, {
    useState,
    useEffect,
    useRef,
    startTransition,
    type CSSProperties,
} from "react"

// Define the option interface
interface DropdownOption {
    id: string
    label: string
    value: string
}

interface SearchableDropdownProps {
    options: DropdownOption[]
    placeholder: string
    searchPlaceholder: string
    initialValue: string
    dropdownHeight: number
    borderRadius: number
    backgroundColor: string
    textColor: string
    placeholderColor: string
    borderColor: string
    hoverColor: string
    selectedColor: string
    fontSize: number
    padding: number
    showSearch: boolean
    allowMultiple: boolean
    disabled: boolean
    font: CSSProperties
    style?: CSSProperties
}

/**
 * Searchable Dropdown Component for Framer
 *
 * IMPORTANT: To use the selected value in forms, emails, or other components:
 * 1. Connect this dropdown to a Form component or use with custom code
 * 2. Access the value via: document.querySelector('[data-framer-component-type="SearchableDropdown"]')?.dataset.selectedValue
 * 3. Or listen to the custom event: window.addEventListener('dropdownValueChange', (e) => console.log(e.detail.value))
 *
 * @framerDisableUnlink
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
function SearchableDropdownComponent(props: SearchableDropdownProps) {
    const {
        options = [
            { id: "1", label: "Option 1", value: "option1" },
            { id: "2", label: "Option 2", value: "option2" },
            { id: "3", label: "Option 3", value: "option3" },
        ],
        placeholder = "Select an option...",
        searchPlaceholder = "Search options...",
        initialValue = "",
        dropdownHeight = 150,
        borderRadius = 8,
        backgroundColor = "#ffffff",
        textColor = "#333333",
        placeholderColor = "#999999",
        borderColor = "#cccccc",
        hoverColor = "#f0f0f0",
        selectedColor = "#e3f2fd",
        fontSize = 14,
        padding = 12,
        showSearch = true,
        allowMultiple = false,
        disabled = false,
        font,
        style,
    } = props

    const [searchTerm, setSearchTerm] = useState("")
    const [filteredOptions, setFilteredOptions] =
        useState<DropdownOption[]>(options)
    const [isOpen, setIsOpen] = useState(false)
    const [selectedValue, setSelectedValue] = useState(initialValue)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const searchInputRef = useRef<HTMLInputElement>(null)

    // Store value in a way that can be accessed by forms and other components
    useEffect(() => {
        if (dropdownRef.current && selectedValue !== undefined) {
            // Store in data attribute for easy access
            dropdownRef.current.setAttribute(
                "data-selected-value",
                selectedValue
            )

            // Only dispatch event if value actually changed
            if (selectedValue !== "") {
                // Dispatch custom event that can be listened to
                const event = new CustomEvent("dropdownValueChange", {
                    detail: {
                        value: selectedValue,
                        component: "SearchableDropdown",
                    },
                    bubbles: true,
                })
                window.dispatchEvent(event)
            }

            // Store in window object for global access
            if (typeof window !== "undefined") {
                if (!window.framerDropdownValues) {
                    window.framerDropdownValues = {}
                }
                window.framerDropdownValues[
                    dropdownRef.current.id || "dropdown"
                ] = selectedValue
            }
        }
    }, [selectedValue])

    // Log selection changes for debugging
    useEffect(() => {
        console.log("Dropdown value changed:", selectedValue)
    }, [selectedValue])

    // Initialize with initial value
    useEffect(() => {
        if (initialValue) {
            setSelectedValue(initialValue)
        }
    }, [initialValue])

    // Filter options based on search term
    useEffect(() => {
        if (searchTerm.trim() === "") {
            startTransition(() => setFilteredOptions(options))
        } else {
            const filtered = options.filter(
                (option) =>
                    option.label
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase()) ||
                    option.value
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase())
            )
            startTransition(() => setFilteredOptions(filtered))
        }
    }, [searchTerm, options])

    // Handle click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false)
            }
        }

        document.addEventListener("mousedown", handleClickOutside)
        return () =>
            document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    // Focus search input when dropdown opens
    useEffect(() => {
        if (isOpen && showSearch && searchInputRef.current) {
            searchInputRef.current.focus()
        }
    }, [isOpen, showSearch])

    const handleToggle = () => {
        if (!disabled) {
            setIsOpen(!isOpen)
        }
    }

    // Handle keyboard navigation
    const handleKeyDown = (event: React.KeyboardEvent) => {
        if (disabled) return

        switch (event.key) {
            case "Enter":
            case " ":
                event.preventDefault()
                handleToggle()
                break
            case "Escape":
                if (isOpen) {
                    setIsOpen(false)
                }
                break
        }
    }

    // Handle option selection
    const handleOptionClick = (option: DropdownOption) => {
        if (allowMultiple) {
            // Multi-select logic
            const currentValues = selectedValue ? selectedValue.split(",") : []
            const isSelected = currentValues.includes(option.value)

            let newValues: string[]
            if (isSelected) {
                newValues = currentValues.filter((val) => val !== option.value)
            } else {
                newValues = [...currentValues, option.value]
            }

            const newValue = newValues.join(",")
            setSelectedValue(newValue)
        } else {
            // Single select logic
            setSelectedValue(option.value)
            setSearchTerm("")
            setIsOpen(false)
        }
    }

    // Get selected option label
    const getSelectedLabel = () => {
        if (allowMultiple) {
            const currentValues = selectedValue ? selectedValue.split(",") : []
            if (currentValues.length === 0) {
                return placeholder
            } else if (currentValues.length === 1) {
                const option = options.find(
                    (opt) => opt.value === currentValues[0]
                )
                return option ? option.label : placeholder
            } else {
                return `${currentValues.length} items selected`
            }
        } else {
            const selectedOption = options.find(
                (option) => option.value === selectedValue
            )
            return selectedOption ? selectedOption.label : placeholder
        }
    }

    // Check if an option is selected
    const isOptionSelected = (option: DropdownOption): boolean => {
        if (allowMultiple) {
            const currentValues = selectedValue ? selectedValue.split(",") : []
            return currentValues.includes(option.value)
        } else {
            return option.value === selectedValue
        }
    }

    const containerStyle: CSSProperties = {
        position: "relative",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        ...style,
    }

    const triggerStyle: CSSProperties = {
        width: "100%",
        height: "100%",
        padding: padding,
        backgroundColor: backgroundColor,
        border: `1px solid ${borderColor}`,
        borderRadius: borderRadius,
        color: selectedValue ? textColor : placeholderColor,
        fontSize: fontSize,
        cursor: disabled ? "not-allowed" : "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        opacity: disabled ? 0.6 : 1,
        outline: "none",
        transition: "all 0.2s ease",
        ...font,
    }

    const dropdownStyle: CSSProperties = {
        position: "absolute",
        top: "calc(100% + 4px)",
        left: 0,
        right: 0,
        backgroundColor: backgroundColor,
        border: `1px solid ${borderColor}`,
        borderRadius: borderRadius,
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
        zIndex: 1000,
        height: dropdownHeight,
        overflow: "hidden",
        display: isOpen ? "flex" : "none",
        flexDirection: "column",
    }

    const searchInputStyle: CSSProperties = {
        width: "100%",
        padding: padding,
        border: "none",
        borderBottom: `1px solid ${borderColor}`,
        backgroundColor: "transparent",
        color: textColor,
        fontSize: fontSize,
        outline: "none",
        borderRadius: 0,
        ...font,
    }

    const optionsListStyle: CSSProperties = {
        height: dropdownHeight - (showSearch ? 50 : 0),
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
    }

    const optionStyle = (option: DropdownOption): CSSProperties => {
        const isSelected = isOptionSelected(option)

        return {
            padding: padding,
            cursor: "pointer",
            backgroundColor: isSelected ? selectedColor : "transparent",
            color: textColor,
            fontSize: fontSize,
            border: "none",
            textAlign: "left",
            transition: "background-color 0.2s ease",
            display: "flex",
            alignItems: "center",
            ...font,
        }
    }

    return (
        <div
            ref={dropdownRef}
            style={containerStyle}
            data-framer-component-type="SearchableDropdown"
            data-selected-value={selectedValue}
        >
            {/* Hidden input for form compatibility */}
            <input
                type="hidden"
                name="dropdown-value"
                value={selectedValue}
                data-dropdown-value={selectedValue}
            />

            {/* Trigger Button */}
            <button
                style={triggerStyle}
                onClick={handleToggle}
                onKeyDown={handleKeyDown}
                disabled={disabled}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                role="combobox"
            >
                <span style={{ flex: 1, textAlign: "left" }}>
                    {getSelectedLabel()}
                </span>
                <span
                    style={{
                        transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                        transition: "transform 0.2s ease",
                    }}
                >
                    ▼
                </span>
            </button>

            {/* Dropdown Menu */}
            <div style={dropdownStyle} role="listbox">
                {/* Search Input */}
                {showSearch && (
                    <input
                        ref={searchInputRef}
                        type="text"
                        placeholder={searchPlaceholder}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={searchInputStyle}
                        aria-label="Search options"
                    />
                )}

                {/* Options List */}
                <div style={optionsListStyle}>
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map((option) => (
                            <button
                                key={option.id}
                                style={optionStyle(option)}
                                onClick={() => handleOptionClick(option)}
                                onMouseEnter={(e) => {
                                    if (!isOptionSelected(option)) {
                                        e.currentTarget.style.backgroundColor =
                                            hoverColor
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor =
                                        isOptionSelected(option)
                                            ? selectedColor
                                            : "transparent"
                                }}
                                role="option"
                                aria-selected={isOptionSelected(option)}
                            >
                                {option.label}
                            </button>
                        ))
                    ) : (
                        <div
                            style={{
                                padding: padding,
                                color: textColor,
                                fontSize: fontSize,
                                textAlign: "center",
                                opacity: 0.6,
                                ...font,
                            }}
                        >
                            No options found
                        </div>
                    )}
                </div>
            </div>

            {/* Value display for debugging */}
            <div
                style={{
                    position: "absolute",
                    bottom: "-25px",
                    left: "0",
                    fontSize: "11px",
                    color: "#666",
                    background: "#f0f0f0",
                    padding: "2px 6px",
                    borderRadius: "3px",
                    whiteSpace: "nowrap",
                    maxWidth: "100%",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                }}
            >
                Selected: {selectedValue || "None"}
            </div>
        </div>
    )
}

// Add TypeScript declaration for window object
declare global {
    interface Window {
        framerDropdownValues?: Record<string, string>
    }
}

export default function SearchableDropdown(props: SearchableDropdownProps) {
    return <SearchableDropdownComponent {...props} />
}

addPropertyControls(SearchableDropdown, {
    options: {
        type: ControlType.Array,
        title: "Options",
        defaultValue: [
            { id: "1", label: "Option 1", value: "option1" },
            { id: "2", label: "Option 2", value: "option2" },
            { id: "3", label: "Option 3", value: "option3" },
        ],
        propertyControl: {
            type: ControlType.Object,
            controls: {
                id: {
                    type: ControlType.String,
                    title: "ID",
                    defaultValue: "",
                },
                label: {
                    type: ControlType.String,
                    title: "Label",
                    defaultValue: "",
                },
                value: {
                    type: ControlType.String,
                    title: "Value",
                    defaultValue: "",
                },
            },
        },
        maxCount: 50,
    },
    placeholder: {
        type: ControlType.String,
        title: "Placeholder",
        defaultValue: "Select an option...",
    },
    searchPlaceholder: {
        type: ControlType.String,
        title: "Search Placeholder",
        defaultValue: "Search options...",
    },
    initialValue: {
        type: ControlType.String,
        title: "Initial Value",
        defaultValue: "",
        description: "Set a default selected value when the component loads.",
    },
    dropdownHeight: {
        type: ControlType.Number,
        title: "Dropdown Height",
        defaultValue: 150,
        min: 100,
        max: 400,
        step: 10,
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        defaultValue: 8,
        min: 0,
        max: 20,
        step: 1,
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background Color",
        defaultValue: "#ffffff",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#333333",
    },
    placeholderColor: {
        type: ControlType.Color,
        title: "Placeholder Color",
        defaultValue: "#999999",
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border Color",
        defaultValue: "#cccccc",
    },
    hoverColor: {
        type: ControlType.Color,
        title: "Hover Color",
        defaultValue: "#f0f0f0",
    },
    selectedColor: {
        type: ControlType.Color,
        title: "Selected Color",
        defaultValue: "#e3f2fd",
    },
    fontSize: {
        type: ControlType.Number,
        title: "Font Size",
        defaultValue: 14,
        min: 10,
        max: 24,
        step: 1,
    },
    padding: {
        type: ControlType.Number,
        title: "Padding",
        defaultValue: 12,
        min: 4,
        max: 24,
        step: 2,
    },
    showSearch: {
        type: ControlType.Boolean,
        title: "Show Search",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    allowMultiple: {
        type: ControlType.Boolean,
        title: "Allow Multiple",
        defaultValue: false,
        enabledTitle: "Multiple",
        disabledTitle: "Single",
    },
    disabled: {
        type: ControlType.Boolean,
        title: "Disabled",
        defaultValue: false,
        enabledTitle: "Disabled",
        disabledTitle: "Enabled",
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
            lineHeight: "1.3em",
        },
    },
})
