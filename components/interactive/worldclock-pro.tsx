// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useState, useEffect } from "react"

/**
 * @file WorldClockPro.tsx
 * @name WorldClock Pro
 * @description A fully featured Framer component that displays real-time clocks
 * for one or multiple IANA timezones. Supports customizable date/time formatting,
 * locale-aware output, flexible layouts, separators, and per-element typography
 * and color styling.
 *
 * @author Sheikh Abdul Aziz
 * @version 1.0.1
 *
 */

// ===============================
// All IANA Timezones
// ===============================

/**
 * @constant {Array<{ value: string, label: string }>} ZONES
 * @description Complete list of IANA timezone identifiers paired with
 * human-readable country/region labels. Used to populate the timezone
 * picker controls and to resolve display names for the multi-timezone view.
 */
const ZONES = [
    { value: "Asia/Kabul", label: "Afghanistan" },
    { value: "Europe/Tirane", label: "Albania" },
    { value: "Africa/Algiers", label: "Algeria" },
    { value: "Pacific/Pago_Pago", label: "American Samoa" },
    { value: "Europe/Andorra", label: "Andorra" },
    { value: "Africa/Luanda", label: "Angola" },
    { value: "America/Anguilla", label: "Anguilla" },
    { value: "Antarctica/Casey", label: "Antarctica — Casey" },
    { value: "Antarctica/Davis", label: "Antarctica — Davis" },
    {
        value: "Antarctica/DumontDUrville",
        label: "Antarctica — Dumont d'Urville",
    },
    { value: "Antarctica/Mawson", label: "Antarctica — Mawson" },
    { value: "Antarctica/McMurdo", label: "Antarctica — McMurdo" },
    { value: "Antarctica/Palmer", label: "Antarctica — Palmer" },
    { value: "Antarctica/Rothera", label: "Antarctica — Rothera" },
    { value: "Antarctica/Syowa", label: "Antarctica — Syowa" },
    { value: "Antarctica/Troll", label: "Antarctica — Troll" },
    { value: "Antarctica/Vostok", label: "Antarctica — Vostok" },
    { value: "America/Antigua", label: "Antigua and Barbuda" },
    {
        value: "America/Argentina/Buenos_Aires",
        label: "Argentina — Buenos Aires",
    },
    { value: "America/Argentina/Catamarca", label: "Argentina — Catamarca" },
    { value: "America/Argentina/Cordoba", label: "Argentina — Córdoba" },
    { value: "America/Argentina/Jujuy", label: "Argentina — Jujuy" },
    { value: "America/Argentina/La_Rioja", label: "Argentina — La Rioja" },
    { value: "America/Argentina/Mendoza", label: "Argentina — Mendoza" },
    {
        value: "America/Argentina/Rio_Gallegos",
        label: "Argentina — Río Gallegos",
    },
    { value: "America/Argentina/Salta", label: "Argentina — Salta" },
    { value: "America/Argentina/San_Juan", label: "Argentina — San Juan" },
    { value: "America/Argentina/San_Luis", label: "Argentina — San Luis" },
    { value: "America/Argentina/Tucuman", label: "Argentina — Tucumán" },
    { value: "America/Argentina/Ushuaia", label: "Argentina — Ushuaia" },
    { value: "Asia/Yerevan", label: "Armenia" },
    { value: "America/Aruba", label: "Aruba" },
    { value: "Australia/Adelaide", label: "Australia — Adelaide (ACST)" },
    { value: "Australia/Brisbane", label: "Australia — Brisbane (AEST)" },
    { value: "Australia/Broken_Hill", label: "Australia — Broken Hill" },
    { value: "Australia/Darwin", label: "Australia — Darwin (ACST)" },
    { value: "Australia/Eucla", label: "Australia — Eucla" },
    { value: "Australia/Hobart", label: "Australia — Hobart (AEST)" },
    { value: "Australia/Currie", label: "Australia — King Island" },
    { value: "Australia/Lindeman", label: "Australia — Lindeman" },
    { value: "Australia/Lord_Howe", label: "Australia — Lord Howe Island" },
    { value: "Antarctica/Macquarie", label: "Australia — Macquarie Island" },
    { value: "Australia/Melbourne", label: "Australia — Melbourne (AEST)" },
    { value: "Australia/Perth", label: "Australia — Perth (AWST)" },
    { value: "Australia/Sydney", label: "Australia — Sydney (AEST)" },
    { value: "Europe/Vienna", label: "Austria" },
    { value: "Asia/Baku", label: "Azerbaijan" },
    { value: "America/Nassau", label: "Bahamas" },
    { value: "Asia/Bahrain", label: "Bahrain" },
    { value: "Asia/Dhaka", label: "Bangladesh" },
    { value: "America/Barbados", label: "Barbados" },
    { value: "Europe/Minsk", label: "Belarus" },
    { value: "Europe/Brussels", label: "Belgium" },
    { value: "America/Belize", label: "Belize" },
    { value: "Africa/Porto-Novo", label: "Benin" },
    { value: "Atlantic/Bermuda", label: "Bermuda" },
    { value: "Asia/Thimphu", label: "Bhutan" },
    { value: "America/La_Paz", label: "Bolivia" },
    { value: "America/Kralendijk", label: "Bonaire" },
    { value: "Europe/Sarajevo", label: "Bosnia and Herzegovina" },
    { value: "Africa/Gaborone", label: "Botswana" },
    { value: "America/Araguaina", label: "Brazil — Araguaína" },
    { value: "America/Bahia", label: "Brazil — Bahia" },
    { value: "America/Belem", label: "Brazil — Belém" },
    { value: "America/Boa_Vista", label: "Brazil — Boa Vista" },
    { value: "America/Campo_Grande", label: "Brazil — Campo Grande" },
    { value: "America/Cuiaba", label: "Brazil — Cuiabá" },
    { value: "America/Eirunepe", label: "Brazil — Eirunepé" },
    { value: "America/Noronha", label: "Brazil — Fernando de Noronha" },
    { value: "America/Fortaleza", label: "Brazil — Fortaleza" },
    { value: "America/Maceio", label: "Brazil — Maceió" },
    { value: "America/Manaus", label: "Brazil — Manaus" },
    { value: "America/Porto_Velho", label: "Brazil — Porto Velho" },
    { value: "America/Recife", label: "Brazil — Recife" },
    { value: "America/Rio_Branco", label: "Brazil — Rio Branco" },
    { value: "America/Santarem", label: "Brazil — Santarém" },
    { value: "America/Sao_Paulo", label: "Brazil — São Paulo" },
    { value: "Indian/Chagos", label: "British Indian Ocean Territory" },
    { value: "America/Tortola", label: "British Virgin Islands" },
    { value: "Asia/Brunei", label: "Brunei" },
    { value: "Europe/Sofia", label: "Bulgaria" },
    { value: "Africa/Ouagadougou", label: "Burkina Faso" },
    { value: "Africa/Bujumbura", label: "Burundi" },
    { value: "Asia/Phnom_Penh", label: "Cambodia" },
    { value: "Africa/Douala", label: "Cameroon" },
    { value: "America/Atikokan", label: "Canada — Atikokan" },
    { value: "America/Blanc-Sablon", label: "Canada — Blanc-Sablon" },
    {
        value: "America/Vancouver",
        label: "Canada — British Columbia (Vancouver)",
    },
    { value: "America/Cambridge_Bay", label: "Canada — Cambridge Bay" },
    { value: "America/Creston", label: "Canada — Creston" },
    { value: "America/Dawson", label: "Canada — Dawson" },
    { value: "America/Dawson_Creek", label: "Canada — Dawson Creek" },
    { value: "America/Edmonton", label: "Canada — Edmonton" },
    { value: "America/Glace_Bay", label: "Canada — Glace Bay" },
    { value: "America/Goose_Bay", label: "Canada — Goose Bay" },
    { value: "America/Halifax", label: "Canada — Halifax (Atlantic)" },
    { value: "America/Inuvik", label: "Canada — Inuvik" },
    { value: "America/Iqaluit", label: "Canada — Iqaluit" },
    { value: "America/Winnipeg", label: "Canada — Manitoba (Winnipeg)" },
    { value: "America/Moncton", label: "Canada — Moncton" },
    { value: "America/St_Johns", label: "Canada — Newfoundland" },
    { value: "America/Nipigon", label: "Canada — Nipigon" },
    { value: "America/Yellowknife", label: "Canada — Northwest Territories" },
    { value: "America/Toronto", label: "Canada — Ontario (Toronto)" },
    { value: "America/Pangnirtung", label: "Canada — Pangnirtung" },
    { value: "America/Rainy_River", label: "Canada — Rainy River" },
    { value: "America/Rankin_Inlet", label: "Canada — Rankin Inlet" },
    { value: "America/Resolute", label: "Canada — Resolute" },
    { value: "America/Regina", label: "Canada — Saskatchewan (Regina)" },
    { value: "America/Swift_Current", label: "Canada — Swift Current" },
    { value: "America/Thunder_Bay", label: "Canada — Thunder Bay" },
    { value: "America/Whitehorse", label: "Canada — Yukon (Whitehorse)" },
    { value: "Atlantic/Cape_Verde", label: "Cape Verde" },
    { value: "America/Cayman", label: "Cayman Islands" },
    { value: "Africa/Bangui", label: "Central African Republic" },
    { value: "Africa/Ndjamena", label: "Chad" },
    { value: "Pacific/Easter", label: "Chile — Easter Island" },
    { value: "America/Punta_Arenas", label: "Chile — Punta Arenas" },
    { value: "America/Santiago", label: "Chile — Santiago" },
    { value: "Asia/Shanghai", label: "China" },
    { value: "Asia/Urumqi", label: "China — Xinjiang (Urumqi)" },
    { value: "Indian/Christmas", label: "Christmas Island" },
    { value: "Indian/Cocos", label: "Cocos Islands" },
    { value: "America/Bogota", label: "Colombia" },
    { value: "Indian/Comoro", label: "Comoros" },
    { value: "Pacific/Rarotonga", label: "Cook Islands" },
    { value: "America/Costa_Rica", label: "Costa Rica" },
    { value: "Europe/Simferopol", label: "Crimea" },
    { value: "Europe/Zagreb", label: "Croatia" },
    { value: "America/Havana", label: "Cuba" },
    { value: "America/Curacao", label: "Curaçao" },
    { value: "Asia/Nicosia", label: "Cyprus" },
    { value: "Asia/Famagusta", label: "Cyprus — Famagusta" },
    { value: "Europe/Nicosia", label: "Cyprus (EU side)" },
    { value: "Europe/Prague", label: "Czech Republic" },
    { value: "Europe/Copenhagen", label: "Denmark" },
    { value: "Africa/Djibouti", label: "Djibouti" },
    { value: "America/Dominica", label: "Dominica" },
    { value: "America/Santo_Domingo", label: "Dominican Republic" },
    { value: "Africa/Lubumbashi", label: "DR Congo (East)" },
    { value: "Africa/Kinshasa", label: "DR Congo (West)" },
    { value: "Asia/Dili", label: "East Timor" },
    { value: "America/Guayaquil", label: "Ecuador" },
    { value: "Pacific/Galapagos", label: "Ecuador — Galápagos" },
    { value: "Africa/Cairo", label: "Egypt" },
    { value: "America/El_Salvador", label: "El Salvador" },
    { value: "Africa/Malabo", label: "Equatorial Guinea" },
    { value: "Africa/Asmara", label: "Eritrea" },
    { value: "Europe/Tallinn", label: "Estonia" },
    { value: "Africa/Mbabane", label: "Eswatini" },
    { value: "Africa/Addis_Ababa", label: "Ethiopia" },
    { value: "Atlantic/Stanley", label: "Falkland Islands" },
    { value: "Atlantic/Faroe", label: "Faroe Islands" },
    { value: "Pacific/Fiji", label: "Fiji" },
    { value: "Europe/Helsinki", label: "Finland" },
    { value: "Europe/Mariehamn", label: "Finland — Åland Islands" },
    { value: "Europe/Paris", label: "France" },
    { value: "America/Cayenne", label: "French Guiana" },
    { value: "Pacific/Gambier", label: "French Polynesia — Gambier" },
    { value: "Pacific/Marquesas", label: "French Polynesia — Marquesas" },
    { value: "Pacific/Tahiti", label: "French Polynesia — Tahiti" },
    { value: "Indian/Kerguelen", label: "French Southern Territories" },
    { value: "Africa/Libreville", label: "Gabon" },
    { value: "Africa/Banjul", label: "Gambia" },
    { value: "Asia/Tbilisi", label: "Georgia" },
    { value: "Europe/Berlin", label: "Germany" },
    { value: "Europe/Busingen", label: "Germany — Büsingen" },
    { value: "Africa/Accra", label: "Ghana" },
    { value: "Europe/Gibraltar", label: "Gibraltar" },
    { value: "Europe/Athens", label: "Greece" },
    { value: "America/Danmarkshavn", label: "Greenland — Danmarkshavn" },
    { value: "America/Godthab", label: "Greenland — Nuuk" },
    { value: "America/Scoresbysund", label: "Greenland — Scoresbysund" },
    { value: "America/Thule", label: "Greenland — Thule" },
    { value: "America/Grenada", label: "Grenada" },
    { value: "America/Guadeloupe", label: "Guadeloupe" },
    { value: "Pacific/Guam", label: "Guam" },
    { value: "America/Guatemala", label: "Guatemala" },
    { value: "Europe/Guernsey", label: "Guernsey" },
    { value: "Africa/Conakry", label: "Guinea" },
    { value: "Africa/Bissau", label: "Guinea-Bissau" },
    { value: "America/Guyana", label: "Guyana" },
    { value: "America/Port-au-Prince", label: "Haiti" },
    { value: "America/Tegucigalpa", label: "Honduras" },
    { value: "Asia/Hong_Kong", label: "Hong Kong" },
    { value: "Europe/Budapest", label: "Hungary" },
    { value: "Atlantic/Reykjavik", label: "Iceland" },
    { value: "Asia/Kolkata", label: "India" },
    { value: "Asia/Jakarta", label: "Indonesia — Java (Jakarta)" },
    { value: "Asia/Jayapura", label: "Indonesia — Papua (Jayapura)" },
    { value: "Asia/Makassar", label: "Indonesia — Sulawesi (Makassar)" },
    { value: "Asia/Pontianak", label: "Indonesia — West Kalimantan" },
    { value: "Asia/Tehran", label: "Iran" },
    { value: "Asia/Baghdad", label: "Iraq" },
    { value: "Europe/Dublin", label: "Ireland" },
    { value: "Europe/Isle_of_Man", label: "Isle of Man" },
    { value: "Asia/Tel_Aviv", label: "Israel" },
    { value: "Europe/Rome", label: "Italy" },
    { value: "Africa/Abidjan", label: "Ivory Coast" },
    { value: "America/Jamaica", label: "Jamaica" },
    { value: "Asia/Tokyo", label: "Japan" },
    { value: "Europe/Jersey", label: "Jersey" },
    { value: "Asia/Amman", label: "Jordan" },
    { value: "Asia/Almaty", label: "Kazakhstan — Almaty" },
    { value: "Asia/Aqtau", label: "Kazakhstan — Aqtau" },
    { value: "Asia/Aqtobe", label: "Kazakhstan — Aqtöbe" },
    { value: "Asia/Atyrau", label: "Kazakhstan — Atyrau" },
    { value: "Asia/Oral", label: "Kazakhstan — Oral" },
    { value: "Asia/Qostanay", label: "Kazakhstan — Qostanay" },
    { value: "Asia/Qyzylorda", label: "Kazakhstan — Qyzylorda" },
    { value: "Africa/Nairobi", label: "Kenya" },
    { value: "Pacific/Tarawa", label: "Kiribati — Gilbert Islands" },
    { value: "Pacific/Kiritimati", label: "Kiribati — Line Islands" },
    { value: "Pacific/Enderbury", label: "Kiribati — Phoenix Islands" },
    { value: "Asia/Kuwait", label: "Kuwait" },
    { value: "Asia/Bishkek", label: "Kyrgyzstan" },
    { value: "Asia/Vientiane", label: "Laos" },
    { value: "Europe/Riga", label: "Latvia" },
    { value: "Asia/Beirut", label: "Lebanon" },
    { value: "Africa/Maseru", label: "Lesotho" },
    { value: "Africa/Monrovia", label: "Liberia" },
    { value: "Africa/Tripoli", label: "Libya" },
    { value: "Europe/Vaduz", label: "Liechtenstein" },
    { value: "Europe/Vilnius", label: "Lithuania" },
    { value: "Europe/Luxembourg", label: "Luxembourg" },
    { value: "Asia/Macau", label: "Macau" },
    { value: "Indian/Antananarivo", label: "Madagascar" },
    { value: "Africa/Blantyre", label: "Malawi" },
    { value: "Asia/Kuala_Lumpur", label: "Malaysia — Kuala Lumpur" },
    { value: "Asia/Kuching", label: "Malaysia — Sarawak" },
    { value: "Indian/Maldives", label: "Maldives" },
    { value: "Africa/Bamako", label: "Mali" },
    { value: "Europe/Malta", label: "Malta" },
    { value: "Pacific/Kwajalein", label: "Marshall Islands" },
    { value: "Pacific/Majuro", label: "Marshall Islands — Majuro" },
    { value: "America/Martinique", label: "Martinique" },
    { value: "Africa/Nouakchott", label: "Mauritania" },
    { value: "Indian/Mauritius", label: "Mauritius" },
    { value: "Indian/Mayotte", label: "Mayotte" },
    { value: "America/Bahia_Banderas", label: "Mexico — Bahía de Banderas" },
    { value: "America/Cancun", label: "Mexico — Cancún (Eastern)" },
    { value: "America/Chihuahua", label: "Mexico — Chihuahua" },
    { value: "America/Hermosillo", label: "Mexico — Hermosillo" },
    { value: "America/Matamoros", label: "Mexico — Matamoros" },
    { value: "America/Mazatlan", label: "Mexico — Mazatlán" },
    { value: "America/Merida", label: "Mexico — Mérida" },
    { value: "America/Mexico_City", label: "Mexico — Mexico City" },
    { value: "America/Monterrey", label: "Mexico — Monterrey" },
    { value: "America/Ojinaga", label: "Mexico — Ojinaga" },
    { value: "America/Santa_Isabel", label: "Mexico — Santa Isabel" },
    { value: "America/Tijuana", label: "Mexico — Tijuana" },
    { value: "Pacific/Chuuk", label: "Micronesia — Chuuk" },
    { value: "Pacific/Kosrae", label: "Micronesia — Kosrae" },
    { value: "Pacific/Pohnpei", label: "Micronesia — Pohnpei" },
    { value: "Europe/Chisinau", label: "Moldova" },
    { value: "Europe/Monaco", label: "Monaco" },
    { value: "Asia/Choibalsan", label: "Mongolia — Choibalsan" },
    { value: "Asia/Hovd", label: "Mongolia — Hovd" },
    { value: "Asia/Ulaanbaatar", label: "Mongolia — Ulaanbaatar" },
    { value: "Europe/Podgorica", label: "Montenegro" },
    { value: "America/Montserrat", label: "Montserrat" },
    { value: "Africa/Casablanca", label: "Morocco" },
    { value: "Africa/Maputo", label: "Mozambique" },
    { value: "Asia/Yangon", label: "Myanmar" },
    { value: "Africa/Windhoek", label: "Namibia" },
    { value: "Pacific/Nauru", label: "Nauru" },
    { value: "Asia/Kathmandu", label: "Nepal" },
    { value: "Europe/Amsterdam", label: "Netherlands" },
    { value: "Pacific/Noumea", label: "New Caledonia" },
    { value: "Pacific/Auckland", label: "New Zealand" },
    { value: "Pacific/Chatham", label: "New Zealand — Chatham Islands" },
    { value: "America/Managua", label: "Nicaragua" },
    { value: "Africa/Niamey", label: "Niger" },
    { value: "Africa/Lagos", label: "Nigeria" },
    { value: "Pacific/Niue", label: "Niue" },
    { value: "Pacific/Norfolk", label: "Norfolk Island" },
    { value: "Asia/Pyongyang", label: "North Korea" },
    { value: "Europe/Skopje", label: "North Macedonia" },
    { value: "Pacific/Saipan", label: "Northern Mariana Islands" },
    { value: "Europe/Oslo", label: "Norway" },
    { value: "Asia/Muscat", label: "Oman" },
    { value: "Asia/Karachi", label: "Pakistan" },
    { value: "Pacific/Palau", label: "Palau" },
    { value: "Asia/Gaza", label: "Palestine — Gaza" },
    { value: "Asia/Hebron", label: "Palestine — Hebron" },
    { value: "Asia/Jerusalem", label: "Palestine — Jerusalem" },
    { value: "America/Panama", label: "Panama" },
    { value: "Pacific/Port_Moresby", label: "Papua New Guinea" },
    { value: "Pacific/Bougainville", label: "Papua New Guinea — Bougainville" },
    { value: "America/Asuncion", label: "Paraguay" },
    { value: "America/Lima", label: "Peru" },
    { value: "Asia/Manila", label: "Philippines" },
    { value: "Pacific/Pitcairn", label: "Pitcairn Islands" },
    { value: "Europe/Warsaw", label: "Poland" },
    { value: "Europe/Lisbon", label: "Portugal" },
    { value: "Atlantic/Azores", label: "Portugal — Azores" },
    { value: "Atlantic/Madeira", label: "Portugal — Madeira" },
    { value: "America/Puerto_Rico", label: "Puerto Rico" },
    { value: "Asia/Qatar", label: "Qatar" },
    { value: "Africa/Brazzaville", label: "Republic of Congo" },
    { value: "Indian/Reunion", label: "Réunion" },
    { value: "Europe/Bucharest", label: "Romania" },
    { value: "Asia/Anadyr", label: "Russia — Anadyr" },
    { value: "Europe/Astrakhan", label: "Russia — Astrakhan" },
    { value: "Asia/Barnaul", label: "Russia — Barnaul" },
    { value: "Asia/Chita", label: "Russia — Chita" },
    { value: "Asia/Irkutsk", label: "Russia — Irkutsk" },
    { value: "Europe/Kaliningrad", label: "Russia — Kaliningrad" },
    { value: "Asia/Kamchatka", label: "Russia — Kamchatka" },
    { value: "Asia/Khandyga", label: "Russia — Khandyga" },
    { value: "Europe/Kirov", label: "Russia — Kirov" },
    { value: "Asia/Krasnoyarsk", label: "Russia — Krasnoyarsk" },
    { value: "Asia/Magadan", label: "Russia — Magadan" },
    { value: "Europe/Moscow", label: "Russia — Moscow" },
    { value: "Asia/Novokuznetsk", label: "Russia — Novokuznetsk" },
    { value: "Asia/Novosibirsk", label: "Russia — Novosibirsk" },
    { value: "Asia/Omsk", label: "Russia — Omsk" },
    { value: "Asia/Sakhalin", label: "Russia — Sakhalin" },
    { value: "Europe/Samara", label: "Russia — Samara" },
    { value: "Europe/Saratov", label: "Russia — Saratov" },
    { value: "Asia/Srednekolymsk", label: "Russia — Srednekolymsk" },
    { value: "Asia/Tomsk", label: "Russia — Tomsk" },
    { value: "Europe/Ulyanovsk", label: "Russia — Ulyanovsk" },
    { value: "Asia/Ust-Nera", label: "Russia — Ust-Nera" },
    { value: "Asia/Vladivostok", label: "Russia — Vladivostok" },
    { value: "Europe/Volgograd", label: "Russia — Volgograd" },
    { value: "Asia/Yakutsk", label: "Russia — Yakutsk" },
    { value: "Asia/Yekaterinburg", label: "Russia — Yekaterinburg" },
    { value: "Africa/Kigali", label: "Rwanda" },
    { value: "America/St_Barthelemy", label: "Saint Barthélemy" },
    { value: "Atlantic/St_Helena", label: "Saint Helena" },
    { value: "America/St_Kitts", label: "Saint Kitts and Nevis" },
    { value: "America/St_Lucia", label: "Saint Lucia" },
    { value: "America/Marigot", label: "Saint Martin" },
    { value: "America/Miquelon", label: "Saint Pierre and Miquelon" },
    { value: "America/St_Vincent", label: "Saint Vincent and the Grenadines" },
    { value: "Pacific/Apia", label: "Samoa" },
    { value: "Europe/San_Marino", label: "San Marino" },
    { value: "Africa/Sao_Tome", label: "São Tomé and Príncipe" },
    { value: "Asia/Riyadh", label: "Saudi Arabia" },
    { value: "Africa/Dakar", label: "Senegal" },
    { value: "Europe/Belgrade", label: "Serbia" },
    { value: "Indian/Mahe", label: "Seychelles" },
    { value: "Africa/Freetown", label: "Sierra Leone" },
    { value: "Asia/Singapore", label: "Singapore" },
    { value: "America/Lower_Princes", label: "Sint Maarten" },
    { value: "Europe/Bratislava", label: "Slovakia" },
    { value: "Europe/Ljubljana", label: "Slovenia" },
    { value: "Pacific/Guadalcanal", label: "Solomon Islands" },
    { value: "Africa/Mogadishu", label: "Somalia" },
    { value: "Africa/Johannesburg", label: "South Africa" },
    { value: "Atlantic/South_Georgia", label: "South Georgia" },
    { value: "Asia/Seoul", label: "South Korea" },
    { value: "Africa/Juba", label: "South Sudan" },
    { value: "Europe/Madrid", label: "Spain" },
    { value: "Atlantic/Canary", label: "Spain — Canary Islands" },
    { value: "Africa/Ceuta", label: "Spain (Ceuta)" },
    { value: "Asia/Colombo", label: "Sri Lanka" },
    { value: "Africa/Khartoum", label: "Sudan" },
    { value: "America/Paramaribo", label: "Suriname" },
    { value: "Arctic/Longyearbyen", label: "Svalbard and Jan Mayen" },
    { value: "Europe/Stockholm", label: "Sweden" },
    { value: "Europe/Zurich", label: "Switzerland" },
    { value: "Asia/Damascus", label: "Syria" },
    { value: "Asia/Taipei", label: "Taiwan" },
    { value: "Asia/Dushanbe", label: "Tajikistan" },
    { value: "Africa/Dar_es_Salaam", label: "Tanzania" },
    { value: "Asia/Bangkok", label: "Thailand" },
    { value: "Africa/Lome", label: "Togo" },
    { value: "Pacific/Fakaofo", label: "Tokelau" },
    { value: "Pacific/Tongatapu", label: "Tonga" },
    { value: "America/Port_of_Spain", label: "Trinidad and Tobago" },
    { value: "Africa/Tunis", label: "Tunisia" },
    { value: "Europe/Istanbul", label: "Turkey" },
    { value: "Asia/Ashgabat", label: "Turkmenistan" },
    { value: "America/Grand_Turk", label: "Turks and Caicos" },
    { value: "Pacific/Funafuti", label: "Tuvalu" },
    { value: "Asia/Dubai", label: "UAE" },
    { value: "Africa/Kampala", label: "Uganda" },
    { value: "Europe/Kiev", label: "Ukraine — Kyiv" },
    { value: "Europe/Uzhgorod", label: "Ukraine — Uzhhorod" },
    { value: "Europe/Zaporozhye", label: "Ukraine — Zaporizhzhia" },
    { value: "Europe/London", label: "United Kingdom" },
    { value: "America/Montevideo", label: "Uruguay" },
    { value: "America/Adak", label: "US — Adak (Hawaii-Aleutian)" },
    { value: "America/Anchorage", label: "US — Alaska" },
    { value: "America/Juneau", label: "US — Alaska (Juneau)" },
    { value: "America/Metlakatla", label: "US — Alaska (Metlakatla)" },
    { value: "America/Nome", label: "US — Alaska (Nome)" },
    { value: "America/Sitka", label: "US — Alaska (Sitka)" },
    { value: "America/Yakutat", label: "US — Alaska (Yakutat)" },
    { value: "America/Phoenix", label: "US — Arizona (Phoenix)" },
    { value: "America/Chicago", label: "US — Central (Chicago)" },
    { value: "America/Menominee", label: "US — Central (Menominee)" },
    { value: "America/Detroit", label: "US — Eastern (Detroit)" },
    { value: "America/New_York", label: "US — Eastern (New York)" },
    { value: "Pacific/Honolulu", label: "US — Hawaii" },
    {
        value: "America/Indiana/Indianapolis",
        label: "US — Indiana (Indianapolis)",
    },
    { value: "America/Indiana/Knox", label: "US — Indiana (Knox)" },
    { value: "America/Indiana/Marengo", label: "US — Indiana (Marengo)" },
    { value: "America/Indiana/Petersburg", label: "US — Indiana (Petersburg)" },
    { value: "America/Indiana/Tell_City", label: "US — Indiana (Tell City)" },
    { value: "America/Indiana/Vevay", label: "US — Indiana (Vevay)" },
    { value: "America/Indiana/Vincennes", label: "US — Indiana (Vincennes)" },
    { value: "America/Indiana/Winamac", label: "US — Indiana (Winamac)" },
    {
        value: "America/Kentucky/Louisville",
        label: "US — Kentucky (Louisville)",
    },
    {
        value: "America/Kentucky/Monticello",
        label: "US — Kentucky (Monticello)",
    },
    { value: "America/Boise", label: "US — Mountain (Boise)" },
    { value: "America/Denver", label: "US — Mountain (Denver)" },
    {
        value: "America/North_Dakota/Beulah",
        label: "US — North Dakota (Beulah)",
    },
    {
        value: "America/North_Dakota/Center",
        label: "US — North Dakota (Center)",
    },
    {
        value: "America/North_Dakota/New_Salem",
        label: "US — North Dakota (New Salem)",
    },
    { value: "America/Los_Angeles", label: "US — Pacific (Los Angeles)" },
    { value: "Pacific/Midway", label: "US Minor Outlying Islands — Midway" },
    { value: "America/St_Thomas", label: "US Virgin Islands" },
    { value: "UTC", label: "UTC — Universal Time" },
    { value: "Asia/Samarkand", label: "Uzbekistan — Samarkand" },
    { value: "Asia/Tashkent", label: "Uzbekistan — Tashkent" },
    { value: "Pacific/Efate", label: "Vanuatu" },
    { value: "Europe/Vatican", label: "Vatican City" },
    { value: "America/Caracas", label: "Venezuela" },
    { value: "Asia/Ho_Chi_Minh", label: "Vietnam" },
    { value: "Pacific/Wake", label: "Wake Island" },
    { value: "Pacific/Wallis", label: "Wallis and Futuna" },
    { value: "Africa/El_Aaiun", label: "Western Sahara" },
    { value: "Asia/Aden", label: "Yemen" },
    { value: "Africa/Lusaka", label: "Zambia" },
    { value: "Africa/Harare", label: "Zimbabwe" },
]

