import { Request, Response } from "express";
import {
  createComment,
  getComments,
  updateComment,
  deleteComment,
} from "../services/commentService";

type AuthRequest = Request & { userId: string };

// Reusable helper — keeps catch blocks DRY
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
    if (error.message.startsWith("INVALID")) {
      res.status(400).json({ message: error.message });
      return;
    }
  }
  res.status(500).json({ message: "Server error" });
}

/** POST /tasks/:taskId/comments */
export async function createCommentController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const userId = (req as AuthRequest).userId;
    const { taskId } = req.params;
    const { content } = req.body;

    if (!taskId || typeof taskId !== "string") {
      res.status(400).json({ message: "taskId is required" });
      return;
    }

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      res.status(400).json({ message: "content is required" });
      return;
    }

    const comment = await createComment(content, taskId, userId);
    res.status(201).json(comment);
  } catch (error) {
    handleError(res, error);
  }
}

/** GET /tasks/:taskId/comments */
export async function getCommentsController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { taskId } = req.params;

    if (!taskId || typeof taskId !== "string") {
      res.status(400).json({ message: "taskId is required" });
      return;
    }

    const comments = await getComments(taskId);
    res.json(comments);
  } catch (error) {
    handleError(res, error);
  }
}

/** PATCH /comments/:commentId */
export async function updateCommentController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const userId = (req as AuthRequest).userId;
    const { commentId } = req.params;

    if (!commentId || typeof commentId !== "string") {
      res.status(400).json({ message: "commentId is required" });
      return;
    }

    const { newContent } = req.body;

    if (!newContent || typeof newContent !== "string" || newContent.trim().length === 0) {
      res.status(400).json({ message: "newContent is required" });
      return;
    }

    const updatedComment = await updateComment(commentId, newContent, userId);
    res.json(updatedComment);
  } catch (error) {
    handleError(res, error);
  }
}

/** DELETE /comments/:commentId */
export async function deleteCommentController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const userId = (req as AuthRequest).userId;
    const { commentId } = req.params;

    if (!commentId || typeof commentId !== "string") {
      res.status(400).json({ message: "commentId is required" });
      return;
    }

    await deleteComment(commentId, userId);
    res.status(204).send();
  } catch (error) {
    handleError(res, error);
  }
}