import express from "express";
import { createJob, getJobs, applyJob, toggleSaveJob, deleteJob } from "../Controllers/JobController.js";
const router = express.Router();
router.post("/", createJob);
router.get("/", getJobs);
router.put("/:id/apply", applyJob);
router.put("/:id/save", toggleSaveJob);
router.delete("/:id", deleteJob);
export default router;
