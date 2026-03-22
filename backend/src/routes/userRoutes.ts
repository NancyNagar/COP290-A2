import { Router } from "express";
import { authMiddleware } from "../middleware/authmiddleware";
import { getUsersController, updateUserRoleController } from "../controllers/userController";

const router = Router();

// GET /api/users — list all users (Global Admin + Project Admin only)
router.get("/users", authMiddleware, getUsersController);

// PATCH /api/users/:targetUserId/role — promote/demote a user's global role (Global Admin only)
router.patch("/users/:targetUserId/role", authMiddleware, updateUserRoleController);

export default router;