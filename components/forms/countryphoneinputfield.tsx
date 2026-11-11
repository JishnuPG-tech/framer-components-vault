import {
    useState,
    useMemo,
    useRef,
    useEffect,
    useId,
    startTransition,
    type CSSProperties,
} from "react"
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

interface Locale {
    code: string
    name: string
    flag: string
    phoneCode: string
}

type BorderValue = {
    borderColor?: string
    borderStyle?: string
    borderWidth?: number
    borderRadius?: string
    borderTopWidth?: number
    borderRightWidth?: number
    borderBottomWidth?: number
    borderLeftWidth?: number
    borderTopStyle?: string
    borderRightStyle?: string
    borderBottomStyle?: string
    borderLeftStyle?: string
    borderTopColor?: string
    borderRightColor?: string
    borderBottomColor?: string
    borderLeftColor?: string
}

interface CountryPhoneInputFieldProps {
    inputMode: "phone" | "country"
    required: boolean
    defaultCountry: string
    flag: {
        show: boolean
        type: "emoji" | "image"
        radius: string
    }
    icon: {
        color: string
        size: number
    }
    showPhoneCode: boolean
    limiter: boolean
    font: any
    textColor: string
    placeholder: {
        default: string
        formatted: boolean
        color: string
    }
    backgroundColorFill: string
    border: BorderValue
    focus: {
        fill: string
        border: BorderValue
        shadowColor: string
        shadowOffsetX: number
        shadowOffsetY: number
        shadowBlur: number
    }
    dropdown: {
        padding:
            | string
            | {
                  paddingTop?: string | number
                  paddingRight?: string | number
                  paddingBottom?: string | number
                  paddingLeft?: string | number
              }
        radius: string
        border: BorderValue
        fill: string
        shadowColor: string
        shadowOffsetX: number
        shadowOffsetY: number
        shadowBlur: number
        height: number
        row: {
            color: string
            hover: string
            radius: string
        }
    }
    searchfield: {
        placeholder: string
        color: string
        radius: string
        border: BorderValue
        fill: string
        shadowColor: string
        shadowOffsetX: number
        shadowOffsetY: number
        shadowBlur: number
    }
    radius: string
    padding:
        | string
        | {
              paddingTop?: string | number
              paddingRight?: string | number
              paddingBottom?: string | number
              paddingLeft?: string | number
          }
    style?: CSSProperties
    inputShadow: string
    transition: {
        type: string
        duration: number
        delay?: number
        ease: any
        stiffness?: number
        damping?: number
    }
}

