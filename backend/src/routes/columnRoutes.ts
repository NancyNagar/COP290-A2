import { Router } from "express";
import {
  createColumnController,
  getColumnsController,
  updateColumnController,
  deleteColumnController,
  reorderColumnsController,
  updateWipLimitController,
  setAllowedTransitionsController
} from "../controllers/coloumnController";
import { authMiddleware } from "../middleware/authmiddleware";

const router = Router();

// Board-scoped column routes
/**used parent resource in url ,working on collection */
router.post("/boards/:boardId/columns", authMiddleware, createColumnController);
router.get("/boards/:boardId/columns", authMiddleware, getColumnsController);
router.patch(
  "/boards/:boardId/columns/reorder",
  authMiddleware,
  reorderColumnsController
);

// Column-specific routes
/**direct resource pasth,because in db columnid and board id already linked to a board and project,
 * prisma traces the relationships
 */
router.put("/columns/:columnId", authMiddleware, updateColumnController);
router.delete("/columns/:columnId", authMiddleware, deleteColumnController);
router.patch(
  "/columns/:columnId/wip-limit",
  authMiddleware,
  updateWipLimitController
);
router.patch(
  "/columns/:columnId/transitions",
  authMiddleware,
  setAllowedTransitionsController
);

export default router;