// ===============================
// Helpers
// ===============================

/**
 * Applies a case transformation to a string based on the given style.
 *
 * @param {string} str - The input string to transform.
 * @param {string} caseStyle - One of `"uppercase"`, `"lowercase"`, or
 *   `"capitalize"` (default). Capitalize uppercases the first character
 *   and lowercases the rest.
 * @returns {string} The transformed string, or `""` if input is falsy.
 *
 */
const applyCase = (str: string, caseStyle: string) => {
    if (!str) return ""
    switch (caseStyle) {
        case "uppercase":
            return str.toUpperCase()
        case "lowercase":
            return str.toLowerCase()
        default:
            return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
    }
}

/**
 * Returns the GMT/UTC offset string (e.g. "GMT+5:30") for a given IANA timezone.
 * Uses `Intl.DateTimeFormat` with the `shortOffset` timezone name option.
 *
 * @param {string} zone - A valid IANA timezone identifier (e.g. "Asia/Kolkata").
 * @returns {string} The short UTC offset string, or an empty string if the
 *   timezone is invalid or the offset cannot be resolved.
 *
 */
const getGMTOffset = (zone: string) => {
    try {
        const now = new Date()
        const formatter = new Intl.DateTimeFormat("en-US", {
            timeZone: zone,
            timeZoneName: "shortOffset",
        })
        const parts = formatter.formatToParts(now)
        return parts.find((p) => p.type === "timeZoneName")?.value || ""
    } catch {
        return ""
    }
}

