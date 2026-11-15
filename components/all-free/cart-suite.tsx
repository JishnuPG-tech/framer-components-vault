// ── Cart Store (window-shared singleton, no external imports) ──
interface CartItem {
    id: string
    name: string
    price: number
    image: string
    quantity: number
}
const WIN_KEY = "__framerCartStore"
function getCart() {
    if (typeof window === "undefined") return null
    const w = window as any
    if (w[WIN_KEY]) return w[WIN_KEY]
    const KEY = "framer-cart-items"
    let items: CartItem[] = []
    try {
        items = JSON.parse(localStorage.getItem(KEY) || "[]")
    } catch {}
    const subs = new Set<() => void>()
    function save() {
        try {
            localStorage.setItem(KEY, JSON.stringify(items))
        } catch {}
    }
    function notify() {
        save()
        subs.forEach((f) => f())
    }
    w[WIN_KEY] = {
        getItems: () => items,
        getCount: () =>
            items.reduce((s: number, i: CartItem) => s + i.quantity, 0),
        getTotal: () =>
            items.reduce(
                (s: number, i: CartItem) => s + i.price * i.quantity,
                0
            ),
        addItem: (item: Omit<CartItem, "quantity">) => {
            const ex = items.find((i: CartItem) => i.id === item.id)
            if (ex) ex.quantity += 1
            else items.push({ ...item, quantity: 1 })
            notify()
        },
        removeItem: (id: string) => {
            items = items.filter((i: CartItem) => i.id !== id)
            notify()
        },
        updateQty: (id: string, q: number) => {
            if (q <= 0) items = items.filter((i: CartItem) => i.id !== id)
            else {
                const it = items.find((i: CartItem) => i.id === id)
                if (it) it.quantity = q
            }
            notify()
        },
        clear: () => {
            items = []
            notify()
        },
        subscribe: (fn: () => void) => {
            subs.add(fn)
            return () => {
                subs.delete(fn)
            }
        },
    }
    return w[WIN_KEY]
}
const cartStore = getCart()

import { useState, useCallback, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface AddToCartButtonProps {
    productId: string
    productName: string
    price: number
    productImage: string
    buttonText: string
    addedText: string
    backgroundColor: string
    textColor: string
    hoverBackgroundColor: string
    borderRadius: number
    fontSize: number
    fontWeight: number | string
    paddingV: number
    paddingH: number
    fullWidth: boolean
    style?: CSSProperties
}

export default function AddToCartButton(props: AddToCartButtonProps) {
    const {
        productId = "product-1",
        productName = "Product",
        price = 0,
        productImage = "",
        buttonText = "Add to Cart",
        addedText = "✓ Added",
        backgroundColor = "#000000",
        textColor = "#FFFFFF",
        hoverBackgroundColor = "#333333",
        borderRadius = 8,
        fontSize = 16,
        fontWeight = 600,
        paddingV = 16,
        paddingH = 48,
        fullWidth = false,
        style,
    } = props

    const [isAdded, setIsAdded] = useState(false)
    const [isHovered, setIsHovered] = useState(false)

    const handleClick = useCallback(() => {
        if (!cartStore) return
        cartStore.addItem({
            id: productId,
            name: productName,
            price: price,
            image: productImage,
        })
        setIsAdded(true)
        setTimeout(() => setIsAdded(false), 1500)
    }, [productId, productName, price, productImage])

    const btnStyle: CSSProperties = {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: `${paddingV}px ${paddingH}px`,
        backgroundColor: isHovered ? hoverBackgroundColor : backgroundColor,
        color: textColor,
        borderRadius,
        fontSize: `${fontSize}px`,
        fontWeight,
        border: "none",
        cursor: "pointer",
        transition: "all 0.2s ease",
        width: fullWidth ? "100%" : "auto",
        outline: "none",
        fontFamily: "inherit",
        ...style,
    }

    return (
        <button
            style={btnStyle}
            onClick={handleClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {isAdded ? addedText : buttonText}
        </button>
    )
}

addPropertyControls(AddToCartButton, {
    productId: {
        type: ControlType.String,
        title: "Product ID",
        defaultValue: "product-1",
        placeholder: "Unique product ID",
    },
    productName: {
        type: ControlType.String,
        title: "Product Name",
        defaultValue: "Product",
        placeholder: "Product name",
    },
    price: {
        type: ControlType.Number,
        title: "Price",
        defaultValue: 0,
        min: 0,
        step: 0.01,
    },
    productImage: { type: ControlType.Image, title: "Product Image" },
    buttonText: {
        type: ControlType.String,
        title: "Button Text",
        defaultValue: "Add to Cart",
    },
    addedText: {
        type: ControlType.String,
        title: "Added Text",
        defaultValue: "✓ Added",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#000000",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#FFFFFF",
    },
    hoverBackgroundColor: {
        type: ControlType.Color,
        title: "Hover BG",
        defaultValue: "#333333",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 8,
        min: 0,
        max: 50,
        unit: "px",
    },
    fontSize: {
        type: ControlType.Number,
        title: "Font Size",
        defaultValue: 16,
        min: 10,
        max: 32,
        unit: "px",
    },
    fontWeight: {
        type: ControlType.Number,
        title: "Font Weight",
        defaultValue: 600,
        min: 100,
        max: 900,
        step: 100,
    },
    paddingV: {
        type: ControlType.Number,
        title: "Padding V",
        defaultValue: 16,
        min: 0,
        max: 50,
        unit: "px",
    },
    paddingH: {
        type: ControlType.Number,
        title: "Padding H",
        defaultValue: 48,
        min: 0,
        max: 100,
        unit: "px",
    },
    fullWidth: {
        type: ControlType.Boolean,
        title: "Full Width",
        defaultValue: false,
        enabledTitle: "Yes",
        disabledTitle: "No",
    },
})
