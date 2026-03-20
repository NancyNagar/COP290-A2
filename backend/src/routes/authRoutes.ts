import { Router } from "express";
import { register, login, logout, refresh, updateProfile } from "../controllers/authController";
import { authMiddleware } from "../middleware/authmiddleware";
const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.post("/refresh", refresh);
router.patch("/profile", authMiddleware, updateProfile);

export default router;