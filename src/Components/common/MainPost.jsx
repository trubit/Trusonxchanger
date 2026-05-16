import { Badge } from "react-bootstrap";

const hasHtml = (value) => /<\/?[a-z][\s\S]*>/i.test(value || "");
const stripHtml = (value) =>
  (value || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

const formatDate = (value) => {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const estimateReadTime = (value) => {
  const plainText = hasHtml(value) ? stripHtml(value) : (value || "").trim();
  if (!plainText) return 0;
  const words = plainText.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
};

const makeSummary = (value, limit = 185) => {
  const plainText = hasHtml(value) ? stripHtml(value) : (value || "").trim();
  if (!plainText) return "";
  if (plainText.length <= limit) return plainText;
  return `${plainText.slice(0, limit).trim()}...`;
};

const renderPlainContent = (description) => {
  const blocks = (description || "")
    .replace(/\r/g, "")
    .split(/\n{2,}/g)
    .map((block) => block.trim())
    .filter(Boolean);

  return blocks.map((block, index) => {
    const lines = block
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const isBulletList =
      lines.length > 1 &&
      lines.every((line) => /^(?:[-*]|\u2022)\s+/.test(line));
    if (isBulletList) {
      return (
        <ul key={index} className="post-bullet-list">
          {lines.map((line, lineIndex) => (
            <li key={`${index}-${lineIndex}`}>
              {line.replace(/^(?:[-*]|\u2022)\s+/, "").trim()}
            </li>
          ))}
        </ul>
      );
    }

    const isNumberedList =
      lines.length > 1 && lines.every((line) => /^\d+[.)]\s+/.test(line));
    if (isNumberedList) {
      return (
        <ol key={index} className="post-numbered-list">
          {lines.map((line, lineIndex) => (
            <li key={`${index}-${lineIndex}`}>
              {line.replace(/^\d+[.)]\s+/, "").trim()}
            </li>
          ))}
        </ol>
      );
    }

    return (
      <p key={index} className={index === 0 ? "post-lead" : undefined}>
        {lines.join(" ")}
      </p>
    );
  });
};

const MainPost = ({ post, isFading }) => {
  if (!post) return null;
  const displayDate = post.date || formatDate(post.updatedAt || post.createdAt);
  const readTime = estimateReadTime(post.description);
  const summary = post.excerpt || makeSummary(post.description);

  return (
    <article className={`main-post post-fade ${isFading ? "fade-out" : ""}`}>
      <header className="post-header">
        <h1 className="post-title">{post.title}</h1>
        {summary ? <p className="post-subtitle">{summary}</p> : null}
        <div className="post-meta">
          {displayDate ? (
            <span className="post-date post-meta-chip">
              <i className="bi bi-calendar3" aria-hidden="true" />
              {displayDate}
            </span>
          ) : null}
          {readTime ? (
            <span className="post-meta-chip">
              <i className="bi bi-clock-history" aria-hidden="true" />
              {readTime} min read
            </span>
          ) : null}
          {post.tag ? (
            <Badge bg="success" className="post-category post-meta-chip">
              {post.tag}
            </Badge>
          ) : null}
        </div>
      </header>

      {post.imageUrl || post.image ? (
        <div className="post-hero">
          <img
            src={post.imageUrl || post.image}
            alt={post.imageAlt || post.title}
          />
        </div>
      ) : null}

      <div className="post-content">
        {hasHtml(post.description) ? (
          <div
            className="post-html-content"
            dangerouslySetInnerHTML={{
              __html: post.description,
            }}
          />
        ) : (
          renderPlainContent(post.description)
        )}
      </div>
    </article>
  );
};

export default MainPost;
