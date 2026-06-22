import PollModel from "../Models/pollModel.js";

export const createPoll = async (req, res) => {
  try {
    const { options = [], ...rest } = req.body;
    const normalized = options.map((o) => (typeof o === "string" ? { text: o, votes: [] } : { ...o, votes: [] }));
    const poll = await new PollModel({ ...rest, options: normalized }).save();
    res.status(201).json(poll);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

export const getPolls = async (req, res) => {
  try {
    const { category } = req.query;
    const query = {};
    if (category && category !== "All") query.category = category;
    const polls = await PollModel.find(query).sort({ createdAt: -1 });
    res.status(200).json(polls);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

export const vote = async (req, res) => {
  try {
    const { userId, optionIndex } = req.body;
    const poll = await PollModel.findById(req.params.id);
    if (!poll) return res.status(404).json({ message: "Poll not found" });
    if (poll.expiresAt && new Date(poll.expiresAt) < new Date())
      return res.status(400).json({ message: "Poll closed" });

    if (!poll.multiSelect) {
      poll.options.forEach((o) => { o.votes = o.votes.filter((v) => v !== userId); });
    }
    const opt = poll.options[optionIndex];
    if (!opt) return res.status(400).json({ message: "Invalid option" });
    const i = opt.votes.indexOf(userId);
    if (i === -1) opt.votes.push(userId);
    else opt.votes.splice(i, 1);
    await poll.save();
    res.status(200).json(poll);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

export const deletePoll = async (req, res) => {
  try {
    const { currentUserId, currentUserAdminStatus } = req.body;
    const poll = await PollModel.findById(req.params.id);
    if (!poll) return res.status(404).json({ message: "Poll not found" });
    if (poll.createdBy !== currentUserId && !currentUserAdminStatus)
      return res.status(401).json({ message: "Unauthorized" });
    await PollModel.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Deleted" });
  } catch (e) { res.status(500).json({ message: e.message }); }
};
