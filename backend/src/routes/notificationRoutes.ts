import { Router } from "express";
import { authMiddleware } from "../middleware/authmiddleware";

import {
  getNotificationsController,
  markNotificationReadController
} from "../controllers/notificationController";

const router = Router();
router.get("/notifications", authMiddleware, getNotificationsController);
router.patch(
  "/notifications/:id/read",
  authMiddleware,
  markNotificationReadController
);

export default router;