import CommunityModel from "../Models/communityModel.js";
import UserModel from "../Models/userModel.js";

// Mutual follow helper: A and B both follow each other
const areMutualFollowers = async (idA, idB) => {
  if (idA === idB) return true;
  const [a, b] = await Promise.all([
    UserModel.findById(idA).select("following followers"),
    UserModel.findById(idB).select("following followers"),
  ]);
  if (!a || !b) return false;
  const aFollowsB =
    (a.following || []).map(String).includes(String(idB)) ||
    (b.followers || []).map(String).includes(String(idA));
  const bFollowsA =
    (b.following || []).map(String).includes(String(idA)) ||
    (a.followers || []).map(String).includes(String(idB));
  return aFollowsB && bFollowsA;
};

const isAdmin = (community, userId) =>
  (community.admins || []).map(String).includes(String(userId)) ||
  String(community.createdBy) === String(userId);

// Populate member docs (id/name/avatar/department) for the picker UI.
const populateMembers = async (community) => {
  const users = await UserModel.find({ _id: { $in: community.members } })
    .select("firstname lastname profilePicture department");
  return users.map((u) => ({
    _id: u._id,
    firstname: u.firstname,
    lastname: u.lastname,
    profilePicture: u.profilePicture,
    department: u.department,
    isAdmin: (community.admins || []).map(String).includes(String(u._id)),
    isCreator: String(community.createdBy) === String(u._id),
  }));
};

export const getUserCommunities = async (req, res) => {
  try {
    const { userId } = req.params;
    const communities = await CommunityModel.find({ members: userId })
      .sort({ updatedAt: -1 })
      .select("-messages");
    res.status(200).json(communities);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
};

export const getCommunity = async (req, res) => {
  try {
    const community = await CommunityModel.findById(req.params.id);
    if (!community) return res.status(404).json({ message: "Not found" });
    res.status(200).json(community);
  } catch (e) {
    res.status(500).json({ message: "Server error" });
  }
};

export const getCommunityMembers = async (req, res) => {
  try {
    const community = await CommunityModel.findById(req.params.id);
    if (!community) return res.status(404).json({ message: "Not found" });
    const members = await populateMembers(community);
    res.status(200).json({
      members,
      createdBy: community.createdBy,
      admins: community.admins,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
};

export const createCommunity = async (req, res) => {
  try {
    const { name, description, avatar, createdBy, members = [] } = req.body;
    if (!name || !createdBy)
      return res.status(400).json({ message: "name and createdBy required" });
    const uniqueMembers = Array.from(new Set([createdBy, ...members]));
    const community = await CommunityModel.create({
      name,
      description: description || "",
      avatar: avatar || "",
      createdBy,
      admins: [createdBy],
      members: uniqueMembers,
    });
    res.status(201).json(community);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
};

// Admin-only: add a member who is a mutual follower of the requesting admin.
export const addMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { currentUserId, targetUserId } = req.body;
    if (!currentUserId || !targetUserId)
      return res.status(400).json({ message: "Missing user ids" });

    const community = await CommunityModel.findById(id);
    if (!community) return res.status(404).json({ message: "Not found" });
    if (!isAdmin(community, currentUserId))
      return res.status(403).json({ message: "Only admins can add members" });
    if (community.members.map(String).includes(String(targetUserId)))
      return res.status(400).json({ message: "User is already a member" });

    const mutual = await areMutualFollowers(currentUserId, targetUserId);
    if (!mutual)
      return res
        .status(403)
        .json({ message: "You can only add people who follow you back" });

    community.members.push(targetUserId);
    await community.save();
    res.status(200).json(community);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
};

// Admin-only: remove a member. Creator cannot be removed.
export const removeMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { currentUserId, targetUserId } = req.body;
    if (!currentUserId || !targetUserId)
      return res.status(400).json({ message: "Missing user ids" });

    const community = await CommunityModel.findById(id);
    if (!community) return res.status(404).json({ message: "Not found" });
    if (!isAdmin(community, currentUserId))
      return res.status(403).json({ message: "Only admins can remove members" });
    if (String(community.createdBy) === String(targetUserId))
      return res.status(400).json({ message: "Creator cannot be removed" });

    community.members = community.members.filter(
      (m) => String(m) !== String(targetUserId)
    );
    community.admins = community.admins.filter(
      (m) => String(m) !== String(targetUserId)
    );
    await community.save();
    res.status(200).json(community);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
};

export const leaveCommunity = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    const community = await CommunityModel.findById(id);
    if (!community) return res.status(404).json({ message: "Not found" });
    community.members = community.members.filter((m) => String(m) !== String(userId));
    community.admins = community.admins.filter((m) => String(m) !== String(userId));
    if (community.members.length === 0) {
      await community.deleteOne();
      return res.status(200).json({ deleted: true });
    }
    await community.save();
    res.status(200).json(community);
  } catch (e) {
    res.status(500).json({ message: "Server error" });
  }
};

export const sendCommunityMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { senderId, senderName, senderAvatar, text, mediaUrl, mediaType } = req.body;
    if (!text?.trim() && !mediaUrl)
      return res.status(400).json({ message: "Text or media required" });

    const community = await CommunityModel.findById(id);
    if (!community) return res.status(404).json({ message: "Not found" });
    if (!community.members.map(String).includes(String(senderId)))
      return res.status(403).json({ message: "Not a member" });

    community.messages.push({
      sender: senderId,
      senderName: senderName || "",
      senderAvatar: senderAvatar || "",
      text: text || "",
      mediaUrl: mediaUrl || null,
      mediaType: mediaType || null,
    });
    await community.save();
    const message = community.messages[community.messages.length - 1];
    res.status(200).json({ message, community: { _id: community._id } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
};

// Get mutual followers for a given user (helper for the "add member" picker)
export const getMutualFollowers = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await UserModel.findById(userId).select("following followers");
    if (!user) return res.status(404).json({ message: "User not found" });
    const following = (user.following || []).map(String);
    const followers = (user.followers || []).map(String);
    const mutualIds = following.filter((id) => followers.includes(id));
    const users = await UserModel.find({ _id: { $in: mutualIds } }).select(
      "firstname lastname profilePicture department"
    );
    res.status(200).json(users);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
};
