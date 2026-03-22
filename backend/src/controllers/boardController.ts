import { Request, Response } from "express";
import {
  createBoard,
  getBoards,
  getBoardById,
  updateBoard,
  deleteBoard,
  getStoriesByBoard,
  setBoardTimestampColumns
} from "../services/boardService";
import { handleError } from "../utils/httpErrors";
import "../types/express";



// only project admins can create boards
/**handles POST /projects/:projectId/boards */
export async function createBoardController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { projectId } = req.params;
    const { name } = req.body;
    const userId = req.userId;

    if (!name) {
      res.status(400).json({ message: "Board name is required" });
      return;
    }

    if (!projectId || typeof projectId !== "string") {
      res.status(400).json({ message: "Project ID is required" });
      return;
    }

    const board = await createBoard(userId, projectId, name);
    res.status(201).json(board);
  } catch (error) {
    handleError(res, error);
  }
}

// anyone can view boards if authenticated
/**GET /projects/:projectId/boards */
export async function getBoardsController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { projectId } = req.params;
    const userId = req.userId;
    if (!projectId || typeof projectId !== "string") {
      res.status(400).json({ message: "Project ID is required" });
      return;
    }

    const boards = await getBoards(userId, projectId);
    res.json(boards);
  } catch (error) {
    handleError(res, error);
  }
}
/**GET /boards/:boardId */
export async function getBoardByIdController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { boardId } = req.params;
    const userId = req.userId;

    if (!boardId || typeof boardId !== "string") {
      res.status(400).json({ message: "Board ID is required" });
      return;
    }

    const board = await getBoardById(userId, boardId);

    if (!board) {
      res.status(404).json({ message: "Board not found" });
      return;
    }

    res.json(board);
  } catch (error) {
    handleError(res, error);
  }
}

// only project admins can rename boards
/**handles PUT /projects/:projectId/boards/:boardId  */
export async function updateBoardController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { projectId, boardId } = req.params;
    const { name } = req.body;
    const userId = req.userId;

    if (!name) {
      res.status(400).json({ message: "Board name is required" });
      return;
    }

    if (!projectId || typeof projectId !== "string") {
      res.status(400).json({ message: "Project ID is required" });
      return;
    }

    if (!boardId || typeof boardId !== "string") {
      res.status(400).json({ message: "Board ID is required" });
      return;
    }

    const board = await updateBoard(userId, projectId, boardId, name);
    res.json(board);
  } catch (error) {
    handleError(res, error);
  }
}

// only project admins can delete boards
/**handles DELETE /projects/:projectId/boards/:boardId */
export async function deleteBoardController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { projectId, boardId } = req.params;
    const userId = req.userId;

    if (!projectId || typeof projectId !== "string") {
      res.status(400).json({ message: "Project ID is required" });
      return;
    }

    if (!boardId || typeof boardId !== "string") {
      res.status(400).json({ message: "Board ID is required" });
      return;
    }

    await deleteBoard(userId, projectId, boardId);
    res.status(204).send();
  } catch (error) {
    handleError(res, error);
  }
}
export async function getStoriesByBoardController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { projectId, boardId } = req.params;
    const userId = req.userId;

    if (!projectId || typeof projectId !== "string") {
      res.status(400).json({ message: "Project ID is required" });
      return;
    }

    if (!boardId || typeof boardId !== "string") {
      res.status(400).json({ message: "Board ID is required" });
      return;
    }

    const stories = await getStoriesByBoard(userId, boardId);
    res.json(stories);
  } catch (error) {
    handleError(res, error);
  }
}
/**
 * PATCH /api/projects/:projectId/boards/:boardId/timestamp-columns
 * Lets a Project Admin configure which column triggers resolvedAt and closedAt
 * on tasks. Pass null for either field to clear that configuration.
 * Body: { resolvedColumnId: string | null, closedColumnId: string | null }
 */
export async function setBoardTimestampColumnsController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { boardId } = req.params;
    const userId = req.userId;
    const { resolvedColumnId, closedColumnId } = req.body as {
      resolvedColumnId?: string | null;
      closedColumnId?: string | null;
    };

    if (!boardId || typeof boardId !== "string") {
      res.status(400).json({ message: "Board ID is required" });
      return;
    }

    // Both fields are optional — pass null if not provided to preserve existing value
    const board = await setBoardTimestampColumns(
      userId,
      boardId,
      resolvedColumnId !== undefined ? resolvedColumnId : null,
      closedColumnId !== undefined ? closedColumnId : null
    );
    res.json(board);
  } catch (error) {
    handleError(res, error);
  }
}