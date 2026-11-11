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


type CoverImage = { src?: string; srcSet?: string; alt?: string }
type SampleKind = "none" | "brief" | "mood" | "launch"
type Resource = {
    fileType?: string
    title: string
    description: string
    coverColor: string
    pageColor: string
    image?: CoverImage
    file?: string
    link?: string
    sample: SampleKind
    filename?: string
}
type Props = {
    resources: Resource[]
    background: string
    textColor: string
    mutedColor: string
    gap: number
    padding: number
    cornerRadius: number
    previewHeight: number
    showBorder: boolean
    style?: React.CSSProperties
}

const DEFAULT_RESOURCES: Resource[] = [
    {
        title: "Creative Brief",
        description: "A clearer start to your next project.",
        coverColor: "#D9EFA6",
        pageColor: "#F7F6F1",
        link: "",
        sample: "brief",
        filename: "Creative-Brief.pdf",
    },
    {
        title: "Moodboard Notes",
        description: "Find a visual direction worth exploring.",
        coverColor: "#D8D0F1",
        pageColor: "#F8F7F3",
        link: "",
        sample: "mood",
        filename: "Moodboard-Notes.pdf",
    },
    {
        title: "Launch Checklist",
        description: "The little details before going live.",
        coverColor: "#BCCDF2",
        pageColor: "#F8F7F3",
        link: "",
        sample: "launch",
        filename: "Launch-Checklist.pdf",
    },
]

const EXERCISES: Record<Exclude<SampleKind, "none">, { subtitle: string; sections: { title: string; prompts: string[] }[] }> = {
    brief: {
        subtitle: "Make the next project start with clarity.",
        sections: [
            { title: "The challenge", prompts: ["What problem are you actually trying to solve?", "Describe it in one clear sentence."] },
            { title: "Who is it for?", prompts: ["Who is the primary audience?", "What matters most to them?"] },
            { title: "The big idea", prompts: ["What is the one thing people should remember?", "What should they feel or do next?"] },
            { title: "Definition of done", prompts: ["How will you know the work is successful?", "Which constraints are non-negotiable?"] },
        ],
    },
    mood: {
        subtitle: "Collect references with intention.",
        sections: [
            { title: "Three direction words", prompts: ["01 _______________________________", "02 _______________________________", "03 _______________________________"] },
            { title: "Reference 01", prompts: ["What inspires you about its composition?"] },
            { title: "Reference 02", prompts: ["What colors and materials feel distinctive?"] },
            { title: "Reference 03", prompts: ["What should this direction deliberately avoid?"] },
        ],
    },
    launch: {
        subtitle: "A focused final check before launch.",
        sections: [
            { title: "Content", prompts: ["Every page has a clear purpose", "Placeholder copy has been replaced", "Download links work"] },
            { title: "Experience", prompts: ["Desktop and mobile layouts are tested", "Buttons work with touch and keyboard", "Focus is visible and motion is accessible"] },
            { title: "Quality", prompts: ["Images have alt text and sensible sizes", "Contrast is readable", "Forms and error states are tested"] },
            { title: "Final checks", prompts: ["Metadata and social image are correct", "Real preview URLs are tested", "The site was checked on a phone"] },
        ],
    },
}

