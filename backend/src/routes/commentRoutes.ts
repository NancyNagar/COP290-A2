import { Router } from "express";
import { authMiddleware } from "../middleware/authmiddleware";
import {
  createCommentController,
  getCommentsController,
  updateCommentController,
  deleteCommentController
} from "../controllers/commentController";
const router = Router();
router.post("/:taskId", authMiddleware, createCommentController);
router.get("/:taskId", authMiddleware, getCommentsController);
router.put("/:commentId", authMiddleware, updateCommentController);
router.delete("/:commentId", authMiddleware, deleteCommentController);
export default router;