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


interface BlogCardProps {
    image: string
    tag: string
    title: string
    date: string
    ctaText: string
    link: string
    accentColor: string
    backgroundColor: string
    titleColor: string
    tagBackgroundColor: string
    tagTextColor: string
    radius: number
    imageAspectRatio: number
    padding: number
}

export function BlogCard(props: BlogCardProps) {
    const {
        image,
        tag,
        title,
        date,
        ctaText,
        link,
        accentColor,
        backgroundColor,
        titleColor,
        tagBackgroundColor,
        tagTextColor,
        radius,
        imageAspectRatio,
        padding,
    } = props

    return (
        <a href={link} style={cardLinkStyle} className="framer-blog-card">
            <div
                className="card-inner"
                style={{
                    ...cardContainerStyle,
                    borderRadius: radius,
                    ["--card-accent" as any]: accentColor,
                    ["--card-bg" as any]: backgroundColor,
                    ["--text-title" as any]: titleColor,
                    ["--tag-bg" as any]: tagBackgroundColor,
                    ["--tag-text" as any]: tagTextColor,
                }}
            >
                <div
                    style={{
                        ...imageWrapperStyle,
                        aspectRatio: String(imageAspectRatio),
                    }}
                >
                    <img
                        src={image}
                        alt={title}
                        style={imageStyle}
                        className="card-image"
                    />
                </div>

                <div style={{ ...contentStyle, padding }}>
                    <div style={metaStyle}>
                        <span style={tagStyle} className="card-tag">
                            {tag}
                        </span>
                        <span style={dateStyle} className="card-date">
                            {date}
                        </span>
                    </div>

                    <h3 style={titleStyle} className="card-title">
                        {title}
                    </h3>

                    <div style={ctaStyle} className="card-cta">
                        <span>{ctaText}</span>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="15"
                            height="15"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="card-cta-icon"
                        >
                            <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: globalStyles }} />
        </a>
    )
}

export default BlogCard

BlogCard.defaultProps = {
    image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
    tag: "Case Study",
    title: "Designing a design system that scales for global remote teams",
    date: "June 01, 2026",
    ctaText: "Read article",
    link: "#",
    accentColor: "#5B5BF7",
    backgroundColor: "#fcfcfd",
    titleColor: "#14141a",
    tagBackgroundColor: "rgba(20, 20, 25, 0.05)",
    tagTextColor: "#4a4a55",
    radius: 20,
    imageAspectRatio: 1.5,
    padding: 28,
}

addPropertyControls(BlogCard, {
    image: { type: ControlType.Image, title: "Image" },
    tag: { type: ControlType.String, title: "Tag" },
    title: { type: ControlType.String, title: "Title" },
    date: { type: ControlType.String, title: "Date" },
    ctaText: { type: ControlType.String, title: "CTA Text" },
    link: { type: ControlType.Link, title: "Link" },
    accentColor: { type: ControlType.Color, title: "Accent" },
    backgroundColor: { type: ControlType.Color, title: "Background" },
    titleColor: { type: ControlType.Color, title: "Title" },
    tagBackgroundColor: { type: ControlType.Color, title: "Tag Background" },
    tagTextColor: { type: ControlType.Color, title: "Tag Text" },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 40,
        step: 1,
    },
    imageAspectRatio: {
        type: ControlType.Number,
        title: "Image Ratio",
        min: 1,
        max: 3,
        step: 0.05,
    },
    padding: {
        type: ControlType.Number,
        title: "Padding",
        min: 12,
        max: 48,
        step: 2,
    },
})

const globalStyles = `
  .framer-blog-card {
    --card-border: rgba(20, 20, 25, 0.08);
    --card-shadow-color: rgba(20, 20, 30, 0.10);
    --text-date: #8a8a94;
  }

  @media (prefers-color-scheme: dark) {
    .framer-blog-card {
      --card-border: rgba(255, 255, 255, 0.08);
      --card-shadow-color: rgba(0, 0, 0, 0.45);
      --text-date: #8f8f99;
    }
  }

  .framer-blog-card {
    display: block;
    text-decoration: none;
    width: 100%;
    height: 100%;
  }

  .card-inner {
    background: var(--card-bg);
    border: 1px solid var(--card-border);
    box-shadow: 0 1px 2px var(--card-shadow-color);
    transition: transform 0.45s cubic-bezier(0.16, 1, 0.3, 1),
      box-shadow 0.45s cubic-bezier(0.16, 1, 0.3, 1),
      border-color 0.45s ease;
  }

  .framer-blog-card:hover .card-inner {
    transform: translateY(-6px);
    box-shadow: 0 20px 40px -12px var(--card-shadow-color);
    border-color: var(--card-accent, #5B5BF7);
  }

  .card-image {
    transition: transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .framer-blog-card:hover .card-image {
    transform: scale(1.06);
  }

  .card-title {
    color: var(--text-title);
    transition: color 0.3s ease;
  }

  .framer-blog-card:hover .card-title {
    color: var(--card-accent, #5B5BF7);
  }

  .card-date { color: var(--text-date); }
  .card-tag { background: var(--tag-bg); color: var(--tag-text); }
  .card-cta { color: var(--card-accent, #5B5BF7); }

  .card-cta-icon {
    transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .framer-blog-card:hover .card-cta-icon {
    transform: translateX(5px);
  }
`

const cardLinkStyle: React.CSSProperties = {
    display: "block",
    width: "100%",
    height: "100%",
}

const cardContainerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    height: "100%",
    fontFamily:
        '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
}

const imageWrapperStyle: React.CSSProperties = {
    width: "100%",
    overflow: "hidden",
    position: "relative",
}

const imageStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
}

const contentStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    flexGrow: 1,
}

const metaStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "14px",
}

const tagStyle: React.CSSProperties = {
    fontSize: "11.5px",
    fontWeight: 600,
    padding: "5px 11px",
    borderRadius: "100px",
    letterSpacing: "0.02em",
    textTransform: "uppercase",
}

const dateStyle: React.CSSProperties = {
    fontSize: "13px",
    fontWeight: 500,
}

const titleStyle: React.CSSProperties = {
    fontSize: "21px",
    fontWeight: 650,
    lineHeight: 1.35,
    margin: "0 0 20px 0",
    letterSpacing: "-0.02em",
    flexGrow: 1,
}

const ctaStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "14px",
    fontWeight: 600,
    letterSpacing: "-0.01em",
}