/** Produces a valid, self-contained one-page PDF for the three demo downloads. No network calls. */
function createSamplePdf(title: string, kind: Exclude<SampleKind, "none">): Uint8Array {
    const doc = EXERCISES[kind]
    const ascii = (s: string) => s.normalize("NFKD").replace(/[^\x20-\x7E]/g, "-")
    const escape = (s: string) => ascii(s).replace(/[\\()]/g, "\\$&")
    const text = (x: number, y: number, str: string, size = 12, font = "F1") =>
        `BT /${font} ${size} Tf 1 0 0 1 ${x} ${y} Tm (${escape(str)}) Tj ET\n`
    const line = (y: number) => `0.75 0.78 0.77 RG 0.7 w 45 ${y} m 550 ${y} l S\n`
    const color = kind === "brief" ? "0.76 0.91 0.45" : kind === "mood" ? "0.81 0.76 0.97" : "0.69 0.78 0.98"
    let stream = `q 0.976 0.972 0.957 rg 0 0 595 842 re f ${color} rg 0 826 595 16 re f Q\n`
    stream += text(45, 785, "STUDIO WORKSHEETS", 10, "F2")
    stream += text(510, 785, "FREE PDF", 9, "F2") + line(771)
    stream += text(45, 707, title, 34, "F2")
    stream += text(46, 680, doc.subtitle, 12)
    let y = 630
    for (const section of doc.sections) {
        stream += text(46, y, section.title.toUpperCase(), 12, "F2")
        stream += line(y - 12)
        y -= 38
        for (const prompt of section.prompts) {
            stream += text(48, y, kind === "launch" ? "[ ]  " + prompt : prompt, 10.5)
            y -= 19
        }
        if (kind !== "launch") {
            stream += line(y - 5) + line(y - 25)
            y -= 46
        } else {
            y -= 20
        }
    }
    stream += text(45, 44, "A practical resource to make your next project better.", 8)
    stream += text(504, 44, "PAGE 1 / 1", 8, "F2")
    const objects = [
        "<< /Type /Catalog /Pages 2 0 R >>",
        "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>",
        "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
        "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
        `<< /Length ${stream.length} >>\nstream\n${stream}endstream`,
    ]
    let pdf = "%PDF-1.4\n"
    const offsets = [0]
    for (let i = 0; i < objects.length; i++) {
        offsets.push(pdf.length)
        pdf += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`
    }
    const xrefOffset = pdf.length
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
    for (let i = 1; i < offsets.length; i++) pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`
    return new TextEncoder().encode(pdf)
}

function downloadSample(resource: Resource) {
    if (!resource.sample || resource.sample === "none") return
    const bytes = createSamplePdf(resource.title, resource.sample)
    const blob = new Blob([bytes as BlobPart], { type: "application/pdf" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    const cleanName = resource.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
    a.href = url
    a.download = resource.filename?.trim() || `${cleanName || "resource"}.pdf`
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Download hosted files as blobs. If CORS or fetch prevents access, open the original file in a new tab. */
async function downloadRemoteFile(url: string, filename: string) {
    try {
        const response = await fetch(url)
        if (!response.ok) throw new Error("Download request failed")
        const blob = await response.blob()
        const objectUrl = URL.createObjectURL(blob)
        const anchor = document.createElement("a")
        anchor.href = objectUrl
        anchor.download = filename || "resource"
        document.body.appendChild(anchor)
        anchor.click()
        anchor.remove()
        window.setTimeout(() => URL.revokeObjectURL(objectUrl), 5000)
    } catch {
        const anchor = document.createElement("a")
        anchor.href = url
        anchor.target = "_blank"
        anchor.rel = "noopener noreferrer"
        document.body.appendChild(anchor)
        anchor.click()
        anchor.remove()
    }
}

const CSS = `
.rpd-root,.rpd-root *{box-sizing:border-box}
.rpd-root{container-type:inline-size;font-family:Inter,Arial,Helvetica,sans-serif;overflow:visible}
.rpd-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:var(--gap);align-items:stretch}
.rpd-card{min-width:0;display:flex;flex-direction:column;border-radius:var(--radius);background:var(--surface);border:var(--border);padding:0;text-align:left;color:var(--ink);text-decoration:none;appearance:none;cursor:pointer;outline:none;transition:transform .3s cubic-bezier(.2,.8,.2,1)}
.rpd-card[data-clickable=false]{cursor:default}
.rpd-card:focus-visible{outline:3px solid #605BFF;outline-offset:5px}
.rpd-media{position:relative;height:var(--preview);width:100%;display:grid;place-items:center;background:var(--cover);border-radius:calc(var(--radius) - 1px);overflow:hidden;isolation:isolate}
.rpd-sheet-back,.rpd-sheet{width:auto;height:79%;aspect-ratio:.72;position:absolute;border-radius:3px 8px 8px 3px;box-shadow:0 15px 28px rgba(20,25,25,.14),0 3px 8px rgba(20,25,25,.09);transition:transform .58s cubic-bezier(.2,.8,.2,1),box-shadow .58s ease;}
.rpd-sheet-back{background:var(--page);transform:translate(12px,8px) rotate(6deg);opacity:.88;z-index:1}
.rpd-sheet{z-index:2;display:flex;flex-direction:column;gap:0;overflow:hidden;background:var(--page);transform:translate(-3px,0px) rotate(-5deg);}
.rpd-card[data-clickable=true]:is(:hover,:focus-visible) .rpd-sheet{transform:translate(-13px,-10px) rotate(-9deg);box-shadow:0 26px 42px rgba(20,25,25,.18),0 6px 12px rgba(20,25,25,.1)}
.rpd-card[data-clickable=true]:is(:hover,:focus-visible) .rpd-sheet-back{transform:translate(22px,10px) rotate(10deg)}
.rpd-sheet-image{width:100%;height:100%;object-fit:cover;display:block}
.rpd-doc{height:100%;width:100%;padding:clamp(11px,1.45cqw,18px);display:flex;flex-direction:column;position:relative;overflow:hidden;background:var(--page)}
.rpd-doc-head{height:7px;background:var(--cover);width:100%;position:absolute;top:0;left:0}
.rpd-doc-kicker{font-size:clamp(7px,.75cqw,10px);font-weight:700;letter-spacing:.065em;margin:11px 0 0}
.rpd-doc-big{margin-top:19%;font-size:clamp(17px,2.15cqw,28px);line-height:1.02;font-weight:700;letter-spacing:-.055em;max-width:95%;word-break:normal}
.rpd-doc-rule{height:1px;background:rgba(27,32,30,.22);margin:17px 0 10px}
.rpd-doc-row{display:flex;gap:7px;align-items:center;margin:7px 0}
.rpd-doc-mark{width:8px;height:8px;border:1px solid #868E89;flex:none}
.rpd-doc-line{height:2px;background:#B6BBB5;border-radius:10px;width:81%}
.rpd-doc-line.short{width:48%}
.rpd-doc-bottom{margin-top:auto;font-size:7px;font-weight:600;opacity:.52;letter-spacing:.08em}
.rpd-doc-swatch{margin:16px 0 5px;display:grid;grid-template-columns:repeat(3,1fr);gap:5px}
.rpd-doc-swatch span{aspect-ratio:1.05;border-radius:3px}
.rpd-doc-swatch span:nth-child(1){background:#B3A7E3}.rpd-doc-swatch span:nth-child(2){background:#CBD3BD}.rpd-doc-swatch span:nth-child(3){background:#E8B8A2}
.rpd-format{position:absolute;top:17px;right:17px;background:rgba(255,255,255,.84);border:1px solid rgba(0,0,0,.07);padding:7px 10px;border-radius:50px;font-size:10px;line-height:1;font-weight:700;letter-spacing:.03em;z-index:4}
.rpd-details{padding:17px 2px 0;display:flex;flex:1;flex-direction:column;min-height:0}
.rpd-title{margin:0;font-size:clamp(18px,2.1cqw,24px);letter-spacing:-.048em;line-height:1.13;font-weight:640}
.rpd-desc{margin:6px 0 0;font-size:13px;line-height:1.42;font-weight:400;letter-spacing:-.012em;color:var(--muted);min-height:36px}
.rpd-action{margin:21px 0 0;display:flex;align-items:center;justify-content:space-between;gap:10px;min-height:40px;border-top:1px solid rgba(28,35,32,.16);padding-top:14px;font-size:13px;letter-spacing:-.014em;font-weight:650;color:var(--ink)}
.rpd-download{width:34px;height:34px;flex:none;border-radius:100%;display:flex;justify-content:center;align-items:center;background:var(--ink);color:#fff;margin-top:-2px;transition:transform .25s ease}
.rpd-card[data-clickable=true]:is(:hover,:focus-visible) .rpd-download{transform:translateY(3px)}
.rpd-card[data-clickable=false] .rpd-download{background:#C6CAC5}
.rpd-card[data-clickable=false] .rpd-action{color:var(--muted)}
@container (max-width:720px){.rpd-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.rpd-doc-big{font-size:clamp(22px,3.3cqw,31px)}.rpd-title{font-size:22px}}
@container (min-width:536px) and (max-width:720px){.rpd-card:last-child:nth-child(odd){grid-column:1 / -1;justify-self:center;width:calc((100% - var(--gap)) / 2)}}
@container (max-width:535px){.rpd-grid{grid-template-columns:1fr}.rpd-media{height:clamp(245px,75cqw,360px)}.rpd-details{padding-top:14px}.rpd-title{font-size:23px}.rpd-desc{min-height:0}.rpd-action{margin-top:14px}.rpd-doc-big{font-size:clamp(22px,6.5cqw,31px)}.rpd-doc-kicker{font-size:9px}}
@media (prefers-reduced-motion:reduce){.rpd-root *,.rpd-root *:before,.rpd-root *:after{transition:none!important;animation:none!important}.rpd-card:is(:hover,:focus-visible) .rpd-sheet,.rpd-card:is(:hover,:focus-visible) .rpd-sheet-back{transform:none!important}}
.rpd-root[data-static=true] *{transition:none!important}
`

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1120
 * @framerIntrinsicHeight 520
 */
export default function ResourcePreviewDeck(props: Props) {
    const {
        resources = DEFAULT_RESOURCES,
        background = "#FFFFFF",
        textColor = "#202320",
        mutedColor = "#777D76",
        gap = 24,
        padding = 0,
        cornerRadius = 13,
        previewHeight = 305,
        showBorder = false,
        style,
    } = props
    const isStatic = useIsStaticRenderer()
    const safeResources = Array.isArray(resources) && resources.length ? resources : DEFAULT_RESOURCES
    const variables = {
        "--gap": `${gap}px`,
        "--radius": `${cornerRadius}px`,
        "--preview": `${previewHeight}px`,
        "--ink": textColor,
        "--muted": mutedColor,
        "--border": showBorder ? "1px solid rgba(0,0,0,.1)" : "0px solid transparent",
        "--surface": background,
    } as React.CSSProperties

    return (
        <div
            className="rpd-root"
            data-static={isStatic ? "true" : "false"}
            style={{ display: "block", width: "100%", background, color: textColor, padding, ...variables, ...style }}
        >
            <style>{CSS}</style>
            <div className="rpd-grid" aria-label="Downloadable resources">
                {safeResources.map((item, index) => {
                    const uploadedFile = (item.file || "").trim()
                    const linkedFile = (item.link || "").trim()
                    const fileUrl = uploadedFile || linkedFile
                    const format = (item.fileType || "PDF").toUpperCase().trim() || "PDF"
                    const demo = !fileUrl && item.sample && item.sample !== "none" && format === "PDF"
                    const enabled = !!fileUrl || !!demo
                    const extension = format.toLowerCase().replace(/[^a-z0-9]/g, "") || "pdf"
                    const fileName = item.filename?.trim() || `${item.title.replace(/[^a-z0-9]+/gi, "-")}.${extension}`
                    const label = linkedFile && !uploadedFile ? `View ${item.title}` : `Download ${item.title}`
                    const inner = (
                        <>
                            <div
                                className="rpd-media"
                                style={{ "--cover": item.coverColor || "#D9EFA6", "--page": item.pageColor || "#F8F7F3" } as React.CSSProperties}
                            >
                                <div className="rpd-sheet-back" aria-hidden="true" />
                                <div className="rpd-sheet">
                                    {item.image?.src ? (
                                        <img src={item.image.src} srcSet={item.image.srcSet} alt={item.image.alt || `${item.title} preview`} className="rpd-sheet-image" draggable={false} />
                                    ) : (
                                        <div className="rpd-doc" aria-hidden="true">
                                            <div className="rpd-doc-head" />
                                            <span className="rpd-doc-kicker">STUDIO / RESOURCES</span>
                                            <span className="rpd-doc-big">{item.title}</span>
                                            {item.sample === "mood" && <div className="rpd-doc-swatch"><span/><span/><span/></div>}
                                            <div className="rpd-doc-rule" />
                                            <div className="rpd-doc-row"><span className="rpd-doc-mark" /><span className="rpd-doc-line" /></div>
                                            <div className="rpd-doc-row"><span className="rpd-doc-mark" /><span className="rpd-doc-line short" /></div>
                                            <div className="rpd-doc-row"><span className="rpd-doc-mark" /><span className="rpd-doc-line" /></div>
                                            <span className="rpd-doc-bottom">MADE TO BE USED.</span>
                                        </div>
                                    )}
                                </div>
                                <span className="rpd-format">{format}</span>
                            </div>
                            <div className="rpd-details">
                                <h3 className="rpd-title">{item.title}</h3>
                                <p className="rpd-desc">{item.description}</p>
                                {enabled && (
                                    <div className="rpd-action">
                                        <span>{linkedFile && !uploadedFile ? `View ${format}` : `Download ${format}`}</span>
                                        <span className="rpd-download" aria-hidden="true">
                                            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v13m-5-5 5 5 5-5M4 20h16" /></svg>
                                        </span>
                                    </div>
                                )}
                            </div>
                        </>
                    )
                    const common = {
                        className: "rpd-card",
                        "data-clickable": enabled ? "true" : "false",
                        key: `${index}-${item.title}`,
                    }
                    if (uploadedFile) {
                        return <button {...common} type="button" aria-label={label} onClick={() => downloadRemoteFile(uploadedFile, fileName)}>{inner}</button>
                    }
                    if (linkedFile) {
                        return <a {...common} href={linkedFile} target="_blank" rel="noopener noreferrer" aria-label={label}>{inner}</a>
                    }
                    if (demo) {
                        return <button {...common} type="button" aria-label={label} onClick={() => downloadSample(item)}>{inner}</button>
                    }
                    return <div {...common} role="group" aria-label={`${item.title} (no download file configured)`}>{inner}</div>
                })}
            </div>
        </div>
    )
}

addPropertyControls(ResourcePreviewDeck, {
    resources: {
        type: ControlType.Array,
        title: "Downloads",
        maxCount: 9,
        defaultValue: DEFAULT_RESOURCES,
        control: {
            type: ControlType.Object,
            controls: {
                title: { type: ControlType.String, title: "Title", defaultValue: "Your Resource" },
                description: { type: ControlType.String, title: "Description", defaultValue: "" },
                fileType: { type: ControlType.String, title: "File Format", defaultValue: "PDF" },
                image: { type: ControlType.ResponsiveImage, title: "Preview Image" },
                coverColor: { type: ControlType.Color, title: "Preview Color", defaultValue: "#D9EFA6" },
                pageColor: { type: ControlType.Color, title: "Paper Color", defaultValue: "#F8F7F3" },
                file: { type: ControlType.File, title: "Upload File", allowedFileTypes: ["pdf", "zip", "png", "jpg", "svg"] },
                link: { type: ControlType.Link, title: "File URL", defaultValue: "" },
                filename: { type: ControlType.String, title: "File Name", defaultValue: "" },
                sample: {
                    type: ControlType.Enum,
                    title: "Example PDF",
                    options: ["none", "brief", "mood", "launch"],
                    optionTitles: ["Disabled", "Creative Brief", "Moodboard Notes", "Launch Checklist"],
                    defaultValue: "none",
                },
            },
        },
    },
    background: { type: ControlType.Color, title: "Background", defaultValue: "#FFFFFF" },
    textColor: { type: ControlType.Color, title: "Text", defaultValue: "#202320" },
    mutedColor: { type: ControlType.Color, title: "Subtext", defaultValue: "#777D76" },
    gap: { type: ControlType.Number, title: "Card Gap", defaultValue: 24, min: 8, max: 48 },
    padding: { type: ControlType.Number, title: "Padding", defaultValue: 0, min: 0, max: 60 },
    cornerRadius: { type: ControlType.Number, title: "Corners", defaultValue: 13, min: 0, max: 32 },
    previewHeight: { type: ControlType.Number, title: "Preview Height", defaultValue: 305, min: 180, max: 520 },
    showBorder: { type: ControlType.Boolean, title: "Card Border", defaultValue: false },
})