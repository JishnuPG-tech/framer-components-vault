import * as React from "react"
import { useState, useRef, useEffect } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


/* -------------------------------------------------------------------------- */
/* 1.  DEFAULT STYLE OBJECTS (guarantee keys exist)                           */
/* -------------------------------------------------------------------------- */
const defaultInputStyle = {
    placeholderText: "Search for address",
    inputFont: { fontSize: 14, fontWeight: 400, lineHeight: "22px" },
    inputTextColor: "#212121",
    placeholderColor: "#9F9F9F",
    inputFillColor: "#FFFFFF",
    inputBorderColor: "#DFDFDF",
    inputBorderWidth: 1,
    inputBorderRadius: "8px",
    inputPadding: "12px 8px 12px 8px",
    inputBoxShadow: "0px 4px 16px 0px rgba(0,0,0,0.10)",
}

const defaultFocusStyle = {
    ...defaultInputStyle,
    inputBorderColor: "#212121",
    inputBoxShadow: "0px 4px 16px 0px rgba(0,0,0,0.15)",
}

const defaultDropdownStyle = {
    dropdownFill: "#FFFFFF",
    dropdownBorderColor: "#DFDFDF",
    dropdownBoxShadow: "0 6px 24px 0 rgba(0,0,0,0.08)",
    optionTextColor: "#212121",
    optionFont: { fontSize: 14, fontWeight: 400, lineHeight: "22px" },
    optionPadding: "12px 8px",
    optionHoverFill: "#F5F5F5",
}

/* -------------------------------------------------------------------------- */
/* 2.  COUNTRY NAME → CODE MAP + PARSER                                       */
/* -------------------------------------------------------------------------- */
const COUNTRY_MAP: Record<string, string> = {
    us: "us",
    "united states": "us",
    usa: "us",
    in: "in",
    india: "in",
    gb: "gb",
    uk: "gb",
    "united kingdom": "gb",
    england: "gb",
    ca: "ca",
    canada: "ca",
    au: "au",
    australia: "au",
    fr: "fr",
    france: "fr",
    de: "de",
    germany: "de",
    it: "it",
    italy: "it",
    es: "es",
    spain: "es",
    cn: "cn",
    china: "cn",
    jp: "jp",
    japan: "jp",
    br: "br",
    brazil: "br",
    za: "za",
    "south africa": "za",
}

const toCountryCodes = (txt: string) =>
    txt
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .map((t) => COUNTRY_MAP[t] ?? t)
        .filter((t) => /^[a-z]{2}$/.test(t))
        .join(",")

/* -------------------------------------------------------------------------- */
/* 3.  PROP TYPES                                                             */
/* -------------------------------------------------------------------------- */
type StyleObj = typeof defaultInputStyle
type DDObj = typeof defaultDropdownStyle

type Props = {
    mapboxToken: string
    worldwide: boolean
    countryInput: string
    required: boolean
    onChange?: (v: string) => void

    labelText: string
    labelFont: any
    labelColor: string

    inputStyle?: Partial<StyleObj>
    focusStyle?: Partial<StyleObj>
    dropdownStyle?: Partial<DDObj>
}
/**
 * @framerDisableUnlink
 */

