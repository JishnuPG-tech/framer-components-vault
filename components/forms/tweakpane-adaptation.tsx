// User request: Simplify Tweakpane to manual controls only, keep runtime prop tweaking, add per-row prop-name copy icon in a body-level dark inspector, body-level pane host, and hide pane in canvas edit mode.

// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { Pane } from "tweakpane"
import * as React from "react"
import {
    startTransition,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react"

type TweakControlType =
    | "Number"
    | "String"
    | "Boolean"
    | "Color"
    | "List"
    | "Separator"

interface ListOption {
    text: string
    value: string
}

interface TweakDefinition {
    type: TweakControlType
    propName: string
    label: string
    prefix: string
    suffix: string
    defaultValueNumber: number
    defaultValueString: string
    defaultValueBoolean: boolean
    defaultValueColor: string
    folder: string
    min: number
    max: number
    step: number
    options: ListOption[]
}

interface MyComponentProps {
    children?: React.ReactNode
    instances?: React.ReactNode[]
    instanceNumber: number
    nestingDepth: number
    expanded?: boolean
    paneTitle: string
    devMode: boolean
    showResetButton: boolean
    tweaks: TweakDefinition[]
}

const COPY_ICON =
    "https://framerusercontent.com/images/IK7RqmaKArszcom0O5uj56Gkj9g.svg?width=18&height=18&kb=3"

function getDefinitionType(value: any): TweakControlType {
    const type = value?.type
    if (type === "Slider") return "Number"
    if (
        type === "Number" ||
        type === "String" ||
        type === "Boolean" ||
        type === "Color" ||
        type === "List" ||
        type === "Separator"
    ) {
        return type
    }
    return "Number"
}

function normalizeInstanceNumber(value: number): number {
    if (!Number.isFinite(value)) return 1
    const rounded = Math.round(value)
    return Math.min(10, Math.max(1, rounded))
}

function collectConnectedElements(
    node: React.ReactNode,
    output: React.ReactElement[]
): void {
    React.Children.forEach(node, (child) => {
        if (!child) return
        if (React.isValidElement(child)) {
            if (child.type === React.Fragment) {
                collectConnectedElements(child.props?.children, output)
            } else {
                output.push(child)
            }
            return
        }
        if (Array.isArray(child)) {
            collectConnectedElements(child, output)
        }
    })
}

function getChildAtDepth(
    node: React.ReactNode,
    depth: number
): React.ReactElement | null {
    let current: React.ReactNode = node
    let remaining = Math.max(0, Math.min(10, depth))

    while (remaining >= 0) {
        if (!React.isValidElement(current)) return null
        if (remaining === 0) return current

        const next = React.Children.toArray(current.props?.children).find(
            (child) => React.isValidElement(child)
        )
        if (!next) return null
        current = next
        remaining -= 1
    }

    return null
}

function cloneWithOverridesAtDepth(
    node: React.ReactElement,
    depth: number,
    overrides: Record<string, any>
): React.ReactElement {
    if (depth <= 0) {
        return React.cloneElement(node, {
            ...node.props,
            ...overrides,
        })
    }

    const childrenArray = React.Children.toArray(node.props?.children)
    const targetIndex = childrenArray.findIndex((child) =>
        React.isValidElement(child)
    )
    if (targetIndex === -1) return node

    const targetChild = childrenArray[targetIndex] as React.ReactElement
    childrenArray[targetIndex] = cloneWithOverridesAtDepth(
        targetChild,
        depth - 1,
        overrides
    )

    return React.cloneElement(node, {
        ...node.props,
        children: childrenArray,
    })
}

function safeSerialize(value: any, seen = new WeakSet<object>()): any {
    if (
        value === null ||
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean"
    ) {
        return value
    }
    if (value === undefined) return "[undefined]"
    if (typeof value === "function")
        return `[function ${value.name || "anonymous"}]`
    if (React.isValidElement(value)) {
        const typeName =
            typeof value.type === "string"
                ? value.type
                : (value.type as any)?.displayName ||
                  (value.type as any)?.name ||
                  "Component"
        return `[ReactElement ${typeName}]`
    }
    if (typeof value !== "object") return String(value)
    if (seen.has(value)) return "[circular]"
    seen.add(value)

    if (Array.isArray(value)) {
        return value.map((item) => safeSerialize(item, seen))
    }

    const output: Record<string, any> = {}
    Object.keys(value).forEach((key) => {
        output[key] = safeSerialize(value[key], seen)
    })
    return output
}

function addSeparatorCompat(container: any): void {
    if (container && typeof container.addSeparator === "function") {
        container.addSeparator()
        return
    }
    if (container && typeof container.addBlade === "function") {
        container.addBlade({ view: "separator" })
    }
}

/**
 * @framerDisableUnlink
 *
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function TweakPane(props) {
    const {
        children,
        instances,
        instanceNumber = 1,
        nestingDepth = 2,
        expanded,
        paneTitle,
        devMode,
        showResetButton,
        tweaks,
    } = props as MyComponentProps
    const resolvedExpanded = typeof expanded === "boolean" ? expanded : false
    const resolvedPaneTitle = (paneTitle || "").trim() || "Parameters"
    const isCanvas = RenderTarget.current() === RenderTarget.canvas

    const paneHostRef = useRef<HTMLDivElement | null>(null)
    const modalHostRef = useRef<HTMLDivElement | null>(null)
    const instanceIdRef = useRef(
        `tweakpane-${Math.random().toString(36).slice(2)}`
    )
    const modalClassRef = useRef(
        `tweakpane-modal-${Math.random().toString(36).slice(2)}`
    )
    const [overrides, setOverrides] = useState<Record<string, any>>({})
    const [showModal, setShowModal] = useState(false)
    const overridesRef = useRef<Record<string, any>>({})
    const discoveredPropsRef = useRef<Record<string, any>>({})
    const rowCopiedRef = useRef<Record<string, number>>({})
    const toastTimerRef = useRef<number | null>(null)

    const activeDefinitions = useMemo(
        () => (Array.isArray(tweaks) ? tweaks : []),
        [tweaks]
    )
    const normalizedInstanceNumber = useMemo(
        () => normalizeInstanceNumber(instanceNumber),
        [instanceNumber]
    )
    const connectedInstances = useMemo(() => {
        const result: React.ReactElement[] = []
        collectConnectedElements(instances, result)
        if (result.length === 0) collectConnectedElements(children, result)
        return result.slice(0, 10)
    }, [instances, children])
    const hasInstances = connectedInstances.length > 0
    const selectedInstance =
        connectedInstances[normalizedInstanceNumber - 1] || null
    const hasValidSelectedInstance = Boolean(selectedInstance)

    const discoveredTarget = useMemo(
        () =>
            selectedInstance
                ? getChildAtDepth(selectedInstance, nestingDepth)
                : null,
        [selectedInstance, nestingDepth]
    )
    const discoveredProps = useMemo(() => {
        const allProps = discoveredTarget?.props || {}
        const propsOnly = Object.keys(allProps)
            .filter((key) => key !== "children")
            .reduce<Record<string, any>>((acc, key) => {
                acc[key] = allProps[key]
                return acc
            }, {})
        return propsOnly
    }, [discoveredTarget])

    useEffect(() => {
        overridesRef.current = overrides
    }, [overrides])

    useEffect(() => {
        discoveredPropsRef.current = discoveredProps
    }, [discoveredProps])

    const openModal = useCallback(
        () => startTransition(() => setShowModal(true)),
        []
    )
    const closeModal = useCallback(
        () => startTransition(() => setShowModal(false)),
        []
    )

    useEffect(() => {
        if (!showModal || typeof window === "undefined") return
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") closeModal()
        }
        window.addEventListener("keydown", onKeyDown)
        return () => window.removeEventListener("keydown", onKeyDown)
    }, [showModal, closeModal])

    useEffect(() => {
        if (
            isCanvas ||
            typeof window === "undefined" ||
            typeof document === "undefined"
        )
            return
        const ownerId = instanceIdRef.current
        const staleHosts = document.querySelectorAll(
            `[data-tweakpane-owner="${ownerId}"]`
        )
        staleHosts.forEach((node) => {
            if (node.parentNode) node.parentNode.removeChild(node)
        })

        const host = document.createElement("div")
        host.setAttribute("data-tweakpane-owner", ownerId)
        host.style.position = "fixed"
        host.style.top = "16px"
        host.style.right = "16px"
        host.style.zIndex = "10000"
        host.style.maxWidth = "calc(100vw - 32px)"
        host.style.overflow = "visible"
        host.style.pointerEvents = "auto"
        document.body.appendChild(host)
        paneHostRef.current = host

        const pane = new Pane({
            container: host,
            title: resolvedPaneTitle,
            expanded: resolvedExpanded,
        })
        if ("expanded" in pane) {
            ;(pane as any).expanded = resolvedExpanded
        }

        const folders = new Map<string, any>()
        const bindingEntries: Array<{ key: string; binding: any }> = []
        const getFolder = (folderName: string) => {
            const key = (folderName || "").trim()
            if (!key) return pane
            if (!folders.has(key)) {
                folders.set(key, pane.addFolder({ title: key }))
            }
            return folders.get(key)
        }

        let systemButtonCount = 0
        if (typeof (pane as any).addButton === "function") {
            if (devMode) {
                const propsButton = (pane as any).addButton({
                    title: "Props List",
                })
                propsButton.on("click", openModal)
                systemButtonCount += 1
            }

            if (showResetButton) {
                const resetButton = (pane as any).addButton({ title: "Reset" })
                resetButton.on("click", () => {
                    const resetValues: Record<string, any> = {}
                    activeDefinitions.forEach((definition) => {
                        const normalizedType = getDefinitionType(definition)
                        if (definition.type === "Separator") return
                        const key = definition.propName?.trim()
                        if (!key) return
                        const fallbackDefault =
                            normalizedType === "Boolean"
                                ? definition.defaultValueBoolean
                                : normalizedType === "Number"
                                  ? definition.defaultValueNumber
                                  : normalizedType === "Color"
                                    ? definition.defaultValueColor
                                    : definition.defaultValueString
                        const nextValue =
                            normalizedType === "List"
                                ? definition.defaultValueString ||
                                  definition.options[0]?.value ||
                                  ""
                                : fallbackDefault
                        resetValues[key] = nextValue
                    })

                    Object.keys(resetValues).forEach((key) => {
                        params[key] = resetValues[key]
                    })
                    bindingEntries.forEach(({ binding }) => {
                        if (binding && typeof binding.refresh === "function")
                            binding.refresh()
                    })
                    if (typeof (pane as any).refresh === "function") {
                        ;(pane as any).refresh()
                    }
                    startTransition(() => {
                        setOverrides(resetValues)
                    })
                })
                systemButtonCount += 1
            }
        }

        if (systemButtonCount > 0) {
            addSeparatorCompat(pane)
        }

        const params: Record<string, any> = {}

        activeDefinitions.forEach((definition) => {
            const normalizedType = getDefinitionType(definition)
            const container = getFolder(definition.folder)

            if (normalizedType === "Separator") {
                addSeparatorCompat(container)
                return
            }

            const key = definition.propName?.trim()
            if (!key) return

            const fallbackDefault =
                normalizedType === "Boolean"
                    ? definition.defaultValueBoolean
                    : normalizedType === "Number"
                      ? definition.defaultValueNumber
                      : normalizedType === "Color"
                        ? definition.defaultValueColor
                        : definition.defaultValueString

            const listDefault =
                normalizedType === "List"
                    ? definition.defaultValueString ||
                      definition.options[0]?.value ||
                      ""
                    : fallbackDefault

            params[key] =
                overridesRef.current[key] ??
                discoveredPropsRef.current[key] ??
                (normalizedType === "List" ? listDefault : fallbackDefault)

            const label = definition.label?.trim() || key
            let binding: any = null

            if (normalizedType === "List") {
                const listOptions = definition.options.map((option) => ({
                    text: option.text,
                    value: option.value,
                }))
                binding =
                    listOptions.length > 0
                        ? container.addBinding(params, key, {
                              label,
                              options: listOptions,
                          })
                        : container.addBinding(params, key, { label })
            } else if (normalizedType === "Number") {
                const prefix = definition.prefix ?? ""
                const suffix = definition.suffix ?? ""
                const numberOptions: Record<string, any> = {
                    label,
                    min: definition.min,
                    max: definition.max,
                    step: definition.step,
                }
                if (prefix || suffix) {
                    numberOptions.format = (value: number) =>
                        `${prefix}${String(value)}${suffix}`
                }
                try {
                    binding = container.addBinding(params, key, numberOptions)
                } catch (_error) {
                    binding = container.addBinding(params, key, {
                        label,
                        min: definition.min,
                        max: definition.max,
                        step: definition.step,
                    })
                }
            } else if (
                normalizedType === "String" ||
                normalizedType === "Boolean" ||
                normalizedType === "Color"
            ) {
                binding = container.addBinding(params, key, {
                    label,
                })
            }

            if (binding && typeof binding.on === "function") {
                bindingEntries.push({ key, binding })
                binding.on("change", (event: any) => {
                    startTransition(() => {
                        setOverrides((prev) => ({
                            ...prev,
                            [key]: event.value,
                        }))
                    })
                })
            }
        })

        return () => {
            pane.dispose()
            if (host.parentNode) {
                host.parentNode.removeChild(host)
            }
            if (paneHostRef.current === host) paneHostRef.current = null
        }
    }, [
        activeDefinitions,
        resolvedExpanded,
        resolvedPaneTitle,
        devMode,
        openModal,
        discoveredTarget,
        isCanvas,
        showResetButton,
    ])

    const mergedOverrides = useMemo(() => ({ ...overrides }), [overrides])
    const selectedClone = useMemo(() => {
        if (!selectedInstance) return null
        return cloneWithOverridesAtDepth(
            selectedInstance,
            nestingDepth,
            mergedOverrides
        )
    }, [selectedInstance, mergedOverrides, nestingDepth])

    const discoveredEntries = useMemo(
        () => Object.entries(discoveredProps),
        [discoveredProps]
    )

    useEffect(() => {
        if (!showModal || typeof document === "undefined") return
        const ownerId = `${instanceIdRef.current}-modal`
        const staleModals = document.querySelectorAll(
            `[data-tweakpane-modal-owner="${ownerId}"]`
        )
        staleModals.forEach((node) => {
            if (node.parentNode) node.parentNode.removeChild(node)
        })

        const host = document.createElement("div")
        host.setAttribute("data-tweakpane-modal-owner", ownerId)
        host.style.position = "fixed"
        host.style.inset = "0"
        host.style.zIndex = "2147483000"
        host.style.display = "flex"
        host.style.alignItems = "center"
        host.style.justifyContent = "center"
        host.style.padding = "16px"
        host.style.background = "rgba(6, 8, 12, 0.72)"

        const dialog = document.createElement("div")
        dialog.setAttribute("role", "dialog")
        dialog.setAttribute("aria-modal", "true")
        dialog.setAttribute("aria-label", "Discovered properties list")
        dialog.className = modalClassRef.current
        dialog.style.background = "#11141A"
        dialog.style.color = "#E8ECF3"
        dialog.style.width = "min(900px, 100%)"
        dialog.style.maxHeight = "90vh"
        dialog.style.overflow = "auto"
        dialog.style.borderRadius = "14px"
        dialog.style.border = "1px solid rgba(255,255,255,0.12)"
        dialog.style.boxShadow = "0 22px 64px rgba(0,0,0,0.55)"
        dialog.style.padding = "16px"
        dialog.style.scrollbarWidth = "thin"
        dialog.style.scrollbarColor = "#5B6475 #1B2130"

        const toast = document.createElement("div")
        toast.setAttribute("role", "status")
        toast.setAttribute("aria-live", "polite")
        toast.style.position = "absolute"
        toast.style.right = "20px"
        toast.style.bottom = "20px"
        toast.style.background = "rgba(11, 14, 20, 0.95)"
        toast.style.color = "#E8ECF3"
        toast.style.border = "1px solid rgba(255,255,255,0.14)"
        toast.style.boxShadow = "0 10px 28px rgba(0,0,0,0.45)"
        toast.style.borderRadius = "10px"
        toast.style.padding = "10px 12px"
        toast.style.fontSize = "12px"
        toast.style.pointerEvents = "none"
        toast.style.opacity = "0"
        toast.style.transform = "translateY(8px)"
        toast.style.transition = "opacity 180ms ease, transform 180ms ease"
        host.appendChild(toast)

        const showToast = (message: string) => {
            toast.textContent = message
            toast.style.opacity = "1"
            toast.style.transform = "translateY(0)"
            if (
                toastTimerRef.current != null &&
                typeof window !== "undefined"
            ) {
                window.clearTimeout(toastTimerRef.current)
            }
            if (typeof window !== "undefined") {
                toastTimerRef.current = window.setTimeout(() => {
                    toast.style.opacity = "0"
                    toast.style.transform = "translateY(8px)"
                }, 1700)
            }
        }

        const styleTag = document.createElement("style")
        styleTag.textContent = `
            .${modalClassRef.current}::-webkit-scrollbar { width: 10px; height: 10px; }
            .${modalClassRef.current}::-webkit-scrollbar-track { background: #1B2130; border-radius: 999px; }
            .${modalClassRef.current}::-webkit-scrollbar-thumb { background: #5B6475; border-radius: 999px; border: 2px solid #1B2130; }
            .${modalClassRef.current}::-webkit-scrollbar-thumb:hover { background: #7B869A; }
        `
        dialog.appendChild(styleTag)

        const header = document.createElement("div")
        header.style.display = "flex"
        header.style.alignItems = "center"
        header.style.justifyContent = "space-between"
        header.style.marginBottom = "12px"
        const title = document.createElement("strong")
        title.textContent = "Discovered Props"
        title.style.fontSize = "16px"
        const closeBtn = document.createElement("button")
        closeBtn.type = "button"
        closeBtn.textContent = "Close"
        closeBtn.style.border = "1px solid rgba(255,255,255,0.2)"
        closeBtn.style.background = "rgba(255,255,255,0.06)"
        closeBtn.style.color = "#E8ECF3"
        closeBtn.style.borderRadius = "8px"
        closeBtn.style.padding = "8px 12px"
        closeBtn.style.cursor = "pointer"
        closeBtn.onclick = () => closeModal()
        header.appendChild(title)
        header.appendChild(closeBtn)
        dialog.appendChild(header)

        if (discoveredEntries.length === 0) {
            const empty = document.createElement("div")
            empty.textContent = "No properties are found."
            empty.style.color = "#B8C0CC"
            dialog.appendChild(empty)
        } else {
            const table = document.createElement("table")
            table.style.width = "100%"
            table.style.borderCollapse = "separate"
            table.style.borderSpacing = "0"
            table.style.fontSize = "12px"
            const thead = document.createElement("thead")
            const hr = document.createElement("tr")
            const h1 = document.createElement("th")
            h1.textContent = "Prop"
            const h2 = document.createElement("th")
            h2.textContent = "Value"
            ;[h1, h2].forEach((cell) => {
                cell.style.textAlign = "left"
                cell.style.borderBottom = "1px solid rgba(255,255,255,0.16)"
                cell.style.padding = "8px"
                cell.style.color = "#C7D2E0"
                cell.style.background = "#171B23"
            })
            hr.appendChild(h1)
            hr.appendChild(h2)
            thead.appendChild(hr)
            table.appendChild(thead)

            const tbody = document.createElement("tbody")
            discoveredEntries.forEach(([key, value], index) => {
                const tr = document.createElement("tr")
                tr.style.background =
                    index % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent"

                const propTd = document.createElement("td")
                propTd.style.borderBottom = "1px solid rgba(255,255,255,0.08)"
                propTd.style.padding = "8px"
                propTd.style.verticalAlign = "top"

                const propWrap = document.createElement("div")
                propWrap.style.display = "flex"
                propWrap.style.alignItems = "center"
                propWrap.style.gap = "8px"
                const propName = document.createElement("span")
                propName.textContent = key
                propName.style.color = "#E8ECF3"
                propName.style.fontWeight = "600"

                const copyBtn = document.createElement("button")
                copyBtn.type = "button"
                copyBtn.setAttribute("aria-label", `Copy ${key}`)
                copyBtn.title = `Copy ${key}`
                copyBtn.style.display = "inline-flex"
                copyBtn.style.alignItems = "center"
                copyBtn.style.justifyContent = "center"
                copyBtn.style.width = "24px"
                copyBtn.style.height = "24px"
                copyBtn.style.borderRadius = "6px"
                copyBtn.style.border = "1px solid rgba(255,255,255,0.16)"
                copyBtn.style.background = "rgba(255,255,255,0.06)"
                copyBtn.style.cursor = "pointer"
                copyBtn.style.padding = "0"

                const icon = document.createElement("img")
                icon.src = COPY_ICON
                icon.alt = ""
                icon.style.width = "14px"
                icon.style.height = "14px"
                icon.style.filter = "brightness(1.2)"
                copyBtn.appendChild(icon)
                copyBtn.onmouseenter = () => {
                    copyBtn.style.background = "rgba(90,146,255,0.22)"
                }
                copyBtn.onmouseleave = () => {
                    copyBtn.style.background = "rgba(255,255,255,0.06)"
                }
                copyBtn.onclick = () => {
                    if (
                        typeof navigator !== "undefined" &&
                        navigator.clipboard?.writeText
                    ) {
                        navigator.clipboard
                            .writeText(key)
                            .then(() => {
                                rowCopiedRef.current[key] = Date.now()
                                copyBtn.title = `Copied ${key}`
                                showToast(`Copied “${key}”`)
                                window.setTimeout(() => {
                                    if (
                                        Date.now() -
                                            (rowCopiedRef.current[key] || 0) >=
                                        1200
                                    ) {
                                        copyBtn.title = `Copy ${key}`
                                    }
                                }, 1300)
                            })
                            .catch(() => {
                                showToast("Copy failed")
                            })
                    } else {
                        showToast("Clipboard unavailable")
                    }
                }

                propWrap.appendChild(propName)
                propWrap.appendChild(copyBtn)
                propTd.appendChild(propWrap)

                const valueTd = document.createElement("td")
                valueTd.style.borderBottom = "1px solid rgba(255,255,255,0.08)"
                valueTd.style.padding = "8px"
                const pre = document.createElement("pre")
                pre.textContent = JSON.stringify(safeSerialize(value), null, 2)
                pre.style.margin = "0"
                pre.style.whiteSpace = "pre-wrap"
                pre.style.wordBreak = "break-word"
                pre.style.background = "#0B0E14"
                pre.style.color = "#BEE3FF"
                pre.style.border = "1px solid rgba(255,255,255,0.08)"
                pre.style.borderRadius = "8px"
                pre.style.padding = "10px"
                pre.style.lineHeight = "1.4"
                valueTd.appendChild(pre)

                tr.appendChild(propTd)
                tr.appendChild(valueTd)
                tbody.appendChild(tr)
            })
            table.appendChild(tbody)
            dialog.appendChild(table)
        }

        dialog.onclick = (event) => event.stopPropagation()
        host.onclick = () => closeModal()
        host.appendChild(dialog)
        document.body.appendChild(host)
        modalHostRef.current = host

        return () => {
            if (
                toastTimerRef.current != null &&
                typeof window !== "undefined"
            ) {
                window.clearTimeout(toastTimerRef.current)
                toastTimerRef.current = null
            }
            if (host.parentNode) {
                host.parentNode.removeChild(host)
            }
            if (modalHostRef.current === host) modalHostRef.current = null
        }
    }, [showModal, discoveredEntries, closeModal])

    return (
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
            {!hasInstances ? (
                <div
                    style={{
                        position: "relative",
                        width: "100%",
                        height: "100%",
                        minHeight: 80,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "1px solid #EEEEEE",
                        borderRadius: 12,
                        background: "#F5F5F5",
                        color: "#666666",
                        padding: 12,
                        boxSizing: "border-box",
                    }}
                >
                    Connect at least one component instance.
                </div>
            ) : !hasValidSelectedInstance ? (
                <div
                    style={{
                        position: "relative",
                        width: "100%",
                        height: "100%",
                        minHeight: 80,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "1px solid #EEEEEE",
                        borderRadius: 12,
                        background: "#F5F5F5",
                        color: "#666666",
                        padding: 12,
                        boxSizing: "border-box",
                    }}
                >
                    Instance does not exist.
                </div>
            ) : (
                <React.Fragment key={`instance-${normalizedInstanceNumber}`}>
                    {selectedClone}
                </React.Fragment>
            )}
        </div>
    )
}

/**
 * props.children.props.children.props

prohibited: height, id, layoutId, style, width, proto
 */

addPropertyControls(TweakPane, {
    instances: {
        type: ControlType.Array,
        title: "Instances",
        maxCount: 10,
        defaultValue: [],
        control: {
            type: ControlType.ComponentInstance,
        },
    },
    instanceNumber: {
        type: ControlType.Number,
        title: "Instance",
        min: 1,
        max: 10,
        step: 1,
        defaultValue: 1,
    },
    nestingDepth: {
        type: ControlType.Number,
        title: "Depth",
        description:
            "How many child layers to traverse before reading component props.",
        min: 0,
        max: 10,
        step: 1,
        defaultValue: 2,
    },
    expanded: {
        type: ControlType.Boolean,
        title: "Expanded",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    paneTitle: {
        type: ControlType.String,
        title: "Pane Title",
        defaultValue: "Parameters",
    },
    devMode: {
        type: ControlType.Boolean,
        title: "Dev Mode",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    showResetButton: {
        type: ControlType.Boolean,
        title: "Reset Button",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    tweaks: {
        type: ControlType.Array,
        title: "Tweaks",
        defaultValue: [
            {
                type: "Number",
                propName: "seed",
                label: "Seed",
                prefix: "",
                suffix: "",
                defaultValueNumber: 10,
                defaultValueString: "",
                defaultValueBoolean: false,
                defaultValueColor: "#000000",
                folder: "Main",
                min: 0,
                max: 1000,
                step: 1,
                options: [],
            },
            {
                type: "Number",
                propName: "defaultRotateX",
                label: "Rotate X",
                prefix: "",
                suffix: "",
                defaultValueNumber: -25,
                defaultValueString: "",
                defaultValueBoolean: false,
                defaultValueColor: "#000000",
                folder: "Main",
                min: -360,
                max: 360,
                step: 1,
                options: [],
            },
        ],
        control: {
            type: ControlType.Object,
            controls: {
                type: {
                    type: ControlType.Enum,
                    options: [
                        "Number",
                        "String",
                        "Boolean",
                        "Color",
                        "List",
                        "Separator",
                    ],
                    defaultValue: "Number",
                },
                propName: {
                    type: ControlType.String,
                    defaultValue: "seed",
                    hidden: (props) => getDefinitionType(props) === "Separator",
                },
                label: {
                    type: ControlType.String,
                    defaultValue: "Seed",
                    hidden: (props) => getDefinitionType(props) === "Separator",
                },
                folder: {
                    type: ControlType.String,
                    defaultValue: "",
                },
                defaultValueNumber: {
                    type: ControlType.Number,
                    defaultValue: 0,
                    hidden: (props) => {
                        const type = getDefinitionType(props)
                        return type !== "Number"
                    },
                },
                defaultValueString: {
                    type: ControlType.String,
                    defaultValue: "",
                    hidden: (props) => {
                        const type = getDefinitionType(props)
                        return !(type === "String" || type === "List")
                    },
                },
                defaultValueBoolean: {
                    type: ControlType.Boolean,
                    defaultValue: false,
                    hidden: (props) => getDefinitionType(props) !== "Boolean",
                },
                defaultValueColor: {
                    type: ControlType.Color,
                    defaultValue: "#000000",
                    hidden: (props) => getDefinitionType(props) !== "Color",
                },
                min: {
                    type: ControlType.Number,
                    defaultValue: 0,
                    hidden: (props) => {
                        const type = getDefinitionType(props)
                        return type !== "Number"
                    },
                },
                max: {
                    type: ControlType.Number,
                    defaultValue: 100,
                    hidden: (props) => {
                        const type = getDefinitionType(props)
                        return type !== "Number"
                    },
                },
                step: {
                    type: ControlType.Number,
                    defaultValue: 1,
                    min: 0.0001,
                    hidden: (props) => {
                        const type = getDefinitionType(props)
                        return type !== "Number"
                    },
                },
                prefix: {
                    type: ControlType.String,
                    title: "Prefix",
                    defaultValue: "",
                    hidden: (props) => getDefinitionType(props) !== "Number",
                },
                suffix: {
                    type: ControlType.String,
                    title: "Suffix",
                    defaultValue: "",
                    hidden: (props) => getDefinitionType(props) !== "Number",
                },
                options: {
                    type: ControlType.Array,
                    defaultValue: [
                        { text: "A", value: "A" },
                        { text: "B", value: "B" },
                    ],
                    hidden: (props) => getDefinitionType(props) !== "List",
                    control: {
                        type: ControlType.Object,
                        controls: {
                            text: {
                                type: ControlType.String,
                                defaultValue: "Option",
                            },
                            value: {
                                type: ControlType.String,
                                defaultValue: "Value",
                            },
                        },
                    },
                },
            },
        },
    },
})
