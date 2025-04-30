import PostModel from "../Models/postModel.js"
import mongoose from "mongoose"
import UserModel from "../Models/userModel.js"
import CommentModel from "../Models/commentModel.js"
import NotificationModel from "../Models/notificationModel.js"
import SavedPostModel from "../Models/savedPostModel.js"

const createNotification = async (recipientId, senderId, type, postId = null) => {
  try {
    console.log(
      `Creating notification in PostController: recipient=${recipientId}, sender=${senderId}, type=${type}, postId=${postId}`,
    )

    const notificationData = {
      recipient: recipientId,
      sender: senderId,
      type,
    }

    // Only add post field if it's provided and not null
    if (postId) {
      notificationData.post = postId
    }

    const notification = new NotificationModel(notificationData)

    const savedNotification = await notification.save()
    console.log("Notification created successfully in PostController:", savedNotification)
    return savedNotification
  } catch (error) {
    console.error("Error creating notification in PostController:", error)
    return null
  }
}

// Keep all your existing functions, but modify likePost and addComment:

export const likePost = async (req, res) => {
  const id = req.params.id
  const { userId } = req.body

  try {
    const post = await PostModel.findById(id)
    if (!post) {
      return res.status(404).json({ message: "Post not found" })
    }

    if (!post.likes.includes(userId)) {
      await post.updateOne({ $push: { likes: userId } })

      // Create notification if the post owner is not the same as the liker
      if (post.userId !== userId) {
        console.log(`Creating like notification: from ${userId} to ${post.userId} for post ${post._id}`)
        try {
          await createNotification(post.userId, userId, "like", post._id)
          console.log("Like notification created successfully")
        } catch (notifError) {
          console.error("Failed to create like notification:", notifError)
        }
      }

      res.status(200).json("Post Liked Successfully")
    } else {
      await post.updateOne({ $pull: { likes: userId } })
      res.status(200).json("Post unliked Successfully")
    }
  } catch (error) {
    console.error("Error in likePost:", error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

export const addComment = async (req, res) => {
  const postId = req.params.id
  const { userId, content } = req.body

  try {
    // Validate inputs
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ message: "Invalid post ID format" })
    }
    if (!userId || typeof userId !== "string") {
      return res.status(400).json({ message: "Invalid user ID format" })
    }
    if (!content || content.trim() === "") {
      return res.status(400).json({ message: "Comment content is required" })
    }

    // Find the post
    const post = await PostModel.findById(postId)
    if (!post) {
      return res.status(404).json({ message: "Post not found" })
    }

    // Create a new comment in the comments collection
    const newComment = new CommentModel({
      userId,
      postId,
      content,
    })
    await newComment.save()

    // Add the comment ID to the post's comments array
    await post.updateOne({ $push: { comments: newComment._id } })

    // Create notification if the post owner is not the same as the commenter
    if (post.userId !== userId) {
      console.log(`Creating comment notification: from ${userId} to ${post.userId} for post ${post._id}`)
      try {
        await createNotification(post.userId, userId, "comment", post._id)
        console.log("Comment notification created successfully")
      } catch (notifError) {
        console.error("Failed to create comment notification:", notifError)
      }
    }

    res.status(200).json({ message: "Comment added successfully", comment: newComment })
  } catch (error) {
    console.error("Error in addComment:", error)
    res.status(500).json({ message: "Server error while adding comment", error: error.message })
  }
}

