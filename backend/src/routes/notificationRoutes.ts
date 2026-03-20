import { Router } from "express";
import { authMiddleware } from "../middleware/authmiddleware";

import {
  getNotificationsController,
  markNotificationReadController
} from "../controllers/notificationController";

const router = Router();
router.get("/", authMiddleware, getNotificationsController);
router.patch("/:id/read", authMiddleware, markNotificationReadController);

export default router;