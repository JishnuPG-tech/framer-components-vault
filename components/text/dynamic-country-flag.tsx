import * as React from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


type SourceMode = "manual" | "variable"
type ImageFormat = "svg" | "png"
type Variation = "waving" | "fixed-width" | "fixed-height"

interface FlagpediaFlagProps {
    sourceMode: SourceMode
    imageFormat: ImageFormat
    country: string
    countryName: string
    cornerRadius: number
    variation: Variation
    wavingSize: string
    fixedWidthSize: string
    fixedHeightSize: string
    altText: string
    style?: React.CSSProperties
}

interface CountryRecord {
    code: string
    name: string
}

const WAVING_SIZES = [
    "16x12",
    "20x15",
    "24x18",
    "28x21",
    "32x24",
    "36x27",
    "40x30",
    "48x36",
    "56x42",
    "60x45",
    "64x48",
    "72x54",
    "80x60",
    "84x63",
    "96x72",
    "108x81",
    "112x84",
    "120x90",
    "128x96",
    "144x108",
    "160x120",
    "192x144",
    "224x168",
    "256x192",
] as const

const FIXED_WIDTH_SIZES = [
    "w20",
    "w40",
    "w80",
    "w160",
    "w320",
    "w640",
    "w1280",
    "w2560",
] as const

const FIXED_HEIGHT_SIZES = [
    "h20",
    "h24",
    "h40",
    "h60",
    "h80",
    "h120",
    "h240",
] as const

