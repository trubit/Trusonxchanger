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

const PostCard = ({ post, isActive, onSelect }) => {
  const imageSrc = post?.imageUrl || post?.image;
  const displayDate = post?.date || formatDate(post?.updatedAt || post?.createdAt);

  return (
    <article
      className={`crypto-post-card ${isActive ? "is-active" : ""}`}
      role="button"
      tabIndex={0}
      onClick={() => onSelect(post)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect(post);
        }
      }}
      aria-label={`Open ${post?.title || "post"}`}
    >
      <div className="crypto-post-visual">
        {imageSrc ? (
          <img src={imageSrc} alt={post?.title || "Related post"} />
        ) : (
          <div className="crypto-post-fallback" />
        )}
        {post?.tag ? <span className="crypto-post-tag">{post.tag}</span> : null}
      </div>
      <div className="crypto-post-content">
        <h4>{post?.title || "Untitled"}</h4>
        <p>{post?.excerpt || post?.description || "Read this related post."}</p>
        {displayDate ? <span className="crypto-post-meta">{displayDate}</span> : null}
      </div>
    </article>
  );
};

export default PostCard;