const locales: Locale[] = [
    { code: "AD", name: "Andorra", flag: "🇦🇩", phoneCode: "+376" },
    { code: "AE", name: "United Arab Emirates", flag: "🇦🇪", phoneCode: "+971" },
    { code: "AF", name: "Afghanistan", flag: "🇦🇫", phoneCode: "+93" },
    { code: "AL", name: "Albania", flag: "🇦🇱", phoneCode: "+355" },
    { code: "AM", name: "Armenia", flag: "🇦🇲", phoneCode: "+374" },
    { code: "AO", name: "Angola", flag: "🇦🇴", phoneCode: "+244" },
    { code: "AR", name: "Argentina", flag: "🇦🇷", phoneCode: "+54" },
    { code: "AT", name: "Austria", flag: "🇦🇹", phoneCode: "+43" },
    { code: "AU", name: "Australia", flag: "🇦🇺", phoneCode: "+61" },
    { code: "AW", name: "Aruba", flag: "🇦🇼", phoneCode: "+297" },
    { code: "AZ", name: "Azerbaijan", flag: "🇦🇿", phoneCode: "+994" },
    {
        code: "BA",
        name: "Bosnia and Herzegovina",
        flag: "🇧🇦",
        phoneCode: "+387",
    },
    { code: "BB", name: "Barbados", flag: "🇧🇧", phoneCode: "+1" },
    { code: "BD", name: "Bangladesh", flag: "🇧🇩", phoneCode: "+880" },
    { code: "BE", name: "Belgium", flag: "🇧🇪", phoneCode: "+32" },
    { code: "BF", name: "Burkina Faso", flag: "🇧🇫", phoneCode: "+226" },
    { code: "BG", name: "Bulgaria", flag: "🇧🇬", phoneCode: "+359" },
    { code: "BH", name: "Bahrain", flag: "🇧🇭", phoneCode: "+973" },
    { code: "BI", name: "Burundi", flag: "🇧🇮", phoneCode: "+257" },
    { code: "BJ", name: "Benin", flag: "🇧🇯", phoneCode: "+229" },
    { code: "BN", name: "Brunei", flag: "🇧🇳", phoneCode: "+673" },
    { code: "BO", name: "Bolivia", flag: "🇧🇴", phoneCode: "+591" },
    { code: "BR", name: "Brazil", flag: "🇧🇷", phoneCode: "+55" },
    { code: "BT", name: "Bhutan", flag: "🇧🇹", phoneCode: "+975" },
    { code: "BW", name: "Botswana", flag: "🇧🇼", phoneCode: "+267" },
    { code: "BY", name: "Belarus", flag: "🇧🇾", phoneCode: "+375" },
    { code: "BZ", name: "Belize", flag: "🇧🇿", phoneCode: "+501" },
    { code: "CA", name: "Canada", flag: "🇨🇦", phoneCode: "+1" },
    {
        code: "CD",
        name: "Democratic Republic of the Congo",
        flag: "🇨🇩",
        phoneCode: "+243",
    },
    {
        code: "CF",
        name: "Central African Republic",
        flag: "🇨🇫",
        phoneCode: "+236",
    },
    {
        code: "CG",
        name: "Republic of the Congo",
        flag: "🇨🇬",
        phoneCode: "+242",
    },
    { code: "CH", name: "Switzerland", flag: "🇨🇭", phoneCode: "+41" },
    { code: "CI", name: "Côte d'Ivoire", flag: "🇨🇮", phoneCode: "+225" },
    { code: "CK", name: "Cook Islands", flag: "🇨🇰", phoneCode: "+682" },
    { code: "CL", name: "Chile", flag: "🇨🇱", phoneCode: "+56" },
    { code: "CM", name: "Cameroon", flag: "🇨🇲", phoneCode: "+237" },
    { code: "CN", name: "China", flag: "🇨🇳", phoneCode: "+86" },
    { code: "CO", name: "Colombia", flag: "🇨🇴", phoneCode: "+57" },
    { code: "CR", name: "Costa Rica", flag: "🇨🇷", phoneCode: "+506" },
    { code: "CU", name: "Cuba", flag: "🇨🇺", phoneCode: "+53" },
    { code: "CV", name: "Cape Verde", flag: "🇨🇻", phoneCode: "+238" },
    { code: "CY", name: "Cyprus", flag: "🇨🇾", phoneCode: "+357" },
    { code: "CZ", name: "Czech Republic", flag: "🇨🇿", phoneCode: "+420" },
    { code: "DE", name: "Germany", flag: "🇩🇪", phoneCode: "+49" },
    { code: "DJ", name: "Djibouti", flag: "🇩🇯", phoneCode: "+253" },
    { code: "DK", name: "Denmark", flag: "🇩🇰", phoneCode: "+45" },
    { code: "DM", name: "Dominica", flag: "🇩🇲", phoneCode: "+1" },
    { code: "DO", name: "Dominican Republic", flag: "🇩🇴", phoneCode: "+1" },
    { code: "DZ", name: "Algeria", flag: "🇩🇿", phoneCode: "+213" },
    { code: "EC", name: "Ecuador", flag: "🇪🇨", phoneCode: "+593" },
    { code: "EE", name: "Estonia", flag: "🇪🇪", phoneCode: "+372" },
    { code: "EG", name: "Egypt", flag: "🇪🇬", phoneCode: "+20" },
    { code: "ER", name: "Eritrea", flag: "🇪🇷", phoneCode: "+291" },
    { code: "ES", name: "Spain", flag: "🇪🇸", phoneCode: "+34" },
    { code: "ET", name: "Ethiopia", flag: "🇪🇹", phoneCode: "+251" },
    { code: "FI", name: "Finland", flag: "🇫🇮", phoneCode: "+358" },
    { code: "FJ", name: "Fiji", flag: "🇫🇯", phoneCode: "+679" },
    { code: "FM", name: "Micronesia", flag: "🇫🇲", phoneCode: "+691" },
    { code: "FO", name: "Faroe Islands", flag: "🇫🇴", phoneCode: "+298" },
    { code: "FR", name: "France", flag: "🇫🇷", phoneCode: "+33" },
    { code: "GA", name: "Gabon", flag: "🇬🇦", phoneCode: "+241" },
    { code: "GB", name: "United Kingdom", flag: "🇬🇧", phoneCode: "+44" },
    { code: "GD", name: "Grenada", flag: "🇬🇩", phoneCode: "+1" },
    { code: "GE", name: "Georgia", flag: "🇬🇪", phoneCode: "+995" },
    { code: "GH", name: "Ghana", flag: "🇬🇭", phoneCode: "+233" },
    { code: "GL", name: "Greenland", flag: "🇬🇱", phoneCode: "+299" },
    { code: "GM", name: "Gambia", flag: "🇬🇲", phoneCode: "+220" },
    { code: "GN", name: "Guinea", flag: "🇬🇳", phoneCode: "+224" },
    { code: "GQ", name: "Equatorial Guinea", flag: "🇬🇶", phoneCode: "+240" },
    { code: "GR", name: "Greece", flag: "🇬🇷", phoneCode: "+30" },
    { code: "GT", name: "Guatemala", flag: "🇬🇹", phoneCode: "+502" },
    { code: "GW", name: "Guinea-Bissau", flag: "🇬🇼", phoneCode: "+245" },
    { code: "GY", name: "Guyana", flag: "🇬🇾", phoneCode: "+592" },
    { code: "HK", name: "Hong Kong", flag: "🇭🇰", phoneCode: "+852" },
    { code: "HN", name: "Honduras", flag: "🇭🇳", phoneCode: "+504" },
    { code: "HR", name: "Croatia", flag: "🇭🇷", phoneCode: "+385" },
    { code: "HT", name: "Haiti", flag: "🇭🇹", phoneCode: "+509" },
    { code: "HU", name: "Hungary", flag: "🇭🇺", phoneCode: "+36" },
    { code: "ID", name: "Indonesia", flag: "🇮🇩", phoneCode: "+62" },
    { code: "IE", name: "Ireland", flag: "🇮🇪", phoneCode: "+353" },
    { code: "IL", name: "Israel", flag: "🇮🇱", phoneCode: "+972" },
    { code: "IN", name: "India", flag: "🇮🇳", phoneCode: "+91" },
    { code: "IQ", name: "Iraq", flag: "🇮🇶", phoneCode: "+964" },
    { code: "IR", name: "Iran", flag: "🇮🇷", phoneCode: "+98" },
    { code: "IS", name: "Iceland", flag: "🇮🇸", phoneCode: "+354" },
    { code: "IT", name: "Italy", flag: "🇮🇹", phoneCode: "+39" },
    { code: "JM", name: "Jamaica", flag: "🇯🇲", phoneCode: "+1" },
    { code: "JO", name: "Jordan", flag: "🇯🇴", phoneCode: "+962" },
    { code: "JP", name: "Japan", flag: "🇯🇵", phoneCode: "+81" },
    { code: "KE", name: "Kenya", flag: "🇰🇪", phoneCode: "+254" },
    { code: "KG", name: "Kyrgyzstan", flag: "🇰🇬", phoneCode: "+996" },
    { code: "KH", name: "Cambodia", flag: "🇰🇭", phoneCode: "+855" },
    { code: "KI", name: "Kiribati", flag: "🇰🇮", phoneCode: "+686" },
    { code: "KM", name: "Comoros", flag: "🇰🇲", phoneCode: "+269" },
    { code: "KP", name: "North Korea", flag: "🇰🇵", phoneCode: "+850" },
    { code: "KR", name: "South Korea", flag: "🇰🇷", phoneCode: "+82" },
    { code: "KW", name: "Kuwait", flag: "🇰🇼", phoneCode: "+965" },
    { code: "KZ", name: "Kazakhstan", flag: "🇰🇿", phoneCode: "+7" },
    { code: "LA", name: "Laos", flag: "🇱🇦", phoneCode: "+856" },
    { code: "LB", name: "Lebanon", flag: "🇱🇧", phoneCode: "+961" },
    { code: "LI", name: "Liechtenstein", flag: "🇱🇮", phoneCode: "+423" },
    { code: "LK", name: "Sri Lanka", flag: "🇱🇰", phoneCode: "+94" },
    { code: "LR", name: "Liberia", flag: "🇱🇷", phoneCode: "+231" },
    { code: "LS", name: "Lesotho", flag: "🇱🇸", phoneCode: "+266" },
    { code: "LT", name: "Lithuania", flag: "🇱🇹", phoneCode: "+370" },
    { code: "LU", name: "Luxembourg", flag: "🇱🇺", phoneCode: "+352" },
    { code: "LV", name: "Latvia", flag: "🇱🇻", phoneCode: "+371" },
    { code: "LY", name: "Libya", flag: "🇱🇾", phoneCode: "+218" },
    { code: "MA", name: "Morocco", flag: "🇲🇦", phoneCode: "+212" },
    { code: "MC", name: "Monaco", flag: "🇲🇨", phoneCode: "+377" },
    { code: "MD", name: "Moldova", flag: "🇲🇩", phoneCode: "+373" },
    { code: "ME", name: "Montenegro", flag: "🇲🇪", phoneCode: "+382" },
    { code: "MG", name: "Madagascar", flag: "🇲🇬", phoneCode: "+261" },
    { code: "MH", name: "Marshall Islands", flag: "🇲🇭", phoneCode: "+692" },
    { code: "MK", name: "North Macedonia", flag: "🇲🇰", phoneCode: "+389" },
    { code: "ML", name: "Mali", flag: "🇲🇱", phoneCode: "+223" },
    { code: "MM", name: "Myanmar", flag: "🇲🇲", phoneCode: "+95" },
    { code: "MN", name: "Mongolia", flag: "🇲🇳", phoneCode: "+976" },
    { code: "MO", name: "Macao", flag: "🇲🇴", phoneCode: "+853" },
    { code: "MR", name: "Mauritania", flag: "🇲🇷", phoneCode: "+222" },
    { code: "MT", name: "Malta", flag: "🇲🇹", phoneCode: "+356" },
    { code: "MU", name: "Mauritius", flag: "🇲🇺", phoneCode: "+230" },
    { code: "MV", name: "Maldives", flag: "🇲🇻", phoneCode: "+960" },
    { code: "MW", name: "Malawi", flag: "🇲🇼", phoneCode: "+265" },
    { code: "MX", name: "Mexico", flag: "🇲🇽", phoneCode: "+52" },
    { code: "MY", name: "Malaysia", flag: "🇲🇾", phoneCode: "+60" },
    { code: "MZ", name: "Mozambique", flag: "🇲🇿", phoneCode: "+258" },
    { code: "NA", name: "Namibia", flag: "🇳🇦", phoneCode: "+264" },
    { code: "NE", name: "Niger", flag: "🇳🇪", phoneCode: "+227" },
    { code: "NG", name: "Nigeria", flag: "🇳🇬", phoneCode: "+234" },
    { code: "NI", name: "Nicaragua", flag: "🇳🇮", phoneCode: "+505" },
    { code: "NL", name: "Netherlands", flag: "🇳🇱", phoneCode: "+31" },
    { code: "NO", name: "Norway", flag: "🇳🇴", phoneCode: "+47" },
    { code: "NP", name: "Nepal", flag: "🇳🇵", phoneCode: "+977" },
    { code: "NR", name: "Nauru", flag: "🇳🇷", phoneCode: "+674" },
    { code: "NZ", name: "New Zealand", flag: "🇳🇿", phoneCode: "+64" },
    { code: "OM", name: "Oman", flag: "🇴🇲", phoneCode: "+968" },
    { code: "PA", name: "Panama", flag: "🇵🇦", phoneCode: "+507" },
    { code: "PE", name: "Peru", flag: "🇵🇪", phoneCode: "+51" },
    { code: "PG", name: "Papua New Guinea", flag: "🇵🇬", phoneCode: "+675" },
    { code: "PH", name: "Philippines", flag: "🇵🇭", phoneCode: "+63" },
    { code: "PK", name: "Pakistan", flag: "🇵🇰", phoneCode: "+92" },
    { code: "PL", name: "Poland", flag: "🇵🇱", phoneCode: "+48" },
    { code: "PT", name: "Portugal", flag: "🇵🇹", phoneCode: "+351" },
    { code: "PW", name: "Palau", flag: "🇵🇼", phoneCode: "+680" },
    { code: "PY", name: "Paraguay", flag: "🇵🇾", phoneCode: "+595" },
    { code: "QA", name: "Qatar", flag: "🇶🇦", phoneCode: "+974" },
    { code: "RO", name: "Romania", flag: "🇷🇴", phoneCode: "+40" },
    { code: "RS", name: "Serbia", flag: "🇷🇸", phoneCode: "+381" },
    { code: "RU", name: "Russia", flag: "🇷🇺", phoneCode: "+7" },
    { code: "RW", name: "Rwanda", flag: "🇷🇼", phoneCode: "+250" },
    { code: "SA", name: "Saudi Arabia", flag: "🇸🇦", phoneCode: "+966" },
    { code: "SB", name: "Solomon Islands", flag: "🇸🇧", phoneCode: "+677" },
    { code: "SC", name: "Seychelles", flag: "🇸🇨", phoneCode: "+248" },
    { code: "SD", name: "Sudan", flag: "🇸🇩", phoneCode: "+249" },
    { code: "SE", name: "Sweden", flag: "🇸🇪", phoneCode: "+46" },
    { code: "SG", name: "Singapore", flag: "🇸🇬", phoneCode: "+65" },
    { code: "SI", name: "Slovenia", flag: "🇸🇮", phoneCode: "+386" },
    { code: "SK", name: "Slovakia", flag: "🇸🇰", phoneCode: "+421" },
    { code: "SL", name: "Sierra Leone", flag: "🇸🇱", phoneCode: "+232" },
    { code: "SM", name: "San Marino", flag: "🇸🇲", phoneCode: "+378" },
    { code: "SN", name: "Senegal", flag: "🇸🇳", phoneCode: "+221" },
    { code: "SO", name: "Somalia", flag: "🇸🇴", phoneCode: "+252" },
    { code: "SR", name: "Suriname", flag: "🇸🇷", phoneCode: "+597" },
    { code: "SS", name: "South Sudan", flag: "🇸🇸", phoneCode: "+211" },
    {
        code: "ST",
        name: "São Tomé and Príncipe",
        flag: "🇸🇹",
        phoneCode: "+239",
    },
    { code: "SV", name: "El Salvador", flag: "🇸🇻", phoneCode: "+503" },
    { code: "SY", name: "Syria", flag: "🇸🇾", phoneCode: "+963" },
    { code: "SZ", name: "Eswatini", flag: "🇸🇿", phoneCode: "+268" },
    { code: "TD", name: "Chad", flag: "🇹🇩", phoneCode: "+235" },
    { code: "TG", name: "Togo", flag: "🇹🇬", phoneCode: "+228" },
    { code: "TH", name: "Thailand", flag: "🇹🇭", phoneCode: "+66" },
    { code: "TJ", name: "Tajikistan", flag: "🇹🇯", phoneCode: "+992" },
    { code: "TL", name: "Timor-Leste", flag: "🇹🇱", phoneCode: "+670" },
    { code: "TM", name: "Turkmenistan", flag: "🇹🇲", phoneCode: "+993" },
    { code: "TN", name: "Tunisia", flag: "🇹🇳", phoneCode: "+216" },
    { code: "TO", name: "Tonga", flag: "🇹🇴", phoneCode: "+676" },
    { code: "TR", name: "Turkey", flag: "🇹🇷", phoneCode: "+90" },
    { code: "TT", name: "Trinidad and Tobago", flag: "🇹🇹", phoneCode: "+1" },
    { code: "TV", name: "Tuvalu", flag: "🇹🇻", phoneCode: "+688" },
    { code: "TW", name: "Taiwan", flag: "🇹🇼", phoneCode: "+886" },
    { code: "TZ", name: "Tanzania", flag: "🇹🇿", phoneCode: "+255" },
    { code: "UA", name: "Ukraine", flag: "🇺🇦", phoneCode: "+380" },
    { code: "UG", name: "Uganda", flag: "🇺🇬", phoneCode: "+256" },
    { code: "US", name: "United States", flag: "🇺🇸", phoneCode: "+1" },
    { code: "UY", name: "Uruguay", flag: "🇺🇾", phoneCode: "+598" },
    { code: "UZ", name: "Uzbekistan", flag: "🇺🇿", phoneCode: "+998" },
    { code: "VE", name: "Venezuela", flag: "🇻🇪", phoneCode: "+58" },
    { code: "VN", name: "Vietnam", flag: "🇻🇳", phoneCode: "+84" },
    { code: "VU", name: "Vanuatu", flag: "🇻🇺", phoneCode: "+678" },
    { code: "WS", name: "Samoa", flag: "🇼🇸", phoneCode: "+685" },
    { code: "YE", name: "Yemen", flag: "🇾🇪", phoneCode: "+967" },
    { code: "ZA", name: "South Africa", flag: "🇿🇦", phoneCode: "+27" },
    { code: "ZM", name: "Zambia", flag: "🇿🇲", phoneCode: "+260" },
    { code: "ZW", name: "Zimbabwe", flag: "🇿🇼", phoneCode: "+263" },
].sort((a, b) => a.name.localeCompare(b.name))