const COUNTRY_RECORDS = [
    ["af", "Afghanistan"],
    ["us-al", "Alabama"],
    ["ax", "Åland Islands"],
    ["us-ak", "Alaska"],
    ["al", "Albania"],
    ["dz", "Algeria"],
    ["as", "American Samoa"],
    ["ad", "Andorra"],
    ["ao", "Angola"],
    ["ai", "Anguilla"],
    ["aq", "Antarctica"],
    ["ag", "Antigua and Barbuda"],
    ["ar", "Argentina"],
    ["us-az", "Arizona"],
    ["us-ar", "Arkansas"],
    ["am", "Armenia"],
    ["aw", "Aruba"],
    ["au", "Australia"],
    ["at", "Austria"],
    ["az", "Azerbaijan"],
    ["bs", "Bahamas"],
    ["bh", "Bahrain"],
    ["bd", "Bangladesh"],
    ["bb", "Barbados"],
    ["by", "Belarus"],
    ["be", "Belgium"],
    ["bz", "Belize"],
    ["bj", "Benin"],
    ["bm", "Bermuda"],
    ["bt", "Bhutan"],
    ["bo", "Bolivia"],
    ["ba", "Bosnia and Herzegovina"],
    ["bw", "Botswana"],
    ["bv", "Bouvet Island"],
    ["br", "Brazil"],
    ["io", "British Indian Ocean Territory"],
    ["vg", "British Virgin Islands"],
    ["bn", "Brunei"],
    ["bg", "Bulgaria"],
    ["bf", "Burkina Faso"],
    ["bi", "Burundi"],
    ["us-ca", "California"],
    ["kh", "Cambodia"],
    ["cm", "Cameroon"],
    ["ca", "Canada"],
    ["cv", "Cape Verde"],
    ["bq", "Caribbean Netherlands"],
    ["ky", "Cayman Islands"],
    ["cf", "Central African Republic"],
    ["td", "Chad"],
    ["cl", "Chile"],
    ["cn", "China"],
    ["cx", "Christmas Island"],
    ["cc", "Cocos (Keeling) Islands"],
    ["co", "Colombia"],
    ["us-co", "Colorado"],
    ["km", "Comoros"],
    ["us-ct", "Connecticut"],
    ["ck", "Cook Islands"],
    ["cr", "Costa Rica"],
    ["ci", "Côte d'Ivoire (Ivory Coast)"],
    ["hr", "Croatia"],
    ["cu", "Cuba"],
    ["cw", "Curaçao"],
    ["cy", "Cyprus"],
    ["cz", "Czechia"],
    ["us-de", "Delaware"],
    ["dk", "Denmark"],
    ["dj", "Djibouti"],
    ["dm", "Dominica"],
    ["do", "Dominican Republic"],
    ["cd", "DR Congo"],
    ["ec", "Ecuador"],
    ["eg", "Egypt"],
    ["sv", "El Salvador"],
    ["gb-eng", "England"],
    ["gq", "Equatorial Guinea"],
    ["er", "Eritrea"],
    ["ee", "Estonia"],
    ["sz", "Eswatini (Swaziland)"],
    ["et", "Ethiopia"],
    ["eu", "European Union"],
    ["fk", "Falkland Islands"],
    ["fo", "Faroe Islands"],
    ["fj", "Fiji"],
    ["fi", "Finland"],
    ["us-fl", "Florida"],
    ["fr", "France"],
    ["gf", "French Guiana"],
    ["pf", "French Polynesia"],
    ["tf", "French Southern and Antarctic Lands"],
    ["ga", "Gabon"],
    ["gm", "Gambia"],
    ["ge", "Georgia"],
    ["us-ga", "Georgia"],
    ["de", "Germany"],
    ["gh", "Ghana"],
    ["gi", "Gibraltar"],
    ["gr", "Greece"],
    ["gl", "Greenland"],
    ["gd", "Grenada"],
    ["gp", "Guadeloupe"],
    ["gu", "Guam"],
    ["gt", "Guatemala"],
    ["gg", "Guernsey"],
    ["gn", "Guinea"],
    ["gw", "Guinea-Bissau"],
    ["gy", "Guyana"],
    ["ht", "Haiti"],
    ["us-hi", "Hawaii"],
    ["hm", "Heard Island and McDonald Islands"],
    ["hn", "Honduras"],
    ["hk", "Hong Kong"],
    ["hu", "Hungary"],
    ["is", "Iceland"],
    ["us-id", "Idaho"],
    ["us-il", "Illinois"],
    ["in", "India"],
    ["us-in", "Indiana"],
    ["id", "Indonesia"],
    ["us-ia", "Iowa"],
    ["ir", "Iran"],
    ["iq", "Iraq"],
    ["ie", "Ireland"],
    ["im", "Isle of Man"],
    ["il", "Israel"],
    ["it", "Italy"],
    ["jm", "Jamaica"],
    ["jp", "Japan"],
    ["je", "Jersey"],
    ["jo", "Jordan"],
    ["us-ks", "Kansas"],
    ["kz", "Kazakhstan"],
    ["us-ky", "Kentucky"],
    ["ke", "Kenya"],
    ["ki", "Kiribati"],
    ["xk", "Kosovo"],
    ["kw", "Kuwait"],
    ["kg", "Kyrgyzstan"],
    ["la", "Laos"],
    ["lv", "Latvia"],
    ["lb", "Lebanon"],
    ["ls", "Lesotho"],
    ["lr", "Liberia"],
    ["ly", "Libya"],
    ["li", "Liechtenstein"],
    ["lt", "Lithuania"],
    ["us-la", "Louisiana"],
    ["lu", "Luxembourg"],
    ["mo", "Macau"],
    ["mg", "Madagascar"],
    ["us-me", "Maine"],
    ["mw", "Malawi"],
    ["my", "Malaysia"],
    ["mv", "Maldives"],
    ["ml", "Mali"],
    ["mt", "Malta"],
    ["mh", "Marshall Islands"],
    ["mq", "Martinique"],
    ["us-md", "Maryland"],
    ["us-ma", "Massachusetts"],
    ["mr", "Mauritania"],
    ["mu", "Mauritius"],
    ["yt", "Mayotte"],
    ["mx", "Mexico"],
    ["us-mi", "Michigan"],
    ["fm", "Micronesia"],
    ["us-mn", "Minnesota"],
    ["us-ms", "Mississippi"],
    ["us-mo", "Missouri"],
    ["md", "Moldova"],
    ["mc", "Monaco"],
    ["mn", "Mongolia"],
    ["us-mt", "Montana"],
    ["me", "Montenegro"],
    ["ms", "Montserrat"],
    ["ma", "Morocco"],
    ["mz", "Mozambique"],
    ["mm", "Myanmar"],
    ["na", "Namibia"],
    ["nr", "Nauru"],
    ["us-ne", "Nebraska"],
    ["np", "Nepal"],
    ["nl", "Netherlands"],
    ["us-nv", "Nevada"],
    ["nc", "New Caledonia"],
    ["us-nh", "New Hampshire"],
    ["us-nj", "New Jersey"],
    ["us-nm", "New Mexico"],
    ["us-ny", "New York"],
    ["nz", "New Zealand"],
    ["ni", "Nicaragua"],
    ["ne", "Niger"],
    ["ng", "Nigeria"],
    ["nu", "Niue"],
    ["nf", "Norfolk Island"],
    ["us-nc", "North Carolina"],
    ["us-nd", "North Dakota"],
    ["kp", "North Korea"],
    ["mk", "North Macedonia"],
    ["gb-nir", "Northern Ireland"],
    ["mp", "Northern Mariana Islands"],
    ["no", "Norway"],
    ["us-oh", "Ohio"],
    ["us-ok", "Oklahoma"],
    ["om", "Oman"],
    ["us-or", "Oregon"],
    ["pk", "Pakistan"],
    ["pw", "Palau"],
    ["ps", "Palestine"],
    ["pa", "Panama"],
    ["pg", "Papua New Guinea"],
    ["py", "Paraguay"],
    ["us-pa", "Pennsylvania"],
    ["pe", "Peru"],
    ["ph", "Philippines"],
    ["pn", "Pitcairn Islands"],
    ["pl", "Poland"],
    ["pt", "Portugal"],
    ["pr", "Puerto Rico"],
    ["qa", "Qatar"],
    ["cg", "Republic of the Congo"],
    ["re", "Réunion"],
    ["us-ri", "Rhode Island"],
    ["ro", "Romania"],
    ["ru", "Russia"],
    ["rw", "Rwanda"],
    ["bl", "Saint Barthélemy"],
    ["sh", "Saint Helena, Ascension and Tristan da Cunha"],
    ["kn", "Saint Kitts and Nevis"],
    ["lc", "Saint Lucia"],
    ["mf", "Saint Martin"],
    ["pm", "Saint Pierre and Miquelon"],
    ["vc", "Saint Vincent and the Grenadines"],
    ["ws", "Samoa"],
    ["sm", "San Marino"],
    ["st", "São Tomé and Príncipe"],
    ["sa", "Saudi Arabia"],
    ["gb-sct", "Scotland"],
    ["sn", "Senegal"],
    ["rs", "Serbia"],
    ["sc", "Seychelles"],
    ["sl", "Sierra Leone"],
    ["sg", "Singapore"],
    ["sx", "Sint Maarten"],
    ["sk", "Slovakia"],
    ["si", "Slovenia"],
    ["sb", "Solomon Islands"],
    ["so", "Somalia"],
    ["za", "South Africa"],
    ["us-sc", "South Carolina"],
    ["us-sd", "South Dakota"],
    ["gs", "South Georgia"],
    ["kr", "South Korea"],
    ["ss", "South Sudan"],
    ["es", "Spain"],
    ["lk", "Sri Lanka"],
    ["sd", "Sudan"],
    ["sr", "Suriname"],
    ["sj", "Svalbard and Jan Mayen"],
    ["se", "Sweden"],
    ["ch", "Switzerland"],
    ["sy", "Syria"],
    ["tw", "Taiwan"],
    ["tj", "Tajikistan"],
    ["tz", "Tanzania"],
    ["us-tn", "Tennessee"],
    ["us-tx", "Texas"],
    ["th", "Thailand"],
    ["tl", "Timor-Leste"],
    ["tg", "Togo"],
    ["tk", "Tokelau"],
    ["to", "Tonga"],
    ["tt", "Trinidad and Tobago"],
    ["tn", "Tunisia"],
    ["tr", "Turkey"],
    ["tm", "Turkmenistan"],
    ["tc", "Turks and Caicos Islands"],
    ["tv", "Tuvalu"],
    ["ug", "Uganda"],
    ["ua", "Ukraine"],
    ["ae", "United Arab Emirates"],
    ["gb", "United Kingdom"],
    ["un", "United Nations"],
    ["us", "United States"],
    ["um", "United States Minor Outlying Islands"],
    ["vi", "United States Virgin Islands"],
    ["uy", "Uruguay"],
    ["us-ut", "Utah"],
    ["uz", "Uzbekistan"],
    ["vu", "Vanuatu"],
    ["va", "Vatican City (Holy See)"],
    ["ve", "Venezuela"],
    ["us-vt", "Vermont"],
    ["vn", "Vietnam"],
    ["us-va", "Virginia"],
    ["gb-wls", "Wales"],
    ["wf", "Wallis and Futuna"],
    ["us-wa", "Washington"],
    ["us-wv", "West Virginia"],
    ["eh", "Western Sahara"],
    ["us-wi", "Wisconsin"],
    ["us-wy", "Wyoming"],
    ["ye", "Yemen"],
    ["zm", "Zambia"],
    ["zw", "Zimbabwe"],
] as const

