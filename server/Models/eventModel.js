import mongoose from "mongoose";

const EventSchema = mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    coverImage: { type: String, default: "" },
    location: { type: String, default: "" },
    department: { type: String, default: "All" },
    eventDate: { type: Date, required: true },
    createdBy: { type: String, required: true }, // userId
    creatorName: { type: String, default: "" },
    attendees: [{ type: String }], // userIds
  },
  { timestamps: true }
);

const EventModel = mongoose.models.Events || mongoose.model("Events", EventSchema);
export default EventModel;
