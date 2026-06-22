import express from "express";
import {
  createEvent,
  getEvents,
  getEvent,
  toggleAttend,
  deleteEvent,
} from "../Controllers/EventController.js";

const router = express.Router();

router.post("/", createEvent);
router.get("/", getEvents);
router.get("/:id", getEvent);
router.put("/:id/attend", toggleAttend);
router.delete("/:id", deleteEvent);

export default router;
