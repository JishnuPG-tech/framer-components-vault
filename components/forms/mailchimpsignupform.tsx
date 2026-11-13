// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import React, { useState } from "react"
type FieldType =
    | "firstName"
    | "lastName"
    | "email"
    | "phone"
    | "birthday"
    | "company"
    | "address"
type FieldConfig = {
    fieldType: FieldType
    label: string
    placeholder: string
    required: boolean
    mergeTag: string
}
const INPUT_TYPE: Record<FieldType, string> = {
    firstName: "text",
    lastName: "text",
    email: "email",
    phone: "tel",
    birthday: "text",
    company: "text",
    address: "text",
}
const DEFAULT_PLACEHOLDER: Record<FieldType, string> = {
    firstName: "First Name",
    lastName: "Last Name",
    email: "Email Address",
    phone: "Phone Number",
    birthday: "Birthday",
    company: "Company",
    address: "Street Address",
}
const DEFAULT_MERGE_TAG: Record<FieldType, string> = {
    firstName: "FNAME",
    lastName: "LNAME",
    email: "EMAIL",
    phone: "PHONE",
    birthday: "BIRTHDAY",
    company: "COMPANY",
    address: "ADDRESS",
}
const COUNTRY_CODES =
    "AF,AL,DZ,AD,AO,AG,AR,AM,AU,AT,AZ,BS,BH,BD,BB,BY,BE,BZ,BJ,BT,BO,BA,BW,BR,BN,BG,BF,BI,CV,KH,CM,CA,CF,TD,CL,CN,CO,KM,CG,CD,CR,CI,HR,CU,CY,CZ,DK,DJ,DM,DO,EC,EG,SV,GQ,ER,EE,SZ,ET,FJ,FI,FR,GA,GM,GE,DE,GH,GR,GD,GT,GN,GW,GY,HT,HN,HU,IS,IN,ID,IR,IQ,IE,IL,IT,JM,JP,JO,KZ,KE,KI,KP,KR,KW,KG,LA,LV,LB,LS,LR,LY,LI,LT,LU,MG,MW,MY,MV,ML,MT,MH,MR,MU,MX,FM,MD,MC,MN,ME,MA,MZ,MM,NA,NR,NP,NL,NZ,NI,NE,NG,MK,NO,OM,PK,PW,PS,PA,PG,PY,PE,PH,PL,PT,QA,RO,RU,RW,KN,LC,VC,WS,SM,ST,SA,SN,RS,SC,SL,SG,SK,SI,SB,SO,ZA,SS,ES,LK,SD,SR,SE,CH,SY,TW,TJ,TZ,TH,TL,TG,TO,TT,TN,TR,TM,TV,UG,UA,AE,GB,US,UY,UZ,VU,VE,VN,YE,ZM,ZW".split(
        ","
    )
const getCountryName = (code: string) => {
    try {
        return (
            new Intl.DisplayNames(["en"], { type: "region" }).of(code) || code
        )
    } catch {
        return code
    }
}
const COUNTRIES = COUNTRY_CODES.map((code) => ({
    code,
    name: getCountryName(code),
})).sort((a, b) => a.name.localeCompare(b.name))
const MONTHS = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
]
/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 340
 * @framerIntrinsicHeight 200
 * @framerDisableUnlink
 */
