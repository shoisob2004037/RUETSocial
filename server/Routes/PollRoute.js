import express from "express";
import { createPoll, getPolls, vote, deletePoll } from "../Controllers/PollController.js";
const router = express.Router();
router.post("/", createPoll);
router.get("/", getPolls);
router.put("/:id/vote", vote);
router.delete("/:id", deletePoll);
export default router;