const flagImageMap: Record<string, string> = Object.fromEntries(
    locales.map((locale) => [
        locale.code,
        `https://flagcdn.com/w80/${locale.code.toLowerCase()}.png`,
    ])
)

const phoneFormats: Record<string, string> = {
    AD: "XXX XXX",
    AE: "XX XXX XXXX",
    AF: "XX XXX XXXX",
    AL: "XX XXX XXXX",
    AM: "XX XXXXXX",
    AO: "XXX XXX XXX",
    AR: "X XX XXXX XXXX",
    AT: "XXX XXXXXX",
    AU: "XXX XXX XXX",
    AW: "XXX XXXX",
    AZ: "XX XXX XX XX",
    BA: "XX XXX XXX",
    BB: "XXX XXX XXXX",
    BD: "XXXX XXXXXX",
    BE: "XXX XX XX XX",
    BF: "XX XX XX XX",
    BG: "XX XXX XXX",
    BH: "XXXX XXXX",
    BI: "XX XX XX XX",
    BJ: "XX XX XX XX XX",
    BN: "XXX XXXX",
    BO: "XXXXXXXX",
    BR: "XX XXXXX XXXX",
    BT: "XX XX XX XX",
    BW: "XX XXX XXX",
    BY: "XX XXX XX XX",
    BZ: "XXX XXXX",
    CA: "XXX XXX XXXX",
    CD: "XXX XXX XXX",
    CF: "XX XX XX XX",
    CG: "XX XXX XXXX",
    CH: "XX XXX XX XX",
    CI: "XX XX XX XXXX",
    CK: "XX XXX",
    CL: "X XXXX XXXX",
    CM: "X XX XX XX XX",
    CN: "XXX XXXX XXXX",
    CO: "XXX XXXXXXX",
    CR: "XXXX XXXX",
    CU: "X XXXXXXX",
    CV: "XXX XX XX",
    CY: "XX XXXXXX",
    CZ: "XXX XXX XXX",
    DE: "XXXX XXXXXXX",
    DJ: "XX XX XX XX",
    DK: "XX XX XX XX",
    DM: "XXX XXX XXXX",
    DO: "XXX XXX XXXX",
    DZ: "XXX XX XX XX",
    EC: "XX XXX XXXX",
    EE: "XXXX XXXX",
    EG: "XX XXXXXXXX",
    ER: "X XXX XXX",
    ES: "XXX XX XX XX",
    ET: "XX XXX XXXX",
    FI: "XX XXXXXXX",
    FJ: "XXX XXXX",
    FM: "XXX XXXX",
    FO: "XXXXXX",
    FR: "X XX XX XX XX",
    GA: "XX XX XX XX",
    GB: "XXXX XXXXXX",
    GD: "XXX XXX XXXX",
    GE: "XXX XX XX XX",
    GH: "XX XXX XXXX",
    GL: "XX XX XX",
    GM: "XXX XXXX",
    GN: "XXX XX XX XX",
    GQ: "XXX XXX XXX",
    GR: "XXX XXX XXXX",
    GT: "XXXX XXXX",
    GW: "XXX XXX XXX",
    GY: "XXX XXXX",
    HK: "XXXX XXXX",
    HN: "XXXX XXXX",
    HR: "XX XXX XXXX",
    HT: "XX XX XXXX",
    HU: "XX XXX XXXX",
    ID: "XXX XXX XXX",
    IE: "XX XXX XXXX",
    IL: "XX XXX XXXX",
    IN: "XXXXX XXXXX",
    IQ: "XXX XXX XXXX",
    IR: "XXX XXX XXXX",
    IS: "XXX XXXX",
    IT: "XXX XXX XXXX",
    JM: "XXX XXX XXXX",
    JO: "X XXXX XXXX",
    JP: "XX XXXX XXXX",
    KE: "XXX XXXXXX",
    KG: "XXX XXX XXX",
    KH: "XX XXX XXX",
    KI: "XXXXXXXX",
    KM: "XXX XX XX",
    KP: "XXX XXX XXXX",
    KR: "XX XXXX XXXX",
    KW: "XXX XXXXX",
    KZ: "XXX XXX XXXX",
    LA: "XX XX XXX XXX",
    LB: "XX XXX XXX",
    LI: "XXX XXX XXX",
    LK: "XX XXX XXXX",
    LR: "XX XXX XXXX",
    LS: "XXXX XXXX",
    LT: "XXX XXXXX",
    LU: "XXX XXX XXX",
    LV: "XX XXX XXX",
    LY: "XX XXXXXXX",
    MA: "XXX XXXXXX",
    MC: "X XX XX XX XX",
    MD: "XXX XX XXX",
    ME: "XX XXX XXX",
    MG: "XX XX XXX XX",
    MH: "XXX XXXX",
    MK: "XX XXX XXX",
    ML: "XX XX XX XX",
    MM: "X XXX XXXX",
    MN: "XXXX XXXX",
    MO: "XXXX XXXX",
    MR: "XX XX XX XX",
    MT: "XXXX XXXX",
    MU: "XXXX XXXX",
    MV: "XXX XXXX",
    MW: "XXX XX XX XX",
    MX: "XXX XXX XXXX",
    MY: "XX XXX XXXX",
    MZ: "XX XXX XXXX",
    NA: "XX XXX XXXX",
    NE: "XX XX XX XX",
    NG: "XXX XXX XXXX",
    NI: "XXXX XXXX",
    NL: "X XXXXXXXX",
    NO: "XX XX XX XX",
    NP: "XXX XXXXXXX",
    NR: "XXX XXXX",
    NZ: "XX XXX XXXX",
    OM: "XXXX XXXX",
    PA: "XXXX XXXX",
    PE: "XXX XXX XXX",
    PG: "XXXX XXXX",
    PH: "XXX XXX XXXX",
    PK: "XXX XXXXXXX",
    PL: "XXX XXX XXX",
    PT: "XXX XXX XXX",
    PW: "XXX XXXX",
    PY: "XXX XXXXXX",
    QA: "XXXX XXXX",
    RO: "XXX XXX XXX",
    RS: "XX XXXXXXX",
    RU: "XXX XXX XX XX",
    RW: "XXX XXX XXX",
    SA: "XX XXX XXXX",
    SB: "XX XXXXX",
    SC: "X XXX XXX",
    SD: "XX XXX XXXX",
    SE: "XX XXX XX XX",
    SG: "XXXX XXXX",
    SI: "XX XXX XXX",
    SK: "XXX XXX XXX",
    SL: "XX XXXXXX",
    SM: "XX XX XX XX",
    SN: "XX XXX XX XX",
    SO: "X XXXXXXX",
    SR: "XXX XXXX",
    SS: "XXX XXX XXX",
    ST: "XXX XXXX",
    SV: "XXXX XXXX",
    SY: "XXX XXX XXX",
    SZ: "XXXX XXXX",
    TD: "XX XX XX XX",
    TG: "XX XX XX XX",
    TH: "XX XXX XXXX",
    TJ: "XX XXX XXXX",
    TL: "XXXX XXXX",
    TM: "XX XXXXXX",
    TN: "XX XXX XXX",
    TO: "XXX XXXX",
    TR: "XXX XXX XX XX",
    TT: "XXX XXX XXXX",
    TV: "XX XXXX",
    TW: "XXX XXX XXX",
    TZ: "XXX XXX XXX",
    UA: "XX XXX XXXX",
    UG: "XXX XXXXXX",
    US: "XXX XXX XXXX",
    UY: "XX XXX XXX",
    UZ: "XX XXX XX XX",
    VE: "XXX XXXXXXX",
    VN: "XXX XXX XXX",
    VU: "XXX XXXX",
    WS: "XX XXXXX",
    YE: "XXX XXX XXX",
    ZA: "XX XXX XXXX",
    ZM: "XX XXXXXXX",
    ZW: "XX XXX XXXX",
}

