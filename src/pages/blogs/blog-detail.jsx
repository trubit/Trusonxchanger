import { useState } from "react";
import { useParams } from "react-router-dom";
import { Container, Row, Col, Alert, Spinner } from "react-bootstrap";
import MiniHeader from "../../Components/layout/mini-header";
import MainPost from "../../Components/common/MainPost.jsx";
import Sidebar from "../../Components/layout/Sidebar.jsx";

import "../../styles/blog-detail.css";
import "bootstrap-icons/font/bootstrap-icons.css";

const BlogDetail = () => {
  const { id } = useParams();
  const [displayPost, setDisplayPost] = useState(null);

  return (
    <>
      <MiniHeader />
      <section className="blog-detail-page">
        <Container fluid="xl">
          <Row className="g-4">
            <Col lg={8}>
              {!displayPost ? (
                <Alert variant="info" className="blog-alert">
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    className="me-2"
                  />
                  Loading blog post...
                </Alert>
              ) : (
                <MainPost post={displayPost} isFading={false} />
              )}
            </Col>
            <Col lg={4}>
              <Sidebar postId={id} onPostUpdate={setDisplayPost} />
            </Col>
          </Row>
        </Container>
      </section>
    </>
  );
};

export default BlogDetail;