export const createPost = async (req, res) => {
  const { desc } = req.body
  const tags = desc?.match(/#\w+/g) || [] // Extract hashtags

  try {
    const newPost = new PostModel({
      ...req.body,
      tags: tags.map((tag) => tag.toLowerCase()), // Store lowercase
    })

    await newPost.save()
    res.status(200).json("Post Created!")
  } catch (error) {
    res.status(500).json(error)
  }
}

export const getPostsByHashtag = async (req, res) => {
  const { tag } = req.params

  try {
    // Remove # if present and prepare for regex
    const cleanTag = tag.replace(/^#/, "").trim()
    const regexPattern = new RegExp(`#${cleanTag}\\b`, "i") // \b for word boundary

    const posts = await PostModel.find({
      $or: [
        { tags: { $regex: regexPattern } }, // Search in tags array
        { "tags.g": { $regex: regexPattern } }, // Your specific structure
        { desc: { $regex: regexPattern } }, // New: Search in description
      ],
    })
      .sort({ createdAt: -1 })
      .populate("userId", "firstname lastname profilePicture")

    res.status(200).json(posts)
  } catch (error) {
    console.error("Hashtag search error:", {
      tag,
      error: error.message,
      stack: error.stack,
    })
    res.status(500).json({
      message: "Error fetching posts",
      error: error.message,
    })
  }
}
// New controller for trending hashtags
export const getTrendingHashtags = async (req, res) => {
  try {
    const result = await PostModel.aggregate([
      { $unwind: "$tags" },
      {
        $group: {
          _id: "$tags",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ])

    res.status(200).json(result)
  } catch (error) {
    res.status(500).json(error)
  }
}
export const getPost = async (req, res) => {
  const id = req.params.id

  try {
    // Validate post ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid post ID format" })
    }

    // Find the post and populate the comments field
    const post = await PostModel.findById(id).populate("comments")
    if (!post) {
      return res.status(404).json({ message: "Post not found" })
    }

    res.status(200).json(post)
  } catch (error) {
    console.error("Error fetching post:", error)
    res.status(500).json({ message: "Server error while fetching post" })
  }
}

export const updatePost = async (req, res) => {
  const postId = req.params.id
  const { userId } = req.body

  try {
    const post = await PostModel.findById(postId)
    if (post.userId === userId) {
      await post.updateOne({ $set: req.body })
      res.status(200).json("Post Updated Successfully")
    } else {
      res.status(403).json("You can't update this post")
    }
  } catch (error) {
    res.status(500).json(error)
  }
}

export const deletePost = async (req, res) => {
  const postId = req.params.id
  const { userId } = req.body

  try {
    const post = await PostModel.findById(postId)
    if (post.userId === userId) {
      await post.deleteOne()
      res.status(200).json("Post Deleted Successfully")
    } else {
      res.status(403).json("You can't delete this post")
    }
  } catch (error) {
    res.status(500).json(error)
  }
}

export const getTimelinePosts = async (req, res) => {
  const userId = req.params.id

  try {
    const currentUserPosts = await PostModel.find({ userId: userId })
    const followingPosts = await UserModel.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(userId),
        },
      },
      {
        $lookup: {
          from: "posts",
          localField: "following",
          foreignField: "userId",
          as: "followingPosts",
        },
      },
      {
        $project: {
          followingPosts: 1,
          _id: 0,
        },
      },
    ])

    res.status(200).json(
      currentUserPosts.concat(...followingPosts[0].followingPosts).sort((a, b) => {
        return b.createdAt - a.createdAt
      }),
    )
  } catch (error) {
    res.status(500).json(error)
  }
}

export const getComments = async (req, res) => {
  const postId = req.params.id

  try {
    // Validate post ID
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ message: "Invalid post ID format" })
    }

    // Find the post and populate the comments field
    const post = await PostModel.findById(postId).populate("comments")
    if (!post) {
      return res.status(404).json({ message: "Post not found" })
    }

    res.status(200).json(post.comments)
  } catch (error) {
    console.error("Error fetching comments:", error)
    res.status(500).json({ message: "Server error while fetching comments" })
  }
}

// New function to save a post
export const savePost = async (req, res) => {
  const postId = req.params.id
  const { userId } = req.body

  try {
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ message: "Invalid post ID format" })
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID format" })
    }

    const post = await PostModel.findById(postId)
    if (!post) {
      return res.status(404).json({ message: "Post not found" })
    }

    // Check if post is already saved
    const existingSave = await SavedPostModel.findOne({ userId, postId })

    if (existingSave) {
      // If already saved, remove it (toggle functionality)
      await SavedPostModel.deleteOne({ _id: existingSave._id })
      return res.status(200).json({ message: "Post unsaved successfully" })
    }

    // Create new saved post entry
    const savedPost = new SavedPostModel({
      userId,
      postId,
    })

    await savedPost.save()
    res.status(200).json({ message: "Post saved successfully" })
  } catch (error) {
    console.error("Error saving post:", error)
    res.status(500).json({ message: "Server error while saving post" })
  }
}

// Get all saved posts for a user
export const getSavedPosts = async (req, res) => {
  const userId = req.params.userId

  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID format" })
    }

    // Find all saved posts for this user
    const savedPosts = await SavedPostModel.find({ userId }).sort({ savedAt: -1 })

    // Get the actual post data for each saved post
    const postIds = savedPosts.map((save) => save.postId)

    const posts = await PostModel.find({ _id: { $in: postIds } })
      .populate("userId", "firstname lastname profilePicture")
      .populate("comments")

    // Sort posts to match the order of saved posts
    const orderedPosts = postIds.map((id) => posts.find((post) => post._id.toString() === id)).filter(Boolean)

    res.status(200).json(orderedPosts)
  } catch (error) {
    console.error("Error fetching saved posts:", error)
    res.status(500).json({ message: "Server error while fetching saved posts" })
  }
}