const phonePlaceholders: Record<string, string> = {
    AD: "312 345",
    AE: "50 123 4567",
    AF: "70 123 4567",
    AL: "67 212 3456",
    AM: "77 123456",
    AO: "923 123 456",
    AR: "9 11 2345 6789",
    AT: "664 123456",
    AU: "412 345 678",
    AW: "560 1234",
    AZ: "40 123 45 67",
    BA: "61 123 456",
    BB: "246 250 1234",
    BD: "1812 345678",
    BE: "470 12 34 56",
    BF: "70 12 34 56",
    BG: "43 012 345",
    BH: "3600 1234",
    BI: "79 56 12 34",
    BJ: "01 95 12 34 56",
    BN: "712 3456",
    BO: "71234567",
    BR: "11 96123 4567",
    BT: "17 12 34 56",
    BW: "71 123 456",
    BY: "29 491 19 11",
    BZ: "622 1234",
    CA: "506 234 5678",
    CD: "991 234 567",
    CF: "70 01 23 45",
    CG: "06 123 4567",
    CH: "78 123 45 67",
    CI: "01 23 45 6789",
    CK: "71 234",
    CL: "2 2123 4567",
    CM: "6 71 23 45 67",
    CN: "131 2345 6789",
    CO: "321 1234567",
    CR: "8312 3456",
    CU: "5 1234567",
    CV: "991 12 34",
    CY: "96 123456",
    CZ: "601 123 456",
    DE: "1512 3456789",
    DJ: "77 83 10 01",
    DK: "34 41 23 45",
    DM: "767 225 1234",
    DO: "809 234 5678",
    DZ: "551 23 45 67",
    EC: "99 123 4567",
    EE: "5123 4567",
    EG: "10 01234567",
    ER: "7 123 456",
    ES: "612 34 56 78",
    ET: "91 123 4567",
    FI: "41 2345678",
    FJ: "701 2345",
    FM: "350 1234",
    FO: "211234",
    FR: "6 12 34 56 78",
    GA: "06 03 12 34",
    GB: "7400 123456",
    GD: "473 403 1234",
    GE: "555 12 34 56",
    GH: "23 123 4567",
    GL: "22 12 34",
    GM: "301 2345",
    GN: "601 12 34 56",
    GQ: "222 123 456",
    GR: "691 234 5678",
    GT: "5123 4567",
    GW: "955 012 345",
    GY: "609 1234",
    HK: "5123 4567",
    HN: "9123 4567",
    HR: "92 123 4567",
    HT: "34 10 1234",
    HU: "20 123 4567",
    ID: "812 345 678",
    IE: "85 012 3456",
    IL: "50 234 5678",
    IN: "81234 56789",
    IQ: "791 234 5678",
    IR: "912 345 6789",
    IS: "611 1234",
    IT: "312 345 6789",
    JM: "876 210 1234",
    JO: "7 9012 3456",
    JP: "90 1234 5678",
    KE: "712 123456",
    KG: "700 123 456",
    KH: "91 234 567",
    KI: "72001234",
    KM: "321 23 45",
    KP: "192 123 4567",
    KR: "10 2000 0000",
    KW: "500 12345",
    KZ: "771 000 9998",
    LA: "20 23 123 456",
    LB: "71 123 456",
    LI: "660 234 567",
    LK: "71 234 5678",
    LR: "77 012 3456",
    LS: "5012 3456",
    LT: "612 34567",
    LU: "628 123 456",
    LV: "21 234 567",
    LY: "91 2345678",
    MA: "650 123456",
    MC: "6 12 34 56 78",
    MD: "621 12 345",
    ME: "67 622 901",
    MG: "32 12 345 67",
    MH: "235 1234",
    MK: "72 345 678",
    ML: "65 01 23 45",
    MM: "9 212 3456",
    MN: "8812 3456",
    MO: "6612 3456",
    MR: "22 12 34 56",
    MT: "9696 1234",
    MU: "5251 2345",
    MV: "771 2345",
    MW: "991 23 45 67",
    MX: "222 123 4567",
    MY: "12 345 6789",
    MZ: "82 123 4567",
    NA: "81 123 4567",
    NE: "93 12 34 56",
    NG: "802 123 4567",
    NI: "8123 4567",
    NL: "6 12345678",
    NO: "40 61 23 45",
    NP: "984 1234567",
    NR: "555 1234",
    NZ: "21 123 4567",
    OM: "9212 3456",
    PA: "6123 4567",
    PE: "912 345 678",
    PG: "7012 3456",
    PH: "905 123 4567",
    PK: "301 2345678",
    PL: "512 345 678",
    PT: "912 345 678",
    PW: "620 1234",
    PY: "961 456789",
    QA: "3312 3456",
    RO: "712 034 567",
    RS: "60 1234567",
    RU: "912 345 67 89",
    RW: "720 123 456",
    SA: "51 234 5678",
    SB: "74 21234",
    SC: "2 510 123",
    SD: "91 123 1234",
    SE: "70 123 45 67",
    SG: "8123 4567",
    SI: "31 234 567",
    SK: "912 123 456",
    SL: "25 123456",
    SM: "66 66 12 12",
    SN: "70 123 45 67",
    SO: "7 1123456",
    SR: "741 2345",
    SS: "977 123 456",
    ST: "981 2345",
    SV: "7012 3456",
    SY: "944 567 890",
    SZ: "7612 3456",
    TD: "63 01 23 45",
    TG: "90 11 23 45",
    TH: "81 234 5678",
    TJ: "91 712 3456",
    TL: "7721 2345",
    TM: "66 123456",
    TN: "20 123 456",
    TO: "771 5123",
    TR: "501 234 56 78",
    TT: "868 291 1234",
    TV: "90 1234",
    TW: "912 345 678",
    TZ: "621 234 567",
    UA: "50 123 4567",
    UG: "712 345678",
    US: "201 555 0123",
    UY: "94 231 234",
    UZ: "91 234 56 78",
    VE: "412 1234567",
    VN: "912 345 678",
    VU: "591 2345",
    WS: "72 12345",
    YE: "712 345 678",
    ZA: "71 123 4567",
    ZM: "95 5123456",
    ZW: "71 234 5678",
}

