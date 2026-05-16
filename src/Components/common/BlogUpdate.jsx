import { Button, Container } from "react-bootstrap";
import { NavLink } from "react-router-dom";
import MiniHeader from "../layout/mini-header";
import { BlogGrid } from "./BlogCards";
import BlogUpdateForm from "./BlogUpdateForm";
import { useBlogPosts } from "../../hooks/useBlogPosts";

import "../../styles/blogs.css";

// Admin blog update page (form + preview).
const BlogUpdatePage = () => {
  const { posts, visiblePosts, loading, error, refresh } =
    useBlogPosts();
  const activePost = visiblePosts[0] ?? null;

  return (
    <>
      <MiniHeader />
      <section className="blogs-page">
        <div className="blogs-hero">
          <Container fluid="xl">
            <div className="blogs-actions">
              <Button
                as={NavLink}
                to="/Blogs"
                variant="outline-light"
                className="blogs-action-button"
              >
                View Blog Cards
              </Button>
            </div>
            {loading && <div className="blogs-admin-note">Loading posts...</div>}
            {error && <div className="blogs-admin-note">{error}</div>}
            <BlogUpdateForm
              posts={posts}
              visiblePosts={visiblePosts}
              activePost={activePost}
              onSaveSuccess={refresh}
            />
            <div className="blogs-update-preview">
              <h2 className="blogs-form-title">Preview</h2>
              <BlogGrid posts={visiblePosts} />
            </div>
          </Container>
        </div>
      </section>
    </>
  );
};

export default BlogUpdatePage;