/* -------------------------------------------------------------------------- */
/* 4.  MAIN COMPONENT                                                         */
/* -------------------------------------------------------------------------- */
export default function StyledMapboxAddressAutocomplete(props: Props) {
    /* ---------- merge defaults with overrides ---------- */
    const inputStyle = { ...defaultInputStyle, ...(props.inputStyle ?? {}) }
    const focusStyle = { ...defaultFocusStyle, ...(props.focusStyle ?? {}) }
    const dropdownStyle = {
        ...defaultDropdownStyle,
        ...(props.dropdownStyle ?? {}),
    }

    const {
        mapboxToken,
        worldwide,
        countryInput,
        required,
        onChange,
        labelText,
        labelFont,
        labelColor,
    } = props

    /* ---------- state & refs ---------- */
    const [inputValue, setInputValue] = useState("")
    const [suggestions, setSuggestions] = useState<any[]>([])
    const [showDropdown, setShowDropdown] = useState(false)
    const [isFocused, setIsFocused] = useState(false)

    const wrapperRef = useRef<HTMLDivElement>(null)
    const inputId = useRef(`addr-${Math.random().toString(36).slice(2, 11)}`)
    const dropdownId = useRef(`dd-${Math.random().toString(36).slice(2, 11)}`)

    const style = isFocused ? focusStyle : inputStyle
    const ds = dropdownStyle

    /* ---------- fetch suggestions ---------- */
    const fetchSuggestions = async (query: string) => {
        if (!query) return setSuggestions([])
        let url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
            query
        )}.json?access_token=${mapboxToken}&autocomplete=true&limit=5`
        if (!worldwide) {
            const codes = toCountryCodes(countryInput)
            if (codes) url += `&country=${codes}`
        }
        try {
            const res = await fetch(url)
            const data = await res.json()
            setSuggestions(data.features || [])
        } catch {
            setSuggestions([])
        }
    }

    /* ---------- handlers ---------- */
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const v = e.target.value
        setInputValue(v)
        setShowDropdown(true)
        fetchSuggestions(v)
        onChange?.(v)
    }
    const handleSelect = (addr: string) => {
        setInputValue(addr)
        setShowDropdown(false)
        setSuggestions([])
        onChange?.(addr)
    }

    /* click-outside closes dropdown */
    useEffect(() => {
        const fn = (e: any) =>
            wrapperRef.current &&
            !wrapperRef.current.contains(e.target) &&
            setShowDropdown(false)
        document.addEventListener("mousedown", fn)
        return () => document.removeEventListener("mousedown", fn)
    }, [])

    /* inject placeholder colour + custom scrollbar css */
    useEffect(() => {
        const tagId = `style-${inputId.current}`
        let tag = document.getElementById(tagId) as HTMLStyleElement | null
        if (!tag) {
            tag = document.createElement("style")
            tag.id = tagId
            document.head.appendChild(tag)
        }

        tag.textContent = `
          /* placeholder colour */
          #${inputId.current}::placeholder { color:${inputStyle.placeholderColor};opacity:1 }

          /* custom scrollbar on dropdown */
          #${dropdownId.current} { scrollbar-width:thin; scrollbar-color:rgba(0,0,0,.3) transparent; }
          #${dropdownId.current}::-webkit-scrollbar       { width:6px }
          #${dropdownId.current}::-webkit-scrollbar-track { background:transparent }
          #${dropdownId.current}::-webkit-scrollbar-thumb { background:rgba(0,0,0,.3); border-radius:3px }
          #${dropdownId.current}::-webkit-scrollbar-thumb:hover { background:rgba(0,0,0,.45) }

          /* round dropdown bottom corners */
          #${dropdownId.current} > div:last-child {
              border-bottom:none;
              border-bottom-left-radius:8px;
              border-bottom-right-radius:8px;
          }
        `
    }, [inputStyle.placeholderColor])

    /* ---------- render ---------- */
    return (
        <div ref={wrapperRef} style={{ width: "100%", position: "relative" }}>
            {/* Label */}
            <label
                style={{
                    display: "block",
                    marginBottom: 6,
                    color: labelColor,
                    ...labelFont,
                }}
            >
                {labelText}
            </label>

            {/* Visible input */}
            <input
                id={inputId.current}
                value={inputValue}
                placeholder={inputStyle.placeholderText}
                autoComplete="off"
                required={required}
                onChange={handleInputChange}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                style={{
                    width: "100%",
                    display: "flex",
                    padding: style.inputPadding,
                    borderRadius: style.inputBorderRadius,
                    border: `${style.inputBorderWidth}px solid ${style.inputBorderColor}`,
                    background: style.inputFillColor,
                    color: style.inputTextColor,
                    outline: "none",
                    transition: "border .15s, box-shadow .15s",
                    boxShadow: style.inputBoxShadow,
                    boxSizing: "border-box",
                    ...style.inputFont,
                }}
            />

            {/* Hidden form field */}
            <input type="hidden" name="address" value={inputValue} />

            {/* Dropdown */}
            {showDropdown && suggestions.length > 0 && (
                <div
                    id={dropdownId.current}
                    style={{
                        marginTop: 12,
                        position: "absolute",
                        width: "100%",
                        maxHeight: 230,
                        overflowY: "auto",
                        background: ds.dropdownFill,
                        border: `1px solid ${ds.dropdownBorderColor}`,
                        borderRadius: 8,
                        boxShadow: ds.dropdownBoxShadow,
                        zIndex: 10,
                    }}
                >
                    {suggestions.map((s) => (
                        <OptionRow
                            key={s.id}
                            text={s.place_name}
                            onClick={() => handleSelect(s.place_name)}
                            optionFont={ds.optionFont}
                            optionTextColor={ds.optionTextColor}
                            optionPadding={ds.optionPadding}
                            optionHoverFill={ds.optionHoverFill}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

/* -------------------------------------------------------------------------- */
/* 5.  OPTION ROW                                                             */
/* -------------------------------------------------------------------------- */
function OptionRow({
    text,
    onClick,
    optionFont,
    optionTextColor,
    optionPadding,
    optionHoverFill,
}: any) {
    const [hover, setHover] = useState(false)
    return (
        <div
            onClick={onClick}
            onMouseDown={(e) => e.preventDefault()}
            onMouseOver={() => setHover(true)}
            onMouseOut={() => setHover(false)}
            style={{
                padding: optionPadding,
                cursor: "pointer",
                color: optionTextColor,
                background: hover ? optionHoverFill : "transparent",
                borderBottom: "1px solid #F5F5F5",
                transition: "background .1s",
                ...optionFont,
            }}
        >
            {text}
        </div>
    )
}

/* -------------------------------------------------------------------------- */
/* 6.  PROPERTY CONTROLS                                                      */
/* -------------------------------------------------------------------------- */
addPropertyControls(StyledMapboxAddressAutocomplete, {
    /*  -- CONNECTION -- */
    mapboxToken: { type: ControlType.String, title: "Mapbox Token" },

    worldwide: {
        type: ControlType.Boolean,
        title: "Worldwide",
        defaultValue: true,
        description: "Search globally or limit to specific countries.",
    },
    countryInput: {
        type: ControlType.String,
        title: "Countries",
        defaultValue: "",
        description:
            "Comma-separated codes or names.\n" +
            "`us,in,gb` or `United States, India, UK`.\n" +
            "Case & spacing are fixed automatically.\n" +
            "Ignore if youre using worldwide.",
        hidden: (p) => p.worldwide,
    },

    /*  -- VALIDATION -- */
    required: {
        type: ControlType.Boolean,
        title: "Required",
        defaultValue: false,
        description: "Browser blocks form submission until filled.",
        group: "Validation",
    },

    /*  -- LABEL GROUP -- */
    labelText: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Subject property address",
        group: "Label",
    },
    labelFont: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultValue: { fontSize: 14, fontWeight: 500, lineHeight: "22px" },
        group: "Label",
    },
    labelColor: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "#000",
        group: "Label",
    },

    /*  -- INPUT STYLE GROUP -- */
    inputStyle: {
        type: ControlType.Object,
        title: "Input Style",
        controls: {
            placeholderText: {
                type: ControlType.String,
                title: "Placeholder",
                defaultValue: defaultInputStyle.placeholderText,
            },
            inputFont: {
                type: ControlType.Font,
                title: "Font",
                controls: "extended",
                defaultValue: defaultInputStyle.inputFont,
            },
            inputTextColor: {
                type: ControlType.Color,
                title: "Text Color",
                defaultValue: defaultInputStyle.inputTextColor,
            },
            placeholderColor: {
                type: ControlType.Color,
                title: "Placeholder",
                defaultValue: defaultInputStyle.placeholderColor,
            },
            inputFillColor: {
                type: ControlType.Color,
                title: "Fill",
                defaultValue: defaultInputStyle.inputFillColor,
            },
            inputBorderColor: {
                type: ControlType.Color,
                title: "Border Color",
                defaultValue: defaultInputStyle.inputBorderColor,
            },
            inputBorderWidth: {
                type: ControlType.Number,
                title: "Border Width",
                defaultValue: defaultInputStyle.inputBorderWidth,
            },
            inputBorderRadius: {
                type: ControlType.BorderRadius,
                title: "Radius",
                defaultValue: defaultInputStyle.inputBorderRadius,
            },
            inputPadding: {
                type: ControlType.Padding,
                title: "Padding",
                defaultValue: defaultInputStyle.inputPadding,
            },
            inputBoxShadow: {
                type: ControlType.BoxShadow,
                title: "Box Shadow",
                defaultValue: defaultInputStyle.inputBoxShadow,
            },
        },
    },

    /*  -- FOCUS STYLE GROUP -- */
    focusStyle: {
        type: ControlType.Object,
        title: "Focus Style",
        controls: {
            inputFont: {
                type: ControlType.Font,
                title: "Font",
                controls: "extended",
                defaultValue: defaultFocusStyle.inputFont,
            },
            inputTextColor: {
                type: ControlType.Color,
                title: "Text Color",
                defaultValue: defaultFocusStyle.inputTextColor,
            },
            inputFillColor: {
                type: ControlType.Color,
                title: "Fill",
                defaultValue: defaultFocusStyle.inputFillColor,
            },
            inputBorderColor: {
                type: ControlType.Color,
                title: "Border Color",
                defaultValue: defaultFocusStyle.inputBorderColor,
            },
            inputBorderWidth: {
                type: ControlType.Number,
                title: "Border Width",
                defaultValue: defaultFocusStyle.inputBorderWidth,
            },
            inputBorderRadius: {
                type: ControlType.BorderRadius,
                title: "Radius",
                defaultValue: defaultFocusStyle.inputBorderRadius,
            },
            inputPadding: {
                type: ControlType.Padding,
                title: "Padding",
                defaultValue: defaultFocusStyle.inputPadding,
            },
            inputBoxShadow: {
                type: ControlType.BoxShadow,
                title: "Box Shadow",
                defaultValue: defaultFocusStyle.inputBoxShadow,
            },
        },
    },

    /*  -- DROPDOWN STYLE GROUP -- */
    dropdownStyle: {
        type: ControlType.Object,
        title: "Dropdown Style",
        controls: {
            dropdownFill: {
                type: ControlType.Color,
                title: "Fill",
                defaultValue: defaultDropdownStyle.dropdownFill,
            },
            dropdownBorderColor: {
                type: ControlType.Color,
                title: "Border",
                defaultValue: defaultDropdownStyle.dropdownBorderColor,
            },
            dropdownBoxShadow: {
                type: ControlType.BoxShadow,
                title: "Shadow",
                defaultValue: defaultDropdownStyle.dropdownBoxShadow,
            },
            optionTextColor: {
                type: ControlType.Color,
                title: "Option Text",
                defaultValue: defaultDropdownStyle.optionTextColor,
            },
            optionFont: {
                type: ControlType.Font,
                title: "Option Font",
                controls: "extended",
                defaultValue: defaultDropdownStyle.optionFont,
            },
            optionPadding: {
                type: ControlType.Padding,
                title: "Option Padding",
                defaultValue: defaultDropdownStyle.optionPadding,
            },
            optionHoverFill: {
                type: ControlType.Color,
                title: "Hover Fill",
                defaultValue: defaultDropdownStyle.optionHoverFill,
            },
        },
    },
})