const formatPhoneNumber = (
    value: string,
    countryCode: string,
    allowOverflow: boolean = false
): string => {
    const format = phoneFormats[countryCode]
    if (!format) return value

    const digitsOnly = value.replace(/\D/g, "")
    let formatted = ""
    let digitIndex = 0

    for (let i = 0; i < format.length && digitIndex < digitsOnly.length; i++) {
        const char = format[i]
        if (char === "X") {
            formatted += digitsOnly[digitIndex]
            digitIndex++
        } else {
            formatted += char
        }
    }

    if (allowOverflow && digitIndex < digitsOnly.length) {
        const extraDigits = digitsOnly.slice(digitIndex)
        formatted += (formatted ? " " : "") + extraDigits
    }

    return formatted
}

const getMaxPhoneLength = (countryCode: string): number => {
    const format = phoneFormats[countryCode]
    if (!format) return 15
    return format.split("X").length - 1
}

function getFlagImageUrl(countryCode: string): string {
    return flagImageMap[countryCode]
}

function resolveBorderStyle(border?: BorderValue): CSSProperties {
    if (!border) return {}

    const hasTRBL =
        border.borderTopWidth !== undefined ||
        border.borderRightWidth !== undefined ||
        border.borderBottomWidth !== undefined ||
        border.borderLeftWidth !== undefined ||
        border.borderTopColor !== undefined ||
        border.borderRightColor !== undefined ||
        border.borderBottomColor !== undefined ||
        border.borderLeftColor !== undefined ||
        border.borderTopStyle !== undefined ||
        border.borderRightStyle !== undefined ||
        border.borderBottomStyle !== undefined ||
        border.borderLeftStyle !== undefined

    if (hasTRBL) {
        return {
            borderTopWidth: `${border.borderTopWidth ?? border.borderWidth ?? 0}px`,
            borderRightWidth: `${border.borderRightWidth ?? border.borderWidth ?? 0}px`,
            borderBottomWidth: `${border.borderBottomWidth ?? border.borderWidth ?? 0}px`,
            borderLeftWidth: `${border.borderLeftWidth ?? border.borderWidth ?? 0}px`,
            borderTopStyle:
                border.borderTopStyle ?? border.borderStyle ?? "solid",
            borderRightStyle:
                border.borderRightStyle ?? border.borderStyle ?? "solid",
            borderBottomStyle:
                border.borderBottomStyle ?? border.borderStyle ?? "solid",
            borderLeftStyle:
                border.borderLeftStyle ?? border.borderStyle ?? "solid",
            borderTopColor:
                border.borderTopColor ?? border.borderColor ?? "transparent",
            borderRightColor:
                border.borderRightColor ?? border.borderColor ?? "transparent",
            borderBottomColor:
                border.borderBottomColor ?? border.borderColor ?? "transparent",
            borderLeftColor:
                border.borderLeftColor ?? border.borderColor ?? "transparent",
        }
    }

    return {
        borderWidth: `${border.borderWidth ?? 0}px`,
        borderStyle: border.borderStyle ?? "solid",
        borderColor: border.borderColor ?? "transparent",
    }
}

function resolvePaddingStyle(
    padding?:
        | string
        | {
              paddingTop?: string | number
              paddingRight?: string | number
              paddingBottom?: string | number
              paddingLeft?: string | number
          }
): CSSProperties {
    if (typeof padding === "string") return { padding }

    const toCss = (value?: string | number) =>
        value === undefined
            ? "0px"
            : typeof value === "number"
              ? `${value}px`
              : value

    return {
        paddingTop: toCss(padding?.paddingTop),
        paddingRight: toCss(padding?.paddingRight),
        paddingBottom: toCss(padding?.paddingBottom),
        paddingLeft: toCss(padding?.paddingLeft),
    }
}

function getFocusRingShadow(
    border: BorderValue,
    shadowColor: string,
    shadowOffsetX: number,
    shadowOffsetY: number,
    shadowBlur: number
) {
    const top = border.borderTopWidth ?? border.borderWidth ?? 0
    const right = border.borderRightWidth ?? border.borderWidth ?? 0
    const bottom = border.borderBottomWidth ?? border.borderWidth ?? 0
    const left = border.borderLeftWidth ?? border.borderWidth ?? 0

    const topColor =
        border.borderTopColor ?? border.borderColor ?? "transparent"
    const rightColor =
        border.borderRightColor ?? border.borderColor ?? "transparent"
    const bottomColor =
        border.borderBottomColor ?? border.borderColor ?? "transparent"
    const leftColor =
        border.borderLeftColor ?? border.borderColor ?? "transparent"

    const parts: string[] = []

    if (top > 0) parts.push(`inset 0 ${top}px 0 0 ${topColor}`)
    if (right > 0) parts.push(`inset -${right}px 0 0 0 ${rightColor}`)
    if (bottom > 0) parts.push(`inset 0 -${bottom}px 0 0 ${bottomColor}`)
    if (left > 0) parts.push(`inset ${left}px 0 0 0 ${leftColor}`)

    parts.push(
        `${shadowOffsetX}px ${shadowOffsetY}px ${shadowBlur}px ${shadowColor}`
    )

    return parts.join(", ")
}