/**
 * Produces a human-readable display string for a timezone, including its
 * GMT offset. Handles the special case of Palestinian territories by
 * normalizing all three of their IANA zones to a single "Palestine" label.
 * Returns "Local" for the magic value `"auto"`.
 *
 * @param {string} zone - An IANA timezone identifier or the string `"auto"`.
 * @returns {string} A formatted label such as `"India (GMT+5:30)"` or
 *   `"Palestine (GMT+3)"`, or the raw zone string if no matching entry is
 *   found in ZONES.
 *
 */
const formatZoneDisplay = (zone: string) => {
    if (zone === "auto") return "Local"
    if (
        zone === "Asia/Jerusalem" ||
        zone === "Asia/Gaza" ||
        zone === "Asia/Hebron"
    ) {
        const offset = getGMTOffset(zone)
        return `Palestine${offset ? ` (${offset})` : ""}`
    }
    const found = ZONES.find((z) => z.value === zone)
    if (!found) return zone
    const offset = getGMTOffset(zone)
    return `${found.label}${offset ? ` (${offset})` : ""}`
}

/**
 * Deduplicates a list of IANA timezone strings, treating the three
 * Palestinian territory zones (`Asia/Jerusalem`, `Asia/Gaza`, `Asia/Hebron`)
 * as a single logical entry. All other zones are deduplicated by their exact
 * string value. The first occurrence of each unique key is kept.
 *
 * @param {string[]} zones - An array of IANA timezone strings, potentially
 *   containing duplicates.
 * @returns {string[]} A new array with duplicate entries removed.
 *
 */
