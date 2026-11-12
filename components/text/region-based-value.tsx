// Country greeting component with customizable messages per country based on user location
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { type CSSProperties, useState, useEffect, startTransition } from "react"

interface CountryValue {
    country: string
    value: string
}

interface CurrencyZoneValue {
    currencyZone: string
    value: string
}

interface GreetingDisplayProps {
    countryValues: CountryValue[]
    currencyZoneValues: CurrencyZoneValue[]
    fallbackGreeting: string
    textColor: string
    backgroundColor: string
    font: any
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function RegionalValueComponent(props: GreetingDisplayProps) {
    const {
        countryValues = [],
        currencyZoneValues = [],
        fallbackGreeting,
        textColor,
        backgroundColor,
        font
    } = props

    const [userCountry, setUserCountry] = useState<string | null>(null)
    const [displayGreeting, setDisplayGreeting] = useState(fallbackGreeting)

    // Detect user's country based on timezone
    useEffect(() => {
        if (typeof window !== "undefined") {
            try {
                const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
                let detectedCountry = "unknown"
                
                // Comprehensive timezone to country mapping
                const timezoneToCountry = {
                    // Europe
                    "Europe/Berlin": "germany",
                    "Europe/Munich": "germany",
                    "Europe/London": "united-kingdom",
                    "Europe/Paris": "france",
                    "Europe/Athens": "greece",
                    "Europe/Rome": "italy",
                    "Europe/Madrid": "spain",
                    "Europe/Amsterdam": "netherlands",
                    "Europe/Brussels": "belgium",
                    "Europe/Vienna": "austria",
                    "Europe/Zurich": "switzerland",
                    "Europe/Stockholm": "sweden",
                    "Europe/Oslo": "norway",
                    "Europe/Copenhagen": "denmark",
                    "Europe/Helsinki": "finland",
                    "Europe/Warsaw": "poland",
                    "Europe/Prague": "czechia",
                    "Europe/Budapest": "hungary",
                    "Europe/Bucharest": "romania",
                    "Europe/Sofia": "bulgaria",
                    "Europe/Zagreb": "croatia",
                    "Europe/Belgrade": "serbia",
                    "Europe/Ljubljana": "slovenia",
                    "Europe/Bratislava": "slovakia",
                    "Europe/Vilnius": "lithuania",
                    "Europe/Riga": "latvia",
                    "Europe/Tallinn": "estonia",
                    "Europe/Dublin": "ireland",
                    "Europe/Lisbon": "portugal",
                    "Europe/Luxembourg": "luxembourg",
                    "Europe/Monaco": "monaco",
                    "Europe/Andorra": "andorra",
                    "Europe/Vatican": "vatican-city",
                    "Europe/San_Marino": "san-marino",
                    "Europe/Malta": "malta",
                    "Europe/Nicosia": "cyprus",
                    "Europe/Reykjavik": "iceland",
                    "Europe/Kiev": "ukraine",
                    "Europe/Minsk": "belarus",
                    "Europe/Moscow": "russia",
                    "Europe/Chisinau": "moldova",
                    "Europe/Skopje": "north-macedonia",
                    "Europe/Podgorica": "montenegro",
                    "Europe/Sarajevo": "bosnia-and-herzegovina",
                    "Europe/Tirane": "albania",
                    
                    // Americas
                    "America/New_York": "united-states",
                    "America/Los_Angeles": "united-states",
                    "America/Chicago": "united-states",
                    "America/Denver": "united-states",
                    "America/Phoenix": "united-states",
                    "America/Anchorage": "united-states",
                    "America/Honolulu": "united-states",
                    "America/Toronto": "canada",
                    "America/Vancouver": "canada",
                    "America/Montreal": "canada",
                    "America/Mexico_City": "mexico",
                    "America/Sao_Paulo": "brazil",
                    "America/Buenos_Aires": "argentina",
                    "America/Lima": "peru",
                    "America/Bogota": "colombia",
                    "America/Santiago": "chile",
                    "America/Caracas": "venezuela",
                    "America/La_Paz": "bolivia",
                    "America/Asuncion": "paraguay",
                    "America/Montevideo": "uruguay",
                    "America/Guyana": "guyana",
                    "America/Paramaribo": "suriname",
                    "America/Cayenne": "france", // French Guiana
                    "America/Costa_Rica": "costa-rica",
                    "America/Panama": "panama",
                    "America/Guatemala": "guatemala",
                    "America/Belize": "belize",
                    "America/Tegucigalpa": "honduras",
                    "America/Managua": "nicaragua",
                    "America/El_Salvador": "el-salvador",
                    "America/Havana": "cuba",
                    "America/Jamaica": "jamaica",
                    "America/Port_of_Spain": "trinidad-and-tobago",
                    "America/Barbados": "barbados",
                    "America/Santo_Domingo": "dominican-republic",
                    "America/Port-au-Prince": "haiti",
                    
                    // Asia
                    "Asia/Tokyo": "japan",
                    "Asia/Shanghai": "china",
                    "Asia/Hong_Kong": "china",
                    "Asia/Seoul": "south-korea",
                    "Asia/Taipei": "taiwan",
                    "Asia/Singapore": "singapore",
                    "Asia/Bangkok": "thailand",
                    "Asia/Jakarta": "indonesia",
                    "Asia/Manila": "philippines",
                    "Asia/Kuala_Lumpur": "malaysia",
                    "Asia/Ho_Chi_Minh": "vietnam",
                    "Asia/Phnom_Penh": "cambodia",
                    "Asia/Vientiane": "laos",
                    "Asia/Yangon": "myanmar",
                    "Asia/Dhaka": "bangladesh",
                    "Asia/Kolkata": "india",
                    "Asia/Colombo": "sri-lanka",
                    "Asia/Kathmandu": "nepal",
                    "Asia/Thimphu": "bhutan",
                    "Asia/Karachi": "pakistan",
                    "Asia/Kabul": "afghanistan",
                    "Asia/Tehran": "iran",
                    "Asia/Baghdad": "iraq",
                    "Asia/Kuwait": "kuwait",
                    "Asia/Riyadh": "saudi-arabia",
                    "Asia/Qatar": "qatar",
                    "Asia/Dubai": "united-arab-emirates",
                    "Asia/Muscat": "oman",
                    "Asia/Bahrain": "bahrain",
                    "Asia/Damascus": "syria",
                    "Asia/Beirut": "lebanon",
                    "Asia/Jerusalem": "israel",
                    "Asia/Amman": "jordan",
                    "Asia/Ankara": "turkey",
                    "Asia/Yerevan": "armenia",
                    "Asia/Baku": "azerbaijan",
                    "Asia/Tbilisi": "georgia",
                    "Asia/Tashkent": "uzbekistan",
                    "Asia/Almaty": "kazakhstan",
                    "Asia/Bishkek": "kyrgyzstan",
                    "Asia/Dushanbe": "tajikistan",
                    "Asia/Ashgabat": "turkmenistan",
                    "Asia/Ulaanbaatar": "mongolia",
                    "Asia/Pyongyang": "north-korea",
                    
                    // Africa
                    "Africa/Cairo": "egypt",
                    "Africa/Lagos": "nigeria",
                    "Africa/Johannesburg": "south-africa",
                    "Africa/Nairobi": "kenya",
                    "Africa/Addis_Ababa": "ethiopia",
                    "Africa/Casablanca": "morocco",
                    "Africa/Algiers": "algeria",
                    "Africa/Tunis": "tunisia",
                    "Africa/Tripoli": "libya",
                    "Africa/Khartoum": "sudan",
                    "Africa/Accra": "ghana",
                    "Africa/Abidjan": "ivory-coast",
                    "Africa/Dakar": "senegal",
                    "Africa/Bamako": "mali",
                    "Africa/Ouagadougou": "burkina-faso",
                    "Africa/Niamey": "niger",
                    "Africa/Ndjamena": "chad",
                    "Africa/Bangui": "central-african-republic",
                    "Africa/Kinshasa": "democratic-republic-of-the-congo",
                    "Africa/Brazzaville": "congo-brazzaville",
                    "Africa/Luanda": "angola",
                    "Africa/Windhoek": "namibia",
                    "Africa/Gaborone": "botswana",
                    "Africa/Harare": "zimbabwe",
                    "Africa/Lusaka": "zambia",
                    "Africa/Maputo": "mozambique",
                    "Africa/Dar_es_Salaam": "tanzania",
                    "Africa/Kampala": "uganda",
                    "Africa/Kigali": "rwanda",
                    "Africa/Bujumbura": "burundi",
                    "Africa/Djibouti": "djibouti",
                    "Africa/Asmara": "eritrea",
                    "Africa/Mogadishu": "somalia",
                    
                    // Oceania
                    "Pacific/Auckland": "new-zealand",
                    "Australia/Sydney": "australia",
                    "Australia/Melbourne": "australia",
                    "Australia/Brisbane": "australia",
                    "Australia/Perth": "australia",
                    "Australia/Adelaide": "australia",
                    "Australia/Darwin": "australia",
                    "Pacific/Fiji": "fiji",
                    "Pacific/Port_Moresby": "papua-new-guinea",
                    "Pacific/Apia": "samoa",
                    "Pacific/Tongatapu": "tonga",
                    "Pacific/Tarawa": "kiribati",
                    "Pacific/Majuro": "marshall-islands",
                    "Pacific/Palau": "palau",
                    "Pacific/Chuuk": "micronesia",
                    "Pacific/Nauru": "nauru",
                    "Pacific/Funafuti": "tuvalu",
                    "Pacific/Port_Vila": "vanuatu",
                    "Pacific/Guadalcanal": "solomon-islands"
                }
                
                // Direct timezone match
                if (timezoneToCountry[timezone]) {
                    detectedCountry = timezoneToCountry[timezone]
                } else {
                    // Additional fallback using Intl.Locale if available
                    try {
                        if (typeof Intl !== 'undefined' && Intl.Locale) {
                            const locale = new Intl.Locale(navigator.language)
                            if (locale.region) {
                                const regionToCountry = {
                                    'GR': 'greece',
                                    'DE': 'germany', 
                                    'SK': 'slovakia',
                                    'FR': 'france',
                                    'GB': 'united-kingdom',
                                    'US': 'united-states',
                                    'IT': 'italy',
                                    'ES': 'spain',
                                    'NL': 'netherlands',
                                    'BE': 'belgium',
                                    'AT': 'austria',
                                    'CH': 'switzerland',
                                    'SE': 'sweden',
                                    'NO': 'norway',
                                    'DK': 'denmark',
                                    'FI': 'finland',
                                    'PL': 'poland',
                                    'CZ': 'czechia',
                                    'HU': 'hungary',
                                    'RO': 'romania',
                                    'BG': 'bulgaria',
                                    'HR': 'croatia',
                                    'RS': 'serbia',
                                    'SI': 'slovenia',
                                    'LT': 'lithuania',
                                    'LV': 'latvia',
                                    'EE': 'estonia',
                                    'IE': 'ireland',
                                    'PT': 'portugal',
                                    'LU': 'luxembourg',
                                    'MC': 'monaco',
                                    'AD': 'andorra',
                                    'VA': 'vatican-city',
                                    'SM': 'san-marino',
                                    'MT': 'malta',
                                    'CY': 'cyprus',
                                    'IS': 'iceland',
                                    'UA': 'ukraine',
                                    'BY': 'belarus',
                                    'RU': 'russia',
                                    'MD': 'moldova',
                                    'MK': 'north-macedonia',
                                    'ME': 'montenegro',
                                    'BA': 'bosnia-and-herzegovina',
                                    'AL': 'albania',
                                    'CA': 'canada',
                                    'MX': 'mexico',
                                    'BR': 'brazil',
                                    'AR': 'argentina',
                                    'PE': 'peru',
                                    'CO': 'colombia',
                                    'CL': 'chile',
                                    'VE': 'venezuela',
                                    'BO': 'bolivia',
                                    'PY': 'paraguay',
                                    'UY': 'uruguay',
                                    'GY': 'guyana',
                                    'SR': 'suriname',
                                    'CR': 'costa-rica',
                                    'PA': 'panama',
                                    'GT': 'guatemala',
                                    'BZ': 'belize',
                                    'HN': 'honduras',
                                    'NI': 'nicaragua',
                                    'SV': 'el-salvador',
                                    'CU': 'cuba',
                                    'JM': 'jamaica',
                                    'TT': 'trinidad-and-tobago',
                                    'BB': 'barbados',
                                    'DO': 'dominican-republic',
                                    'HT': 'haiti',
                                    'JP': 'japan',
                                    'CN': 'china',
                                    'KR': 'south-korea',
                                    'TW': 'taiwan',
                                    'SG': 'singapore',
                                    'TH': 'thailand',
                                    'ID': 'indonesia',
                                    'PH': 'philippines',
                                    'MY': 'malaysia',
                                    'VN': 'vietnam',
                                    'KH': 'cambodia',
                                    'LA': 'laos',
                                    'MM': 'myanmar',
                                    'BD': 'bangladesh',
                                    'IN': 'india',
                                    'LK': 'sri-lanka',
                                    'NP': 'nepal',
                                    'BT': 'bhutan',
                                    'PK': 'pakistan',
                                    'AF': 'afghanistan',
                                    'IR': 'iran',
                                    'IQ': 'iraq',
                                    'KW': 'kuwait',
                                    'SA': 'saudi-arabia',
                                    'QA': 'qatar',
                                    'AE': 'united-arab-emirates',
                                    'OM': 'oman',
                                    'BH': 'bahrain',
                                    'SY': 'syria',
                                    'LB': 'lebanon',
                                    'IL': 'israel',
                                    'JO': 'jordan',
                                    'TR': 'turkey',
                                    'AM': 'armenia',
                                    'AZ': 'azerbaijan',
                                    'GE': 'georgia',
                                    'UZ': 'uzbekistan',
                                    'KZ': 'kazakhstan',
                                    'KG': 'kyrgyzstan',
                                    'TJ': 'tajikistan',
                                    'TM': 'turkmenistan',
                                    'MN': 'mongolia',
                                    'KP': 'north-korea',
                                    'EG': 'egypt',
                                    'NG': 'nigeria',
                                    'ZA': 'south-africa',
                                    'KE': 'kenya',
                                    'ET': 'ethiopia',
                                    'MA': 'morocco',
                                    'DZ': 'algeria',
                                    'TN': 'tunisia',
                                    'LY': 'libya',
                                    'SD': 'sudan',
                                    'GH': 'ghana',
                                    'SN': 'senegal',
                                    'ML': 'mali',
                                    'BF': 'burkina-faso',
                                    'NE': 'niger',
                                    'TD': 'chad',
                                    'CF': 'central-african-republic',
                                    'CD': 'democratic-republic-of-the-congo',
                                    'CG': 'congo-brazzaville',
                                    'AO': 'angola',
                                    'NA': 'namibia',
                                    'BW': 'botswana',
                                    'ZW': 'zimbabwe',
                                    'ZM': 'zambia',
                                    'MZ': 'mozambique',
                                    'TZ': 'tanzania',
                                    'UG': 'uganda',
                                    'RW': 'rwanda',
                                    'BI': 'burundi',
                                    'DJ': 'djibouti',
                                    'ER': 'eritrea',
                                    'SO': 'somalia',
                                    'AU': 'australia',
                                    'NZ': 'new-zealand',
                                    'FJ': 'fiji',
                                    'PG': 'papua-new-guinea',
                                    'WS': 'samoa',
                                    'TO': 'tonga',
                                    'KI': 'kiribati',
                                    'MH': 'marshall-islands',
                                    'PW': 'palau',
                                    'FM': 'micronesia',
                                    'NR': 'nauru',
                                    'TV': 'tuvalu',
                                    'VU': 'vanuatu',
                                    'SB': 'solomon-islands'
                                }
                                if (regionToCountry[locale.region]) {
                                    detectedCountry = regionToCountry[locale.region]
                                }
                            }
                        }
                    } catch (e) {
                        // Fallback to timezone parsing if Intl.Locale fails
                        const parts = timezone.split("/")
                        if (parts.length >= 2) {
                            const city = parts[1].toLowerCase().replace(/_/g, "-")
                            const countryOptions = ["afghanistan", "albania", "algeria", "andorra", "angola", "antigua-and-barbuda", "argentina", "armenia", "australia", "austria", "azerbaijan", "bahamas", "bahrain", "bangladesh", "barbados", "belarus", "belgium", "belize", "benin", "bhutan", "bolivia", "bosnia-and-herzegovina", "botswana", "brazil", "brunei", "bulgaria", "burkina-faso", "burundi", "cabo-verde", "cambodia", "cameroon", "canada", "central-african-republic", "chad", "chile", "china", "colombia", "comoros", "congo-brazzaville", "costa-rica", "croatia", "cuba", "cyprus", "czechia", "democratic-republic-of-the-congo", "denmark", "djibouti", "dominica", "dominican-republic", "ecuador", "egypt", "el-salvador", "equatorial-guinea", "eritrea", "estonia", "eswatini", "ethiopia", "fiji", "finland", "france", "gabon", "gambia", "georgia", "germany", "ghana", "greece", "grenada", "guatemala", "guinea", "guinea-bissau", "guyana", "haiti", "honduras", "hungary", "iceland", "india", "indonesia", "iran", "iraq", "ireland", "israel", "italy", "jamaica", "japan", "jordan", "kazakhstan", "kenya", "kiribati", "kuwait", "kyrgyzstan", "laos", "latvia", "lebanon", "lesotho", "liberia", "libya", "liechtenstein", "lithuania", "luxembourg", "madagascar", "malawi", "malaysia", "maldives", "mali", "malta", "marshall-islands", "mauritania", "mauritius", "mexico", "micronesia", "moldova", "monaco", "mongolia", "montenegro", "morocco", "mozambique", "myanmar", "namibia", "nauru", "nepal", "netherlands", "new-zealand", "nicaragua", "niger", "nigeria", "north-korea", "north-macedonia", "norway", "oman", "pakistan", "palau", "palestine", "panama", "papua-new-guinea", "paraguay", "peru", "philippines", "poland", "portugal", "qatar", "romania", "russia", "rwanda", "saint-kitts-and-nevis", "saint-lucia", "saint-vincent-and-the-grenadines", "samoa", "san-marino", "sao-tome-and-principe", "saudi-arabia", "senegal", "serbia", "seychelles", "sierra-leone", "singapore", "slovakia", "slovenia", "solomon-islands", "somalia", "south-africa", "south-korea", "south-sudan", "spain", "sri-lanka", "sudan", "suriname", "sweden", "switzerland", "syria", "taiwan", "tajikistan", "tanzania", "thailand", "timor-leste", "togo", "tonga", "trinidad-and-tobago", "tunisia", "turkey", "turkmenistan", "tuvalu", "uganda", "ukraine", "united-arab-emirates", "united-kingdom", "united-states", "uruguay", "uzbekistan", "vanuatu", "vatican-city", "venezuela", "vietnam", "yemen", "zambia", "zimbabwe"]
                            
                            if (countryOptions.includes(city)) {
                                detectedCountry = city
                            }
                        }
                    }
                }
                
                startTransition(() => setUserCountry(detectedCountry))
            } catch (error) {
                startTransition(() => setUserCountry("unknown"))
            }
        }
    }, [])

    // Update display greeting when user country or values change
    useEffect(() => {
        if (userCountry && (countryValues.length > 0 || currencyZoneValues.length > 0)) {
            let matchingValue
            
            // First try to find a country match
            matchingValue = countryValues.find(c => c.country && c.country.toLowerCase() === userCountry.toLowerCase())
            
            // If no country match, try currency zone matching
            if (!matchingValue) {
                const currencyZoneMapping = {
                    "austria": "eurozone", "belgium": "eurozone", "croatia": "eurozone", "cyprus": "eurozone", "estonia": "eurozone", "finland": "eurozone", "france": "eurozone", "germany": "eurozone", "greece": "eurozone", "ireland": "eurozone", "italy": "eurozone", "latvia": "eurozone", "lithuania": "eurozone", "luxembourg": "eurozone", "malta": "eurozone", "netherlands": "eurozone", "portugal": "eurozone", "slovakia": "eurozone", "slovenia": "eurozone", "spain": "eurozone", "andorra": "eurozone", "monaco": "eurozone", "san-marino": "eurozone", "vatican-city": "eurozone", "kosovo": "eurozone", "montenegro": "eurozone",
                    "united-states": "us-dollar-zone", "ecuador": "us-dollar-zone", "el-salvador": "us-dollar-zone", "timor-leste": "us-dollar-zone", "zimbabwe": "us-dollar-zone", "micronesia": "us-dollar-zone", "palau": "us-dollar-zone", "marshall-islands": "us-dollar-zone", "panama": "us-dollar-zone",
                    "united-kingdom": "sterling-zone", "gibraltar": "sterling-zone", "guernsey": "sterling-zone", "jersey": "sterling-zone", "isle-of-man": "sterling-zone", "falkland-islands": "sterling-zone", "st-helena": "sterling-zone",
                    "japan": "yen-zone",
                    "china": "chinese-yuan-zone", "macau": "chinese-yuan-zone", "hong-kong": "chinese-yuan-zone",
                    "russia": "russian-ruble-zone", "belarus": "russian-ruble-zone", "abkhazia": "russian-ruble-zone", "south-ossetia": "russian-ruble-zone",
                    "india": "indian-rupee-zone", "bhutan": "indian-rupee-zone", "nepal": "indian-rupee-zone",
                    "benin": "cfa-franc-west-zone", "burkina-faso": "cfa-franc-west-zone", "cote-divoire": "cfa-franc-west-zone", "guinea-bissau": "cfa-franc-west-zone", "mali": "cfa-franc-west-zone", "niger": "cfa-franc-west-zone", "senegal": "cfa-franc-west-zone", "togo": "cfa-franc-west-zone",
                    "cameroon": "cfa-franc-central-zone", "central-african-republic": "cfa-franc-central-zone", "chad": "cfa-franc-central-zone", "congo-brazzaville": "cfa-franc-central-zone", "equatorial-guinea": "cfa-franc-central-zone", "gabon": "cfa-franc-central-zone",
                    "switzerland": "swiss-franc-zone", "liechtenstein": "swiss-franc-zone",
                    "canada": "canadian-dollar-zone", "saint-pierre-and-miquelon": "canadian-dollar-zone",
                    "australia": "australian-dollar-zone", "christmas-island": "australian-dollar-zone", "cocos-islands": "australian-dollar-zone", "norfolk-island": "australian-dollar-zone", "kiribati": "australian-dollar-zone", "nauru": "australian-dollar-zone", "tuvalu": "australian-dollar-zone",
                    "brazil": "brazilian-real-zone",
                    "mexico": "mexican-peso-zone",
                    "south-africa": "south-african-rand-zone", "lesotho": "south-african-rand-zone", "eswatini": "south-african-rand-zone", "namibia": "south-african-rand-zone",
                    "sweden": "swedish-krona-zone",
                    "denmark": "danish-krone-zone", "greenland": "danish-krone-zone", "faroe-islands": "danish-krone-zone",
                    "norway": "norwegian-krone-zone", "svalbard": "norwegian-krone-zone",
                    "iceland": "icelandic-krona-zone",
                    "turkey": "turkish-lira-zone", "northern-cyprus": "turkish-lira-zone",
                    "bangladesh": "bangladeshi-taka-zone",
                    "pakistan": "pakistani-rupee-zone",
                    "indonesia": "indonesian-rupiah-zone",
                    "vietnam": "vietnamese-dong-zone",
                    "thailand": "thai-baht-zone",
                    "poland": "polish-zloty-zone",
                    "ukraine": "ukrainian-hryvnia-zone",
                    "argentina": "argentine-peso-zone",
                    "colombia": "colombian-peso-zone",
                    "saudi-arabia": "saudi-riyal-zone",
                    "iran": "iranian-rial-zone",
                    "south-korea": "south-korean-won-zone",
                    "egypt": "egyptian-pound-zone"
                }
                
                const userCurrencyZone = currencyZoneMapping[userCountry]
                if (userCurrencyZone) {
                    matchingValue = currencyZoneValues.find(c => c.currencyZone && c.currencyZone === userCurrencyZone)
                }
            }
            
            if (matchingValue && matchingValue.value) {
                startTransition(() => setDisplayGreeting(matchingValue.value))
            } else {
                startTransition(() => setDisplayGreeting(fallbackGreeting))
            }
        } else {
            startTransition(() => setDisplayGreeting(fallbackGreeting))
        }
    }, [userCountry, countryValues, currencyZoneValues, fallbackGreeting])

    const isFixedWidth = props?.style && props.style.width === "100%"

    return (
        <div
            style={{
                ...props.style,
                ...(isFixedWidth ? { ...props?.style } : { minWidth: "max-content" }),
                backgroundColor,
                color: textColor,
                padding: "16px 24px",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                ...font
            }}
        >
            {displayGreeting}
        </div>
    )
}

addPropertyControls(RegionalValueComponent, {
    countryValues: {
        type: ControlType.Array,
        title: "Country Value Items",
        control: {
            type: ControlType.Object,
            controls: {
                country: {
                    type: ControlType.Enum,
                    title: "Country",
                    options: ["afghanistan", "albania", "algeria", "andorra", "angola", "antigua-and-barbuda", "argentina", "armenia", "australia", "austria", "azerbaijan", "bahamas", "bahrain", "bangladesh", "barbados", "belarus", "belgium", "belize", "benin", "bhutan", "bolivia", "bosnia-and-herzegovina", "botswana", "brazil", "brunei", "bulgaria", "burkina-faso", "burundi", "cabo-verde", "cambodia", "cameroon", "canada", "central-african-republic", "chad", "chile", "china", "colombia", "comoros", "congo-brazzaville", "costa-rica", "croatia", "cuba", "cyprus", "czechia", "democratic-republic-of-the-congo", "denmark", "djibouti", "dominica", "dominican-republic", "ecuador", "egypt", "el-salvador", "equatorial-guinea", "eritrea", "estonia", "eswatini", "ethiopia", "fiji", "finland", "france", "gabon", "gambia", "georgia", "germany", "ghana", "greece", "grenada", "guatemala", "guinea", "guinea-bissau", "guyana", "haiti", "honduras", "hungary", "iceland", "india", "indonesia", "iran", "iraq", "ireland", "israel", "italy", "jamaica", "japan", "jordan", "kazakhstan", "kenya", "kiribati", "kuwait", "kyrgyzstan", "laos", "latvia", "lebanon", "lesotho", "liberia", "libya", "liechtenstein", "lithuania", "luxembourg", "madagascar", "malawi", "malaysia", "maldives", "mali", "malta", "marshall-islands", "mauritania", "mauritius", "mexico", "micronesia", "moldova", "monaco", "mongolia", "montenegro", "morocco", "mozambique", "myanmar", "namibia", "nauru", "nepal", "netherlands", "new-zealand", "nicaragua", "niger", "nigeria", "north-korea", "north-macedonia", "norway", "oman", "pakistan", "palau", "palestine", "panama", "papua-new-guinea", "paraguay", "peru", "philippines", "poland", "portugal", "qatar", "romania", "russia", "rwanda", "saint-kitts-and-nevis", "saint-lucia", "saint-vincent-and-the-grenadines", "samoa", "san-marino", "sao-tome-and-principe", "saudi-arabia", "senegal", "serbia", "seychelles", "sierra-leone", "singapore", "slovakia", "slovenia", "solomon-islands", "somalia", "south-africa", "south-korea", "south-sudan", "spain", "sri-lanka", "sudan", "suriname", "sweden", "switzerland", "syria", "taiwan", "tajikistan", "tanzania", "thailand", "timor-leste", "togo", "tonga", "trinidad-and-tobago", "tunisia", "turkey", "turkmenistan", "tuvalu", "uganda", "ukraine", "united-arab-emirates", "united-kingdom", "united-states", "uruguay", "uzbekistan", "vanuatu", "vatican-city", "venezuela", "vietnam", "yemen", "zambia", "zimbabwe"],
                    optionTitles: ["Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo (Congo-Brazzaville)", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czechia (Czech Republic)", "Democratic Republic of the Congo", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini (Swaziland)", "Ethiopia", "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar (Burma)", "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway", "Oman", "Pakistan", "Palau", "Palestine State", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States of America", "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"],
                    defaultValue: "afghanistan"
                },
                value: {
                    type: ControlType.String,
                    title: "Value",
                    defaultValue: "Hello",
                    placeholder: "Enter value..."
                }
            }
        },
        defaultValue: []
    },
    currencyZoneValues: {
        type: ControlType.Array,
        title: "Currency Value Items",
        control: {
            type: ControlType.Object,
            controls: {
                currencyZone: {
                    type: ControlType.Enum,
                    title: "Currency Zone",
                    options: ["eurozone", "us-dollar-zone", "sterling-zone", "yen-zone", "chinese-yuan-zone", "russian-ruble-zone", "indian-rupee-zone", "cfa-franc-west-zone", "cfa-franc-central-zone", "swiss-franc-zone", "canadian-dollar-zone", "australian-dollar-zone", "brazilian-real-zone", "mexican-peso-zone", "south-african-rand-zone", "swedish-krona-zone", "danish-krone-zone", "norwegian-krone-zone", "icelandic-krona-zone", "turkish-lira-zone", "bangladeshi-taka-zone", "pakistani-rupee-zone", "indonesian-rupiah-zone", "vietnamese-dong-zone", "thai-baht-zone", "polish-zloty-zone", "ukrainian-hryvnia-zone", "argentine-peso-zone", "colombian-peso-zone", "saudi-riyal-zone", "iranian-rial-zone", "south-korean-won-zone", "egyptian-pound-zone"],
                    optionTitles: ["Eurozone (€ – Euro)", "US Dollar Zone ($ – US Dollar)", "Sterling Zone (£ – British Pound)", "Yen Zone (¥ – Japanese Yen)", "Chinese Yuan Zone (¥ – Chinese Yuan Renminbi)", "Russian Ruble Zone (₽ – Russian Ruble)", "Indian Rupee Zone (₹ – Indian Rupee)", "CFA Franc West Zone (Fr – West African CFA Franc XOF)", "CFA Franc Central Zone (Fr – Central African CFA Franc XAF)", "Swiss Franc Zone (Fr – Swiss Franc CHF)", "Canadian Dollar Zone (C$ – Canadian Dollar)", "Australian Dollar Zone (A$ – Australian Dollar)", "Brazilian Real Zone (R$ – Brazilian Real)", "Mexican Peso Zone (Mex$ – Mexican Peso)", "South African Rand Zone (R – South African Rand)", "Swedish Krona Zone (kr – Swedish Krona SEK)", "Danish Krone Zone (kr – Danish Krone DKK)", "Norwegian Krone Zone (kr – Norwegian Krone NOK)", "Icelandic Króna Zone (kr – Icelandic Króna ISK)", "Turkish Lira Zone (₺ – Turkish Lira TRY)", "Bangladeshi Taka Zone (৳ – Bangladeshi Taka)", "Pakistani Rupee Zone (₨ – Pakistani Rupee)", "Indonesian Rupiah Zone (Rp – Indonesian Rupiah)", "Vietnamese Dong Zone (₫ – Vietnamese Dong)", "Thai Baht Zone (฿ – Thai Baht)", "Polish Złoty Zone (zł – Polish Złoty)", "Ukrainian Hryvnia Zone (₴ – Ukrainian Hryvnia)", "Argentine Peso Zone (ARS$ – Argentine Peso)", "Colombian Peso Zone (COL$ – Colombian Peso)", "Saudi Riyal Zone (﷼ – Saudi Riyal)", "Iranian Rial Zone (﷼ – Iranian Rial)", "South Korean Won Zone (₩ – South Korean Won)", "Egyptian Pound Zone (E£ – Egyptian Pound)"],
                    defaultValue: "eurozone"
                },
                value: {
                    type: ControlType.String,
                    title: "Value",
                    defaultValue: "Hello",
                    placeholder: "Enter value..."
                }
            }
        },
        defaultValue: []
    },
    fallbackGreeting: {
        type: ControlType.String,
        title: "Default Value",
        defaultValue: "Hello",
        placeholder: "Greeting for unmatched countries..."
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#000000"
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background Color",
        defaultValue: "#FFFFFF"
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        defaultValue: {
            fontSize: "22px",
            variant: "Semibold",
            letterSpacing: "-0.01em",
            lineHeight: "1.2em"
        },
        controls: "extended",
        defaultFontType: "sans-serif"
    }
})