export default function MailchimpSignupForm({
    actionUrl,
    fields: fieldConfigs,
    buttonLabel,
    successMessage,
    styleOptions,
    style,
}: {
    actionUrl: string
    fields: FieldConfig[]
    buttonLabel: string
    successMessage: string
    styleOptions: {
        textColor: string
        inputFillColor: string
        borderColor: string
        borderWidth: number
        borderRadius: number
    }
    style?: React.CSSProperties
}) {
    const [values, setValues] = useState<Record<string, string>>({})
    const [status, setStatus] = useState<
        "idle" | "loading" | "success" | "error"
    >("idle")
    const [errorMsg, setErrorMsg] = useState("")
    const set =
        (key: string) =>
        (
            e: React.ChangeEvent<
                HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
            >
        ) =>
            setValues((prev) => ({ ...prev, [key]: e.target.value }))
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!actionUrl) {
            setErrorMsg("No MailChimp Action URL provided.")
            setStatus("error")
            return
        }
        setStatus("loading")
        const formData = new FormData()
        ;(fieldConfigs || []).forEach(({ fieldType, mergeTag }) => {
            const tag = mergeTag || DEFAULT_MERGE_TAG[fieldType]
            switch (fieldType) {
                case "firstName":
                    formData.append(tag, values["firstName"] || "")
                    break
                case "lastName":
                    formData.append(tag, values["lastName"] || "")
                    break
                case "email":
                    formData.append(tag, values["email"] || "")
                    break
                case "phone":
                    formData.append(tag, values["phone"] || "")
                    break
                case "birthday":
                    formData.append(
                        tag,
                        `${(values["birthdayMonth"] || "").padStart(2, "0")}/${(values["birthdayDay"] || "").padStart(2, "0")}`
                    )
                    break
                case "company":
                    formData.append(tag, values["company"] || "")
                    break
                case "address":
                    formData.append(`${tag}[addr1]`, values["address"] || "")
                    formData.append(`${tag}[addr2]`, values["address2"] || "")
                    formData.append(`${tag}[city]`, values["city"] || "")
                    formData.append(`${tag}[state]`, values["state"] || "")
                    formData.append(`${tag}[zip]`, values["zip"] || "")
                    formData.append(`${tag}[country]`, values["country"] || "")
                    break
            }
        })
        // Required hidden field expected by Mailchimp's form handler
        formData.append("subscribe", "Subscribe")
        try {
            // mode: "no-cors" returns an opaque response, so we cannot
            // verify whether Mailchimp accepted or rejected the submission.
            // The success state is assumed if the request completes.
            await fetch(actionUrl, {
                method: "POST",
                body: formData,
                mode: "no-cors",
            })
            setValues({})
            setStatus("success")
        } catch (err) {
            setErrorMsg(
                "Network error. Please check your connection and try again."
            )
            setStatus("error")
        }
    }
    const isLoading = status === "loading"
    const allRequiredFilled = (fieldConfigs || []).every((config) => {
        if (!config.required) return true
        if (config.fieldType === "birthday")
            return !!values["birthdayMonth"] && !!values["birthdayDay"]
        if (config.fieldType === "address")
            return (
                !!values["address"] &&
                !!values["city"] &&
                !!values["state"] &&
                !!values["zip"] &&
                !!values["country"]
            )
        return !!values[config.fieldType]
    })
    const {
        textColor = "#333",
        inputFillColor = "#fff",
        borderColor = "#ccc",
        borderWidth = 1,
        borderRadius = 8,
    } = styleOptions || {}
    const inputStyle: React.CSSProperties = {
        ...styles.input,
        color: textColor,
        backgroundColor: inputFillColor,
        border: `${borderWidth}px solid ${borderColor}`,
        borderRadius: `${borderRadius}px`,
    }
    const labelStyle: React.CSSProperties = {
        ...styles.label,
        color: textColor,
    }
    const renderSingleField = (config: FieldConfig, key: string | number) => {
        const { fieldType, label, placeholder, required } = config
        const resolvedPlaceholder =
            placeholder || DEFAULT_PLACEHOLDER[fieldType]
        const inputType = INPUT_TYPE[fieldType]
        const fieldLabel = label ? (
            <label style={labelStyle}>
                {label}
                {required && <span style={styles.asterisk}> *</span>}
            </label>
        ) : null
        const requiredPlaceholder =
            !label && required
                ? `${resolvedPlaceholder} *`
                : resolvedPlaceholder
        // Birthday — two dropdowns side by side
        if (fieldType === "birthday") {
            return (
                <div key={key} style={styles.fieldWrapper}>
                    {fieldLabel}
                    <div style={{ display: "flex", gap: "10px" }}>
                        <select
                            className="mc-signup-input"
                            value={values["birthdayMonth"] || ""}
                            onChange={set("birthdayMonth")}
                            required={required}
                            aria-required={required}
                            aria-label="Birthday month"
                            style={inputStyle}
                        >
                            <option value="">Month</option>
                            {MONTHS.map((m, i) => (
                                <option
                                    key={m}
                                    value={String(i + 1).padStart(2, "0")}
                                >
                                    {m}
                                </option>
                            ))}
                        </select>
                        <select
                            className="mc-signup-input"
                            value={values["birthdayDay"] || ""}
                            onChange={set("birthdayDay")}
                            required={required}
                            aria-required={required}
                            aria-label="Birthday day"
                            style={{ ...inputStyle, maxWidth: "100px" }}
                        >
                            <option value="">Day</option>
                            {Array.from({ length: 31 }, (_, i) => i + 1).map(
                                (d) => (
                                    <option
                                        key={d}
                                        value={String(d).padStart(2, "0")}
                                    >
                                        {d}
                                    </option>
                                )
                            )}
                        </select>
                    </div>
                </div>
            )
        }
        // Address — stacked sub-fields matching Mailchimp's embedded form
        if (fieldType === "address") {
            return (
                <div key={key} style={styles.fieldWrapper}>
                    {fieldLabel}
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "8px",
                        }}
                    >
                        <input
                            className="mc-signup-input"
                            type="text"
                            placeholder="Street Address"
                            aria-label="Street address"
                            value={values["address"] || ""}
                            onChange={set("address")}
                            required={required}
                            aria-required={required}
                            style={inputStyle}
                        />
                        <input
                            className="mc-signup-input"
                            type="text"
                            placeholder="Address Line 2"
                            aria-label="Address line 2"
                            value={values["address2"] || ""}
                            onChange={set("address2")}
                            style={inputStyle}
                        />
                        <div style={{ display: "flex", gap: "10px" }}>
                            <input
                                className="mc-signup-input"
                                type="text"
                                placeholder="City"
                                aria-label="City"
                                value={values["city"] || ""}
                                onChange={set("city")}
                                required={required}
                                aria-required={required}
                                style={inputStyle}
                            />
                            <input
                                className="mc-signup-input"
                                type="text"
                                placeholder="State / Province / Region"
                                aria-label="State, province, or region"
                                value={values["state"] || ""}
                                onChange={set("state")}
                                required={required}
                                aria-required={required}
                                style={inputStyle}
                            />
                        </div>
                        <div style={{ display: "flex", gap: "10px" }}>
                            <input
                                className="mc-signup-input"
                                type="text"
                                placeholder="Postal / Zip Code"
                                aria-label="Postal or zip code"
                                value={values["zip"] || ""}
                                onChange={set("zip")}
                                required={required}
                                aria-required={required}
                                style={inputStyle}
                            />
                            <select
                                className="mc-signup-input"
                                value={values["country"] || ""}
                                onChange={set("country")}
                                required={required}
                                aria-required={required}
                                aria-label="Country"
                                style={inputStyle}
                            >
                                <option value="">Country</option>
                                {COUNTRIES.map(({ code, name }) => (
                                    <option key={code} value={code}>
                                        {name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            )
        }
        // All other standard fields
        return (
            <div key={key} style={{ ...styles.fieldWrapper, flex: 1 }}>
                {fieldLabel}
                <input
                    className="mc-signup-input"
                    type={inputType}
                    placeholder={requiredPlaceholder}
                    aria-label={resolvedPlaceholder}
                    value={values[fieldType] || ""}
                    onChange={set(fieldType)}
                    required={required}
                    aria-required={required}
                    style={inputStyle}
                />
            </div>
        )
    }
    const renderFields = () => {
        const elements: React.ReactNode[] = []
        const configs = fieldConfigs || []
        let i = 0
        while (i < configs.length) {
            const curr = configs[i]
            const next = configs[i + 1]
            // Auto side-by-side pairs
            const isNamePair =
                curr.fieldType === "firstName" && next?.fieldType === "lastName"
            if (isNamePair) {
                elements.push(
                    <div key={i} style={{ display: "flex", gap: "10px" }}>
                        {renderSingleField(curr, `${i}-a`)}
                        {renderSingleField(next, `${i}-b`)}
                    </div>
                )
                i += 2
            } else {
                elements.push(renderSingleField(curr, i))
                i++
            }
        }
        return elements
    }
    return (
        <div style={{ ...styles.wrapper, ...style }}>
            <form onSubmit={handleSubmit} style={styles.form}>
                {renderFields()}
                <button
                    type="submit"
                    disabled={isLoading || !allRequiredFilled}
                    style={{
                        ...styles.button,
                        borderRadius: `${borderRadius}px`,
                        opacity: isLoading || !allRequiredFilled ? 0.5 : 1,
                        cursor:
                            isLoading || !allRequiredFilled
                                ? "not-allowed"
                                : "pointer",
                    }}
                >
                    {isLoading ? (
                        <span style={styles.buttonInner}>
                            <span style={styles.spinner} />
                            Submitting…
                        </span>
                    ) : (
                        buttonLabel
                    )}
                </button>
                {status === "success" && (
                    <p style={styles.success}>{successMessage}</p>
                )}
                {status === "error" && <p style={styles.error}>{errorMsg}</p>}
            </form>
            <style>{`
                @keyframes mailchimp-form-spin {
                    to { transform: rotate(360deg); }
                }
                .mc-signup-input:focus {
                    outline: 2px solid #005fcc;
                    outline-offset: -1px;
                }
            `}</style>
        </div>
    )
}
MailchimpSignupForm.displayName = "Mailchimp Signup Form"
MailchimpSignupForm.defaultProps = {
    actionUrl: "",
    buttonLabel: "Subscribe",
    successMessage: "🎉 You're subscribed! Check your inbox.",
    fields: [
        {
            fieldType: "firstName" as const,
            label: "",
            placeholder: "First Name",
            required: false,
            mergeTag: "FNAME",
        },
        {
            fieldType: "lastName" as const,
            label: "",
            placeholder: "Last Name",
            required: false,
            mergeTag: "LNAME",
        },
        {
            fieldType: "email" as const,
            label: "",
            placeholder: "Email Address",
            required: true,
            mergeTag: "EMAIL",
        },
    ],
    styleOptions: {
        textColor: "#333",
        inputFillColor: "#fff",
        borderColor: "#ccc",
        borderWidth: 1,
        borderRadius: 8,
    },
}
addPropertyControls(MailchimpSignupForm, {
    actionUrl: {
        type: ControlType.String,
        title: "MC Action URL",
        description:
            "Paste the action URL from your Mailchimp embedded form code. Find it under **Forms > Other forms > Embedded form**.",
        placeholder:
            "https://xyz.us1.list-manage.com/subscribe/post?u=...&id=...",
    },
    buttonLabel: {
        type: ControlType.String,
        title: "Button Label",
        placeholder: "e.g. Subscribe",
    },
    successMessage: {
        type: ControlType.String,
        title: "Success Message",
        placeholder: "e.g. Thanks for subscribing!",
    },
    fields: {
        type: ControlType.Array,
        title: "Fields",
        description: "Add, remove, and reorder form fields.",
        control: {
            type: ControlType.Object,
            controls: {
                fieldType: {
                    type: ControlType.Enum,
                    title: "Field",
                    options: [
                        "firstName",
                        "lastName",
                        "email",
                        "phone",
                        "birthday",
                        "company",
                        "address",
                    ],
                    optionTitles: [
                        "First Name",
                        "Last Name",
                        "Email Address",
                        "Phone Number",
                        "Birthday",
                        "Company",
                        "Address",
                    ],
                    defaultValue: "email",
                },
                label: {
                    type: ControlType.String,
                    title: "Label",
                    placeholder: "Optional label above field",
                },
                placeholder: {
                    type: ControlType.String,
                    title: "Placeholder",
                    placeholder: "e.g. Enter your email…",
                },
                required: {
                    type: ControlType.Boolean,
                    title: "Required",
                    defaultValue: false,
                },
                mergeTag: {
                    type: ControlType.String,
                    title: "Merge Tag",
                    description:
                        "The Mailchimp merge tag for this field. Find yours under **Audience > Settings > Audience fields and merge tags**.",
                    placeholder: "e.g. FNAME, MMERGE3",
                },
            },
        },
    },
    styleOptions: {
        type: ControlType.Object,
        title: "Style Options",
        controls: {
            textColor: {
                type: ControlType.Color,
                title: "Text Color",
                defaultValue: "#333",
            },
            inputFillColor: {
                type: ControlType.Color,
                title: "Input Fill",
                defaultValue: "#fff",
            },
            borderColor: {
                type: ControlType.Color,
                title: "Border Color",
                defaultValue: "#ccc",
            },
            borderWidth: {
                type: ControlType.Number,
                title: "Border Width",
                defaultValue: 1,
                min: 0,
                max: 10,
                step: 1,
            },
            borderRadius: {
                type: ControlType.Number,
                title: "Border Radius",
                defaultValue: 8,
                min: 0,
                max: 50,
                step: 1,
            },
        },
    },
})
const styles: Record<string, React.CSSProperties> = {
    wrapper: {
        display: "flex",
        flexDirection: "column",
        width: "100%",
        fontFamily: "sans-serif",
    },
    form: {
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        width: "100%",
    },
    fieldWrapper: {
        display: "flex",
        flexDirection: "column",
        gap: "4px",
        width: "100%",
    },
    label: {
        fontSize: "13px",
        fontWeight: 500,
        color: "#333",
    },
    asterisk: {
        color: "red",
        fontWeight: 700,
    },
    input: {
        padding: "10px 14px",
        borderRadius: "8px",
        border: "1px solid #ccc",
        fontSize: "14px",
        width: "100%",
        boxSizing: "border-box",
        backgroundColor: "#fff",
    },
    button: {
        padding: "10px 14px",
        borderRadius: "8px",
        border: "none",
        backgroundColor: "#000",
        color: "#fff",
        fontSize: "14px",
        width: "100%",
        transition: "opacity 0.2s ease",
    },
    buttonInner: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
    },
    spinner: {
        width: "14px",
        height: "14px",
        border: "2px solid rgba(255,255,255,0.3)",
        borderTop: "2px solid #fff",
        borderRadius: "50%",
        animation: "mailchimp-form-spin 0.7s linear infinite",
        display: "inline-block",
        flexShrink: 0,
    },
    success: {
        color: "green",
        fontSize: "14px",
        textAlign: "center",
        margin: "0",
    },
    error: {
        color: "red",
        fontSize: "14px",
        textAlign: "center",
        margin: "0",
    },
}
