import { Router } from "express";
import { authMiddleware } from "../middleware/authmiddleware";
import {
  createTaskController,
  getTasksByColumnController,
  updateTaskController,
  deleteTaskController,
  moveTaskController,
  getTaskByIdController
} from "../controllers/taskController";
const router = Router();
router.post("/", authMiddleware, createTaskController);
router.patch("/move/:taskId", authMiddleware, moveTaskController);
router.get("/column/:columnId", authMiddleware, getTasksByColumnController);
router.get("/:taskId", authMiddleware, getTaskByIdController);
router.put("/:taskId", authMiddleware, updateTaskController);
router.delete("/:taskId", authMiddleware, deleteTaskController);
export default router;