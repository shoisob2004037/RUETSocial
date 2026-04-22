import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getPostsByHashtag } from '../services/api';
import Post from '../components/Post';
import LoadingSpinner from '../components/LoadingSpinner';

const HashtagPage = ({ user }) => {
    const { tag } = useParams();
    const navigate = useNavigate();
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

    if (loading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center">
                <LoadingSpinner />
                <p className="text-gray-500 mt-3 text-sm">Loading posts...</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
            {/* Header */}
            <div className="bg-white rounded-lg border border-gray-200 mb-6 overflow-hidden">
                <div className="px-6 py-8 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 rounded-full mb-4">
                        <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                        </svg>
                    </div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                        <span className="text-blue-500">#</span>{tag}
                    </h1>
                    <div className="flex items-center justify-center gap-2">
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-sm font-medium">
                            {posts.length} {posts.length === 1 ? 'post' : 'posts'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Error State */}
            {error && (
                <div className="bg-white rounded-lg border border-red-200 p-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-red-50 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <p className="text-red-600 font-medium mb-4">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm font-medium"
                    >
                        Try Again
                    </button>
                </div>
            )}

            {/* Empty State */}
            {!error && posts.length === 0 && (
                <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                    <svg className="w-20 h-20 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                    </svg>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">No posts found</h3>
                    <p className="text-gray-500 text-sm">
                        No posts have been tagged with <span className="font-medium text-blue-600">#{tag}</span> yet.
                        <br />
                        Be the first to use this hashtag!
                    </p>
                    <button
                        onClick={() => navigate('/')}
                        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm font-medium"
                    >
                        Go to Feed
                    </button>
                </div>
            )}

            {/* Posts Feed */}
            {!error && posts.length > 0 && (
                <div className="space-y-4">
                    {posts.map((post) => (
                        <Post
                            key={post._id}
                            post={post}
                            currentUser={user?.user}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default HashtagPage;