"use client"

import { useState, useEffect } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { getPost, getUser, likePost, addComment, getComments, savePost, isPostSaved } from "../services/api"
import LoadingSpinner from "../components/LoadingSpinner"
import { formatDistanceToNow } from "date-fns"

const PostPage = ({ user }) => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [post, setPost] = useState(null)
  const [postAuthor, setPostAuthor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [comments, setComments] = useState([])
  const [commentText, setCommentText] = useState("")
  const [commentLoading, setCommentLoading] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)
  const [commentUsers, setCommentUsers] = useState({})

  useEffect(() => {
    const fetchPostData = async () => {
      try {
        setLoading(true)
        const postData = await getPost(id)
        setPost(postData)

        // Fetch post author
        const authorId = postData.userId || postData.user?._id
        if (authorId) {
          const authorData = await getUser(authorId)
          setPostAuthor(authorData)
        }

        // Fetch comments
        const commentsData = await getComments(id)
        setComments(commentsData)

        // Fetch comment users
        const userIds = [...new Set(commentsData.map((comment) => comment.userId))]
        const usersData = {}

        for (const userId of userIds) {
          try {
            const userData = await getUser(userId)
            usersData[userId] = userData
          } catch (err) {
            console.error(`Failed to fetch user ${userId}:`, err)
          }
        }

        setCommentUsers(usersData)

        // Check if post is saved
        if (user && user.user) {
          const savedStatus = await isPostSaved(id, user.user._id)
          setIsSaved(savedStatus)
        }
      } catch (err) {
        console.error("Error fetching post:", err)
        setError("Failed to load post. It may have been deleted or is unavailable.")
      } finally {
        setLoading(false)
      }
    }

    fetchPostData()
  }, [id, user])

  const handleLike = async () => {
    try {
      const updatedPost = await likePost(post._id, user.user._id)
      setPost(updatedPost)
    } catch (err) {
      console.error("Error liking post:", err)
    }
  }

  const handleSave = async () => {
    try {
      setSaveLoading(true)
      await savePost(post._id, user.user._id)
      setIsSaved(!isSaved)
    } catch (err) {
      console.error("Error saving post:", err)
    } finally {
      setSaveLoading(false)
    }
  }

  const handleComment = async (e) => {
    e.preventDefault()
    if (!commentText.trim()) return

    try {
      setCommentLoading(true)
      const updatedPost = await addComment(post._id, user.user._id, commentText)

      // Fetch updated comments
      const updatedComments = await getComments(id)
      setComments(updatedComments)

      // Add current user to comment users if not already there
      if (!commentUsers[user.user._id]) {
        setCommentUsers((prev) => ({
          ...prev,
          [user.user._id]: user.user,
        }))
      }

      setCommentText("")
      setPost(updatedPost)
    } catch (err) {
      console.error("Error adding comment:", err)
    } finally {
      setCommentLoading(false)
    }
  }

  const formatTimestamp = (timestamp) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true })
    } catch (error) {
      return "some time ago"
    }
  }

  if (loading) return <LoadingSpinner />

  if (error) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Post Not Found</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  if (!post) return null

  const isLiked = post.likes?.includes(user?.user?._id)

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Post Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center">
            <Link to={`/profile/${postAuthor?._id}`} className="flex-shrink-0">
              <img
                src={postAuthor?.profilePicture || "https://via.placeholder.com/50"}
                alt={postAuthor ? `${postAuthor.firstname} ${postAuthor.lastname}` : "User"}
                className="w-12 h-12 rounded-full object-cover border-2 border-purple-100"
              />
            </Link>
            <div className="ml-4 flex-1">
              <Link to={`/profile/${postAuthor?._id}`} className="font-semibold text-gray-900 hover:text-purple-700">
                {postAuthor ? `${postAuthor.firstname} ${postAuthor.lastname}` : "Unknown User"}
              </Link>
              <div className="flex items-center text-sm text-gray-500">
                <span>{formatTimestamp(post.createdAt)}</span>
                {postAuthor?.department && (
                  <>
                    <span className="mx-1">•</span>
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full text-xs">
                      {postAuthor.department}
                    </span>
                  </>
                )}
              </div>
            </div>
            <button
              onClick={() => navigate(-1)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Go back"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Post Image */}
        {post.image && (
          <div className="relative bg-gray-100">
            <img
              src={post.image || "/placeholder.svg"}
              alt={post.desc || "Post image"}
              className="w-full max-h-[600px] object-contain"
              onError={(e) => {
                e.target.onerror = null
                e.target.src = "https://via.placeholder.com/800x600?text=Image+Not+Available"
              }}
            />
          </div>
        )}

        {/* Post Content */}
        <div className="p-6">
          {post.desc && <p className="text-gray-800 text-lg mb-4 whitespace-pre-line">{post.desc}</p>}

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {post.tags.map((tag, index) => (
                <Link
                  key={index}
                  to={`/hashtag/${tag.substring(1)}`}
                  className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm hover:bg-purple-200 transition-colors"
                >
                  {tag}
                </Link>
              ))}
            </div>
          )}

          {/* Post Stats */}
          <div className="flex items-center justify-between py-3 border-t border-b border-gray-100 my-4">
            <div className="flex items-center space-x-2">
              <div className="flex -space-x-1">
                <div className="w-7 h-7 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
              <span className="text-sm text-gray-600">
                {post.likes?.length || 0} {post.likes?.length === 1 ? "like" : "likes"}
              </span>
            </div>
            <div className="text-sm text-gray-600">
              {comments.length} {comments.length === 1 ? "comment" : "comments"}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between mb-6">
            <button
              onClick={handleLike}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                isLiked ? "text-pink-600 bg-pink-50 hover:bg-pink-100" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <svg className={`w-5 h-5 ${isLiked ? "fill-current" : "stroke-current fill-none"}`} viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
              <span>{isLiked ? "Liked" : "Like"}</span>
            </button>

            <button
              onClick={() => document.getElementById("comment-input").focus()}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <span>Comment</span>
            </button>

            <button
              onClick={handleSave}
              disabled={saveLoading}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                isSaved ? "text-blue-600 bg-blue-50 hover:bg-blue-100" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {saveLoading ? (
                <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
              ) : (
                <svg
                  className="w-5 h-5"
                  fill={isSaved ? "currentColor" : "none"}
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                  />
                </svg>
              )}
              <span>{isSaved ? "Saved" : "Save"}</span>
            </button>
          </div>

          {/* Comments Section */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Comments</h3>

            {/* Comment Form */}
            <form onSubmit={handleComment} className="mb-6">
              <div className="flex items-start space-x-3">
                <img
                  src={user?.user?.profilePicture || "https://via.placeholder.com/40"}
                  alt={user?.user ? `${user.user.firstname} ${user.user.lastname}` : "User"}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="flex-1 relative">
                  <textarea
                    id="comment-input"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Write a comment..."
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none min-h-[80px]"
                    required
                  />
                  <button
                    type="submit"
                    disabled={commentLoading || !commentText.trim()}
                    className="absolute bottom-3 right-3 p-2 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {commentLoading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </form>

            {/* Comments List */}
            {comments.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                <p className="mt-2 text-gray-600">No comments yet. Be the first to comment!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {comments.map((comment) => {
                  const commentUser = commentUsers[comment.userId] || {}
                  return (
                    <div key={comment._id} className="flex space-x-3">
                      <Link to={`/profile/${comment.userId}`} className="flex-shrink-0">
                        <img
                          src={commentUser.profilePicture || "https://via.placeholder.com/40"}
                          alt={commentUser.firstname ? `${commentUser.firstname} ${commentUser.lastname}` : "User"}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      </Link>
                      <div className="flex-1">
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <Link
                            to={`/profile/${comment.userId}`}
                            className="font-medium text-gray-900 hover:text-purple-700"
                          >
                            {commentUser.firstname
                              ? `${commentUser.firstname} ${commentUser.lastname}`
                              : "Unknown User"}
                          </Link>
                          <p className="text-gray-800 mt-1">{comment.content}</p>
                        </div>
                        <div className="flex items-center mt-1 text-xs text-gray-500">
                          <span>{formatTimestamp(comment.createdAt)}</span>
                          <button className="ml-3 hover:text-purple-700">Like</button>
                          <button className="ml-3 hover:text-purple-700">Reply</button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PostPage
