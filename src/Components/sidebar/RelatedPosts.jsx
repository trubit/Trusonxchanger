import PostCard from "./PostCard";

const RelatedPosts = ({ posts, loading, error, activeId, onSelect }) => {
  return (
    <section className="crypto-sidebar-section crypto-related-section">
      <div className="crypto-related-header">
        <p className="crypto-section-label">Related Posts</p>
      </div>

      {loading ? <p className="crypto-inline-note">Loading related posts...</p> : null}
      {error ? <p className="crypto-inline-error">{error}</p> : null}

      {!loading && !error && posts.length === 0 ? (
        <p className="crypto-inline-note">No related posts yet.</p>
      ) : null}

      <div className="crypto-related-list">
        {posts.map((post) => (
          <PostCard
            key={post.id || post._id || post.slug}
            post={post}
            isActive={
              String(post.id || post._id || post.slug) === String(activeId)
            }
            onSelect={onSelect}
          />
        ))}
      </div>
    </section>
  );
};

export default RelatedPosts;