const normalizeZones = (zones: string[]) => {
    const seen = new Set()
    return zones.filter((zone) => {
        const key =
            zone === "Asia/Jerusalem" ||
            zone === "Asia/Gaza" ||
            zone === "Asia/Hebron"
                ? "Palestine"
                : zone
        if (seen.has(key)) return false
        seen.add(key)
        return true
    })
}

/**
 * Formats a date into a string using a specified date format pattern.
 * When `format` is `"default"`, falls back to `"DD MM YYYY"` with a space separator.
 *
 * @param {{ day: string, month: string, year: string, format: string }} params
 * @param {string} params.day   - Zero-padded day string (e.g. `"07"`).
 * @param {string} params.month - Month string; may be numeric (`"01"`) or
 *   named (`"Jan"` / `"January"`) depending on the `monthFormat` prop.
 * @param {string} params.year  - Four-digit year string (e.g. `"2025"`).
 * @param {string} params.format - One of `"DD/MM/YYYY"`, `"MM/DD/YYYY"`,
 *   `"YYYY-MM-DD"`, `"DD-MM-YYYY"`, or `"default"`.
 * @returns {string} The formatted date string.
 *
 */
const formatCustomDate = ({ day, month, year, format }) => {
    switch (format) {
        case "DD/MM/YYYY":
            return `${day}/${month}/${year}`
        case "MM/DD/YYYY":
            return `${month}/${day}/${year}`
        case "YYYY-MM-DD":
            return `${year}-${month}-${day}`
        case "DD-MM-YYYY":
            return `${day}-${month}-${year}`
        default:
            return `${day} ${month} ${year}`
    }
}

