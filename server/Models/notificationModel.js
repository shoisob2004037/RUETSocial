import mongoose from "mongoose"

const notificationSchema = mongoose.Schema(
  {
    recipient: { type: String, required: true }, // User receiving the notification
    sender: { type: String, required: true }, // User who triggered the notification
    type: {
      type: String,
      required: true,
      enum: ["like", "comment", "follow"],
    },
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Posts",
      required: function () {
        return this.type === "like" || this.type === "comment"
      },
    },
    read: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  },
)

// Check if model exists before creating a new one
const NotificationModel = mongoose.models.Notifications || mongoose.model("Notifications", notificationSchema)
export default NotificationModel

