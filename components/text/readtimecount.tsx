import React, { useEffect, useState, isValidElement } from "react"
import type { ComponentType, ReactNode } from "react"

function createStore<T extends object>(initialState: T) {
    let state = initialState
    const listeners = new Set<(state: T) => void>()

    const setState = (
        partialState: Partial<T> | ((prevState: T) => Partial<T>)
    ) => {
        const nextState =
            typeof partialState === "function"
                ? partialState(state)
                : partialState
        state = { ...state, ...nextState }
        listeners.forEach((listener) => listener(state))
    }

    const useStore = (): [T, typeof setState] => {
        const [currentState, setCurrentState] = useState(state)
        useEffect(() => {
            listeners.add(setCurrentState)
            return () => {
                listeners.delete(setCurrentState)
            }
        }, [])
        return [currentState, setState]
    }

    return useStore
}

const useStore = createStore({
    content: "",
    numberOfWords: 0,
    text: "Store TEXT",
})

interface PropsWithChildren {
    children?: ReactNode
}

function extractTextFromNode(node: ReactNode): string {
    if (typeof node === "string" || typeof node === "number") {
        return String(node)
    }

    if (!node) return ""

    if (Array.isArray(node)) {
        return node.map(extractTextFromNode).join(" ")
    }

    if (isValidElement<PropsWithChildren>(node)) {
        return extractTextFromNode(node.props.children)
    }

    return ""
}

export function countContentToReadTime<P extends PropsWithChildren>(
    Component: ComponentType<P>
): ComponentType<P> {
    return (props: P) => {
        const [, setStore] = useStore()
        const children = props.children

        useEffect(() => {
            if (!children) return

            const childrenArray = React.Children.toArray(children)
            const extractedTexts: string[] = []

            childrenArray.forEach((child) => {
                if (isValidElement<PropsWithChildren>(child)) {
                    const innerChildren = child.props.children
                    if (innerChildren) {
                        React.Children.toArray(innerChildren).forEach(
                            (inner) => {
                                if (
                                    isValidElement<PropsWithChildren>(inner) &&
                                    inner.type === "p"
                                ) {
                                    extractedTexts.push(
                                        extractTextFromNode(
                                            inner.props.children
                                        )
                                    )
                                } else {
                                    extractedTexts.push(
                                        extractTextFromNode(inner)
                                    )
                                }
                            }
                        )
                    } else if (child.type === "p") {
                        extractedTexts.push(
                            extractTextFromNode(child.props.children)
                        )
                    }
                } else {
                    extractedTexts.push(extractTextFromNode(child))
                }
            })

            const concatenatedText = extractedTexts.filter(Boolean).join(" ")

            const wordCount = concatenatedText.trim()
                ? concatenatedText.trim().split(/\s+/).length
                : 0

            setStore({
                content: concatenatedText,
                numberOfWords: wordCount,
            })
        }, [children])

        return <Component {...props} />
    }
}

export function showReadTime<P extends { text?: string }>(
    Component: ComponentType<P>
): ComponentType<P> {
    return (props: P) => {
        const [store] = useStore()
        const readMinutes = Math.max(
            1,
            Math.ceil((store.numberOfWords || 0) / 200)
        )

        return <Component {...props} text={`${readMinutes} min`} />
    }
}