function getDividerBorderStyle(border?: BorderValue): string {
    const width = border?.borderRightWidth ?? border?.borderWidth ?? 1
    const style = border?.borderRightStyle ?? border?.borderStyle ?? "solid"
    const color =
        border?.borderRightColor ?? border?.borderColor ?? "transparent"
    return `${width}px ${style} ${color}`
}

function FlagDisplay({
    countryCode,
    flagEmoji,
    flagType,
    radius,
    fontSize = "18px",
    lineHeight = "1.2",
}: {
    countryCode: string
    flagEmoji: string
    flagType: "emoji" | "image"
    radius: string
    fontSize?: string
    lineHeight?: string | number
}) {
    const [useFallback, setUseFallback] = useState(false)
    const imageUrl = getFlagImageUrl(countryCode)

    if (flagType === "emoji" || useFallback || !imageUrl) {
        return (
            <span
                style={{
                    fontSize,
                    lineHeight,
                    display: "inline-block",
                    verticalAlign: "middle",
                }}
            >
                {flagEmoji}
            </span>
        )
    }

    return (
        <img
            src={imageUrl}
            alt={`${countryCode} flag`}
            style={{
                width: "16px",
                height: "12px",
                verticalAlign: "middle",
                objectFit: "cover",
                borderRadius: radius,
                display: "block",
                flexShrink: 0,
                imageRendering: "auto",
            }}
            onError={() => setUseFallback(true)}
        />
    )
}

/**
 * Country & Phone Number Input Field
 *
 * @framerIntrinsicWidth 300
 * @framerIntrinsicHeight 40
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-auto
 *
 * @framerDisableUnlink
 */
