import mongoose from "mongoose";

const pollSchema = mongoose.Schema(
  {
    createdBy: { type: String, required: true },
    createdByName: String,
    question: { type: String, required: true },
    options: [
      {
        text: { type: String, required: true },
        votes: [{ type: String }],
      },
    ],
    category: { type: String, default: "General" }, // Academic, Career, Campus, Fun
    expiresAt: Date,
    multiSelect: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Polls", pollSchema);
