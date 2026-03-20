import { Request, Response } from "express";
import {
  createTask,
  getTasksByColumn,
  getTaskById,
  updateTask,
  deleteTask,
  moveTask,
} from "../services/taskService";

type AuthRequest = Request & { userId: string };

// reusable error handler (same style as boardController / columnController)
function handleError(res: Response, error: unknown): void {
  if (error instanceof Error) {
    if (error.message.startsWith("FORBIDDEN")) {
      res.status(403).json({ message: error.message });
      return;
    }

    if (error.message.startsWith("NOT_FOUND")) {
      res.status(404).json({ message: error.message });
      return;
    }

    if (
      error.message.startsWith("INVALID") ||
      error.message.startsWith("WIP_LIMIT")
    ) {
      res.status(400).json({ message: error.message }); //invalid input
      return;
    }
  }

  res.status(500).json({ message: "Server error" });
}
/**POST/tasks */
export async function createTaskController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const userId = (req as AuthRequest).userId;
    const { title, description, columnId, priority, type, dueDate, assigneeId, reporterId, parentId } = req.body;

    // Basic validation (same as other controllers)
    if (!title || typeof title !== "string") {
      res.status(400).json({ message: "title is required" });
      return;
    }

    if (!columnId || typeof columnId !== "string") {
      res.status(400).json({ message: "columnId is required" });
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
    const userId = (req as AuthRequest).userId;
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
    const userId = (req as AuthRequest).userId;
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
    const userId = (req as AuthRequest).userId;
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
    const userId = (req as AuthRequest).userId;
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
    const userId = (req as AuthRequest).userId;
    const { taskId } = req.params;
    if (!taskId || typeof taskId !== "string") {
      res.status(400).json({ message: "taskId is required" });
      return;
    }

    const { newColumnId, newStatus } = req.body;
    if (!newColumnId || typeof newColumnId !== "string") {
      res.status(400).json({ message: "newColumnId is required" });
      return;
    }

    if (!newStatus || typeof newStatus !== "string") {
      res.status(400).json({ message: "newStatus is required" });
      return;
    }

    const task = await moveTask(userId, taskId, newColumnId);
    res.json(task);
  } catch (error) {
    handleError(res, error);
  }
}
