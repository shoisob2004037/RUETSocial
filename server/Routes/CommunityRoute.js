import express from "express";
import {
  getUserCommunities,
  getCommunity,
  createCommunity,
  addMember,
  leaveCommunity,
  sendCommunityMessage,
  getMutualFollowers,
} from "../Controllers/CommunityController.js";

const router = express.Router();

router.get("/user/:userId", getUserCommunities);
router.get("/mutual/:userId", getMutualFollowers);
router.get("/:id", getCommunity);
router.post("/", createCommunity);
router.post("/:id/members", addMember);
router.post("/:id/leave", leaveCommunity);
router.post("/:id/messages", sendCommunityMessage);

export default router;
