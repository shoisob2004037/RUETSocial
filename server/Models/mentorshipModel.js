import mongoose from "mongoose";

const mentorshipSchema = mongoose.Schema(
  {
    menteeId: { type: String, required: true },
    menteeName: String,
    mentorId: { type: String, required: true },
    mentorName: String,
    topic: { type: String, required: true },
    message: String,
    status: { type: String, enum: ["pending", "accepted", "declined", "completed"], default: "pending" },
    responseMessage: String,
  },
  { timestamps: true }
);

export default mongoose.model("Mentorships", mentorshipSchema);
