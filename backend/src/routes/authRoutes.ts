import { Router } from "express";
import { register, login, logout, refresh, updateProfile, getMe } from "../controllers/authController";
import { authMiddleware } from "../middleware/authmiddleware";
const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.post("/refresh", refresh);
router.patch("/profile", authMiddleware, updateProfile);
router.get("/me", authMiddleware, getMe);

export default router;