// ===============================
// COMPONENT
// ===============================

/**
 * @component WorldClockPro
 * @description A real-time world clock Framer component. Renders one clock row
 * per selected timezone, updating every second using a drift-corrected timeout
 * loop. All formatting is handled via the native `Intl.DateTimeFormat` API,
 * making the output fully locale-aware.
 *
 * ---
 *
 * ### Props
 *
 * #### Core
 * @param {boolean}  props.multiTimezone        - When `true`, renders one clock
 *   row for each timezone listed in `selectedTimeZones`. When `false`, renders
 *   a single clock for `customTimeZone`. Default: `false`.
 * @param {string}   props.customTimeZone        - IANA timezone identifier used
 *   in single-timezone mode. Pass `"auto"` to use the browser's local timezone.
 *   Default: `"auto"`.
 * @param {string[]} props.selectedTimeZones     - Array of IANA timezone
 *   identifiers used in multi-timezone mode. Default: `[]`.
 * @param {string}   props.locale                - BCP 47 locale tag for number
 *   and text formatting (e.g. `"en-US"`, `"hi-IN"`). Pass `"auto"` to use
 *   `navigator.language`. Default: `"auto"`.
 *
 * #### Date & Time Display
 * @param {boolean}  props.showDate              - Render the date portion
 *   (day, month, year). Default: `true`.
 * @param {boolean}  props.showDay               - Render the weekday name
 *   alongside the date. Only active when `showDate` is `true`. Default: `true`.
 * @param {"short"|"long"} props.dayFormat       - Weekday name length.
 *   `"short"` → `"Mon"`, `"long"` → `"Monday"`. Default: `"short"`.
 * @param {"short"|"long"|"numeric"} props.monthFormat - Month display style.
 *   `"short"` → `"Jan"`, `"long"` → `"January"`, `"numeric"` → `"01"`.
 *   Default: `"short"`.
 * @param {"default"|"DD/MM/YYYY"|"MM/DD/YYYY"|"YYYY-MM-DD"|"DD-MM-YYYY"} props.customDateFormat
 *   - Override the default locale date ordering. `"default"` preserves the
 *   native `Intl` output order. Default: `"default"`.
 * @param {boolean}  props.seconds               - Display the seconds field in
 *   the time string. Default: `false`.
 * @param {boolean}  props.is12hour              - Use 12-hour (AM/PM) format.
 *   When `false`, uses 24-hour format. Default: `true`.
 * @param {"uppercase"|"lowercase"} props.ampmCase - Case style for the AM/PM
 *   suffix. Only active when `is12hour` is `true`. Default: `"uppercase"`.
 * @param {"capitalize"|"uppercase"|"lowercase"} props.dayCase - Case style
 *   for the weekday name. Only active when both `showDay` and `showDate` are
 *   `true`. Default: `"capitalize"`.
 * @param {"capitalize"|"uppercase"|"lowercase"} props.monthCase - Case style
 *   for the month name. Only active when `showDate` is `true` and
 *   `monthFormat` is not `"numeric"`. Default: `"capitalize"`.
 *
 * #### Layout
 * @param {"inline"|"stacked"} props.layout      - `"inline"` places date,
 *   separator, and time on one horizontal line; `"stacked"` places each
 *   element on its own line. Default: `"inline"`.
 * @param {"start"|"center"|"end"} props.align   - Cross-axis alignment for
 *   stacked layout items. Only active when `layout === "stacked"`.
 *   Default: `"start"`.
 * @param {number}   props.spacingX              - Horizontal gap (px) between
 *   inline elements. Default: `8`.
 * @param {number}   props.spacingY              - Vertical gap (px) between
 *   stacked elements or between multiple timezone rows. Default: `8`.
 *
 * #### Separator
 * @param {boolean}  props.isSeparator           - Show a separator character
 *   between the date and time in inline layout. Default: `false`.
 * @param {"•"|"|"|"-"} props.separator          - The separator character to
 *   display. Only active when `isSeparator` is `true` and `layout === "inline"`.
 *   Default: `"|"`.
 *
 * #### Styles — Unified (separateStyles: false)
 * @param {boolean}  props.separateStyles        - When `false`, a single font
 *   style and color apply to all text elements. When `true`, date, time,
 *   separator, and timezone label each have independent style controls.
 *   Default: `false`.
 * @param {object}   props.textStyle             - Framer font style object
 *   applied to all text when `separateStyles` is `false`.
 * @param {string}   props.textColor             - CSS color for all text when
 *   `separateStyles` is `false`. Default: `"#000"`.
 *
 * #### Styles — Separate (separateStyles: true)
 * @param {object}   props.dateTextStyle         - Framer font style for the
 *   date portion.
 * @param {string}   props.dateColor             - CSS color for the date
 *   portion. Default: `"#666"`.
 * @param {object}   props.timeTextStyle         - Framer font style for the
 *   time portion.
 * @param {string}   props.timeColor             - CSS color for the time
 *   portion. Default: `"#000"`.
 * @param {object}   props.separatorTextStyle    - Framer font style for the
 *   separator character.
 * @param {string}   props.separatorColor        - CSS color for the separator.
 *   Default: `"#999"`.
 * @param {object}   props.timezoneTextStyle     - Framer font style for the
 *   timezone label shown in multi-timezone mode.
 * @param {string}   props.timezoneColor         - CSS color for the timezone
 *   label. Default: `"#999"`. Rendered at 60% opacity.
 *
 * @returns {JSX.Element} A `<div>` containing one clock row per resolved
 *   timezone.
 */
