// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useState, type CSSProperties, type FormEvent } from "react"

type FormState = "idle" | "submitting" | "success" | "error"
type Layout = "stacked" | "inline"
type ListMode = "default" | "none" | "specific"

interface SequenzySignupFormProps {
  apiBaseUrl: string
  companyId: string
  listMode: ListMode
  listIds: string
  tagIds: string
  placeholder: string
  buttonText: string
  successMessage: string
  buttonColor: string
  textColor: string
  inputBackgroundColor: string
  borderColor: string
  layout: Layout
  redirectUrl: string
  borderRadius: number
  fontSize: number
}

const DEFAULT_PROPS: SequenzySignupFormProps = {
  "apiBaseUrl": "https://api.sequenzy.com",
  "companyId": "",
  "listMode": "default",
  "listIds": "",
  "tagIds": "",
  "placeholder": "you@example.com",
  "buttonText": "Subscribe",
  "successMessage": "Thanks for subscribing.",
  "buttonColor": "#c95a3c",
  "textColor": "#111827",
  "inputBackgroundColor": "#ffffff",
  "borderColor": "#d1d5db",
  "layout": "stacked",
  "redirectUrl": "",
  "borderRadius": 6,
  "fontSize": 14
}
const INITIAL_ACTION_URL = "https://api.sequenzy.com/api/v1/forms/"

function parseIds(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
}

function normalizeHttpUrl(value: string): string | null {
  try {
    const url = new URL(value.trim())
    if (url.protocol !== "http:" && url.protocol !== "https:") return null
    return url.toString().replace(/\/$/, "")
  } catch {
    return null
  }
}

function normalizeRedirectUrl(value: string): string {
  const trimmedValue = value.trim()
  if (!trimmedValue) return ""
  const candidate = /^[a-z][a-z\d+.-]*:/i.test(trimmedValue)
    ? trimmedValue
    : `https://${trimmedValue}`

  return normalizeHttpUrl(candidate) ?? ""
}

function buildActionUrl(props: SequenzySignupFormProps): string {
  const apiBaseUrl = normalizeHttpUrl(props.apiBaseUrl) ?? "https://api.sequenzy.com"
  const url = new URL(
    `/api/v1/forms/${encodeURIComponent(props.companyId.trim())}`,
    apiBaseUrl
  )

  if (props.listMode === "none") {
    url.searchParams.set("lists", "")
  } else if (props.listMode === "specific") {
    const listIds = parseIds(props.listIds).join(",")
    if (listIds) {
      url.searchParams.set("lists", listIds)
    }
  }

  const tagIds = parseIds(props.tagIds).join(",")
  if (tagIds) {
    url.searchParams.set("tags", tagIds)
  }

  return url.toString()
}

