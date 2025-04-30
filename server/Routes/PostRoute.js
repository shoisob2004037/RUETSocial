import express from "express"
import {
  createPost,
  deletePost,
  getPost,
  getTimelinePosts,
  likePost,
  updatePost,
  addComment,
  getComments,
  searchPosts,
  getUserPosts,
  getPostLikes,
  getPostsByHashtag,
  getTrendingHashtags,
  editComment,
  deleteComment,
  savePost,
  getSavedPosts,
  isPostSaved,
  getSavedPostsCount,
} from "../Controllers/PostController.js"

const router = express.Router()

// Important: Order matters for routes with similar patterns
// More specific routes should come before more general ones

// Saved posts routes
router.get("/saved/:userId/count", getSavedPostsCount) // Count route must come before the general saved posts route
router.get("/saved/:userId", getSavedPosts)
router.get("/saved/:postId/:userId", isPostSaved)

// Post routes
router.post("/", createPost)
router.get("/:id", getPost)
router.put("/:id", updatePost)
router.delete("/:id", deletePost)
router.put("/:id/like", likePost)
router.get("/:id/timeline", getTimelinePosts)
router.post("/:id/comment", addComment)
router.get("/:id/comments", getComments)
router.post("/:id/save", savePost)
router.post("/search", searchPosts)
router.get("/user/:userId", getUserPosts)
router.get("/:id/likes", getPostLikes)
router.get("/hashtag/:tag", getPostsByHashtag)
router.get("/hashtags/trending", getTrendingHashtags)
router.put("/comment/:commentId", editComment)
router.delete("/comment/:commentId", deleteComment)

export default router