function WorldClockPro(props) {
    /** @type {[Date, Function]} Live clock state, updated every second. */
    const isStatic = useIsStaticRenderer()
    const [now, setNow] = useState(new Date())

    /**
     * Drift-corrected tick loop.
     * Schedules the next `setNow` call at the start of the next wall-clock
     * second rather than a fixed 1 000 ms interval, preventing cumulative drift.
     * Skipped entirely during static rendering to avoid editor performance
     * degradation and export artifacts.
     */
    useEffect(() => {
        if (isStatic) return // Skip live timer on canvas/static export

        let timer: any
        const tick = () => {
            setNow(new Date())
            const delay = 1000 - (Date.now() % 1000)
            timer = setTimeout(tick, delay)
        }
        tick()
        return () => clearTimeout(timer)
    }, [isStatic])

    /**
     * Resolve the list of zones to render.
     * In multi-timezone mode the `selectedTimeZones` array is used;
     * otherwise the single `customTimeZone` value is wrapped in an array.
     */
    const zones =
        props.multiTimezone && props.selectedTimeZones?.length
            ? props.selectedTimeZones
            : [props.customTimeZone]

    /** De-duplicated zone list (Palestinian zones collapsed to one entry). */
    const safeZones = normalizeZones(zones)

    /**
     * Resolve the active locale.
     * `"auto"` defers to the browser's `navigator.language`; any explicit
     * BCP 47 tag (e.g. `"fr-FR"`) is passed straight through to `Intl`.
     */
    const locale =
        props.locale === "auto"
            ? typeof navigator !== "undefined"
                ? navigator.language
                : "en-US"
            : props.locale

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                rowGap: props.spacingY,
            }}
        >
            {safeZones.map((zone, i) => {
                /**
                 * Build an `Intl.DateTimeFormat` instance tailored to the
                 * current zone, locale, and display options. Passing
                 * `undefined` as the `timeZone` option (when zone is `"auto"`)
                 * tells `Intl` to use the browser's local timezone.
                 */
                const formatter = new Intl.DateTimeFormat(locale, {
                    timeZone: zone === "auto" ? undefined : zone,
                    hour: "numeric",
                    minute: "2-digit",
                    second: props.seconds ? "2-digit" : undefined,
                    hour12: props.is12hour,
                    weekday: props.showDay
                        ? props.dayFormat === "long"
                            ? "long"
                            : "short"
                        : undefined,
                    day: props.showDate ? "numeric" : undefined,
                    month: props.showDate
                        ? props.monthFormat === "long"
                            ? "long"
                            : props.monthFormat === "numeric"
                              ? "numeric"
                              : "short"
                        : undefined,
                    year: props.showDate
                        ? props.yearFormat === "2-digit"
                            ? "2-digit"
                            : props.yearFormat === "numeric"
                              ? "numeric"
                              : "2-digit"
                        : undefined,
                })

                /** Extract individual date/time parts from the formatted date. */
                const parts = formatter.formatToParts(now)

                /**
                 * Helper to retrieve a single part value by its type token.
                 * @param {string} t - The `Intl.DateTimeFormatPartTypes` key.
                 * @returns {string} The part's string value, or `""` if absent.
                 */
                const get = (t: string) =>
                    parts.find((p) => p.type === t)?.value || ""

                const day = get("day")
                const year = get("year")

                /**
                 * Apply zero-padding to numeric months so they always render
                 * as two digits (e.g. `"1"` → `"01"`). Named formats are
                 * passed through `applyCase` using the `monthCase` prop.
                 */
                const rawMonth = get("month")
                const month =
                    props.monthFormat === "numeric"
                        ? rawMonth.toString().padStart(2, "0")
                        : applyCase(rawMonth, props.monthCase)

                /** Weekday name transformed according to the `dayCase` prop. */
                const weekday = applyCase(get("weekday"), props.dayCase)

                /**
                 * Apply a custom date format template if one has been selected,
                 * otherwise fall back to the default `"DD Month YYYY"` order.
                 */
                const formattedDate =
                    props.customDateFormat !== "default"
                        ? formatCustomDate({
                              day,
                              month,
                              year,
                              format: props.customDateFormat,
                          })
                        : `${day} ${month} ${year}`

                /**
                 * Compose the full date label. Includes the weekday prefix
                 * only when both `showDay` and `showDate` are active.
                 */
                const dateString = `${props.showDay && props.showDate ? weekday + ", " : ""}${
                    props.showDate ? formattedDate : ""
                }`

                /**
                 * Format the AM/PM suffix according to the `ampmCase` prop.
                 * Returns an empty string in 24-hour mode or when `dayPeriod`
                 * is unavailable.
                 */
                const dayPeriod = get("dayPeriod")
                const ampm =
                    props.is12hour && dayPeriod
                        ? props.ampmCase === "lowercase"
                            ? dayPeriod.toLowerCase()
                            : dayPeriod.toUpperCase()
                        : ""

                /** Assembled time string, conditionally including seconds and AM/PM. */
                const timeString = `${get("hour")}:${get("minute")}${
                    props.seconds ? `:${get("second")}` : ""
                }${ampm ? ` ${ampm}` : ""}`

                // ── Style objects ──────────────────────────────────────────

                /** Unified style applied to every element when `separateStyles` is off. */
                const unifiedStyle = {
                    ...props.textStyle,
                    color: props.textColor,
                }

                /** Per-element styles used when `separateStyles` is on. */
                const dateStyle = {
                    ...props.dateTextStyle,
                    color: props.dateColor,
                }
                const timeStyle = {
                    ...props.timeTextStyle,
                    color: props.timeColor,
                }
                const separatorStyle = {
                    ...props.separatorTextStyle,
                    color: props.separatorColor,
                }
                /**
                 * Timezone label is always rendered at 60% opacity to visually
                 * distinguish it from the primary time/date content.
                 */
                const timezoneStyle = {
                    ...props.timezoneTextStyle,
                    color: props.timezoneColor,
                    opacity: 0.8,
                }

                return (
                    <div
                        key={i}
                        style={{
                            display: "flex",
                            flexDirection:
                                props.layout === "stacked" ? "column" : "row",
                            alignItems:
                                props.align === "start"
                                    ? "flex-start"
                                    : props.align === "end"
                                      ? "flex-end"
                                      : "center",
                            columnGap: props.spacingX,
                            rowGap: props.spacingY,
                        }}
                    >
                        {props.layout === "stacked" ? (
                            // ── Stacked layout: no inline separator ──────────
                            <>
                                {dateString && (
                                    <div
                                        style={
                                            props.separateStyles
                                                ? dateStyle
                                                : unifiedStyle
                                        }
                                    >
                                        {dateString}
                                    </div>
                                )}
                                <div
                                    style={
                                        props.separateStyles
                                            ? timeStyle
                                            : unifiedStyle
                                    }
                                >
                                    {timeString}
                                </div>
                                {props.multiTimezone && (
                                    <div
                                        style={
                                            props.separateStyles
                                                ? timezoneStyle
                                                : {
                                                      ...unifiedStyle,
                                                      opacity: 0.8,
                                                  }
                                        }
                                    >
                                        ({formatZoneDisplay(zone)})
                                    </div>
                                )}
                            </>
                        ) : (
                            // ── Inline layout: each element is a sibling <span> ──
                            <>
                                {dateString && (
                                    <span
                                        style={
                                            props.separateStyles
                                                ? dateStyle
                                                : unifiedStyle
                                        }
                                    >
                                        {dateString}
                                    </span>
                                )}
                                {/* Separator is only shown when both date and isSeparator are active */}
                                {dateString && props.isSeparator && (
                                    <span
                                        style={
                                            props.separateStyles
                                                ? separatorStyle
                                                : unifiedStyle
                                        }
                                    >
                                        {props.separator}
                                    </span>
                                )}
                                <span
                                    style={
                                        props.separateStyles
                                            ? timeStyle
                                            : unifiedStyle
                                    }
                                >
                                    {timeString}
                                </span>
                                {props.multiTimezone && (
                                    <span
                                        style={
                                            props.separateStyles
                                                ? timezoneStyle
                                                : {
                                                      ...unifiedStyle,
                                                      opacity: 0.8,
                                                  }
                                        }
                                    >
                                        ({formatZoneDisplay(zone)})
                                    </span>
                                )}
                            </>
                        )}
                    </div>
                )
            })}
        </div>
    )
}

