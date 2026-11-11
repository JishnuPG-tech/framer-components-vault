import * as React from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


export default function StatsCard(props) {
    // Arredonda o número para evitar casas decimais
    const progressValue = Math.round(props.progress)

    // Cálculo da largura da barra de progresso
    const progressWidth = Math.min(Math.max(progressValue, 0), 100) + "%"

    // Verifica se existe um ícone customizado conectado
    const hasCustomIcon = React.Children.count(props.customIcon) > 0

    // Estilos dinâmicos do cartão
    const cardDynamicStyle = {
        ...styles.card,
        backgroundColor: props.backgroundColor,
        borderRadius: `${props.radius}px`,
        boxShadow: props.showShadow
            ? "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)"
            : "none",
    }

    return (
        <div style={cardDynamicStyle}>
            <div style={styles.title}>
                {/* Container do Ícone */}
                <div
                    style={{
                        ...styles.iconContainer,
                        backgroundColor: hasCustomIcon
                            ? "transparent"
                            : props.accentColor,
                    }}
                >
                    {hasCustomIcon ? (
                        <div style={styles.customIconWrapper}>
                            {props.customIcon}
                        </div>
                    ) : (
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            style={styles.svg}
                        >
                            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                            <polyline points="17 6 23 6 23 12"></polyline>
                        </svg>
                    )}
                </div>

                {/* Texto do Título - Agora usa a fonte nativa (titleFont) */}
                <span
                    style={{
                        ...styles.titleText,
                        ...props.titleFont, // Aplica a fonte escolhida no painel
                        color: props.textColor,
                    }}
                >
                    {props.title}
                </span>

                {/* Porcentagem */}
                <span
                    style={{
                        ...styles.percent,
                        // Vamos usar a mesma fonte do título, mas talvez você queira criar um controle separado "percentFont" se preferir
                        ...props.titleFont,
                        fontSize: "14px", // Mantive fixo pequeno, mas herdando a família do título
                        color: props.accentColor,
                    }}
                >
                    {progressValue}%
                </span>
            </div>

            <div style={styles.data}>
                {/* Valor Principal - Agora usa a fonte nativa (valueFont) */}
                <p
                    style={{
                        ...styles.valueText,
                        ...props.valueFont, // Aplica a fonte escolhida no painel
                        color: props.valueColor,
                    }}
                >
                    {props.value}
                </p>

                {/* Barra de Progresso */}
                <div style={styles.range}>
                    <div
                        style={{
                            ...styles.fill,
                            width: progressWidth,
                            backgroundColor: props.accentColor,
                        }}
                    />
                </div>
            </div>
        </div>
    )
}

// Definição dos valores padrão
StatsCard.defaultProps = {
    title: "Sales",
    value: "$45,231.89",
    progress: 76,
    accentColor: "#10B981",
    backgroundColor: "#ffffff",
    textColor: "#374151",
    valueColor: "#1F2937",
    radius: 20,
    showShadow: true,
    customIcon: [],
}

// Adicionando controles à interface do Framer
addPropertyControls(StatsCard, {
    // --- Controles de Fonte (NOVOS) ---
    // Isso cria aquele painel nativo de fonte (Família, Peso, Tamanho, etc)
    titleFont: {
        type: ControlType.Font, // Esse é o segredo!
        title: "Title Font",
        controls: "extended", // Libera todas as opções (tamanho, altura da linha, etc)
    },
    valueFont: {
        type: ControlType.Font,
        title: "Value Font",
        controls: "extended",
    },

    // --- Controles de Conteúdo ---
    title: {
        type: ControlType.String,
        title: "Title",
        defaultValue: "Sales",
    },
    value: {
        type: ControlType.String,
        title: "Value",
        defaultValue: "$45,231.89",
    },
    progress: {
        type: ControlType.Number,
        title: "Progress %",
        min: 0,
        max: 100,
        defaultValue: 76,
        displayStepper: true,
    },
    customIcon: {
        type: ControlType.ComponentInstance,
        title: "Icon Swap",
    },

    // --- Controles Visuais ---
    radius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 50,
        defaultValue: 20,
        displayStepper: true,
    },
    showShadow: {
        type: ControlType.Boolean,
        title: "Shadow",
        defaultValue: true,
    },

    // --- Cores ---
    accentColor: {
        type: ControlType.Color,
        title: "Accent",
        defaultValue: "#10B981",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#ffffff",
    },
    textColor: {
        type: ControlType.Color,
        title: "Title Color",
        defaultValue: "#374151",
    },
    valueColor: {
        type: ControlType.Color,
        title: "Value Color",
        defaultValue: "#1F2937",
    },
})

// Estilos
const styles = {
    card: {
        padding: "1rem",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        boxSizing: "border-box",
        overflow: "hidden",
    },
    title: {
        display: "flex",
        alignItems: "center",
    },
    iconContainer: {
        position: "relative",
        padding: "0",
        width: "1.5rem",
        height: "1.5rem",
        borderRadius: "9999px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
    },
    customIconWrapper: {
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
    svg: {
        color: "#ffffff",
        height: "1rem",
        width: "1rem",
    },
    titleText: {
        marginLeft: "0.5rem",
        // Removi fontSize e fontWeight fixos daqui, pois agora vêm do controle 'titleFont'
    },
    percent: {
        marginLeft: "auto",
        paddingLeft: "0.5rem",
        fontWeight: 600,
        display: "flex",
    },
    data: {
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
    },
    valueText: {
        marginTop: "1rem",
        marginBottom: "1rem",
        // Removi fontSize/fontWeight fixos daqui, pois vêm do 'valueFont'
        textAlign: "left",
        margin: "1rem 0",
    },
    range: {
        position: "relative",
        backgroundColor: "#E5E7EB",
        width: "100%",
        height: "0.5rem",
        borderRadius: "0.25rem",
        overflow: "hidden",
    },
    fill: {
        position: "absolute",
        top: 0,
        left: 0,
        height: "100%",
        borderRadius: "0.25rem",
        transition: "width 0.3s ease",
    },
}
