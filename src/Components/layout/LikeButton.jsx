import { useState } from "react";

const LikeButton = ({ likes, onLike, loading, error }) => {
  const [isPressed, setIsPressed] = useState(false);

  const handleClick = () => {
    setIsPressed(true);
    onLike();
    window.setTimeout(() => setIsPressed(false), 220);
  };

  return (
    <section className="crypto-sidebar-section crypto-like-section">
      <p className="crypto-section-label">Like This Post</p>
      <button
        type="button"
        className={`crypto-like-button ${isPressed ? "is-pressed" : ""}`}
        onClick={handleClick}
        disabled={loading}
        aria-label="Like this post"
      >
        <i className="bi bi-hand-thumbs-up-fill" />
      </button>
      <p className="crypto-like-count">{likes} likes</p>
      {error ? <p className="crypto-inline-error">{error}</p> : null}
    </section>
  );
};

export default LikeButton;