// ===============================
// DEFAULT PROPS
// ===============================

/**
 * @name WorldClockPro.defaultProps
 * @description Fallback prop values applied by Framer when the component is
 * first dropped onto the canvas or when a prop is not explicitly set.
 */
WorldClockPro.defaultProps = {
    // ── Core ──────────────────────────────────────────────────────────────
    /** @default false */
    multiTimezone: false,
    /** @default "auto" — uses the browser's local timezone */
    customTimeZone: "auto",
    /** @default [] */
    selectedTimeZones: [],
    /** @default "auto" — uses navigator.language */
    locale: "auto",

    // ── Date & Time ───────────────────────────────────────────────────────
    /** @default true */
    showDate: true,
    /** @default true */
    showDay: true,
    /** @default "short" — e.g. "Mon" */
    dayFormat: "short",
    /** @default "capitalize" — e.g. "Mon" */
    dayCase: "capitalize",
    /** @default "short" — e.g. "Jan" */
    monthFormat: "short",
    /** @default "capitalize" — e.g. "Jan" */
    monthCase: "capitalize",
    /** @default "numeric" — e.g. "2026" */
    yearFormat: "numeric",
    /** @default "default" — uses Intl native ordering */
    customDateFormat: "default",
    /** @default false */
    seconds: false,
    /** @default true */
    is12hour: true,
    /** @default "uppercase" — e.g. "AM" / "PM" */
    ampmCase: "uppercase",

    // ── Layout ────────────────────────────────────────────────────────────
    /** @default "inline" */
    layout: "inline",
    /** @default "start" */
    align: "start",
    /** @default 8 — px */
    spacingX: 8,
    /** @default 8 — px */
    spacingY: 8,

    // ── Separator ─────────────────────────────────────────────────────────
    /** @default false */
    isSeparator: false,
    /** @default "|" */
    separator: "|",

    // ── Styles ────────────────────────────────────────────────────────────
    /** @default false */
    separateStyles: false,
    /** @default "#000" */
    textColor: "#000",
    /** @default "#666" */
    dateColor: "#666",
    /** @default "#000" */
    timeColor: "#000",
    /** @default "#999" */
    separatorColor: "#999",
    /** @default "#999" */
    timezoneColor: "#999",
}

// ===============================
// PROPERTY CONTROLS
// ===============================