// Check if a post is saved by a user
export const isPostSaved = async (req, res) => {
  const { postId, userId } = req.params

  try {
    if (!mongoose.Types.ObjectId.isValid(postId) || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid ID format" })
    }

    const savedPost = await SavedPostModel.findOne({ userId, postId })
    res.status(200).json({ isSaved: !!savedPost })
  } catch (error) {
    console.error("Error checking saved status:", error)
    res.status(500).json({ message: "Server error" })
  }
}

export const searchPosts = async (req, res) => {
  const query = req.body.query

  try {
    if (!query || query.trim() === "") {
      return res.status(400).json({ message: "Search query is required" })
    }

    const searchTerms = query.trim().split(/\s+/)

    const regexPatterns = searchTerms.map((term) => new RegExp(term, "i"))

    const posts = await PostModel.find({
      $or: [{ desc: { $in: regexPatterns } }, { tags: { $in: regexPatterns } }],
    })
      .sort({ createdAt: -1 }) // Sort by newest first
      .populate("userId", "firstname lastname email profilePicture") // Populate user details

    res.status(200).json(posts)
  } catch (error) {
    console.error("Error searching posts:", error)
    res.status(500).json({ message: "Server error while searching posts", error: error.message })
  }
}

export const getUserPosts = async (req, res) => {
  const userId = req.params.userId

  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID format" })
    }

    const posts = await PostModel.find({ userId })
      .sort({ createdAt: -1 })
      .populate("userId", "firstname lastname email") // Already populating user details
      .populate("comments") // Add this to populate comments

    res.status(200).json(posts)
  } catch (error) {
    console.error("Error fetching user posts:", error)
    res.status(500).json({ message: "Server error while fetching user posts" })
  }
}

export const getPostLikes = async (req, res) => {
  const postId = req.params.id

  try {
    // Validate post ID
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ message: "Invalid post ID format" })
    }

    // Find the post
    const post = await PostModel.findById(postId)
    if (!post) {
      return res.status(404).json({ message: "Post not found" })
    }

    // Fetch user details for the IDs in the likes array
    const likers = await UserModel.find(
      { _id: { $in: post.likes } },
      "firstname lastname profilePicture", // Select only needed fields
    )

    res.status(200).json(likers)
  } catch (error) {
    console.error("Error fetching post likes:", error)
    res.status(500).json({ message: "Server error while fetching post likes" })
  }
}

export const editComment = async (req, res) => {
  const { commentId } = req.params
  const { userId, content } = req.body

  try {
    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return res.status(400).json({ message: "Invalid comment ID format" })
    }

    const comment = await CommentModel.findById(commentId)
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" })
    }

    if (comment.userId !== userId) {
      return res.status(403).json({ message: "You can only edit your own comments" })
    }

    comment.content = content
    await comment.save()

    res.status(200).json({ message: "Comment updated successfully", comment })
  } catch (error) {
    console.error("Error editing comment:", error)
    res.status(500).json({ message: "Server error while editing comment" })
  }
}

export const deleteComment = async (req, res) => {
  const { commentId } = req.params
  const { userId } = req.body

  try {
    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return res.status(400).json({ message: "Invalid comment ID format" })
    }

    const comment = await CommentModel.findById(commentId)
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" })
    }

    const post = await PostModel.findById(comment.postId)
    if (!post) {
      return res.status(404).json({ message: "Associated post not found" })
    }

    if (comment.userId !== userId && post.userId !== userId) {
      return res.status(403).json({ message: "You can only delete your own comments or comments on your post" })
    }

    await CommentModel.deleteOne({ _id: commentId })
    await PostModel.updateOne({ _id: comment.postId }, { $pull: { comments: commentId } })

    res.status(200).json({ message: "Comment deleted successfully" })
  } catch (error) {
    console.error("Error deleting comment:", error)
    res.status(500).json({ message: "Server error while deleting comment" })
  }
}

// Add a function to get the count of saved posts
export const getSavedPostsCount = async (req, res) => {
  const userId = req.params.userId

  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID format" })
    }

    // Count saved posts for this user
    const count = await SavedPostModel.countDocuments({ userId })
    res.status(200).json({ count })
  } catch (error) {
    console.error("Error counting saved posts:", error)
    res.status(500).json({ message: "Server error while counting saved posts" })
  }
}
