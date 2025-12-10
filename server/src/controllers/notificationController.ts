import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get user notifications
export async function getNotifications(req: Request, res: Response) {
  try {
    const userId = req.user!.userId;
    const { limit = 20, unreadOnly } = req.query;

    const notifications = await prisma.notification.findMany({
      where: {
        userId,
        ...(unreadOnly === 'true' && { read: false }),
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: parseInt(limit as string),
    });

    // Count unread notifications
    const unreadCount = await prisma.notification.count({
      where: {
        userId,
        read: false,
      },
    });

    res.json({
      success: true,
      data: {
        notifications,
        unreadCount,
      },
    });
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message,
    });
  }
}

// Mark notification as read
export async function markAsRead(req: Request, res: Response) {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const notification = await prisma.notification.update({
      where: {
        id,
        userId, // Ensure user owns this notification
      },
      data: {
        read: true,
      },
    });

    res.json({
      success: true,
      message: 'Notification marked as read',
      data: notification,
    });
  } catch (error: any) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: error.message,
    });
  }
}

// Mark all notifications as read
export async function markAllAsRead(req: Request, res: Response) {
  try {
    const userId = req.user!.userId;

    await prisma.notification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: {
        read: true,
      },
    });

    res.json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error: any) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notifications as read',
      error: error.message,
    });
  }
}

// Delete notification
export async function deleteNotification(req: Request, res: Response) {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    await prisma.notification.delete({
      where: {
        id,
        userId, // Ensure user owns this notification
      },
    });

    res.json({
      success: true,
      message: 'Notification deleted',
    });
  } catch (error: any) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification',
      error: error.message,
    });
  }
}
