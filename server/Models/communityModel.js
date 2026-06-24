import mongoose from "mongoose";

const communityMessageSchema = mongoose.Schema(
  {
    sender: { type: String, required: true },
    senderName: { type: String, default: "" },
    senderAvatar: { type: String, default: "" },
    text: { type: String, default: "" },
    mediaUrl: { type: String, default: null },
    mediaType: { type: String, enum: ["image", "video", null], default: null },
    edited: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    deletedBy: { type: String, default: null },
    deletedByName: { type: String, default: "" },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

const CommunitySchema = mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    avatar: { type: String, default: "" },
    createdBy: { type: String, required: true },
    admins: [{ type: String }],
    members: [{ type: String }], // userIds
    messages: [communityMessageSchema],
  },
  { timestamps: true }
);

CommunitySchema.index({ members: 1 });

const CommunityModel =
  mongoose.models.Communities || mongoose.model("Communities", CommunitySchema);
export default CommunityModel;
