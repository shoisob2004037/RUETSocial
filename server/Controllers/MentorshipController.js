import MentorshipModel from "../Models/mentorshipModel.js";

export const requestMentorship = async (req, res) => {
  try {
    const m = await new MentorshipModel(req.body).save();
    res.status(201).json(m);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

export const getMyMentorships = async (req, res) => {
  try {
    const { userId } = req.params;
    const all = await MentorshipModel.find({
      $or: [{ menteeId: userId }, { mentorId: userId }],
    }).sort({ createdAt: -1 });
    res.status(200).json(all);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

export const updateMentorshipStatus = async (req, res) => {
  try {
    const { status, responseMessage, currentUserId } = req.body;
    const m = await MentorshipModel.findById(req.params.id);
    if (!m) return res.status(404).json({ message: "Not found" });
    if (m.mentorId !== currentUserId && m.menteeId !== currentUserId)
      return res.status(401).json({ message: "Unauthorized" });
    if (status) m.status = status;
    if (responseMessage !== undefined) m.responseMessage = responseMessage;
    await m.save();
    res.status(200).json(m);
  } catch (e) { res.status(500).json({ message: e.message }); }
};