const COUNTRY_INDEX: CountryRecord[] = COUNTRY_RECORDS.map(([code, name]) => ({
    code,
    name,
}))

const COUNTRY_CODES = COUNTRY_INDEX.map(({ code }) => code)

const COUNTRY_NAME_COUNTS = new Map<string, number>()
for (const { name } of COUNTRY_INDEX) {
    COUNTRY_NAME_COUNTS.set(name, (COUNTRY_NAME_COUNTS.get(name) ?? 0) + 1)
}

const COUNTRY_OPTION_TITLES = COUNTRY_INDEX.map(({ code, name }) =>
    (COUNTRY_NAME_COUNTS.get(name) ?? 0) > 1
        ? `${name} (${code.toUpperCase()})`
        : name
)

const COUNTRY_BY_CODE = new Map<string, CountryRecord>()
for (const record of COUNTRY_INDEX) {
    COUNTRY_BY_CODE.set(record.code.toLowerCase(), record)
}

const COUNTRY_ALIASES: Record<string, string> = {
    britain: "gb",
    burma: "mm",
    "cabo verde": "cv",
    "congo brazzaville": "cg",
    "congo kinshasa": "cd",
    "czech republic": "cz",
    drc: "cd",
    "east timor": "tl",
    "great britain": "gb",
    "lao pdr": "la",
    macedonia: "mk",
    "republic of congo": "cg",
    "republic of korea": "kr",
    "russian federation": "ru",
    turkiye: "tr",
    uae: "ae",
    uk: "gb",
    usa: "us",
    "u k": "gb",
    "u s a": "us",
    vatican: "va",
    "united states of america": "us",
    "democratic peoples republic of korea": "kp",
    "democratic republic of the congo": "cd",
}

