import express from "express";
import { requestMentorship, getMyMentorships, updateMentorshipStatus } from "../Controllers/MentorshipController.js";
const router = express.Router();
router.post("/", requestMentorship);
router.get("/user/:userId", getMyMentorships);
router.put("/:id", updateMentorshipStatus);
export default router;
