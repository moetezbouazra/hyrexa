import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get admin statistics
export async function getAdminStats(req: Request, res: Response) {
  try {
    const [totalUsers, totalReports, totalCleanups, pendingReports, pendingCleanups] = await Promise.all([
      prisma.user.count(),
      prisma.wasteReport.count(),
      prisma.cleanupActivity.count(),
      prisma.wasteReport.count({ where: { status: 'PENDING_REVIEW' } }),
      prisma.cleanupActivity.count({ where: { status: 'PENDING_VERIFICATION' } }),
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        totalReports,
        totalCleanups,
        pendingReports,
        pendingCleanups,
      },
    });
  } catch (error: any) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch admin statistics',
      error: error.message,
    });
  }
}

// Approve waste report
export async function approveWasteReport(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const report = await prisma.wasteReport.update({
      where: { id },
      data: {
        status: 'APPROVED',
      },
    });

    // Create notification for user
    await prisma.notification.create({
      data: {
        userId: report.userId,
        type: 'REPORT_APPROVED',
        title: 'Report Approved',
        message: 'Your waste report has been approved by our team.',
        relatedId: report.id,
      },
    });

    res.json({
      success: true,
      message: 'Report approved successfully',
      data: report,
    });
  } catch (error: any) {
    console.error('Error approving report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve report',
      error: error.message,
    });
  }
}

// Reject waste report
export async function rejectWasteReport(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;

    const report = await prisma.wasteReport.update({
      where: { id },
      data: {
        status: 'REJECTED',
        adminNotes: adminNotes || 'Report rejected by admin',
      },
    });

    // Create notification for user
    await prisma.notification.create({
      data: {
        userId: report.userId,
        type: 'REPORT_REJECTED',
        title: 'Report Rejected',
        message: adminNotes || 'Your waste report has been rejected.',
        relatedId: report.id,
      },
    });

    res.json({
      success: true,
      message: 'Report rejected successfully',
      data: report,
    });
  } catch (error: any) {
    console.error('Error rejecting report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject report',
      error: error.message,
    });
  }
}

// Verify cleanup activity
export async function verifyCleanup(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { pointsAwarded } = req.body;

    if (!pointsAwarded || typeof pointsAwarded !== 'number') {
      return res.status(400).json({
        success: false,
        message: 'Points awarded is required',
      });
    }

    const cleanup = await prisma.cleanupActivity.update({
      where: { id },
      data: {
        status: 'VERIFIED',
        carbonPointsAwarded: pointsAwarded,
      },
    });

    // Update user's carbon points
    await prisma.user.update({
      where: { id: cleanup.userId },
      data: {
        carbonPoints: {
          increment: pointsAwarded,
        },
      },
    });

    // Create notification for user
    await prisma.notification.create({
      data: {
        userId: cleanup.userId,
        type: 'CLEANUP_VERIFIED',
        title: 'Cleanup Verified!',
        message: `Your cleanup has been verified! You earned ${pointsAwarded} carbon points.`,
        relatedId: cleanup.id,
      },
    });

    // Check for achievements
    await checkCleanupAchievements(cleanup.userId);

    res.json({
      success: true,
      message: 'Cleanup verified successfully',
      data: cleanup,
    });
  } catch (error: any) {
    console.error('Error verifying cleanup:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify cleanup',
      error: error.message,
    });
  }
}

// Reject cleanup activity
export async function rejectCleanup(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;

    const cleanup = await prisma.cleanupActivity.update({
      where: { id },
      data: {
        status: 'REJECTED',
        adminNotes: adminNotes || 'Cleanup rejected by admin',
      },
    });

    // Create notification for user
    await prisma.notification.create({
      data: {
        userId: cleanup.userId,
        type: 'CLEANUP_REJECTED',
        title: 'Cleanup Rejected',
        message: adminNotes || 'Your cleanup submission has been rejected.',
        relatedId: cleanup.id,
      },
    });

    res.json({
      success: true,
      message: 'Cleanup rejected successfully',
      data: cleanup,
    });
  } catch (error: any) {
    console.error('Error rejecting cleanup:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject cleanup',
      error: error.message,
    });
  }
}

// Get all users (admin)
export async function getAllUsers(req: Request, res: Response) {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        carbonPoints: true,
        createdAt: true,
        profileImage: true,
        _count: {
          select: {
            wasteReports: true,
            cleanupActivities: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      success: true,
      data: users,
    });
  } catch (error: any) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message,
    });
  }
}

// Update user role (admin)
export async function updateUserRole(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['USER', 'ADMIN', 'MODERATOR'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role',
      });
    }

    const user = await prisma.user.update({
      where: { id },
      data: { role },
    });

    res.json({
      success: true,
      message: 'User role updated successfully',
      data: user,
    });
  } catch (error: any) {
    console.error('Error updating user role:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user role',
      error: error.message,
    });
  }
}

// Helper function to check for cleanup achievements
async function checkCleanupAchievements(userId: string) {
  try {
    const cleanupCount = await prisma.cleanupActivity.count({
      where: {
        userId,
        status: 'VERIFIED',
      },
    });

    // Check for "First Cleanup" achievement
    if (cleanupCount === 1) {
      const achievement = await prisma.achievement.findFirst({
        where: { identifier: 'first-cleanup' },
      });

      if (achievement) {
        await prisma.userAchievement.create({
          data: {
            userId,
            achievementId: achievement.id,
          },
        });

        await prisma.notification.create({
          data: {
            userId,
            type: 'ACHIEVEMENT_UNLOCKED',
            title: 'Achievement Unlocked!',
            message: `You've unlocked: ${achievement.name}`,
            relatedId: achievement.id,
          },
        });
      }
    }

    // Check for "Cleanup Master" achievement (10 cleanups)
    if (cleanupCount === 10) {
      const achievement = await prisma.achievement.findFirst({
        where: { identifier: 'cleanup-master' },
      });

      if (achievement) {
        await prisma.userAchievement.create({
          data: {
            userId,
            achievementId: achievement.id,
          },
        });

        await prisma.notification.create({
          data: {
            userId,
            type: 'ACHIEVEMENT_UNLOCKED',
            title: 'Achievement Unlocked!',
            message: `You've unlocked: ${achievement.name}`,
            relatedId: achievement.id,
          },
        });
      }
    }
  } catch (error) {
    console.error('Error checking achievements:', error);
  }
}
