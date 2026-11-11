import { ComponentType } from "react"
import { createStore } from "https://framer.com/m/framer/store.js@^1.0.0"

// 1. Shared Store
const useFocusStore = createStore({
    isFocusMode: false,
})

// 2. Override for YOUR Custom Button (Toggle State + Animation)
export function ToggleFocusMode(Component: ComponentType): ComponentType {
    return (props) => {
        const [store, setStore] = useFocusStore()

        const handleClick = (e: React.MouseEvent) => {
            if (props.onClick) props.onClick(e)
            setStore({ isFocusMode: !store.isFocusMode })
        }

        return (
            <Component
                {...props}
                onClick={handleClick}
                animate={{
                    scale: store.isFocusMode ? 0.95 : 1,
                    opacity: store.isFocusMode ? 0.8 : 1,
                }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
            />
        )
    }
}

// 3. Override for Hidden Elements (Smooth Fade & Scale Animation)
export function HideInFocusMode(Component: ComponentType): ComponentType {
    return (props) => {
        const [store] = useFocusStore()
        const isVisible = !store.isFocusMode

        return (
            <Component
                {...props}
                animate={{
                    opacity: isVisible ? 1 : 0,
                    scale: isVisible ? 1 : 0.96,
                }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                style={{
                    ...props.style,
                    pointerEvents: isVisible ? "auto" : "none",
                }}
            />
        )
    }
}
