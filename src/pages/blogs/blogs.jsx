import { Container, Button } from "react-bootstrap";
import { NavLink } from "react-router-dom";
import MiniHeader from "../../Components/layout/mini-header";
import { BlogCarousel, BlogGrid } from "../../Components/common/BlogCards";
import { useBlogPosts } from "../../hooks/useBlogPosts";
import { useBlogs } from "../../hooks/useBlogs";

import "bootstrap-icons/font/bootstrap-icons.css";
import "../../styles/mini-header.css";
import "../../styles/blogs.css";

const Blogs = () => {
  const { visiblePosts, loading, error } = useBlogPosts();
  const carouselPosts = visiblePosts.slice(0, 4);
  const { activeIndex, setActiveIndex } = useBlogs(carouselPosts);

  return (
    <>
      <MiniHeader showBreadcrumb={false} />
      <section className="blogs-page">
        <div className="blogs-hero">
          <Container fluid="xl">
            <div className="blogs-actions">
              <Button
                as={NavLink}
                to="/BlogUpdate"
                variant="outline-light"
                className="blogs-action-button"
              >
                Post Blog Update
              </Button>
            </div>
            {loading && (
              <div className="blogs-admin-note">Loading blog posts...</div>
            )}
            {error && <div className="blogs-admin-note">{error}</div>}
            {!loading && (
              <BlogCarousel
                posts={carouselPosts}
                activeIndex={activeIndex}
                onSelectIndex={setActiveIndex}
              />
            )}

            <div className="blogs-update-preview">
              {/*<h2 className="blogs-form-title">All Blog Cards</h2>*/}
              <BlogGrid posts={visiblePosts} />
            </div>
          </Container>
        </div>
      </section>
    </>
  );
};

export default Blogs;