const COUNTRY_BY_SEARCH_KEY = new Map<string, CountryRecord>()
for (const record of COUNTRY_INDEX) {
    for (const key of buildSearchKeys(record)) {
        if (!COUNTRY_BY_SEARCH_KEY.has(key)) {
            COUNTRY_BY_SEARCH_KEY.set(key, record)
        }
    }
}

function normalizeCountryValue(value: string): string {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/&/g, " and ")
        .replace(/[’'`]/g, "")
        .replace(/[^a-z0-9]+/g, " ")
        .trim()
}

function buildSearchKeys(record: CountryRecord): string[] {
    const keys = new Set<string>()
    const withoutParentheses = record.name
        .replace(/\s*\([^)]*\)\s*/g, " ")
        .trim()

    keys.add(normalizeCountryValue(record.code))
    keys.add(normalizeCountryValue(record.name))

    if (withoutParentheses !== record.name) {
        keys.add(normalizeCountryValue(withoutParentheses))
    }

    for (const match of record.name.matchAll(/\(([^)]+)\)/g)) {
        keys.add(normalizeCountryValue(match[1]))
    }

    return Array.from(keys).filter(Boolean)
}

function resolveCountryRecord(
    sourceMode: SourceMode,
    country: string,
    countryName: string
): CountryRecord | null {
    const rawValue = sourceMode === "manual" ? country : countryName
    const trimmedValue = rawValue.trim()

    if (!trimmedValue) {
        return null
    }

    const directCode = COUNTRY_BY_CODE.get(trimmedValue.toLowerCase())
    if (directCode) {
        return directCode
    }

    const normalizedValue = normalizeCountryValue(trimmedValue)
    if (!normalizedValue) {
        return null
    }

    const aliasCode = COUNTRY_ALIASES[normalizedValue]
    if (aliasCode) {
        return COUNTRY_BY_CODE.get(aliasCode) ?? null
    }

    return COUNTRY_BY_SEARCH_KEY.get(normalizedValue) ?? null
}

