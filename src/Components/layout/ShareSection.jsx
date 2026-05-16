const ShareSection = ({ post }) => {
  const slugOrId = post?.slug || post?.id;
  const postUrl = slugOrId
    ? `${window.location.origin}/blogs/${slugOrId}`
    : window.location.href;
  const encodedUrl = encodeURIComponent(postUrl);
  const encodedTitle = encodeURIComponent(post?.title || "Check this post");

  return (
    <section className="crypto-sidebar-section crypto-share-section">
      <p className="crypto-section-label">Share Post</p>
      <div className="crypto-share-icons" role="group" aria-label="Share links">
        <a
          href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`}
          target="_blank"
          rel="noreferrer"
          aria-label="Share on X"
        >
          <i className="bi bi-twitter-x" />
        </a>
        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
          target="_blank"
          rel="noreferrer"
          aria-label="Share on Facebook"
        >
          <i className="bi bi-facebook" />
        </a>
        <a
          href={`https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`}
          target="_blank"
          rel="noreferrer"
          aria-label="Share on Telegram"
        >
          <i className="bi bi-telegram" />
        </a>
      </div>
    </section>
  );
};

export default ShareSection;