export default function SequenzySignupForm(
  props: Partial<SequenzySignupFormProps>
) {
  const config = { ...DEFAULT_PROPS, ...props }
  const [email, setEmail] = useState("")
  const [formState, setFormState] = useState<FormState>("idle")
  const actionUrl =
    config.companyId === DEFAULT_PROPS.companyId &&
    config.apiBaseUrl === DEFAULT_PROPS.apiBaseUrl &&
    config.listMode === DEFAULT_PROPS.listMode &&
    config.listIds === DEFAULT_PROPS.listIds &&
    config.tagIds === DEFAULT_PROPS.tagIds
      ? INITIAL_ACTION_URL
      : buildActionUrl(config)
  const redirectUrl = normalizeRedirectUrl(config.redirectUrl)
  const isInline = config.layout === "inline"

  const shellStyle: CSSProperties = {
    width: "100%",
    fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
  }

  const formStyle: CSSProperties = {
    display: "flex",
    flexDirection: isInline ? "row" : "column",
    gap: 10,
    alignItems: "stretch",
    width: "100%",
  }

  const inputStyle: CSSProperties = {
    flex: isInline ? "1 1 0" : undefined,
    minWidth: 0,
    width: "100%",
    height: 40,
    boxSizing: "border-box",
    border: `1px solid ${config.borderColor}`,
    borderRadius: config.borderRadius,
    padding: "8px 12px",
    background: config.inputBackgroundColor,
    color: config.textColor,
    fontSize: config.fontSize,
    outline: "none",
  }

  const buttonStyle: CSSProperties = {
    flex: isInline ? "0 0 auto" : undefined,
    height: 40,
    border: "none",
    borderRadius: config.borderRadius,
    padding: "8px 16px",
    background: config.buttonColor,
    color: "#ffffff",
    fontSize: config.fontSize,
    fontWeight: 600,
    cursor: formState === "submitting" ? "default" : "pointer",
    whiteSpace: "nowrap",
  }

  const messageStyle: CSSProperties = {
    margin: 0,
    color: config.textColor,
    fontSize: config.fontSize,
    lineHeight: 1.4,
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (formState === "submitting") return

    if (!config.companyId.trim()) {
      setFormState("error")
      return
    }

    if (config.listMode === "specific" && parseIds(config.listIds).length === 0) {
      setFormState("error")
      return
    }

    setFormState("submitting")

    try {
      const websiteInput = event.currentTarget.elements.namedItem("website")
      const websiteValue =
        websiteInput instanceof HTMLInputElement ? websiteInput.value : ""
      const formBody = new URLSearchParams()
      formBody.set("email", email)
      formBody.set("website", websiteValue)
      if (redirectUrl) {
        formBody.set("redirectUrl", redirectUrl)
      }

      const response = await fetch(actionUrl, {
        method: "POST",
        body: formBody.toString(),
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        redirect: redirectUrl ? "manual" : "follow",
      })

      if (
        redirectUrl &&
        (response.type === "opaqueredirect" ||
          (response.status >= 300 && response.status < 400))
      ) {
        window.location.assign(redirectUrl)
        return
      }

      if (!response.ok) {
        setFormState("error")
        return
      }

      if (redirectUrl) {
        window.location.assign(redirectUrl)
        return
      }

      setEmail("")
      setFormState("success")
    } catch {
      setFormState("error")
    }
  }

  if (formState === "success") {
    return (
      <div style={shellStyle}>
        <p style={messageStyle}>{config.successMessage}</p>
      </div>
    )
  }

  return (
    <div style={shellStyle}>
      <form onSubmit={handleSubmit} style={formStyle}>
        <input
          type="email"
          name="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder={config.placeholder}
          required
          autoComplete="email"
          disabled={formState === "submitting"}
          style={inputStyle}
        />
        <input
          type="text"
          name="website"
          style={{ display: "none" }}
          tabIndex={-1}
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={formState === "submitting"}
          style={buttonStyle}
        >
          {formState === "submitting" ? "..." : config.buttonText}
        </button>
      </form>
      {formState === "error" && (
        <p style={{ ...messageStyle, marginTop: 8 }}>
          Something went wrong. Please try again.
        </p>
      )}
    </div>
  )
}

SequenzySignupForm.defaultProps = DEFAULT_PROPS

addPropertyControls(SequenzySignupForm, {
  companyId: { type: ControlType.String, title: "Form ID" },
  listMode: {
    type: ControlType.Enum,
    title: "List Target",
    options: ["default", "none", "specific"],
    optionTitles: ["Default", "None", "Specific"],
  },
  listIds: {
    type: ControlType.String,
    title: "List IDs",
    hidden: (props) => props.listMode !== "specific",
  },
  tagIds: { type: ControlType.String, title: "Tags" },
  placeholder: { type: ControlType.String, title: "Placeholder" },
  buttonText: { type: ControlType.String, title: "Button" },
  successMessage: { type: ControlType.String, title: "Success" },
  buttonColor: { type: ControlType.Color, title: "Button Color" },
  textColor: { type: ControlType.Color, title: "Text Color" },
  inputBackgroundColor: { type: ControlType.Color, title: "Input Fill" },
  borderColor: { type: ControlType.Color, title: "Border" },
  layout: {
    type: ControlType.Enum,
    title: "Layout",
    options: ["stacked", "inline"],
    optionTitles: ["Stacked", "Inline"],
  },
  redirectUrl: { type: ControlType.String, title: "Redirect" },
  borderRadius: {
    type: ControlType.Number,
    title: "Radius",
    min: 0,
    max: 24,
    step: 1,
  },
  fontSize: {
    type: ControlType.Number,
    title: "Font",
    min: 12,
    max: 24,
    step: 1,
  },
})