function buildFlagUrl(props: FlagpediaFlagProps, countryCode: string): string {
    const lowerCode = countryCode.toLowerCase()

    if (props.imageFormat === "svg") {
        return `https://flagcdn.com/${lowerCode}.svg`
    }

    if (props.variation === "fixed-width") {
        return `https://flagcdn.com/${props.fixedWidthSize}/${lowerCode}.png`
    }

    if (props.variation === "fixed-height") {
        return `https://flagcdn.com/${props.fixedHeightSize}/${lowerCode}.png`
    }

    return `https://flagcdn.com/${props.wavingSize}/${lowerCode}.png`
}

function renderPlaceholder(
    style: React.CSSProperties | undefined,
    cornerRadius: number,
    title: string,
    subtitle: string
) {
    return (
        <div
            style={{
                ...style,
                alignItems: "center",
                background:
                    "linear-gradient(135deg, rgba(244,245,247,0.95), rgba(234,237,241,0.95))",
                border: "1px dashed rgba(0, 0, 0, 0.18)",
                borderRadius: cornerRadius,
                boxSizing: "border-box",
                color: "#17212B",
                display: "flex",
                flexDirection: "column",
                gap: 6,
                justifyContent: "center",
                overflow: "hidden",
                padding: 16,
                textAlign: "center",
            }}
        >
            <div
                style={{
                    fontFamily:
                        '"Inter", "Plus Jakarta Sans", "Segoe UI", sans-serif',
                    fontSize: 14,
                    fontWeight: 600,
                    lineHeight: 1.3,
                }}
            >
                {title}
            </div>
            <div
                style={{
                    color: "rgba(23, 33, 43, 0.72)",
                    fontFamily:
                        '"Inter", "Plus Jakarta Sans", "Segoe UI", sans-serif',
                    fontSize: 12,
                    lineHeight: 1.45,
                    maxWidth: 280,
                }}
            >
                {subtitle}
            </div>
        </div>
    )
}

