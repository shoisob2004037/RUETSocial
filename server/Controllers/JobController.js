import JobModel from "../Models/jobModel.js";

export const createJob = async (req, res) => {
  try {
    const job = await new JobModel(req.body).save();
    res.status(201).json(job);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

export const getJobs = async (req, res) => {
  try {
    const { type, department, q } = req.query;
    const query = {};
    if (type && type !== "All") query.type = type;
    if (department && department !== "All") query.department = department;
    if (q) query.$or = [
      { title: { $regex: q, $options: "i" } },
      { company: { $regex: q, $options: "i" } },
    ];
    const jobs = await JobModel.find(query).sort({ createdAt: -1 });
    res.status(200).json(jobs);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

export const applyJob = async (req, res) => {
  try {
    const { userId, name } = req.body;
    const job = await JobModel.findById(req.params.id);
    if (!job) return res.status(404).json({ message: "Job not found" });
    if (job.applicants.find((a) => a.userId === userId))
      return res.status(400).json({ message: "Already applied" });
    job.applicants.push({ userId, name });
    await job.save();
    res.status(200).json(job);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

export const toggleSaveJob = async (req, res) => {
  try {
    const { userId } = req.body;
    const job = await JobModel.findById(req.params.id);
    if (!job) return res.status(404).json({ message: "Job not found" });
    const idx = job.savedBy.indexOf(userId);
    if (idx === -1) job.savedBy.push(userId);
    else job.savedBy.splice(idx, 1);
    await job.save();
    res.status(200).json(job);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

export const deleteJob = async (req, res) => {
  try {
    const { currentUserId, currentUserAdminStatus } = req.body;
    const job = await JobModel.findById(req.params.id);
    if (!job) return res.status(404).json({ message: "Job not found" });
    if (job.postedBy !== currentUserId && !currentUserAdminStatus)
      return res.status(401).json({ message: "Unauthorized" });
    await JobModel.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Deleted" });
  } catch (e) { res.status(500).json({ message: e.message }); }
};
