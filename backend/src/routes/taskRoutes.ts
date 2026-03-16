import { Router } from "express";
import { authMiddleware } from "../middleware/authmiddleware";
import {
  createTaskController,
  getTasksByColumnController,
    updateTaskController,
    deleteTaskController,
    moveTaskController
} from "../controllers/taskController";
const router = Router();
router.post("/", authMiddleware, createTaskController);
router.get("/:columnId", authMiddleware, getTasksByColumnController);
router.put("/:taskId", authMiddleware, updateTaskController);   
router.delete("/:taskId", authMiddleware, deleteTaskController);
router.patch("/move/:taskId", authMiddleware, moveTaskController);
export default router;