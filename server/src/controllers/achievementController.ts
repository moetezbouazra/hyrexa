import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database.js';
import { AppError, asyncHandler } from '../utils/errorHandler.js';

/**
 * Get all achievements
 */
export const getAchievements = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const achievements = await prisma.achievement.findMany({
      orderBy: [{ requiredPoints: 'asc' }, { name: 'asc' }],
    });

    res.status(200).json({
      success: true,
      data: { achievements },
    });
  }
);

/**
 * Get user achievements
 */
export const getUserAchievements = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.params;

    const userAchievements = await prisma.userAchievement.findMany({
      where: { userId },
      include: {
        achievement: true,
      },
      orderBy: { unlockedAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      data: { achievements: userAchievements },
    });
  }
);

/**
 * Check and unlock achievements for a user
 */
export const checkAchievements = async (userId: string): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      achievements: {
        include: { achievement: true },
      },
      _count: {
        select: {
          cleanupActivities: {
            where: { status: 'APPROVED' },
          },
        },
      },
    },
  });

  if (!user) return;

  // Get all achievements
  const allAchievements = await prisma.achievement.findMany();
  const unlockedIds = user.achievements.map((ua) => ua.achievementId);

  // Check each achievement
  for (const achievement of allAchievements) {
    if (unlockedIds.includes(achievement.id)) continue;

    let shouldUnlock = false;

    // Check based on carbon points
    if (achievement.requiredPoints <= user.carbonPoints) {
      shouldUnlock = true;
    }

    // Special achievement checks
    if (achievement.name === 'First Cleanup' && user._count.cleanupActivities >= 1) {
      shouldUnlock = true;
    }
    if (achievement.name === '100 Club' && user._count.cleanupActivities >= 100) {
      shouldUnlock = true;
    }

    if (shouldUnlock) {
      await prisma.userAchievement.create({
        data: {
          userId,
          achievementId: achievement.id,
        },
      });

      // TODO: Send notification about achievement unlock
    }
  }
};

/**
 * Create achievement (Admin only)
 */
export const createAchievement = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || req.user.role !== 'ADMIN') {
      return next(new AppError('Admin access required', 403));
    }

    const { name, description, icon, requiredPoints, category, tier, isSpecial } = req.body;

    const achievement = await prisma.achievement.create({
      data: {
        name,
        description,
        icon,
        requiredPoints,
        category,
        tier,
        isSpecial: isSpecial || false,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Achievement created successfully',
      data: { achievement },
    });
  }
);