/**
 * @framerDisableUnlink
 * @framerIntrinsicWidth 160
 * @framerIntrinsicHeight 120
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function FlagpediaFlag(props: FlagpediaFlagProps) {
    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const record = resolveCountryRecord(
        props.sourceMode,
        props.country,
        props.countryName
    )
    const src = record ? buildFlagUrl(props, record.code) : ""
    const [hasError, setHasError] = React.useState(false)

    React.useEffect(() => {
        setHasError(false)
    }, [src])

    if (!record) {
        const isEmptyVariable =
            props.sourceMode === "variable" && props.countryName.trim() === ""

        if (isEmptyVariable) {
            return renderPlaceholder(
                props.style,
                props.cornerRadius,
                "Country value is empty",
                isCanvas
                    ? "Bind a text variable with a country name or ISO code."
                    : "No country name was provided to the component."
            )
        }

        return renderPlaceholder(
            props.style,
            props.cornerRadius,
            "Country not found",
            `No Flagpedia match for "${props.countryName.trim()}". Try a full country name or ISO code.`
        )
    }

    if (hasError) {
        return renderPlaceholder(
            props.style,
            props.cornerRadius,
            "Flag could not load",
            `Flagpedia asset failed for ${record.name}. Check the selected size or network access.`
        )
    }

    const altText = props.altText.trim() || `${record.name} flag`

    return (
        <div
            style={{
                ...props.style,
                borderRadius: props.cornerRadius,
                display: "flex",
                overflow: "hidden",
            }}
        >
            <img
                src={src}
                alt={altText}
                draggable={false}
                decoding="async"
                onError={() => setHasError(true)}
                style={{
                    borderRadius: "inherit",
                    display: "block",
                    height: "100%",
                    objectFit: "contain",
                    objectPosition: "center",
                    width: "100%",
                }}
            />
        </div>
    )
}

FlagpediaFlag.defaultProps = {
    altText: "",
    cornerRadius: 0,
    country: "us",
    countryName: "",
    fixedHeightSize: "h40",
    fixedWidthSize: "w80",
    imageFormat: "svg",
    sourceMode: "manual",
    variation: "waving",
    wavingSize: "64x48",
} satisfies FlagpediaFlagProps

addPropertyControls(FlagpediaFlag, {
    sourceMode: {
        type: ControlType.Enum,
        title: "Source",
        options: ["manual", "variable"],
        optionTitles: ["Manual", "Variable"],
        displaySegmentedControl: true,
        defaultValue: FlagpediaFlag.defaultProps.sourceMode,
    },
    imageFormat: {
        type: ControlType.Enum,
        title: "Format",
        options: ["svg", "png"],
        optionTitles: ["SVG", "PNG"],
        displaySegmentedControl: true,
        defaultValue: FlagpediaFlag.defaultProps.imageFormat,
    },
    country: {
        type: ControlType.Enum,
        title: "Country",
        options: COUNTRY_CODES,
        optionTitles: COUNTRY_OPTION_TITLES,
        defaultValue: FlagpediaFlag.defaultProps.country,
        hidden(props) {
            return props.sourceMode !== "manual"
        },
    },
    countryName: {
        type: ControlType.String,
        title: "Country",
        defaultValue: FlagpediaFlag.defaultProps.countryName,
        placeholder: "United States / DE / South Korea",
        description: "Accepts country name or ISO code from a variable.",
        hidden(props) {
            return props.sourceMode !== "variable"
        },
    },
    variation: {
        type: ControlType.Enum,
        title: "Variant",
        options: ["waving", "fixed-width", "fixed-height"],
        optionTitles: ["Waving", "Fixed width", "Fixed height"],
        displaySegmentedControl: true,
        segmentedControlDirection: "vertical",
        defaultValue: FlagpediaFlag.defaultProps.variation,
        hidden(props) {
            return props.imageFormat !== "png"
        },
    },
    wavingSize: {
        type: ControlType.Enum,
        title: "Size",
        options: [...WAVING_SIZES],
        optionTitles: [...WAVING_SIZES],
        defaultValue: FlagpediaFlag.defaultProps.wavingSize,
        hidden(props) {
            return props.imageFormat !== "png" || props.variation !== "waving"
        },
    },
    fixedWidthSize: {
        type: ControlType.Enum,
        title: "Size",
        options: [...FIXED_WIDTH_SIZES],
        optionTitles: [...FIXED_WIDTH_SIZES],
        defaultValue: FlagpediaFlag.defaultProps.fixedWidthSize,
        hidden(props) {
            return (
                props.imageFormat !== "png" || props.variation !== "fixed-width"
            )
        },
    },
    fixedHeightSize: {
        type: ControlType.Enum,
        title: "Size",
        options: [...FIXED_HEIGHT_SIZES],
        optionTitles: [...FIXED_HEIGHT_SIZES],
        defaultValue: FlagpediaFlag.defaultProps.fixedHeightSize,
        hidden(props) {
            return (
                props.imageFormat !== "png" ||
                props.variation !== "fixed-height"
            )
        },
    },
    altText: {
        type: ControlType.String,
        title: "Alt",
        defaultValue: FlagpediaFlag.defaultProps.altText,
        placeholder: "Auto",
    },
    cornerRadius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: FlagpediaFlag.defaultProps.cornerRadius,
        min: 0,
        max: 999,
        step: 1,
        unit: "px",
        displayStepper: true,
        description: "[Support ❤️](https://iaroslavv.gumroad.com/coffee)",
    },
})
