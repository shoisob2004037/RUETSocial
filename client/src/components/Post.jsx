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

  if (!postUser) return <div className="text-center text-gray-600">Loading...</div>

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 mb-6">
        {/* Shared Post Indicator */}
        {isShared && sharedBy && (
          <div className="px-4 pt-3 text-sm text-gray-500 flex items-center">
            <svg className="w-4 h-4 mr-2 text-teal-700" fill="currentColor" viewBox="0 0 24 24">
              <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            <Link to={`/profile/${sharedBy._id}`} className="text-teal-700 hover:underline">
              <strong>{sharedBy.firstname} {sharedBy.lastname}</strong>
            </Link>
            <span className="ml-1">saved this post</span>
          </div>
        )}

        {/* Post Header */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-l from-teal-600 to-green-800 text-white rounded-t-lg">
          <div className="flex items-center">
            <img
              src={postUser.profilePicture || "https://via.placeholder.com/40"}
              alt={`${postUser.firstname} ${postUser.lastname}`}
              className="w-10 h-10 rounded-full mr-3 object-cover"
            />
            <div>
              <Link to={`/profile/${postUser._id}`} className="text-white font-medium hover:underline">
                {postUser.firstname} {postUser.lastname}
              </Link>
              <p className="text-gray-200 text-xs">
                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
              </p>
            </div>
          </div>
          {isOwnPost && !post.virtual && (
            <div className="relative group">
              <button className="text-white hover:text-gray-200 p-1 rounded-full hover:bg-green-800">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
              <div className="absolute right-0 mt-2 w-36 bg-white shadow-lg rounded-lg hidden group-hover:block z-10">
                <button
                  onClick={handleEditPost}
                  className="block w-full text-left px-3 py-2 text-gray-700 hover:bg-teal-100 hover:text-teal-700 transition-colors duration-200"
                >
                  Edit Post
                </button>
                <button
                  onClick={() => setShowDeleteConfirmation(true)}
                  className="block w-full text-left px-3 py-2 text-red-600 hover:bg-red-100 hover:text-red-700 transition-colors duration-200"
                >
                  Delete Post
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Post Content */}
        <div className="p-4 bg-gray-50">
          <p className="text-gray-800 text-base">{customDescription || post.desc}</p>
          {post.image && (
            <div className="mt-3">
              <img
                src={post.image || "https://via.placeholder.com/500"}
                alt="Post"
                className="w-full max-h-auto object-cover rounded-lg"
                onError={(e) => (e.target.src = "https://via.placeholder.com/500")}
              />
            </div>
          )}
        </div>

        {/* Post Actions */}
        <div className="flex justify-between items-center px-4 py-3 border-t border-gray-200">
          <div className="flex items-center gap-3">
            <button
              onClick={handleLike}
              className={`flex items-center gap-1 ${liked ? "text-red-500" : "text-gray-600"} hover:text-red-500 transition-colors duration-200`}
            >
              <svg className="w-5 h-5" fill={liked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span className="text-sm">{likesCount}</span>
            </button>
            <button
              onClick={handleShowLikers}
              disabled={likesCount === 0}
              className="text-gray-600 hover:text-teal-700 disabled:text-gray-400 text-sm"
            >
              View
            </button>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleLoadComments}
              className="flex items-center gap-1 text-gray-600 hover:text-teal-700 transition-colors duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
              <span className="text-sm">{post.comments?.length || 0}</span>
            </button>
            <button
              onClick={handleSavePost}
              disabled={saveLoading}
              className={`flex items-center gap-1 ${isSaved ? "text-teal-700" : "text-gray-600"} hover:text-teal-700 transition-colors duration-200`}
            >
              <svg className="w-5 h-5" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              <span className="text-sm">{isSaved ? "Saved" : "Save"}</span>
            </button>
          </div>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="px-4 pb-4 border-t border-gray-200 bg-gray-50">
            {loading ? (
              <p className="text-center text-gray-600 text-sm">Loading comments...</p>
            ) : comments.length === 0 ? (
              <p className="text-center text-gray-600 text-sm">No comments yet. Be the first to comment!</p>
            ) : (
              <div className="space-y-2 mt-3">
                {comments.map((comment) => {
                  const commentUser = commentUsers[comment.userId]
                  const isOwnComment = comment.userId === currentUser._id
                  const isPostOwner = post.userId === currentUser._id

                  return (
                    <div key={comment._id} className="flex gap-2">
                      <img
                        src={commentUser?.profilePicture || "https://via.placeholder.com/32"}
                        alt={commentUser?.firstname || "User"}
                        className="w-8 h-8 rounded-full mt-1"
                      />
                      <div className="flex-1 bg-white p-2 rounded-lg shadow-sm">
                        <div className="flex justify-between items-center">
                          <Link
                            to={`/profile/${commentUser?._id}`}
                            className="text-gray-800 font-medium text-sm hover:underline"
                          >
                            {commentUser ? `${commentUser.firstname} ${commentUser.lastname}` : "User"}
                          </Link>
                          {(isOwnComment || isPostOwner) && (
                            <div className="flex gap-2">
                              {isOwnComment && editingCommentId !== comment._id && (
                                <button
                                  onClick={() => handleEditComment(comment)}
                                  className="text-teal-700 hover:text-teal-800 text-xs"
                                >
                                  Edit
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteComment(comment._id)}
                                className="text-red-600 hover:text-red-700 text-xs"
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
                              className="flex-1 p-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-700 text-sm"
                            />
                            <button
                              onClick={() => handleSaveEditComment(comment._id)}
                              className="text-xs text-teal-700 hover:text-teal-800"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingCommentId(null)}
                              className="text-xs text-gray-500 hover:text-gray-600"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <p className="text-gray-700 text-sm">{comment.content}</p>
                        )}
                        <p className="text-gray-500 text-xs mt-1">
                          {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            <form onSubmit={handleAddComment} className="mt-3 flex items-center gap-2">
              <img
                src={currentUser.profilePicture || "https://via.placeholder.com/32"}
                alt="You"
                className="w-8 h-8 rounded-full"
              />
              <input
                type="text"
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700 text-sm"
              />
              <button
                type="submit"
                className="px-3 py-1 bg-gradient-to-r from-teal-700 to-green-900 text-white rounded-lg hover:from-teal-800 hover:to-green-950 transition-colors duration-200 text-sm"
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
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-md w-full max-w-sm p-5">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold text-gray-800">Who Liked This Post</h3>
              <button
                onClick={() => setShowLikersModal(false)}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {likers.length === 0 ? (
              <p className="text-center text-gray-600 text-sm">No likes yet.</p>
            ) : (
              <ul className="space-y-2">
                {likers.map((liker) => (
                  <li key={liker._id} className="flex items-center">
                    <img
                      src={liker.profilePicture || "https://via.placeholder.com/40"}
                      alt={liker.firstname}
                      className="w-8 h-8 rounded-full mr-2"
                    />
                    <Link to={`/profile/${liker._id}`} className="text-gray-800 hover:underline text-sm">
                      {liker.firstname} {liker.lastname}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowLikersModal(false)}
                className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200 text-sm"
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