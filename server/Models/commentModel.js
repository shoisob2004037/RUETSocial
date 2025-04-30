import mongoose from "mongoose";

const commentSchema = mongoose.Schema(
    {
        userId: { type: String, required: true },
        postId: { type: mongoose.Schema.Types.ObjectId, ref: "Posts", required: true }, // Reference to the post
        content: { type: String, required: true, minlength: 1, maxlength: 500 },
    },
    {
        timestamps: true, // Adds createdAt and updatedAt fields
    }
);

var CommentModel = mongoose.model("Comments", commentSchema);
export default CommentModel;