import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Row, Col, Card, Alert, Button, Badge } from 'react-bootstrap';
import { getPostsByHashtag } from '../services/api';
import Post from '../components/Post';
import LoadingSpinner from '../components/LoadingSpinner';

const HashtagPage = ({ user }) => {
    const { tag } = useParams();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                setLoading(true);
                setError('');
                const hashtagPosts = await getPostsByHashtag(tag);
                
                if (!Array.isArray(hashtagPosts)) {
                    throw new Error('Invalid response format from server');
                }

                setPosts(hashtagPosts);
            } catch (err) {
                setError(`Failed to load posts for #${tag}. Please try again.`);
            } finally {
                setLoading(false);
            }
        };

        fetchPosts();
    }, [tag]);

    return (
        <div className="hashtag-page">
            <div className="hashtag-header text-center py-4">
                <h1 className="hashtag-title mb-3">
                    #{tag} 
                    {posts.length > 0 && (
                        <Badge bg="light" text="dark" className="ms-2 fs-6">
                            {posts.length} {posts.length === 1 ? 'post' : 'posts'}
                        </Badge>
                    )}
                </h1>
                <p className="text-muted">Posts tagged with #{tag}</p>
            </div>

            {loading ? (
                <div className="text-center py-5">
                    <LoadingSpinner />
                    <p className="mt-3">Loading posts...</p>
                </div>
            ) : error ? (
                <Card className="error-card my-4">
                    <Card.Body className="text-center py-4">
                        <Alert variant="danger" className="mb-0">
                            <p className="mb-3">{error}</p>
                            <Button 
                                variant="outline-danger" 
                                onClick={() => window.location.reload()}
                                size="sm"
                            >
                                Try Again
                            </Button>
                        </Alert>
                    </Card.Body>
                </Card>
            ) : posts.length === 0 ? (
                <Card className="no-posts-card my-4">
                    <Card.Body className="text-center py-5">
                        <div className="empty-state-icon mb-3">
                            <i className="bi bi-hash fs-1 text-muted"></i>
                        </div>
                        <h5 className="mb-3">No posts found with #{tag}</h5>
                        <p className="text-muted small">
                            This hashtag doesn't have any posts yet. Be the first to use it!
                        </p>
                    </Card.Body>
                </Card>
            ) : (
                <div className="posts-container">
                    <Row className="justify-content-center">
                        <Col lg={8} xxl={6}>
                            {posts.map(post => (
                                <div key={post._id} className="post-wrapper mb-4">
                                    <Post 
                                        post={post} 
                                        currentUser={user?.user} 
                                    />
                                </div>
                            ))}
                        </Col>
                    </Row>
                </div>
            )}
        </div>
    );
};

export default HashtagPage;