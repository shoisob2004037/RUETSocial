import mongoose from "mongoose"

const savedPostSchema = mongoose.Schema(
  {
    userId: { type: String, required: true },
    postId: { type: String, required: true },
    savedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
)

// Create a compound index to ensure a user can only save a post once
savedPostSchema.index({ userId: 1, postId: 1 }, { unique: true })

var SavedPostModel = mongoose.model("SavedPosts", savedPostSchema)
export default SavedPostModel