export default function CountryPhoneInputField(
    props: CountryPhoneInputFieldProps
) {
    const {
        inputMode,
        required,
        defaultCountry,
        flag,
        icon,
        showPhoneCode,
        limiter,
        font,
        textColor,
        placeholder,
        backgroundColorFill,
        border,
        focus: {
            fill: focusFill,
            border: focusBorder,
            shadowColor,
            shadowOffsetX,
            shadowOffsetY,
            shadowBlur,
        },
        dropdown,
        searchfield,
        radius,
        padding,
        inputShadow,
        transition,
        style,
    } = props

    const resolvedBorder = resolveBorderStyle(border)
    const resolvedDropdownBorder = resolveBorderStyle(dropdown.border)
    const resolvedSearchBorder = resolveBorderStyle(searchfield.border)
    const resolvedPadding = resolvePaddingStyle(padding)
    const resolvedDropdownPadding = resolvePaddingStyle(dropdown.padding)
    const focusShadow = getFocusRingShadow(
        focusBorder,
        shadowColor,
        shadowOffsetX,
        shadowOffsetY,
        shadowBlur
    )

    const [selectedCountry, setSelectedCountry] = useState<Locale>(
        () => locales.find((c) => c.code === defaultCountry) || locales[0]
    )
    const [isOpen, setIsOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")
    const [isFocused, setIsFocused] = useState(false)
    const [phoneNumber, setPhoneNumber] = useState("")
    const [phoneInputFocused, setPhoneInputFocused] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const searchInputRef = useRef<HTMLInputElement>(null)

    const instanceId = useId().replace(/:/g, "")
    const instanceClass = `country-phone-input-${instanceId}`

    const getPlaceholder = (countryCode: string): string => {
        const rawPlaceholder = placeholder?.default?.trim() || ""
        const isDefaultCountry = countryCode === defaultCountry

        if (rawPlaceholder && isDefaultCountry) {
            if (!placeholder?.formatted) return rawPlaceholder

            const digitsOnly = rawPlaceholder.replace(/\D/g, "")
            if (!digitsOnly) return rawPlaceholder

            return formatPhoneNumber(digitsOnly, countryCode, !limiter)
        }

        return (
            phonePlaceholders[countryCode] ||
            phoneFormats[countryCode] ||
            "XXX XXX XXXX"
        )
    }

    useEffect(() => {
        if (!phoneNumber || !selectedCountry) return

        const digitsOnly = phoneNumber.replace(/\D/g, "")

        if (limiter) {
            const maxLength = getMaxPhoneLength(selectedCountry.code)

            if (digitsOnly.length <= maxLength) {
                const reformatted = formatPhoneNumber(
                    phoneNumber,
                    selectedCountry.code,
                    false
                )
                if (reformatted !== phoneNumber) {
                    startTransition(() => setPhoneNumber(reformatted))
                }
            } else {
                const truncatedDigits = digitsOnly.slice(0, maxLength)
                const reformatted = formatPhoneNumber(
                    truncatedDigits,
                    selectedCountry.code,
                    false
                )
                startTransition(() => setPhoneNumber(reformatted))
            }
        } else {
            const reformatted = formatPhoneNumber(
                phoneNumber,
                selectedCountry.code,
                true
            )
            if (reformatted !== phoneNumber) {
                startTransition(() => setPhoneNumber(reformatted))
            }
        }
    }, [selectedCountry, limiter, phoneNumber])

    useEffect(() => {
        if (
            typeof window !== "undefined" &&
            window.location &&
            window.location.hostname === "localhost"
        ) {
            const newCountry = locales.find((c) => c.code === defaultCountry)
            if (newCountry && newCountry.code !== selectedCountry.code) {
                startTransition(() => setSelectedCountry(newCountry))
            }
        }
    }, [defaultCountry, selectedCountry.code])

    useEffect(() => {
        if (typeof window === "undefined" || inputMode !== "phone") return

        const styleId = `country-phone-input-placeholder-style-${instanceId}`
        let styleTag = document.getElementById(
            styleId
        ) as HTMLStyleElement | null

        if (!styleTag) {
            styleTag = document.createElement("style")
            styleTag.id = styleId
            document.head.appendChild(styleTag)
        }

        const shouldShowPlaceholderColor = !phoneNumber

        styleTag.innerHTML = `
        .${instanceClass} .framer-form-input::placeholder {
            color: ${
                shouldShowPlaceholderColor ? placeholder.color : textColor
            };
            line-height: ${font.lineHeight || 1.2};
            opacity: 1;
        }

        .${instanceClass} .country-phone-search-input::placeholder {
            color: ${searchfield.color};
            opacity: 1;
        }
    `

        return () => {
            styleTag?.remove()
        }
    }, [
        instanceId,
        instanceClass,
        placeholder.color,
        inputMode,
        phoneNumber,
        textColor,
        font.lineHeight,
        searchfield.color,
    ])

    const filteredCountries = useMemo(() => {
        if (!searchTerm) return locales
        return locales.filter(
            (country) =>
                country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                country.code.toLowerCase().includes(searchTerm.toLowerCase())
        )
    }, [searchTerm])

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node)
            ) {
                startTransition(() => {
                    setIsOpen(false)
                    setSearchTerm("")
                    setIsFocused(false)
                })
            }
        }

        if (typeof window !== "undefined") {
            document.addEventListener("mousedown", handleClickOutside)
            return () =>
                document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [])

    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            searchInputRef.current.focus()
        }
    }, [isOpen])

    const handleToggle = () => {
        startTransition(() => setIsOpen(!isOpen))
    }

    const handleCountrySelect = (country: Locale) => {
        startTransition(() => {
            setSelectedCountry(country)
            setIsOpen(false)
            setSearchTerm("")
        })
    }

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        startTransition(() => setSearchTerm(e.target.value))
    }

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        const digitsOnly = value.replace(/\D/g, "")

        if (limiter) {
            const maxLength = getMaxPhoneLength(selectedCountry.code)
            if (digitsOnly.length > maxLength) return
        }

        const formattedValue = formatPhoneNumber(
            value,
            selectedCountry.code,
            !limiter
        )
        startTransition(() => setPhoneNumber(formattedValue))
    }

    const inputContainerVariants = {
        normal: {
            backgroundColor: backgroundColorFill,
            ...resolvedBorder,
            boxShadow: inputShadow || "none",
            transition,
        },
        focused: {
            backgroundColor: focusFill,
            ...resolvedBorder,
            boxShadow: focusShadow,
            transition,
        },
    }

    const showPhoneInput = inputMode === "phone"

    return (
        <motion.div
            ref={containerRef}
            className={instanceClass}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                boxSizing: "border-box",
                ...font,
                ...style,
            }}
        >
            <motion.div
                variants={inputContainerVariants}
                animate={
                    isFocused || phoneInputFocused || isOpen
                        ? "focused"
                        : "normal"
                }
                transition={transition}
                initial="normal"
                style={{
                    display: "flex",
                    alignItems: "stretch",
                    borderRadius: radius || border.borderRadius,
                    height: "100%",
                    boxSizing: "border-box",
                    overflow: "hidden",
                    ...resolvedPadding,
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        cursor: "pointer",
                        borderRight: showPhoneInput
                            ? getDividerBorderStyle(border)
                            : "none",
                        minWidth: showPhoneInput ? "auto" : "100%",
                        flex: showPhoneInput ? "0 0 auto" : "1",
                        padding: "0",
                    }}
                    onClick={handleToggle}
                    onFocus={() => startTransition(() => setIsFocused(true))}
                    onBlur={(e) => {
                        if (
                            !containerRef.current?.contains(
                                e.relatedTarget as Node
                            )
                        ) {
                            startTransition(() => setIsFocused(false))
                        }
                    }}
                    tabIndex={0}
                    role="combobox"
                    aria-expanded={isOpen}
                    aria-haspopup="listbox"
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                        }}
                    >
                        {flag.show && (
                            <FlagDisplay
                                countryCode={selectedCountry.code}
                                flagEmoji={selectedCountry.flag}
                                flagType={flag.type}
                                radius={flag.radius}
                                fontSize="18px"
                                lineHeight={font.lineHeight || "1"}
                            />
                        )}

                        {!showPhoneInput && (
                            <span
                                style={{
                                    color: textColor,
                                    lineHeight: font.lineHeight || 1,
                                }}
                            >
                                {selectedCountry.name}
                            </span>
                        )}

                        {showPhoneCode && showPhoneInput && (
                            <span
                                style={{
                                    color: textColor,
                                    lineHeight: font.lineHeight || 1,
                                }}
                            >
                                {selectedCountry.phoneCode}
                            </span>
                        )}
                    </div>

                    <motion.svg
                        width={icon.size}
                        height={icon.size}
                        viewBox="0 0 16 16"
                        fill="none"
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={transition}
                        style={{
                            color: icon.color,
                            marginRight: showPhoneInput ? "8px" : "0",
                            marginLeft: showPhoneInput ? "8px" : "auto",
                            flexShrink: 0,
                        }}
                    >
                        <path
                            d="M4 6L8 10L12 6"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </motion.svg>
                </div>

                {showPhoneInput && (
                    <>
                        <motion.input
                            type="tel"
                            name="Phone Number"
                            required={required}
                            value={phoneNumber}
                            onChange={handlePhoneChange}
                            placeholder={getPlaceholder(selectedCountry.code)}
                            onFocus={() =>
                                startTransition(() =>
                                    setPhoneInputFocused(true)
                                )
                            }
                            onBlur={() =>
                                startTransition(() =>
                                    setPhoneInputFocused(false)
                                )
                            }
                            className="framer-form-input framer-form-input-empty"
                            style={{
                                flex: 1,
                                border: "none",
                                outline: "none",
                                padding: "0 0 0 8px",
                                backgroundColor: "transparent",
                                color: textColor,
                                fontSize: "inherit",
                                fontFamily: "inherit",
                                fontWeight: "inherit",
                                letterSpacing: "inherit",
                                lineHeight: font.lineHeight || 1,
                                display: "flex",
                                alignItems: "center",
                            }}
                        />
                        <input
                            type="hidden"
                            name="Full Phone Number"
                            value={
                                phoneNumber
                                    ? `${selectedCountry.phoneCode} ${phoneNumber}`
                                    : ""
                            }
                        />
                    </>
                )}

                {!showPhoneInput && (
                    <input
                        type="hidden"
                        name="Country"
                        value={selectedCountry.name}
                        className="framer-form-input"
                    />
                )}
            </motion.div>

            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={transition}
                    style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        backgroundColor: dropdown.fill,
                        ...resolvedDropdownBorder,
                        borderRadius: dropdown.radius,
                        marginTop: "8px",
                        height: `${dropdown.height}px`,
                        overflow: "hidden",
                        zIndex: 7,
                        boxShadow: `${dropdown.shadowOffsetX}px ${dropdown.shadowOffsetY}px ${dropdown.shadowBlur}px ${dropdown.shadowColor}`,
                    }}
                    role="listbox"
                >
                    <div style={resolvedDropdownPadding}>
                        <motion.input
                            ref={searchInputRef}
                            type="text"
                            placeholder={searchfield.placeholder}
                            value={searchTerm}
                            onChange={handleSearchChange}
                            className="country-phone-search-input"
                            style={{
                                width: "100%",
                                padding: "8px 12px",
                                ...resolvedSearchBorder,
                                borderRadius: searchfield.radius,
                                backgroundColor: searchfield.fill,
                                color: textColor,
                                outline: "none",
                                boxSizing: "border-box",
                                fontSize: font.fontSize,
                                fontFamily: font.fontFamily,
                                fontWeight: font.fontWeight,
                                letterSpacing: font.letterSpacing,
                                lineHeight: "1.2",
                                boxShadow: `${searchfield.shadowOffsetX}px ${searchfield.shadowOffsetY}px ${searchfield.shadowBlur}px ${searchfield.shadowColor}`,
                                overflow: "visible",
                            }}
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>

                    <div
                        style={{
                            height: `${dropdown.height}px`,
                            overflowY: "scroll",
                            ...resolvedDropdownPadding,
                            paddingTop: "0px",
                            boxSizing: "border-box",
                        }}
                    >
                        {filteredCountries.length > 0 ? (
                            filteredCountries.map((country) => {
                                const isActive =
                                    selectedCountry.code === country.code

                                return (
                                    <motion.div
                                        key={country.code}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            padding: "12px 16px",
                                            cursor: "pointer",
                                            backgroundColor: isActive
                                                ? dropdown.row.hover
                                                : "transparent",
                                            gap: "8px",
                                            lineHeight: "1.2",
                                            borderRadius: dropdown.row.radius,
                                        }}
                                        onClick={() =>
                                            handleCountrySelect(country)
                                        }
                                        onMouseEnter={(e) => {
                                            if (!isActive) {
                                                e.currentTarget.style.backgroundColor =
                                                    dropdown.row.hover
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor =
                                                isActive
                                                    ? dropdown.row.hover
                                                    : "transparent"
                                        }}
                                        role="option"
                                        aria-selected={isActive}
                                        whileHover={{
                                            backgroundColor: isActive
                                                ? dropdown.row.hover
                                                : dropdown.row.hover,
                                        }}
                                        transition={transition}
                                    >
                                        {flag.show && (
                                            <FlagDisplay
                                                countryCode={country.code}
                                                flagEmoji={country.flag}
                                                flagType={flag.type}
                                                radius={flag.radius}
                                                fontSize="16px"
                                                lineHeight="1.2"
                                            />
                                        )}

                                        <span
                                            style={{
                                                color: dropdown.row.color,
                                                flex: 1,
                                                lineHeight: "1.2",
                                            }}
                                        >
                                            {country.name}
                                        </span>

                                        {showPhoneCode && (
                                            <span
                                                style={{
                                                    color: dropdown.row.color,
                                                    fontSize: "14px",
                                                    lineHeight: "1.2",
                                                }}
                                            >
                                                {country.phoneCode}
                                            </span>
                                        )}
                                    </motion.div>
                                )
                            })
                        ) : (
                            <div
                                style={{
                                    padding: "12px 16px",
                                    color: dropdown.row.color,
                                    opacity: 0.5,
                                    lineHeight: "1.2",
                                }}
                            >
                                No matches found
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </motion.div>
    )
}

