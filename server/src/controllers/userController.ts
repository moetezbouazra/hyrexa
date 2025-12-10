import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database.js';
import { AppError, asyncHandler } from '../utils/errorHandler.js';

// Get user profile by username
export const getUserProfile = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { username } = req.params;

    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        profileImage: true,
        carbonPoints: true,
        createdAt: true,
        _count: {
          select: {
            wasteReports: true,
            cleanupActivities: {
              where: { status: 'APPROVED' },
            },
          },
        },
        achievements: {
          include: {
            achievement: true,
          },
          orderBy: {
            unlockedAt: 'desc',
          },
        },
        cleanupActivities: {
          where: { status: 'APPROVED' },
          orderBy: {
            verifiedAt: 'desc',
          },
          take: 10,
          include: {
            wasteReport: {
              select: {
                id: true,
                latitude: true,
                longitude: true,
                wasteType: true,
                severity: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    res.status(200).json({
      success: true,
      data: { user },
    });
  }
);

// Get leaderboard
export const getLeaderboard = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { period = 'all', limit = 10 } = req.query;

    let dateFilter: any = {};

    if (period === 'weekly') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      dateFilter = { createdAt: { gte: weekAgo } };
    } else if (period === 'monthly') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      dateFilter = { createdAt: { gte: monthAgo } };
    }

    const users = await prisma.user.findMany({
      where: dateFilter,
      orderBy: {
        carbonPoints: 'desc',
      },
      take: parseInt(limit as string),
      select: {
        id: true,
        username: true,
        profileImage: true,
        carbonPoints: true,
        _count: {
          select: {
            cleanupActivities: {
              where: { status: 'APPROVED' },
            },
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: { users },
    });
  }
);

// Update user profile
export const updateProfile = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Unauthorized', 401));
    }

    const { username, profileImage } = req.body;
    const userId = req.user.userId;

    // Check if username is already taken
    if (username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          username,
          NOT: { id: userId },
        },
      });

      if (existingUser) {
        return next(new AppError('Username already taken', 400));
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(username && { username }),
        ...(profileImage && { profileImage }),
      },
      select: {
        id: true,
        email: true,
        username: true,
        profileImage: true,
        carbonPoints: true,
        role: true,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: { user: updatedUser },
    });
  }
);

// Get user statistics
export const getUserStats = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Unauthorized', 401));
    }

    const userId = req.user.userId;

    const [user, totalCleanups, totalReports, achievements] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { carbonPoints: true },
      }),
      prisma.cleanupActivity.count({
        where: { userId, status: 'APPROVED' },
      }),
      prisma.wasteReport.count({
        where: { reporterId: userId },
      }),
      prisma.userAchievement.count({
        where: { userId },
      }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        carbonPoints: user?.carbonPoints || 0,
        totalCleanups,
        totalReports,
        achievementsCount: achievements,
      },
    });
  }
);

// Get user recent activities
export const getUserActivities = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Unauthorized', 401));
    }

    const userId = req.user.userId;
    const limit = parseInt(req.query.limit as string) || 10;

    // Get recent cleanups
    const cleanups = await prisma.cleanupActivity.findMany({
      where: { userId, status: 'APPROVED' },
      orderBy: { verifiedAt: 'desc' },
      take: limit,
      include: {
        wasteReport: {
          select: {
            wasteType: true,
            severity: true,
          },
        },
      },
    });

    // Get recent waste reports
    const reports = await prisma.wasteReport.findMany({
      where: { reporterId: userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        wasteType: true,
        severity: true,
        status: true,
        createdAt: true,
      },
    });

    // Get recent achievements
    const achievementsUnlocked = await prisma.userAchievement.findMany({
      where: { userId },
      orderBy: { unlockedAt: 'desc' },
      take: limit,
      include: {
        achievement: true,
      },
    });

    // Combine and format activities
    const activities = [
      ...cleanups.map((cleanup) => ({
        id: cleanup.id,
        type: 'cleanup' as const,
        title: 'Cleanup Verified',
        description: `${cleanup.wasteReport.wasteType} cleanup completed`,
        date: cleanup.verifiedAt?.toISOString() || cleanup.createdAt.toISOString(),
        points: cleanup.pointsAwarded,
      })),
      ...reports.map((report) => ({
        id: report.id,
        type: 'report' as const,
        title: 'Waste Reported',
        description: `${report.wasteType} - ${report.severity} severity`,
        date: report.createdAt.toISOString(),
        points: undefined,
      })),
      ...achievementsUnlocked.map((ua) => ({
        id: ua.id,
        type: 'achievement' as const,
        title: `Achievement Unlocked: ${ua.achievement.name}`,
        description: ua.achievement.description,
        date: ua.unlockedAt.toISOString(),
        points: ua.achievement.requiredPoints,
      })),
    ]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);

    res.status(200).json({
      success: true,
      data: activities,
    });
  }
);

// Get user achievements
export const getUserAchievements = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Unauthorized', 401));
    }

    const userId = req.user.userId;

    const userAchievements = await prisma.userAchievement.findMany({
      where: { userId },
      include: {
        achievement: true,
      },
      orderBy: {
        unlockedAt: 'desc',
      },
    });

    const achievements = userAchievements.map((ua) => ({
      id: ua.achievement.id,
      name: ua.achievement.name,
      description: ua.achievement.description,
      icon: ua.achievement.icon,
      points: ua.achievement.requiredPoints,
      unlockedAt: ua.unlockedAt.toISOString(),
    }));

    res.status(200).json({
      success: true,
      data: achievements,
    });
  }
);
