import { Button } from "react-bootstrap";
import { useBlogUpdateForm, MAX_IMAGE_SIZE_MB } from "../../hooks/useBlogUpdate";

// Form UI for creating/updating blog posts.
const BlogUpdateForm = ({
  posts,
  visiblePosts,
  activePost,
  onActivatePost,
}) => {
  const {
    editingId,
    formData,
    uploadError,
    saveError,
    saving,
    deleting,
    imageUrlValue,
    handleSelectChange,
    handleFieldChange,
    handleImageUpload,
    handleRemoveImage,
    handleSubmit,
    handleDelete,
    useLatestPost,
  } = useBlogUpdateForm({
    posts,
    visiblePosts,
    activePost,
    onActivatePost,
  });

  return (
    <div className="blogs-form">
      <div className="blogs-form-header">
        <div>
          <h2 className="blogs-form-title">Post a Blog Update</h2>
          <p className="blogs-form-subtitle">
            Add a new post or update the one currently on screen.
          </p>
        </div>
        <div className="blogs-form-select">
          <label htmlFor="postSelect">Edit</label>
          <select
            id="postSelect"
            value={editingId}
            onChange={handleSelectChange}
          >
            <option value="new">New post</option>
            {posts.map((post) => (
              <option key={post.id} value={post.id}>
                {post.title || "Untitled post"}
              </option>
            ))}
          </select>
        </div>
      </div>

      <form className="blogs-form-grid" onSubmit={handleSubmit}>
        <label className="blogs-field">
          Title
          <input
            name="title"
            value={formData.title}
            onChange={handleFieldChange}
            placeholder="Blog title"
            required
          />
        </label>

        <label className="blogs-field">
          Tag (optional)
          <input
            name="tag"
            value={formData.tag}
            onChange={handleFieldChange}
            placeholder="Introducing"
          />
        </label>

        <label className="blogs-field">
          Date (optional)
          <input
            name="date"
            value={formData.date}
            onChange={handleFieldChange}
            placeholder="08 Mar 2026 8:00 am"
          />
        </label>

        <label className="blogs-field blogs-field-full">
          Description
          <textarea
            name="description"
            value={formData.description}
            onChange={handleFieldChange}
            placeholder="Write a short summary for this post."
            rows={4}
            required
          />
        </label>

        <label className="blogs-field blogs-field-full">
          Image URL (optional)
          <input
            name="image"
            value={imageUrlValue}
            onChange={handleFieldChange}
            placeholder="https://example.com/image.jpg"
          />
        </label>

        <label className="blogs-field blogs-field-full">
          Or Upload Image (max {MAX_IMAGE_SIZE_MB}MB)
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
          />
          {formData.image ? (
            <div className="blogs-image-preview">
              <img src={formData.image} alt="Preview" />
              <Button
                type="button"
                variant="outline-light"
                size="sm"
                onClick={handleRemoveImage}
              >
                Remove image
              </Button>
            </div>
          ) : null}
        {uploadError ? (
          <div className="blogs-image-error">{uploadError}</div>
        ) : null}
        {saveError ? (
          <div className="blogs-image-error">{saveError}</div>
        ) : null}
      </label>

        <label className="blogs-field blogs-field-full">
          Image alt text (optional)
          <input
            name="imageAlt"
            value={formData.imageAlt}
            onChange={handleFieldChange}
            placeholder="Describe the image for accessibility"
          />
        </label>

        <div className="blogs-form-actions">
          <Button type="submit" variant="success" disabled={saving}>
            {saving ? "Saving..." : editingId === "new" ? "Add post" : "Update post"}
          </Button>
          {activePost ? (
            <Button
              type="button"
              variant="outline-light"
              onClick={useLatestPost}
            >
              Use latest post
            </Button>
          ) : null}
          {editingId !== "new" ? (
            <Button
              type="button"
              variant="outline-danger"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete post"}
            </Button>
          ) : null}
        </div>
      </form>
    </div>
  );
};

export default BlogUpdateForm;
