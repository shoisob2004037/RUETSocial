import express from "express";
import {
  getUserCommunities,
  getCommunity,
  getCommunityMembers,
  createCommunity,
  addMember,
  removeMember,
  leaveCommunity,
  sendCommunityMessage,
  getMutualFollowers,
} from "../Controllers/CommunityController.js";

const router = express.Router();

router.get("/user/:userId", getUserCommunities);
router.get("/mutual/:userId", getMutualFollowers);
router.get("/:id/members", getCommunityMembers);
router.get("/:id", getCommunity);
router.post("/", createCommunity);
router.post("/:id/members", addMember);
router.delete("/:id/members", removeMember);
router.post("/:id/leave", leaveCommunity);
router.post("/:id/messages", sendCommunityMessage);

export default router;
