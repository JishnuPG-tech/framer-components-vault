// v1.0

import { useEffect, useState, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


// Shown on the canvas card. Bump it with each major release.
const VERSION = "1.0"
const ACCENT = "#0088FF"

const DAYS = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
] as const
type Day = (typeof DAYS)[number]

// Which extra fields a business type uses. Every group except org and person has a shopfront.
type Group =
    | "local"
    | "food"
    | "medical"
    | "service"
    | "trade"
    | "org"
    | "person"

const GROUP_TITLES: Record<Group, string> = {
    local: "Local business",
    food: "Food and drink",
    medical: "Medical",
    service: "Professional service",
    trade: "Trade or home service",
    org: "Company with no shopfront",
    person: "Person",
}

const LOCAL_GROUPS: Group[] = ["local", "food", "medical", "service", "trade"]

// schema.org type → title in the dropdown and the group that decides its extra fields.
const TYPES: Record<string, { title: string; group: Group }> = {
    LocalBusiness: { title: "Local business (general)", group: "local" },
    Restaurant: { title: "Restaurant", group: "food" },
    CafeOrCoffeeShop: { title: "Café", group: "food" },
    BarOrPub: { title: "Bar or pub", group: "food" },
    Bakery: { title: "Bakery", group: "food" },
    Store: { title: "Shop", group: "local" },
    HairSalon: { title: "Hair salon", group: "local" },
    BeautySalon: { title: "Beauty salon", group: "local" },
    DaySpa: { title: "Spa", group: "local" },
    HealthClub: { title: "Gym", group: "local" },
    Dentist: { title: "Dentist", group: "medical" },
    MedicalClinic: { title: "Medical clinic", group: "medical" },
    LegalService: { title: "Law firm", group: "service" },
    AccountingService: { title: "Accountant", group: "service" },
    RealEstateAgent: { title: "Real estate agent", group: "service" },
    Plumber: { title: "Plumber", group: "trade" },
    Electrician: { title: "Electrician", group: "trade" },
    HomeAndConstructionBusiness: { title: "Builder", group: "trade" },
    Organization: { title: "Company with no shopfront", group: "org" },
    Person: { title: "Person or freelancer", group: "person" },
}
const CUSTOM = "Custom"

interface Photo {
    src: string
    alt?: string
}

interface SmartSchemaProps {
    businessType: string
    customType: string
    customGroup: Group
    name: string
    description: string
    photo?: Photo
    logo?: Photo
    websiteUrl: string
    phone: string
    email: string
    priceRange: string
    paymentAccepted: string
    cuisine: string
    menuUrl: string
    reservations: string
    medicalSpecialty: string
    areaServed: string
    contactType: string
    jobTitle: string
    worksFor: string
    street: string
    suburb: string
    state: string
    postcode: string
    country: string
    latitude: string
    longitude: string
    monday: string
    tuesday: string
    wednesday: string
    thursday: string
    friday: string
    saturday: string
    sunday: string
    instagram: string
    facebook: string
    x: string
    linkedin: string
    tiktok: string
    youtube: string
    googleBusiness: string
    extraJson: string
    style?: CSSProperties
}

function groupOf(props: Partial<SmartSchemaProps>): Group {
    if (props.businessType === CUSTOM) return props.customGroup || "local"
    return TYPES[props.businessType ?? ""]?.group ?? "local"
}

const TIME = String.raw`(\d{1,2})(?:[:.](\d{2}))?\s*(?:([ap])\.?m\.?)?`
const RANGE = new RegExp(`^${TIME}\\s*(?:-|–|—|to)\\s*${TIME}$`, "i")

