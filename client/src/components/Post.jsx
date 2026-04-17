"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import {
  likePost,
  addComment,
  getComments,
  getUser,
  deletePost,
  getPostLikes,
  savePost,
  isPostSaved,
  editComment,
  deleteComment,
} from "../services/api"
import { formatDistanceToNow } from "date-fns"
import EditPost from "./EditPost"
import DeleteConfirmation from "./DeleteConfirmation"

const Post = ({ post, currentUser, customDescription, onPostUpdate, onPostDelete, isShared, sharedBy }) => {
  const [liked, setLiked] = useState(post.likes?.includes(currentUser._id))
  const [likesCount, setLikesCount] = useState(post.likes?.length || 0)
  const [comments, setComments] = useState([])
  const [showComments, setShowComments] = useState(false)
  const [newComment, setNewComment] = useState("")
  const [postUser, setPostUser] = useState(post.user || null)
  const [loading, setLoading] = useState(false)
  const [commentUsers, setCommentUsers] = useState({})
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const [showLikersModal, setShowLikersModal] = useState(false)
  const [likers, setLikers] = useState([])
  const [isSaved, setIsSaved] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)
  const [editingCommentId, setEditingCommentId] = useState(null)
  const [editedCommentContent, setEditedCommentContent] = useState("")

  const isOwnPost = (post.user?._id || post.userId) === currentUser._id

  useEffect(() => {
    const fetchPostUser = async () => {
      if (!post.user && post.userId) {
        const userData = await getUser(post.userId)
        setPostUser(userData)
      }
    }

    const checkSavedStatus = async () => {
      const saved = await isPostSaved(post._id, currentUser._id)
      setIsSaved(saved)
    }

    if (!postUser) fetchPostUser()
    checkSavedStatus()
  }, [post.user, post.userId, post._id, currentUser._id])

  const fetchCommentUserData = async (userId) => {
    if (!commentUsers[userId]) {
      const userData = await getUser(userId)
      setCommentUsers((prev) => ({ ...prev, [userId]: userData }))
    }
  }

  const handleLike = async () => {
    await likePost(post._id, currentUser._id)
    setLikesCount(liked ? likesCount - 1 : likesCount + 1)
    setLiked(!liked)
    const updatedLikes = liked ? post.likes.filter((id) => id !== currentUser._id) : [...post.likes, currentUser._id]
    onPostUpdate({ ...post, likes: updatedLikes })
  }

  const handleLoadComments = async () => {
    if (!showComments) {
      setLoading(true)
      const commentsData = await getComments(post._id)
      setComments(commentsData)
      commentsData.forEach((comment) => fetchCommentUserData(comment.userId))
      setShowComments(true)
      setLoading(false)
    } else {
      setShowComments(false)
    }
  }

  const handleAddComment = async (e) => {
    e.preventDefault()
    if (!newComment.trim()) return
    const response = await addComment(post._id, currentUser._id, newComment)
    setComments([...comments, response.comment])
    setNewComment("")
    onPostUpdate({ ...post, comments: [...post.comments, response.comment._id] })
    fetchCommentUserData(currentUser._id)
  }

  const handleEditComment = (comment) => {
    setEditingCommentId(comment._id)
    setEditedCommentContent(comment.content)
  }

  const handleSaveEditComment = async (commentId) => {
    const response = await editComment(commentId, currentUser._id, editedCommentContent)
    setComments(comments.map((c) => (c._id === commentId ? response.comment : c)))
    setEditingCommentId(null)
    setEditedCommentContent("")
  }

  const handleDeleteComment = async (commentId) => {
    if (window.confirm("Are you sure you want to delete this comment?")) {
      await deleteComment(commentId, currentUser._id)
      setComments(comments.filter((c) => c._id !== commentId))
      onPostUpdate({ ...post, comments: post.comments.filter((id) => id !== commentId) })
    }
  }

  const handleEditPost = () => setShowEditModal(true)

  const handleDeletePost = async () => {
    await deletePost(post._id, currentUser._id)
    if (onPostDelete) onPostDelete(post._id)
  }

  const handleShowLikers = async () => {
    const likersData = await getPostLikes(post._id)
    setLikers(likersData)
    setShowLikersModal(true)
  }

  const handleSavePost = async () => {
    setSaveLoading(true)
    await savePost(post._id, currentUser._id)
    setIsSaved(!isSaved)
    setSaveLoading(false)
  }

  if (!postUser) return <div className="text-center text-gray-600 py-8">Loading...</div>

  return (
    <>
      <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden">
        {/* Shared Post Indicator */}
        {isShared && sharedBy && (
          <div className="px-5 pt-4 pb-2 bg-gradient-to-r from-teal-50 to-green-50 border-b border-teal-100 flex items-center">
            <svg className="w-4 h-4 mr-2 text-teal-700" fill="currentColor" viewBox="0 0 24 24">
              <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            <Link to={`/profile/${sharedBy._id}`} className="text-teal-700 hover:underline font-semibold text-sm">
              {sharedBy.firstname} {sharedBy.lastname}
            </Link>
            <span className="ml-2 text-gray-600 text-sm">saved this post</span>
          </div>
        )}

        {/* Post Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-teal-600 to-green-700 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img
                src={postUser.profilePicture || "https://via.placeholder.com/50"}
                alt={`${postUser.firstname} ${postUser.lastname}`}
                className="w-14 h-14 rounded-full object-cover border-3 border-white shadow-md"
              />
              <div>
                <Link to={`/profile/${postUser._id}`} className="text-white font-bold text-lg hover:text-gray-100 transition-colors">
                  {postUser.firstname} {postUser.lastname}
                </Link>
                <p className="text-teal-100 text-xs mt-1 font-medium">
                  {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>
            {isOwnPost && !post.virtual && (
              <div className="relative group">
                <button className="text-white hover:text-gray-100 p-2 rounded-full hover:bg-white hover:bg-opacity-20 transition-all">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>
                <div className="absolute right-0 mt-2 w-40 bg-white shadow-xl rounded-lg hidden group-hover:block z-10">
                  <button
                    onClick={handleEditPost}
                    className="block w-full text-left px-4 py-3 text-gray-700 hover:bg-teal-50 hover:text-teal-700 transition-colors font-medium text-sm border-b border-gray-100"
                  >
                    ✏️ Edit Post
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirmation(true)}
                    className="block w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors font-medium text-sm"
                  >
                    🗑️ Delete Post
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Post Content - ENHANCED */}
        <div className="px-6 py-6 bg-white">
          {/* Post Description/Caption - LARGER & BOLDER */}
          <p className="text-gray-800 text-lg leading-relaxed font-semibold mb-5 whitespace-pre-wrap">
            {customDescription || post.desc}
          </p>
          
          {/* Post Image */}
          {post.image && (
            <div className="mt-4 -mx-6 mb-0">
              <img
                src={post.image || "https://via.placeholder.com/500"}
                alt="Post"
                className="w-full h-auto object-cover"
                onError={(e) => (e.target.src = "https://via.placeholder.com/500")}
              />
            </div>
          )}
        </div>

        {/* Post Stats Bar */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between text-sm">
            <button
              onClick={handleShowLikers}
              disabled={likesCount === 0}
              className="text-gray-600 hover:text-teal-700 disabled:text-gray-400 font-medium transition-colors"
            >
              ❤️ {likesCount} {likesCount === 1 ? 'like' : 'likes'}
            </button>
            <span className="text-gray-600 font-medium">
              💬 {post.comments?.length || 0} {post.comments?.length === 1 ? 'comment' : 'comments'}
            </span>
          </div>
        </div>

        {/* Post Actions */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between gap-2">
          <button
            onClick={handleLike}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-semibold transition-all duration-200 ${
              liked
                ? "bg-red-100 text-red-600 hover:bg-red-200"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <svg className="w-5 h-5" fill={liked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span>{liked ? "Liked" : "Like"}</span>
          </button>
          
          <button
            onClick={handleLoadComments}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
            <span>Comment</span>
          </button>
          
          <button
            onClick={handleSavePost}
            disabled={saveLoading}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-semibold transition-all duration-200 ${
              isSaved
                ? "bg-teal-100 text-teal-700 hover:bg-teal-200"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <svg className="w-5 h-5" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            <span>{isSaved ? "Saved" : "Save"}</span>
          </button>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="px-6 pb-6 pt-4 border-t border-gray-200 bg-gray-50">
            {loading ? (
              <p className="text-center text-gray-600 text-sm py-4">Loading comments...</p>
            ) : comments.length === 0 ? (
              <p className="text-center text-gray-600 text-sm py-4">No comments yet. Be the first!</p>
            ) : (
              <div className="space-y-4 mb-5">
                {comments.map((comment) => {
                  const commentUser = commentUsers[comment.userId]
                  const isOwnComment = comment.userId === currentUser._id
                  const isPostOwner = post.userId === currentUser._id

                  return (
                    <div key={comment._id} className="flex gap-3">
                      <img
                        src={commentUser?.profilePicture || "https://via.placeholder.com/32"}
                        alt={commentUser?.firstname || "User"}
                        className="w-9 h-9 rounded-full mt-0.5 object-cover"
                      />
                      <div className="flex-1">
                        <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                          <div className="flex justify-between items-start mb-2">
                            <Link
                              to={`/profile/${commentUser?._id}`}
                              className="text-gray-800 font-bold text-sm hover:underline"
                            >
                              {commentUser ? `${commentUser.firstname} ${commentUser.lastname}` : "User"}
                            </Link>
                            {(isOwnComment || isPostOwner) && (
                              <div className="flex gap-2">
                                {isOwnComment && editingCommentId !== comment._id && (
                                  <button
                                    onClick={() => handleEditComment(comment)}
                                    className="text-teal-700 hover:text-teal-800 text-xs font-semibold hover:underline"
                                  >
                                    Edit
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteComment(comment._id)}
                                  className="text-red-600 hover:text-red-700 text-xs font-semibold hover:underline"
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                          {editingCommentId === comment._id ? (
                            <div className="flex gap-2">
                              <input
                                value={editedCommentContent}
                                onChange={(e) => setEditedCommentContent(e.target.value)}
                                className="flex-1 p-2 border border-teal-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                              />
                              <button
                                onClick={() => handleSaveEditComment(comment._id)}
                                className="px-3 py-1 bg-teal-600 text-white text-xs font-semibold rounded-lg hover:bg-teal-700 transition-colors"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingCommentId(null)}
                                className="px-3 py-1 bg-gray-300 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-400 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <p className="text-gray-700 text-sm font-medium">{comment.content}</p>
                          )}
                          <p className="text-gray-500 text-xs mt-2 font-medium">
                            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            
            {/* Add Comment Form */}
            <form onSubmit={handleAddComment} className="flex items-center gap-3 bg-white p-3 rounded-lg border border-gray-200">
              <img
                src={currentUser.profilePicture || "https://via.placeholder.com/32"}
                alt="You"
                className="w-9 h-9 rounded-full object-cover"
              />
              <input
                type="text"
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1 bg-gray-100 px-4 py-2 rounded-full focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm font-medium"
              />
              <button
                type="submit"
                className="px-5 py-2 bg-gradient-to-r from-teal-600 to-green-700 text-white rounded-full hover:from-teal-700 hover:to-green-800 transition-all font-bold text-sm"
              >
                Post
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Edit Post Modal */}
      {showEditModal && (
        <EditPost
          show={showEditModal}
          onHide={() => setShowEditModal(false)}
          post={post}
          currentUser={currentUser}
          onPostUpdate={onPostUpdate}
        />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmation
        show={showDeleteConfirmation}
        onHide={() => setShowDeleteConfirmation(false)}
        onConfirm={handleDeletePost}
        title="Delete Post"
        message="Are you sure you want to delete this post? This action cannot be undone."
      />

      {/* Likers Modal */}
      {showLikersModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-2xl font-bold text-gray-800">❤️ Who Liked This</h3>
              <button
                onClick={() => setShowLikersModal(false)}
                className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {likers.length === 0 ? (
              <p className="text-center text-gray-600 text-sm py-8">No likes yet.</p>
            ) : (
              <ul className="space-y-3 max-h-96 overflow-y-auto">
                {likers.map((liker) => (
                  <li key={liker._id} className="flex items-center p-3 hover:bg-gray-50 rounded-lg transition-colors">
                    <img
                      src={liker.profilePicture || "https://via.placeholder.com/40"}
                      alt={liker.firstname}
                      className="w-10 h-10 rounded-full mr-3 object-cover"
                    />
                    <Link to={`/profile/${liker._id}`} className="text-gray-800 hover:text-teal-700 font-bold transition-colors">
                      {liker.firstname} {liker.lastname}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setShowLikersModal(false)}
                className="px-5 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Post