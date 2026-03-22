import { Router } from "express";
import { createBoardController, getBoardsController, getBoardByIdController, updateBoardController, deleteBoardController, getStoriesByBoardController, setBoardTimestampColumnsController } from "../controllers/boardController";
import { authMiddleware } from "../middleware/authmiddleware";

const router = Router();

router.post("/projects/:projectId/boards", authMiddleware, createBoardController);
router.get("/projects/:projectId/boards", authMiddleware, getBoardsController); //boards inside project projectId
router.put("/projects/:projectId/boards/:boardId", authMiddleware, updateBoardController);
router.delete("/projects/:projectId/boards/:boardId", authMiddleware, deleteBoardController);
router.get("/projects/:projectId/boards/:boardId/stories", authMiddleware, getStoriesByBoardController);
// Single board lookup (used when loading the board view with columns + tasks)
router.get("/boards/:boardId", authMiddleware, getBoardByIdController);
router.patch(
    "/projects/:projectId/boards/:boardId/timestamp-columns",
    authMiddleware,
    setBoardTimestampColumnsController
);
export default router;