/**
 * Framer property controls definition for `WorldClock Pro`.
 * These controls are rendered in the Framer design panel and map directly
 * to the component props documented above.
 *
 * Control groups:
 * - **Core**: timezone selection mode, timezone picker(s), locale.
 * - **Date & Time Display**: date/day/month/format toggles, seconds, 12/24h, AM/PM case.
 * - **Layout**: inline vs. stacked, alignment, X/Y spacing.
 * - **Separator**: toggle and character picker.
 * - **Styles**: unified vs. separate font/color controls for each text element.
 */
addPropertyControls(WorldClockPro, {
    multiTimezone: {
        type: ControlType.Boolean,
        title: "Multi Timezone",
    },

    customTimeZone: {
        type: ControlType.Enum,
        options: ["auto", ...ZONES.map((z) => z.value)],
        optionTitles: ["Auto", ...ZONES.map((z) => z.label)],
        title: "Timezone",
        hidden(props) {
            return props.multiTimezone
        },
    },

    selectedTimeZones: {
        type: ControlType.Array,
        control: {
            type: ControlType.Enum,
            options: ZONES.map((z) => z.value),
            optionTitles: ZONES.map((z) => z.label),
        },
        title: "Timezones",
        hidden(props) {
            return !props.multiTimezone
        },
    },

    locale: {
        type: ControlType.Enum,
        options: [
            "auto",
            "ar-SA",
            "en-US",
            "en-GB",
            "fr-FR",
            "de-DE",
            "hi-IN",
            "bn-BD",
            "ur-PK",
        ],
        optionTitles: [
            "Auto",
            "Arabic (SA)",
            "English (US)",
            "English (UK)",
            "French",
            "German",
            "Hindi (India)",
            "Bengali (Bangladesh)",
            "Urdu (Pakistan)",
        ],
        title: "Locale",
    },

    // ── Date & Time Display ───────────────────────────────────────────────
    showDate: {
        type: ControlType.Boolean,
        title: "Show Date",
    },
    showDay: {
        type: ControlType.Boolean,
        title: "Show Day",
        hidden(props) {
            return !props.showDate
        },
    },
    dayFormat: {
        type: ControlType.Enum,
        options: ["short", "long"],
        optionTitles: ["Mon", "Monday"],
        title: "Day Format",
        hidden(props) {
            return !props.showDate || !props.showDay
        },
    },
    dayCase: {
        type: ControlType.Enum,
        options: ["capitalize", "uppercase", "lowercase"],
        optionTitles: ["Default", "Uppercase", "Lowercase"],
        title: "Day Case",
        hidden(props) {
            return !props.showDate || !props.showDay
        },
    },
    monthFormat: {
        type: ControlType.Enum,
        options: ["short", "long", "numeric"],
        optionTitles: ["Jan", "January", "01"],
        title: "Month Format",
        hidden(props) {
            return !props.showDate
        },
    },
    monthCase: {
        type: ControlType.Enum,
        options: ["capitalize", "uppercase", "lowercase"],
        optionTitles: ["Default", "Uppercase", "Lowercase"],
        title: "Month Case",
        hidden(props) {
            return !props.showDate || props.monthFormat === "numeric"
        },
    },
    yearFormat: {
        type: ControlType.Enum,
        options: ["2-digit", "numeric"],
        optionTitles: ["26", "2026"],
        title: "Year Format",
        hidden(props) {
            return !props.showDate
        },
    },
    customDateFormat: {
        type: ControlType.Enum,
        options: [
            "default",
            "DD/MM/YYYY",
            "MM/DD/YYYY",
            "YYYY-MM-DD",
            "DD-MM-YYYY",
        ],
        optionTitles: [
            "Default",
            "DD/MM/YYYY",
            "MM/DD/YYYY",
            "YYYY-MM-DD",
            "DD-MM-YYYY",
        ],
        title: "Date Format",
        hidden(props) {
            return !props.showDate
        },
    },
    seconds: {
        type: ControlType.Boolean,
        title: "Show Seconds",
    },
    is12hour: {
        type: ControlType.Boolean,
        title: "12 Hour Format",
    },
    ampmCase: {
        type: ControlType.Enum,
        options: ["uppercase", "lowercase"],
        optionTitles: ["AM / PM", "am / pm"],
        title: "AM/PM Style",
        hidden(props) {
            return !props.is12hour
        },
    },

    // ── Layout ────────────────────────────────────────────────────────────
    layout: {
        type: ControlType.Enum,
        options: ["inline", "stacked"],
        optionTitles: ["horizontal", "vertical"],
        displaySegmentedControl: true,
        title: "Layout",
    },
    align: {
        type: ControlType.Enum,
        options: ["start", "center", "end"],
        optionTitles: ["Left", "Center", "Right"],
        displaySegmentedControl: true,
        title: "Alignment",
        hidden(props) {
            return props.layout === "inline"
        },
    },
    spacingX: {
        type: ControlType.Number,
        title: "Spacing X",
        hidden(props) {
            return props.layout === "stacked"
        },
    },
    spacingY: {
        type: ControlType.Number,
        title: "Spacing Y",
    },

    // ── Separator ─────────────────────────────────────────────────────────
    isSeparator: {
        type: ControlType.Boolean,
        title: "Show Separator",
        hidden(props) {
            return props.layout === "stacked"
        },
    },
    separator: {
        type: ControlType.Enum,
        options: ["•", "|", "-"],
        optionTitles: ["Dot", "Pipe", "Dash"],
        title: "Separator",
        hidden(props) {
            return !props.isSeparator || props.layout === "stacked"
        },
    },

    // ── Styles ────────────────────────────────────────────────────────────
    separateStyles: {
        type: ControlType.Boolean,
        title: "Separate Styles",
    },

    // Unified (separateStyles OFF)
    textStyle: {
        type: ControlType.Font || ("font" as any),
        controls: "extended",
        title: "Text Style",
        hidden(props) {
            return props.separateStyles
        },
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        hidden(props) {
            return props.separateStyles
        },
    },

    // Separate (separateStyles ON)
    dateTextStyle: {
        type: ControlType.Font || ("font" as any),
        controls: "extended",
        title: "Date Style",
        hidden(props) {
            return !props.separateStyles
        },
    },
    dateColor: {
        type: ControlType.Color,
        title: "Date Color",
        hidden(props) {
            return !props.separateStyles
        },
    },

    timeTextStyle: {
        type: ControlType.Font || ("font" as any),
        controls: "extended",
        title: "Time Style",
        hidden(props) {
            return !props.separateStyles
        },
    },
    timeColor: {
        type: ControlType.Color,
        title: "Time Color",
        hidden(props) {
            return !props.separateStyles
        },
    },

    separatorTextStyle: {
        type: ControlType.Font || ("font" as any),
        controls: "extended",
        title: "Separator Style",
        hidden(props) {
            return !props.separateStyles || !props.isSeparator
        },
    },
    separatorColor: {
        type: ControlType.Color,
        title: "Separator Color",
        hidden(props) {
            return !props.separateStyles || !props.isSeparator
        },
    },

    timezoneTextStyle: {
        type: ControlType.Font || ("font" as any),
        controls: "extended",
        title: "Timezone Style",
        hidden(props) {
            return !props.separateStyles || !props.multiTimezone
        },
    },
    timezoneColor: {
        type: ControlType.Color,
        title: "Timezone Color",
        hidden(props) {
            return !props.separateStyles || !props.multiTimezone
        },
    },
})

export { WorldClockPro as default }

WorldClockPro.displayName = "WorldClock Pro"
