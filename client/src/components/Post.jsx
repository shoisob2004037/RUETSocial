"use client";

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Heart,
  MessageCircle,
  Bookmark,
  MoreHorizontal,
  Send,
  X,
  Edit2,
  Trash2,
} from "lucide-react";
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
} from "../services/api";
import { formatDistanceToNow } from "date-fns";
import EditPost from "./EditPost";
import DeleteConfirmation from "./DeleteConfirmation";

const Post = ({
  post,
  currentUser,
  customDescription,
  onPostUpdate,
  onPostDelete,
  isShared,
  sharedBy,
}) => {
  const [liked, setLiked] = useState(post.likes?.includes(currentUser._id));
  const [likesCount, setLikesCount] = useState(post.likes?.length || 0);
  const [comments, setComments] = useState([]);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [postUser, setPostUser] = useState(post.user || null);
  const [loading, setLoading] = useState(false);
  const [commentUsers, setCommentUsers] = useState({});
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [showLikersModal, setShowLikersModal] = useState(false);
  const [likers, setLikers] = useState([]);
  const [isSaved, setIsSaved] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editedCommentContent, setEditedCommentContent] = useState("");
  const [showPostOptions, setShowPostOptions] = useState(false);
  const [likeBurst, setLikeBurst] = useState(false);

  const isOwnPost = (post.user?._id || post.userId) === currentUser._id;

  useEffect(() => {
    const fetchPostUser = async () => {
      if (!post.user && post.userId) {
        const userData = await getUser(post.userId);
        setPostUser(userData);
      }
    };

    const checkSavedStatus = async () => {
      const saved = await isPostSaved(post._id, currentUser._id);
      setIsSaved(saved);
    };

    if (!postUser) fetchPostUser();
    checkSavedStatus();
  }, [post.user, post.userId, post._id, currentUser._id]);

  const fetchCommentUserData = async (userId) => {
    if (!commentUsers[userId]) {
      const userData = await getUser(userId);
      setCommentUsers((prev) => ({ ...prev, [userId]: userData }));
    }
  };

  const handleLike = async () => {
    await likePost(post._id, currentUser._id);
    setLikesCount(liked ? likesCount - 1 : likesCount + 1);
    setLiked(!liked);
    if (!liked) {
      setLikeBurst(true);
      setTimeout(() => setLikeBurst(false), 500);
    }
    const updatedLikes = liked
      ? post.likes.filter((id) => id !== currentUser._id)
      : [...post.likes, currentUser._id];
    onPostUpdate({ ...post, likes: updatedLikes });
  };

  const handleLoadComments = async () => {
    if (!showComments) {
      setLoading(true);
      const commentsData = await getComments(post._id);
      setComments(commentsData);
      commentsData.forEach((c) => fetchCommentUserData(c.userId));
      setShowComments(true);
      setLoading(false);
    } else {
      setShowComments(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    const response = await addComment(post._id, currentUser._id, newComment);
    setComments([...comments, response.comment]);
    setNewComment("");
    onPostUpdate({
      ...post,
      comments: [...post.comments, response.comment._id],
    });
    fetchCommentUserData(currentUser._id);
  };

  const handleEditComment = (c) => {
    setEditingCommentId(c._id);
    setEditedCommentContent(c.content);
  };

  const handleSaveEditComment = async (commentId) => {
    const response = await editComment(
      commentId,
      currentUser._id,
      editedCommentContent
    );
    setComments(
      comments.map((c) => (c._id === commentId ? response.comment : c))
    );
    setEditingCommentId(null);
    setEditedCommentContent("");
  };

  const handleDeleteComment = async (commentId) => {
    if (window.confirm("Delete this comment?")) {
      await deleteComment(commentId, currentUser._id);
      setComments(comments.filter((c) => c._id !== commentId));
      onPostUpdate({
        ...post,
        comments: post.comments.filter((id) => id !== commentId),
      });
    }
  };

  const handleEditPost = () => setShowEditModal(true);

  const handleDeletePost = async () => {
    await deletePost(post._id, currentUser._id);
    if (onPostDelete) onPostDelete(post._id);
  };

  const handleShowLikers = async () => {
    const data = await getPostLikes(post._id);
    setLikers(data);
    setShowLikersModal(true);
  };

  const handleSavePost = async () => {
    setSaveLoading(true);
    await savePost(post._id, currentUser._id);
    setIsSaved(!isSaved);
    setSaveLoading(false);
  };

  if (!postUser)
    return (
      <div className="text-center text-gray-500 py-8 text-sm">Loading…</div>
    );

  return (
    <>
      <article className="post-card-modern bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow mb-5 overflow-hidden">
        {/* Shared indicator */}
        {isShared && sharedBy && (
          <div className="px-4 sm:px-5 py-2 bg-purple-50 border-b border-purple-100 flex items-center text-xs sm:text-sm">
            <Bookmark className="w-4 h-4 mr-2 text-purple-500" />
            <Link
              to={`/profile/${sharedBy._id}`}
              className="text-purple-700 hover:underline font-medium"
            >
              {sharedBy.firstname} {sharedBy.lastname}
            </Link>
            <span className="ml-1 text-gray-500">saved this post</span>
          </div>
        )}

        {/* Header */}
        <header className="px-4 sm:px-5 pt-4 pb-3 flex items-center justify-between gap-3">
          <Link
            to={`/profile/${postUser._id}`}
            className="flex items-center gap-3 min-w-0 group no-underline"
          >
            <img
              src={postUser.profilePicture || "https://via.placeholder.com/44"}
              alt={`${postUser.firstname}`}
              className="w-11 h-11 rounded-full object-cover ring-2 ring-white shadow-sm"
            />
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 text-sm group-hover:text-purple-600 transition-colors truncate m-0">
                {postUser.firstname} {postUser.lastname}
              </p>
              <p className="text-xs text-gray-500 mt-0.5 m-0 flex items-center gap-1.5">
                {postUser.department && (
                  <span className="bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded text-[10px] font-medium">
                    {postUser.department}
                  </span>
                )}
                <span>·</span>
                {formatDistanceToNow(new Date(post.createdAt), {
                  addSuffix: true,
                })}
              </p>
            </div>
          </Link>

          {isOwnPost && !post.virtual && (
            <div className="relative shrink-0">
              <button
                onClick={() => setShowPostOptions((p) => !p)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Post options"
              >
                <MoreHorizontal className="w-5 h-5 text-gray-500" />
              </button>
              {showPostOptions && (
                <div className="absolute right-0 mt-2 w-40 bg-white shadow-xl rounded-xl z-10 border border-gray-100 overflow-hidden">
                  <button
                    onClick={() => {
                      handleEditPost();
                      setShowPostOptions(false);
                    }}
                    className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Edit2 className="w-4 h-4" /> Edit
                  </button>
                  <button
                    onClick={() => {
                      setShowDeleteConfirmation(true);
                      setShowPostOptions(false);
                    }}
                    className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </header>

        {/* Content */}
        <div className="px-4 sm:px-5 pb-3">
          {(customDescription || post.desc) && (
            <p className="text-gray-800 text-[15px] leading-relaxed whitespace-pre-wrap m-0">
              {customDescription || post.desc}
            </p>
          )}
        </div>
        {post.image && (
          <div className="bg-black/5">
            <img
              src={post.image}
              alt="Post"
              className="w-full max-h-[640px] object-cover"
              onError={(e) =>
                (e.target.src = "https://via.placeholder.com/500")
              }
            />
          </div>
        )}

        {/* Stats */}
        <div className="px-4 sm:px-5 pt-3 pb-1 flex justify-between text-xs sm:text-sm text-gray-500">
          <button
            onClick={handleShowLikers}
            disabled={likesCount === 0}
            className="flex items-center gap-1.5 hover:text-red-500 disabled:opacity-50 transition-colors"
          >
            <span className="w-5 h-5 inline-flex items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-red-500 text-white text-[10px]">
              <Heart className="w-3 h-3 fill-current" />
            </span>
            {likesCount} {likesCount === 1 ? "like" : "likes"}
          </button>
          <span>
            {post.comments?.length || 0}{" "}
            {post.comments?.length === 1 ? "comment" : "comments"}
          </span>
        </div>

        {/* Actions */}
        <div className="mx-4 sm:mx-5 my-2 border-t border-gray-100 pt-1.5 grid grid-cols-3 gap-1">
          <button
            onClick={handleLike}
            className={`relative flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
              liked
                ? "text-red-500 bg-red-50 hover:bg-red-100"
                : "text-gray-600 hover:text-red-500 hover:bg-gray-50"
            }`}
          >
            <Heart
              className={`w-5 h-5 transition-transform ${
                liked ? "fill-current scale-110" : ""
              } ${likeBurst ? "animate-ping-once" : ""}`}
            />
            <span className="hidden sm:inline">{liked ? "Liked" : "Like"}</span>
          </button>

          <button
            onClick={handleLoadComments}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
              showComments
                ? "text-blue-600 bg-blue-50"
                : "text-gray-600 hover:text-blue-600 hover:bg-gray-50"
            }`}
          >
            <MessageCircle className="w-5 h-5" />
            <span className="hidden sm:inline">Comment</span>
          </button>

          <button
            onClick={handleSavePost}
            disabled={saveLoading}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
              isSaved
                ? "text-purple-600 bg-purple-50 hover:bg-purple-100"
                : "text-gray-600 hover:text-purple-600 hover:bg-gray-50"
            }`}
          >
            <Bookmark
              className={`w-5 h-5 ${isSaved ? "fill-current" : ""}`}
            />
            <span className="hidden sm:inline">
              {isSaved ? "Saved" : "Save"}
            </span>
          </button>
        </div>

        {/* Comments */}
        {showComments && (
          <div className="px-4 sm:px-5 py-3 border-t border-gray-100 bg-gray-50/60">
            {loading ? (
              <p className="text-center text-gray-500 text-sm py-4">
                Loading comments…
              </p>
            ) : comments.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-4">
                Be the first to comment ✨
              </p>
            ) : (
              <div className="space-y-3 mb-4">
                {comments.map((comment) => {
                  const cu = commentUsers[comment.userId];
                  const isOwnComment = comment.userId === currentUser._id;
                  const isPostOwner = post.userId === currentUser._id;
                  return (
                    <div key={comment._id} className="flex gap-2.5">
                      <img
                        src={
                          cu?.profilePicture ||
                          "https://via.placeholder.com/32"
                        }
                        alt=""
                        className="w-8 h-8 rounded-full object-cover shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="bg-white px-3 py-2 rounded-2xl border border-gray-100">
                          <div className="flex justify-between items-start gap-2 mb-0.5">
                            <Link
                              to={`/profile/${cu?._id}`}
                              className="text-gray-900 font-semibold text-xs hover:underline truncate"
                            >
                              {cu
                                ? `${cu.firstname} ${cu.lastname}`
                                : "User"}
                            </Link>
                            {(isOwnComment || isPostOwner) && (
                              <div className="flex gap-2 shrink-0">
                                {isOwnComment &&
                                  editingCommentId !== comment._id && (
                                    <button
                                      onClick={() =>
                                        handleEditComment(comment)
                                      }
                                      className="text-gray-400 hover:text-blue-600 text-xs"
                                    >
                                      Edit
                                    </button>
                                  )}
                                <button
                                  onClick={() =>
                                    handleDeleteComment(comment._id)
                                  }
                                  className="text-gray-400 hover:text-red-600 text-xs"
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
                                onChange={(e) =>
                                  setEditedCommentContent(e.target.value)
                                }
                                className="flex-1 px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                              />
                              <button
                                onClick={() =>
                                  handleSaveEditComment(comment._id)
                                }
                                className="px-3 py-1 bg-blue-500 text-white text-xs rounded-lg hover:bg-blue-600"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingCommentId(null)}
                                className="px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded-lg hover:bg-gray-300"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <p className="text-gray-800 text-sm leading-snug m-0 break-words">
                              {comment.content}
                            </p>
                          )}
                        </div>
                        <p className="text-gray-400 text-[11px] mt-1 ml-2">
                          {formatDistanceToNow(new Date(comment.createdAt), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <form
              onSubmit={handleAddComment}
              className="flex items-center gap-2"
            >
              <img
                src={
                  currentUser.profilePicture ||
                  "https://via.placeholder.com/32"
                }
                alt="You"
                className="w-8 h-8 rounded-full object-cover shrink-0"
              />
              <div className="flex-1 flex items-center bg-white border border-gray-200 rounded-full pl-4 pr-1 py-1 focus-within:border-purple-400 focus-within:ring-2 focus-within:ring-purple-100">
                <input
                  type="text"
                  placeholder="Write a comment…"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="flex-1 bg-transparent border-none outline-none text-sm"
                />
                <button
                  type="submit"
                  disabled={!newComment.trim()}
                  className="w-8 h-8 rounded-full inline-flex items-center justify-center text-white disabled:opacity-40 transition"
                  style={{
                    background: "linear-gradient(135deg,#7c3aed,#4f46e5)",
                  }}
                  aria-label="Send"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        )}
      </article>

      {showEditModal && (
        <EditPost
          show={showEditModal}
          onHide={() => setShowEditModal(false)}
          post={post}
          currentUser={currentUser}
          onPostUpdate={onPostUpdate}
        />
      )}

      <DeleteConfirmation
        show={showDeleteConfirmation}
        onHide={() => setShowDeleteConfirmation(false)}
        onConfirm={handleDeletePost}
        title="Delete Post"
        message="Are you sure you want to delete this post? This action cannot be undone."
      />

      {showLikersModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 m-0">Likes</h3>
              <button
                onClick={() => setShowLikersModal(false)}
                className="text-gray-400 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {likers.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No likes yet.</p>
            ) : (
              <ul className="max-h-96 overflow-y-auto list-none p-0 m-0">
                {likers.map((liker) => (
                  <li
                    key={liker._id}
                    className="flex items-center p-3 hover:bg-gray-50"
                  >
                    <img
                      src={
                        liker.profilePicture ||
                        "https://via.placeholder.com/40"
                      }
                      alt=""
                      className="w-10 h-10 rounded-full mr-3 object-cover"
                    />
                    <Link
                      to={`/profile/${liker._id}`}
                      className="text-gray-900 font-medium hover:text-purple-600 no-underline"
                    >
                      {liker.firstname} {liker.lastname}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Post;
