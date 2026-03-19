import prisma from "../utils/prisma";
export async function createNotification(userId: string, message: string) {
  const notification = await prisma.notification.create({
    data: { userId, message }
  });
  return notification
}
export async function getNotifications(userId: string) {
  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" }
  });
  return notifications;
}
export async function markNotificationRead(notificationId: string) {
  const notification = await prisma.notification.update({
    where: { id: notificationId },
    data: { read: true }
  });
  return notification;
}