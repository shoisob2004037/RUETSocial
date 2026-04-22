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

  if (!postUser) return <div className="text-center text-gray-500 py-8">Loading...</div>

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200 mb-4 overflow-hidden">
        {/* Shared Post Indicator */}
        {isShared && sharedBy && (
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center text-sm">
            <svg className="w-4 h-4 mr-2 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            <Link to={`/profile/${sharedBy._id}`} className="text-gray-700 hover:text-blue-600 font-medium">
              {sharedBy.firstname} {sharedBy.lastname}
            </Link>
            <span className="ml-1 text-gray-500">saved this post</span>
          </div>
        )}

        {/* Post Header */}
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={postUser.profilePicture || "https://via.placeholder.com/40"}
              alt={`${postUser.firstname} ${postUser.lastname}`}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <Link to={`/profile/${postUser._id}`} className="font-semibold text-gray-900 hover:text-blue-600 text-sm">
                {postUser.firstname} {postUser.lastname}
              </Link>
              <p className="text-xs text-gray-500 mt-0.5">
                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
              </p>
            </div>
          </div>
          {isOwnPost && !post.virtual && (
            <div className="relative">
              <button className="p-1.5 rounded-full hover:bg-gray-100 transition-colors">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
              <div className="absolute right-0 mt-2 w-36 bg-white shadow-lg rounded-md hidden group-hover:block z-10 border border-gray-200">
                <button
                  onClick={handleEditPost}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Edit
                </button>
                <button
                  onClick={() => setShowDeleteConfirmation(true)}
                  className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                >
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Post Content */}
        <div className="px-4 pb-3">
          <p className="text-gray-800 text-base leading-relaxed whitespace-pre-wrap">
            {customDescription || post.desc}
          </p>
          
          {post.image && (
            <div className="mt-3 -mx-4">
              <img
                src={post.image || "https://via.placeholder.com/500"}
                alt="Post"
                className="w-full h-auto object-cover"
                onError={(e) => (e.target.src = "https://via.placeholder.com/500")}
              />
            </div>
          )}
        </div>

        {/* Post Stats */}
        <div className="px-4 py-2 border-t border-gray-100 flex justify-between text-sm">
          <button
            onClick={handleShowLikers}
            disabled={likesCount === 0}
            className="text-gray-500 hover:text-red-500 disabled:text-gray-300 transition-colors"
          >
            {likesCount} {likesCount === 1 ? 'like' : 'likes'}
          </button>
          <span className="text-gray-500">
            {post.comments?.length || 0} {post.comments?.length === 1 ? 'comment' : 'comments'}
          </span>
        </div>

        {/* Post Actions */}
        <div className="px-4 py-2 border-t border-gray-100 flex gap-1">
          <button
            onClick={handleLike}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors ${
              liked
                ? "text-red-500 bg-red-50 hover:bg-red-100"
                : "text-gray-600 hover:text-red-500 hover:bg-gray-50"
            }`}
          >
            <svg className="w-5 h-5" fill={liked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span>{liked ? "Liked" : "Like"}</span>
          </button>
          
          <button
            onClick={handleLoadComments}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-gray-50 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
            <span>Comment</span>
          </button>
          
          <button
            onClick={handleSavePost}
            disabled={saveLoading}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors ${
              isSaved
                ? "text-blue-600 bg-blue-50 hover:bg-blue-100"
                : "text-gray-600 hover:text-blue-600 hover:bg-gray-50"
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
          <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
            {loading ? (
              <p className="text-center text-gray-500 text-sm py-4">Loading comments...</p>
            ) : comments.length === 0 ? (
              <p className="text-center text-gray-500 text-sm py-4">No comments yet.</p>
            ) : (
              <div className="space-y-3 mb-4">
                {comments.map((comment) => {
                  const commentUser = commentUsers[comment.userId]
                  const isOwnComment = comment.userId === currentUser._id
                  const isPostOwner = post.userId === currentUser._id

                  return (
                    <div key={comment._id} className="flex gap-2">
                      <img
                        src={commentUser?.profilePicture || "https://via.placeholder.com/32"}
                        alt={commentUser?.firstname || "User"}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <div className="bg-white p-2 rounded-md border border-gray-200">
                          <div className="flex justify-between items-start mb-1">
                            <Link
                              to={`/profile/${commentUser?._id}`}
                              className="text-gray-900 font-semibold text-xs hover:underline"
                            >
                              {commentUser ? `${commentUser.firstname} ${commentUser.lastname}` : "User"}
                            </Link>
                            {(isOwnComment || isPostOwner) && (
                              <div className="flex gap-2">
                                {isOwnComment && editingCommentId !== comment._id && (
                                  <button
                                    onClick={() => handleEditComment(comment)}
                                    className="text-gray-500 hover:text-blue-600 text-xs"
                                  >
                                    Edit
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteComment(comment._id)}
                                  className="text-gray-500 hover:text-red-600 text-xs"
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                          {editingCommentId === comment._id ? (
                            <div className="flex gap-2 mt-1">
                              <input
                                value={editedCommentContent}
                                onChange={(e) => setEditedCommentContent(e.target.value)}
                                className="flex-1 p-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
                              />
                              <button
                                onClick={() => handleSaveEditComment(comment._id)}
                                className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingCommentId(null)}
                                className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <p className="text-gray-700 text-sm">{comment.content}</p>
                          )}
                          <p className="text-gray-400 text-xs mt-1">
                            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            
            <form onSubmit={handleAddComment} className="flex items-center gap-2">
              <img
                src={currentUser.profilePicture || "https://via.placeholder.com/32"}
                alt="You"
                className="w-8 h-8 rounded-full object-cover"
              />
              <input
                type="text"
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1 bg-white px-3 py-1.5 rounded-full border border-gray-200 focus:outline-none focus:border-blue-500 text-sm"
              />
              <button
                type="submit"
                className="px-4 py-1.5 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors text-sm font-medium"
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
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm">
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Likes</h3>
              <button
                onClick={() => setShowLikersModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {likers.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No likes yet.</p>
            ) : (
              <ul className="max-h-96 overflow-y-auto">
                {likers.map((liker) => (
                  <li key={liker._id} className="flex items-center p-3 hover:bg-gray-50">
                    <img
                      src={liker.profilePicture || "https://via.placeholder.com/40"}
                      alt={liker.firstname}
                      className="w-10 h-10 rounded-full mr-3 object-cover"
                    />
                    <Link to={`/profile/${liker._id}`} className="text-gray-900 font-medium hover:text-blue-600">
                      {liker.firstname} {liker.lastname}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <div className="p-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowLikersModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm font-medium"
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