// "9", "9:30", "9.30pm" → "09:00", "09:30", "21:30". Out-of-range times → null.
function toTime(
    hour: string,
    minute: string | undefined,
    half: string | undefined
) {
    let h = Number(hour)
    const m = minute ? Number(minute) : 0
    if (half) {
        if (h < 1 || h > 12) return null
        h = (h % 12) + (half.toLowerCase() === "p" ? 12 : 0)
    }
    if (h === 24 && m === 0) return "23:59"
    if (h > 23 || m > 59) return null
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

// "11:00-22:00", "11am – 10pm", "11:00-14:00, 17:00-22:00", "Open 24 hours" → time ranges.
// "Closed" or blank → no ranges. Pieces it can't read are reported in `invalid`.
function parseHours(value: string | undefined) {
    const text = (value || "").trim()
    if (!text || /closed/i.test(text)) return { ranges: [], invalid: false }
    if (/24\s*h(ou)?rs?|all day/i.test(text))
        return { ranges: [{ opens: "00:00", closes: "23:59" }], invalid: false }

    const ranges: { opens: string; closes: string }[] = []
    let invalid = false
    for (const piece of text.split(/,|&|\band\b/i)) {
        const match = piece.trim().match(RANGE)
        const opens = match && toTime(match[1], match[2], match[3])
        const closes = match && toTime(match[4], match[5], match[6])
        // "7-5" is probably 7am to 5pm, not past midnight, so treat it as unreadable rather than guess.
        const bare =
            match && ((!match[2] && !match[3]) || (!match[5] && !match[6]))
        if (opens && closes && !(bare && closes <= opens))
            ranges.push({ opens, closes })
        else if (piece.trim()) invalid = true
    }
    return { ranges, invalid }
}

// Comma or line separated text → one string, a list of strings, or undefined.
function list(value: string | undefined) {
    const items = (value || "")
        .split(/[,\n]/)
        .map((item) => item.trim())
        .filter(Boolean)
    return items.length > 1 ? items : items[0]
}

// "Yes" / "No" → true / false. Anything else is treated as a booking link.
function reservations(
    value: string | undefined,
    resolve: (link?: string) => string | undefined
) {
    const text = (value || "").trim()
    if (/^(yes|true)$/i.test(text)) return true
    if (/^(no|false)$/i.test(text)) return false
    return resolve(text)
}

// Drops empty strings, empty arrays and objects that only carry an "@type".
function clean(value: unknown): unknown {
    if (Array.isArray(value)) {
        const list = value.map(clean).filter((item) => item !== undefined)
        return list.length ? list : undefined
    }
    if (value && typeof value === "object") {
        const entries = Object.entries(value)
            .map(([key, item]) => [key, clean(item)] as const)
            .filter(([, item]) => item !== undefined)
        const meaningful = entries.filter(
            ([key]) => key !== "@type" && key !== "@context"
        )
        return meaningful.length ? Object.fromEntries(entries) : undefined
    }
    if (typeof value === "string")
        return value.trim() ? value.trim() : undefined
    return value
}

// Builds the JSON-LD object and a list of problems to show on the canvas label.
// Fields that don't belong to the chosen type are left out even if they hold a value.
function buildSchema(props: SmartSchemaProps, browserOrigin: string) {
    const warnings: string[] = []
    const group = groupOf(props)
    const is = (...groups: Group[]) => groups.includes(group)
    const local = is(...LOCAL_GROUPS)

    let type =
        props.businessType in TYPES ? props.businessType : "LocalBusiness"
    if (props.businessType === CUSTOM) {
        const custom = (props.customType || "").trim()
        if (/^[A-Z][A-Za-z]+$/.test(custom)) type = custom
        else
            warnings.push(
                "Custom Type needs a schema.org type name, like AutoRepair"
            )
    }

    // Prefer the Website URL from the CMS: the server-rendered HTML has no browser address to read.
    const fromCms = (props.websiteUrl || "").trim().replace(/\/+$/, "")
    const origin = fromCms || browserOrigin
    const resolve = (link?: string) => {
        const text = (link || "").trim()
        if (!text) return undefined
        try {
            return new URL(text, origin ? origin + "/" : undefined).href
        } catch {
            return undefined
        }
    }

    const openingHours = new Map<
        string,
        { opens: string; closes: string; days: Day[] }
    >()
    if (local) {
        for (const day of DAYS) {
            const { ranges, invalid } = parseHours(
                props[day.toLowerCase() as Lowercase<Day>]
            )
            if (invalid)
                warnings.push(`${day} hours not understood, use 11:00-22:00`)
            for (const range of ranges) {
                const key = range.opens + range.closes
                const entry = openingHours.get(key) ?? { ...range, days: [] }
                entry.days.push(day)
                openingHours.set(key, entry)
            }
        }
    }

    const latitude = Number(props.latitude)
    const longitude = Number(props.longitude)
    const hasGeo =
        local &&
        (props.latitude || "").trim() !== "" &&
        (props.longitude || "").trim() !== "" &&
        !isNaN(latitude) &&
        !isNaN(longitude)

    const hasContact = Boolean(
        (props.phone || "").trim() || (props.email || "").trim()
    )
    const socials = [
        props.instagram,
        props.facebook,
        props.x,
        props.linkedin,
        props.tiktok,
        props.youtube,
        props.googleBusiness,
    ].filter((link) => /^https?:\/\//i.test((link || "").trim()))

    const data = clean({
        "@context": "https://schema.org",
        "@type": type,
        name: props.name,
        description: props.description,
        image: props.photo?.src,
        logo: is("person") ? undefined : props.logo?.src,
        url: origin ? origin + "/" : undefined,
        telephone: props.phone,
        email: props.email,
        priceRange:
            local && props.priceRange !== "none" ? props.priceRange : undefined,
        paymentAccepted: local ? props.paymentAccepted : undefined,
        servesCuisine: is("food") ? props.cuisine : undefined,
        hasMenu: is("food") ? resolve(props.menuUrl) : undefined,
        acceptsReservations: is("food")
            ? reservations(props.reservations, resolve)
            : undefined,
        medicalSpecialty: is("medical") ? props.medicalSpecialty : undefined,
        areaServed: is("service", "trade", "org")
            ? list(props.areaServed)
            : undefined,
        jobTitle: is("person") ? props.jobTitle : undefined,
        worksFor: is("person")
            ? { "@type": "Organization", name: props.worksFor }
            : undefined,
        contactPoint:
            is("org") && hasContact
                ? {
                      "@type": "ContactPoint",
                      contactType: props.contactType,
                      telephone: props.phone,
                      email: props.email,
                  }
                : undefined,
        address: is("person")
            ? undefined
            : {
                  "@type": "PostalAddress",
                  streetAddress: props.street,
                  addressLocality: props.suburb,
                  addressRegion: props.state,
                  postalCode: props.postcode,
                  addressCountry: props.country,
              },
        geo: hasGeo
            ? { "@type": "GeoCoordinates", latitude, longitude }
            : undefined,
        hasMap: local ? resolve(props.googleBusiness) : undefined,
        openingHoursSpecification: [...openingHours.values()].map(
            ({ days, ...range }) => ({
                "@type": "OpeningHoursSpecification",
                dayOfWeek: days.length === 1 ? days[0] : days,
                ...range,
            })
        ),
        sameAs: socials,
    }) as Record<string, unknown> | undefined

    if (!(props.name || "").trim()) warnings.push("Add a name")
    if (local && !(props.street || "").trim() && !(props.suburb || "").trim())
        warnings.push("Add an address, Google needs one for local results")
    if ((props.latitude || props.longitude) && local && !hasGeo)
        warnings.push("Map Latitude and Longitude must both be numbers")

    let extra: Record<string, unknown> = {}
    if ((props.extraJson || "").trim()) {
        try {
            const parsed = JSON.parse(props.extraJson)
            if (parsed && typeof parsed === "object" && !Array.isArray(parsed))
                extra = parsed
            else
                warnings.push(
                    "Extra JSON must be an object { … }, so it's skipped"
                )
        } catch {
            warnings.push("Extra JSON isn't valid JSON, so it's skipped")
        }
    }

    // Nothing filled in → no script at all.
    const merged =
        data || Object.keys(extra).length
            ? {
                  "@context": "https://schema.org",
                  "@type": type,
                  ...data,
                  ...extra,
              }
            : undefined
    return { data: merged, warnings, type }
}

/**
 * Smart Schema
 *
 * Outputs schema.org structured data (JSON-LD) for a business, a company or a
 * person. Fill in the properties, or bind them to a CMS entry. Invisible on the
 * live site.
 *
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function SmartSchema(props: SmartSchemaProps) {
    // Only used when Website URL is empty. It can't reach the server HTML, so Google's first read won't have it.
    const [browserOrigin, setBrowserOrigin] = useState("")
    useEffect(() => setBrowserOrigin(window.location.origin), [])

    const { data, warnings, type } = buildSchema(props, browserOrigin)
    const target = RenderTarget.current()

    if (target === RenderTarget.canvas || target === RenderTarget.thumbnail) {
        // "Local business (general)" → "Local business"
        const typeTitle = (TYPES[type]?.title ?? type).replace(/\s*\(.*\)$/, "")
        return (
            <div
                style={{
                    position: "relative",
                    display: "grid",
                    gridTemplateColumns: "1fr auto",
                    width: "max-content",
                    columnGap: 16,
                    rowGap: 4,
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: `2px dashed ${ACCENT}`,
                    background: "#FFFFFF",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
                    color: "#000000",
                    fontFamily: "Inter, sans-serif",
                    fontSize: 9,
                    lineHeight: 1.35,
                    whiteSpace: "nowrap",
                }}
            >
                <div
                    style={{
                        alignSelf: "center",
                        fontSize: 11,
                        fontWeight: 700,
                        lineHeight: 1.2,
                    }}
                >
                    Smart Schema v{VERSION}
                </div>
                <div
                    style={{
                        justifySelf: "end",
                        padding: "2px 7px",
                        borderRadius: 999,
                        background: ACCENT,
                        color: "#FFFFFF",
                    }}
                >
                    {typeTitle}
                </div>
                <div>
                    This component will be
                    <br />
                    hidden on the live site.
                </div>
                <div
                    style={{
                        alignSelf: "end",
                        justifySelf: "end",
                        color: ACCENT,
                    }}
                >
                    Click to add details
                </div>
                {warnings.length > 0 && (
                    <div
                        style={{
                            gridColumn: "1 / -1",
                            fontSize: 8,
                            color: "#B25E00",
                        }}
                    >
                        {warnings.map((warning) => (
                            <div key={warning}>⚠ {warning}</div>
                        ))}
                    </div>
                )}
            </div>
        )
    }

    if (!data) return null

    const json = JSON.stringify(data).replace(/</g, "\\u003c")

    return (
        <div
            style={{
                position: "relative",
                width: 0,
                height: 0,
                overflow: "hidden",
            }}
            aria-hidden="true"
        >
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: json }}
            />
        </div>
    )
}

// Hides a property unless the chosen business type belongs to one of these groups.
const onlyFor =
    (...groups: Group[]) =>
    (props: Partial<SmartSchemaProps>) =>
        !groups.includes(groupOf(props))

const text = (
    title: string,
    placeholder: string,
    hidden?: ReturnType<typeof onlyFor>
) =>
    ({
        type: ControlType.String,
        title,
        defaultValue: "",
        placeholder,
        hidden,
    }) as const
const link = (title: string, hidden?: ReturnType<typeof onlyFor>) =>
    ({ type: ControlType.Link, title, hidden }) as const
const hours = (title: string) =>
    text(title, "11:00-22:00 or Closed", onlyFor(...LOCAL_GROUPS))
const notPerson = onlyFor("local", "food", "medical", "service", "trade", "org")

addPropertyControls(SmartSchema, {
    businessType: {
        type: ControlType.Enum,
        title: "Business Type",
        options: [...Object.keys(TYPES), CUSTOM],
        optionTitles: [
            ...Object.values(TYPES).map((type) => type.title),
            "Other (type it in)",
        ],
        defaultValue: "LocalBusiness",
    },
    customType: {
        ...text("Custom Type", "AutoRepair"),
        hidden: (props) => props.businessType !== CUSTOM,
    },
    customGroup: {
        type: ControlType.Enum,
        title: "Fields Like",
        options: Object.keys(GROUP_TITLES),
        optionTitles: Object.values(GROUP_TITLES),
        defaultValue: "local",
        hidden: (props) => props.businessType !== CUSTOM,
    },
    name: text("Name", "Business or person name"),
    description: {
        type: ControlType.String,
        title: "Short Description",
        displayTextArea: true,
        defaultValue: "",
    },
    photo: { type: ControlType.ResponsiveImage, title: "Photo" },
    logo: {
        type: ControlType.ResponsiveImage,
        title: "Logo",
        hidden: notPerson,
    },
    websiteUrl: text("Website URL", "https://www.example.com"),
    phone: text("Phone", "02 5550 1234"),
    email: text("Email", "hello@example.com"),
    priceRange: {
        type: ControlType.Enum,
        title: "Price Range",
        options: ["none", "$", "$$", "$$$", "$$$$"],
        optionTitles: ["Not set", "$", "$$", "$$$", "$$$$"],
        defaultValue: "none",
        hidden: onlyFor(...LOCAL_GROUPS),
    },
    paymentAccepted: text(
        "Payments",
        "Cash, Credit Card",
        onlyFor(...LOCAL_GROUPS)
    ),
    cuisine: text("Cuisine", "Fried Chicken", onlyFor("food")),
    menuUrl: link("Menu Link", onlyFor("food")),
    reservations: text(
        "Reservations",
        "Yes, No or a booking link",
        onlyFor("food")
    ),
    medicalSpecialty: text(
        "Medical Specialty",
        "Dentistry",
        onlyFor("medical")
    ),
    areaServed: text(
        "Area Served",
        "Sydney, Parramatta",
        onlyFor("service", "trade", "org")
    ),
    contactType: {
        ...text("Contact Type", "customer service", onlyFor("org")),
        defaultValue: "customer service",
    },
    jobTitle: text("Job Title", "Brand Designer", onlyFor("person")),
    worksFor: text("Works For", "Company name", onlyFor("person")),
    street: text("Street Address", "1 Example Street", notPerson),
    suburb: text("Suburb or City", "Sydney", notPerson),
    state: text("State", "NSW", notPerson),
    postcode: text("Postcode", "2000", notPerson),
    country: text("Country", "AU", notPerson),
    latitude: text("Map Latitude", "-33.8688", onlyFor(...LOCAL_GROUPS)),
    longitude: text("Map Longitude", "151.2093", onlyFor(...LOCAL_GROUPS)),
    monday: hours("Monday"),
    tuesday: hours("Tuesday"),
    wednesday: hours("Wednesday"),
    thursday: hours("Thursday"),
    friday: hours("Friday"),
    saturday: hours("Saturday"),
    sunday: hours("Sunday"),
    instagram: link("Instagram URL"),
    facebook: link("Facebook URL"),
    x: link("X URL"),
    linkedin: link("LinkedIn URL"),
    tiktok: link("TikTok URL"),
    youtube: link("YouTube URL"),
    googleBusiness: link("Google Maps URL", notPerson),
    extraJson: {
        type: ControlType.String,
        title: "Extra JSON",
        displayTextArea: true,
        defaultValue: "",
        placeholder: '{ "foundingDate": "2019" }',
    },
})

SmartSchema.displayName = "Smart Schema"
