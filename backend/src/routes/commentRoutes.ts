import { Router } from "express";
import { authMiddleware } from "../middleware/authmiddleware";
import {
  createCommentController,
  getCommentsController,
  updateCommentController,
  deleteCommentController
} from "../controllers/commentController";
const router = Router();
router.post("/tasks/:taskId", authMiddleware, createCommentController);
router.get("/tasks/:taskId", authMiddleware, getCommentsController);
router.put("/:commentId", authMiddleware, updateCommentController);
router.delete("/:commentId", authMiddleware, deleteCommentController);
export default router;