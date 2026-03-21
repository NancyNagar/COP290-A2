import { Request, Response } from "express";
import {
  createComment,
  getComments,
  updateComment,
  deleteComment,
} from "../services/commentService";
import { handleError } from "../utils/httpErrors";


/** POST /tasks/:taskId/comments */
export async function createCommentController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const userId = req.userId;
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
    const userId = req.userId;
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
    const userId = req.userId;
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