import { Request, Response } from "express";
import { createColumn, updateColumn, deleteColumn, getColumns, reorderColumns, updateWipLimit, setAllowedTransitions } from "../services/coloumService";
type AuthRequest = Request & { userId: string };

// reusable error handler (same pattern as boardController)
function handleError(res: Response, error: unknown): void {
  if (error instanceof Error) {
    if (error.message.startsWith("FORBIDDEN")) {
      res.status(403).json({ message: error.message });
      return;
    }
    if (error.message === "WIP_LIMIT_INVALID") {
      res.status(400).json({ message: "wipLimit must be a positive integer or null" });
      return;
    }
  }

  res.status(500).json({ message: "Server error" });
}

/** POST /boards/:boardId/columns */
export async function createColumnController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { boardId } = req.params;
    const { name, order } = req.body;
    const userId = (req as AuthRequest).userId;

    if (!boardId || typeof boardId !== "string") {
      res.status(400).json({ message: "Board ID is required" });
      return;
    }

    if (!name) {
      res.status(400).json({ message: "Column name is required" });
      return;
    }

    if (order === undefined) {
      res.status(400).json({ message: "Column order is required" });
      return;
    }

    const column = await createColumn(userId, boardId, name, order);

    res.status(201).json(column);
  } catch (error) {
    handleError(res, error);
  }
}

/** GET /boards/:boardId/columns */
export async function getColumnsController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { boardId } = req.params;
    const userId = (req as AuthRequest).userId;

    if (!boardId || typeof boardId !== "string") {
      res.status(400).json({ message: "Board ID is required" });
      return;
    }

    const columns = await getColumns(userId, boardId);

    res.json(columns);
  } catch (error) {
    handleError(res, error);
  }
}

/** PUT /boards/:boardId/columns/:columnId */
export async function updateColumnController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { columnId } = req.params;
    const { name } = req.body;
    const userId = (req as AuthRequest).userId;

    if (!columnId || typeof columnId !== "string") {
      res.status(400).json({ message: "Column ID is required" });
      return;
    }

    if (!name) {
      res.status(400).json({ message: "Column name is required" });
      return;
    }

    const column = await updateColumn(userId, columnId, name);

    res.json(column);
  } catch (error) {
    handleError(res, error);
  }
}

/** DELETE /boards/:boardId/columns/:columnId */
export async function deleteColumnController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { columnId } = req.params;
    const userId = (req as AuthRequest).userId;

    if (!columnId || typeof columnId !== "string") {
      res.status(400).json({ message: "Column ID is required" });
      return;
    }

    await deleteColumn(userId, columnId);

    res.status(204).send();
  } catch (error) {
    handleError(res, error);
  }
}
/**
 * PATCH /boards/:boardId/columns/reorder
 * Only Project Admins can reorder columns.
 * Body: { orderedIds: string[] }
 */
export async function reorderColumnsController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { boardId } = req.params;
    const { orderedIds } = req.body;
    const userId = (req as AuthRequest).userId;

    if (!boardId || typeof boardId !== "string") {
      res.status(400).json({ message: "Board ID is required" });
      return;
    }

    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      res.status(400).json({ message: "orderedIds must be a non-empty array" });
      return;
    }

    const columns = await reorderColumns(userId, boardId, orderedIds);

    res.json(columns);
  } catch (error) {
    handleError(res, error);
  }
}

/**
 * PATCH /columns/:columnId/wip-limit
 * Only Project Admins can set WIP limits.
 * Body: { wipLimit: number | null, boardId: string }
 */
export async function updateWipLimitController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { columnId } = req.params;
    const { wipLimit } = req.body;
    const userId = (req as AuthRequest).userId;

    if (!columnId || typeof columnId !== "string") {
      res.status(400).json({ message: "Column ID is required" });
      return;
    }

    const column = await updateWipLimit(userId, columnId, wipLimit);

    res.json(column);
  } catch (error) {
    handleError(res, error);
  }
}
/**
 * PATCH /columns/:columnId/transitions
 * Sets which columns tasks are allowed to move to from this column.
 * Only Project Admins can configure transitions.
 * Body: { allowedNextColumnIds: string[] | null }
 *   - string[]  → restrict moves to only these column IDs
 *   - null      → clear restriction (any move allowed)
 */

export async function setAllowedTransitionsController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { columnId } = req.params;
    const { allowedNextColumnIds } = req.body;
    const userId = (req as AuthRequest).userId;

    if (!columnId || typeof columnId !== "string") {
      res.status(400).json({ message: "Column ID is required" });
      return;
    }

    // allowedNextColumnIds must be an array of strings, or explicitly null
    if (
      allowedNextColumnIds !== null &&
      (!Array.isArray(allowedNextColumnIds) ||
        allowedNextColumnIds.some((id: unknown) => typeof id !== "string"))
    ) {
      res.status(400).json({
        message: "allowedNextColumnIds must be an array of column ID strings, or null",
      });
      return;
    }

    const column = await setAllowedTransitions(userId, columnId, allowedNextColumnIds);
    res.json(column);
  } catch (error) {
    handleError(res, error);
  }
}