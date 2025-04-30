import express from "express";
import { deleteUser, followUser, getUser, unFollowUser, updateUser, getAllUsers, getMultipleUsers } from "../Controllers/UserController.js";

const router = express.Router();

router.get("/:id",getUser);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);
router.put("/:id/follow", followUser);
router.put("/:id/unfollow",unFollowUser);
router.get("/", getAllUsers);
router.post('/multiple', getMultipleUsers);

export default router;