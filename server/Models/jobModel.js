import mongoose from "mongoose";

const jobSchema = mongoose.Schema(
  {
    postedBy: { type: String, required: true },
    postedByName: String,
    title: { type: String, required: true },
    company: { type: String, required: true },
    location: String,
    type: { type: String, enum: ["Full-time", "Part-time", "Internship", "Contract", "Remote"], default: "Full-time" },
    department: String,
    description: String,
    requirements: String,
    salary: String,
    applyLink: String,
    deadline: Date,
    applicants: [{ userId: String, name: String, appliedAt: { type: Date, default: Date.now } }],
    savedBy: [{ type: String }],
  },
  { timestamps: true }
);

export default mongoose.model("Jobs", jobSchema);