addPropertyControls(CountryPhoneInputField, {
    inputMode: {
        type: ControlType.Enum,
        title: "Variant",
        options: ["phone", "country"],
        optionTitles: ["Phone", "Locale"],
        defaultValue: "phone",
        displaySegmentedControl: true,
    },
    required: {
        type: ControlType.Boolean,
        title: "Required",
        defaultValue: false,
        enabledTitle: "Yes",
        disabledTitle: "No",
        hidden: ({ inputMode }) => inputMode !== "phone",
    },
    defaultCountry: {
        type: ControlType.Enum,
        title: "Default Locale",
        options: locales.map((c) => c.code),
        optionTitles: locales.map((c) => c.name),
        defaultValue: "DK",
    },
    flag: {
        type: ControlType.Object,
        title: "Flag",
        controls: {
            show: {
                type: ControlType.Boolean,
                title: "Show",
                defaultValue: true,
                enabledTitle: "Show",
                disabledTitle: "Hide",
            },
            type: {
                type: ControlType.Enum,
                title: "Type",
                options: ["emoji", "image"],
                optionTitles: ["Emoji", "Image"],
                defaultValue: "emoji",
                displaySegmentedControl: true,
                hidden: ({ show }) => !show,
            },
            radius: {
                type: ControlType.BorderRadius,
                title: "Radius",
                defaultValue: "2px",
                hidden: ({ show, type }) => !show || type !== "image",
            },
        },
    },
    icon: {
        type: ControlType.Object,
        title: "Icon",
        controls: {
            color: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: "rgba(237, 237, 237, 0.5)",
            },
            size: {
                type: ControlType.Number,
                title: "Size",
                defaultValue: 16,
                min: 8,
                max: 64,
                step: 1,
                unit: "px",
                displayStepper: true,
            },
        },
    },
    showPhoneCode: {
        type: ControlType.Boolean,
        title: "Phone Code",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        hidden: ({ inputMode }) => inputMode === "country",
    },
    limiter: {
        type: ControlType.Boolean,
        title: "Limiter",
        defaultValue: true,
        enabledTitle: "Yes",
        disabledTitle: "No",
        hidden: ({ inputMode }) => inputMode !== "phone",
    },
    placeholder: {
        type: ControlType.Object,
        title: "Placeholder",
        hidden: ({ inputMode }) => inputMode !== "phone",
        controls: {
            default: {
                type: ControlType.String,
                title: "Default",
                defaultValue: "",
                placeholder: "Phone number",
            },
            formatted: {
                type: ControlType.Boolean,
                title: "Formatted",
                defaultValue: true,
                enabledTitle: "Yes",
                disabledTitle: "No",
            },
            color: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: "#999999",
            },
        },
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        defaultValue: {
            fontSize: "15px",
            variant: "Regular",
            letterSpacing: "-0.01em",
            lineHeight: "1",
        },
        controls: "extended",
        defaultFontType: "sans-serif",
    },
    textColor: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "#EDEDED",
    },
    backgroundColorFill: {
        type: ControlType.Color,
        title: "Fill",
        defaultValue: "#2b2b2b",
    },
    radius: {
        type: ControlType.BorderRadius,
        title: "Radius",
        defaultValue: "10px",
    },
    padding: {
        type: ControlType.Padding,
        title: "Padding",
        defaultValue: "10px 12px 10px 12px",
    },
    border: {
        type: ControlType.Border,
        title: "Border",
        defaultValue: {
            borderWidth: 1,
            borderStyle: "solid",
            borderColor: "rgba(136, 136, 136, 0.1)",
        },
    },
    inputShadow: {
        type: ControlType.BoxShadow,
        title: "Shadows",
    },
    focus: {
        type: ControlType.Object,
        title: "Focus",
        controls: {
            fill: {
                type: ControlType.Color,
                title: "Fill",
                defaultValue: "#333333",
            },
            border: {
                type: ControlType.Border,
                title: "Border",
                defaultValue: {
                    borderWidth: 2,
                    borderStyle: "solid",
                    borderColor: "#0099FF",
                },
            },
            shadowColor: {
                type: ControlType.Color,
                title: "Shadow",
                defaultValue: "rgba(0, 153, 255, 0.15)",
            },
            shadowOffsetX: {
                type: ControlType.Number,
                title: "X",
                defaultValue: 0,
                min: -50,
                max: 50,
            },
            shadowOffsetY: {
                type: ControlType.Number,
                title: "Y",
                defaultValue: 4,
                min: -50,
                max: 50,
            },
            shadowBlur: {
                type: ControlType.Number,
                title: "Blur",
                defaultValue: 4,
                min: 0,
                max: 100,
            },
        },
    },
    dropdown: {
        type: ControlType.Object,
        title: "Dropdown",
        controls: {
            padding: {
                type: ControlType.Padding,
                title: "Padding",
                defaultValue: "8px",
            },
            radius: {
                type: ControlType.BorderRadius,
                title: "Radius",
                defaultValue: "10px",
            },
            border: {
                type: ControlType.Border,
                title: "Border",
                defaultValue: {
                    borderWidth: 1,
                    borderStyle: "solid",
                    borderColor: "rgba(136, 136, 136, 0.1)",
                },
            },
            fill: {
                type: ControlType.Color,
                title: "Fill",
                defaultValue: "#2b2b2b",
            },
            row: {
                type: ControlType.Object,
                title: "Row",
                controls: {
                    color: {
                        type: ControlType.Color,
                        title: "Color",
                        defaultValue: "#EDEDED",
                    },
                    hover: {
                        type: ControlType.Color,
                        title: "Hover",
                        defaultValue: "rgba(255, 255, 255, 0.05)",
                    },
                    radius: {
                        type: ControlType.BorderRadius,
                        title: "Radius",
                        defaultValue: "8px",
                    },
                },
            },
            shadowColor: {
                type: ControlType.Color,
                title: "Shadow",
                defaultValue: "rgba(43, 43, 43, 0.35)",
            },
            shadowOffsetX: {
                type: ControlType.Number,
                title: "X",
                defaultValue: 0,
                min: -50,
                max: 50,
            },
            shadowOffsetY: {
                type: ControlType.Number,
                title: "Y",
                defaultValue: 4,
                min: -50,
                max: 50,
            },
            shadowBlur: {
                type: ControlType.Number,
                title: "Blur",
                defaultValue: 8,
                min: 0,
                max: 100,
            },
            height: {
                type: ControlType.Number,
                title: "Height",
                defaultValue: 200,
                min: 100,
                step: 10,
                max: 500,
                unit: "px",
                displayStepper: true,
            },
        },
    },
    searchfield: {
        type: ControlType.Object,
        title: "Search",
        controls: {
            placeholder: {
                type: ControlType.String,
                title: "Placeholder",
                defaultValue: "Search countries...",
                placeholder: "Search countries...",
            },
            color: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: "rgba(255, 255, 255, 0.5)",
            },
            radius: {
                type: ControlType.BorderRadius,
                title: "Radius",
                defaultValue: "10px",
            },
            border: {
                type: ControlType.Border,
                title: "Border",
                defaultValue: {
                    borderWidth: 1,
                    borderStyle: "solid",
                    borderColor: "rgba(255, 255, 255, 0.085)",
                },
            },
            fill: {
                type: ControlType.Color,
                title: "Fill",
                defaultValue: "rgba(0, 0, 0, 0.2)",
            },
            shadowColor: {
                type: ControlType.Color,
                title: "Shadow",
                defaultValue: "rgba(0, 0, 0, 0)",
            },
            shadowOffsetX: {
                type: ControlType.Number,
                title: "X",
                defaultValue: 0,
                min: -50,
                max: 50,
            },
            shadowOffsetY: {
                type: ControlType.Number,
                title: "Y",
                defaultValue: 0,
                min: -50,
                max: 50,
            },
            shadowBlur: {
                type: ControlType.Number,
                title: "Blur",
                defaultValue: 0,
                min: 0,
                max: 100,
            },
        },
    },
    transition: {
        type: ControlType.Transition,
        title: "Transition",
        defaultValue: {
            ease: [0.44, 0, 0.56, 1],
            duration: 0.2,
        },
        description:
            "Discover more Framer resources at [Pixco](https://pixcodrops.com/resources)",
    },
})
