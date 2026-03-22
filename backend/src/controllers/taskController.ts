import { Request, Response } from "express";
import {
  createTask,
  getTasksByColumn,
  getTaskById,
  updateTask,
  deleteTask,
  moveTask,
} from "../services/taskService";
import { handleError } from "../utils/httpErrors";

/**POST/tasks */
export async function createTaskController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const userId = req.userId;
    const { title, description, columnId, boardId, priority, type, dueDate, assigneeId, reporterId, parentId } = req.body;
    const taskType = type || "task";
    // Stories require boardId and must NOT have a columnId; tasks/bugs require columnId
    if (taskType === "story") {
      if (!boardId || typeof boardId !== "string") {
        res.status(400).json({ message: "boardId is required for stories" });
        return;
      }
    } else {
      if (!columnId || typeof columnId !== "string") {
        res.status(400).json({ message: "columnId is required for tasks and bugs" });
        return;
      }
    }
    if (!title || typeof title !== "string" || title.trim().length === 0) {
      res.status(400).json({ message: "title is required" });
      return;
    }
    
    if (!priority || typeof priority !== "string") {
      res.status(400).json({ message: "priority is required" });
      return;
    }

    if (!reporterId || typeof reporterId !== "string") {
      res.status(400).json({ message: "reporterId is required" });
      return;
    }

    const task = await createTask(
      userId,
      title,
      description ?? null,
      columnId,
      boardId ?? null,
      priority,
      type ?? "task",
      dueDate ? new Date(dueDate) : null,
      assigneeId ?? null,
      reporterId,
      parentId ?? null
    );

    res.status(201).json(task);
  } catch (error) {
    handleError(res, error);
  }
}
/**GET/tasks/column/:columnId */
export async function getTasksByColumnController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const userId = req.userId;
    const { columnId } = req.params;
    if (!columnId || typeof columnId !== "string") {
      res.status(400).json({ message: "columnId is required" });
      return;
    }

    const tasks = await getTasksByColumn(userId, columnId);
    res.json(tasks);
  } catch (error) {
    handleError(res, error);
  }
}
/**GET/tasks/:taskId */
export async function getTaskByIdController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const userId = req.userId;
    const { taskId } = req.params;
    if (!taskId || typeof taskId !== "string") {
      res.status(400).json({ message: "taskId is required" });
      return;
    }

    const task = await getTaskById(userId, taskId);
    res.json(task);
  } catch (error) {
    handleError(res, error);
  }
}
/**PATCH/tasks/:taskId */
export async function updateTaskController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const userId = req.userId;
    const { taskId } = req.params;
    if (!taskId || typeof taskId !== "string") {
      res.status(400).json({ message: "taskId is required" });
      return;
    }

    const { title, description, priority, dueDate, assigneeId } = req.body;

    const updates: Record<string, unknown> = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (priority !== undefined) updates.priority = priority;
    if (assigneeId !== undefined) updates.assigneeId = assigneeId;
    if (dueDate !== undefined) updates.dueDate = new Date(dueDate);
    if (Object.keys(updates).length === 0) {
      res.status(400).json({ message: "No valid fields provided to update" });
      return;
    }

    const task = await updateTask(userId, taskId, updates);
    res.json(task);
  } catch (error) {
    handleError(res, error);
  }
}
/**DELETE/tasks/:taskId */
export async function deleteTaskController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const userId = req.userId;
    const { taskId } = req.params;
    if (!taskId || typeof taskId !== "string") {
      res.status(400).json({ message: "taskId is required" });
      return;
    }

    await deleteTask(userId, taskId);
    res.status(204).send();
  } catch (error) {
    handleError(res, error);
  }
}
/**PATCH/tasks/:taskId/move */
export async function moveTaskController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const userId = req.userId;
    const { taskId } = req.params;
    if (!taskId || typeof taskId !== "string") {
      res.status(400).json({ message: "taskId is required" });
      return;
    }

    const { newColumnId } = req.body;
    if (!newColumnId || typeof newColumnId !== "string") {
      res.status(400).json({ message: "newColumnId is required" });
      return;
    }

    const task = await moveTask(userId, taskId, newColumnId);
    res.json(task);
  } catch (error) {
    handleError(res, error);
  }
}
