import { Request, Response } from "express";
import {
  getNotifications,
  markNotificationRead
} from "../services/notificationService";

export async function getNotificationsController(
  req: Request,
  res: Response
) {
  try {
    const userId = req.userId;
    const notifications = await getNotifications(userId);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch notifications"
    });
  }
}
export async function markNotificationReadController(
  req: Request,
  res: Response
) {
  try {
    const { id } = req.params;
    if (!id || typeof id !== "string") {
      return res.status(400).json({ error: "Notification ID is required" });
    }
    const notification = await markNotificationRead(id);
    res.json(notification);
  } catch (error) {
    res.status(500).json({
      message: "Update failed"
    });
  }
}
