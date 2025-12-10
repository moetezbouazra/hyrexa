import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get user's streak
export async function getUserStreak(req: Request, res: Response) {
  try {
    const userId = req.user!.userId;

    let streak = await prisma.dailyStreak.findUnique({
      where: { userId },
    });

    if (!streak) {
      // Create initial streak
      streak = await prisma.da
      
      ilyStreak.create({
        data: {
          userId,
          currentStreak: 0,
          longestStreak: 0,
          lastActiveDate: new Date(),
        },
      });
    }

    res.json({
      success: true,
      data: streak,
    });
  } catch (error: any) {
    console.error('Error fetching streak:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch streak',
      error: error.message,
    });
  }
}

// Update user's streak (called after cleanup or report)
export async function updateUserStreak(req: Request, res: Response) {
  try {
    const userId = req.user!.userId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let streak = await prisma.dailyStreak.findUnique({
      where: { userId },
    });

    if (!streak) {
      // Create initial streak
      streak = await prisma.dailyStreak.create({
        data: {
          userId,
          currentStreak: 1,
          longestStreak: 1,
          lastActiveDate: today,
        },
      });

      return res.json({
        success: true,
        message: 'Streak started!',
        data: streak,
      });
    }

    const lastActive = new Date(streak.lastActiveDate);
    lastActive.setHours(0, 0, 0, 0);

    const daysDiff = Math.floor(
      (today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24)
    );

    let newStreak = streak.currentStreak;
    let bonusPoints = 0;

    if (daysDiff === 0) {
      // Same day, no streak update
      return res.json({
        success: true,
        message: 'Already active today',
        data: streak,
        bonusPoints: 0,
      });
    } else if (daysDiff === 1) {
      // Consecutive day, increment streak
      newStreak = streak.currentStreak + 1;
      bonusPoints = Math.min(newStreak * 5, 50); // Max 50 bonus points

      // Award bonus points
      await prisma.user.update({
        where: { id: userId },
        data: {
          carbonPoints: {
            increment: bonusPoints,
          },
        },
      });
    } else {
      // Streak broken, reset to 1
      newStreak = 1;
    }

    const updatedStreak = await prisma.dailyStreak.update({
      where: { userId },
      data: {
        currentStreak: newStreak,
        longestStreak: Math.max(newStreak, streak.longestStreak),
        lastActiveDate: today,
      },
    });

    // Check for streak achievements
    await checkStreakAchievements(userId, newStreak);

    res.json({
      success: true,
      message:
        daysDiff === 1
          ? `${newStreak} day streak! Earned ${bonusPoints} bonus points`
          : 'Activity recorded',
      data: updatedStreak,
      bonusPoints,
    });
  } catch (error: any) {
    console.error('Error updating streak:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update streak',
      error: error.message,
    });
  }
}

// Helper function to check for streak achievements
async function checkStreakAchievements(userId: string, streakCount: number) {
  try {
    const achievementMap: { [key: number]: string } = {
      7: 'week-warrior',
      30: 'month-champion',
      100: 'century-streak',
    };

    const identifier = achievementMap[streakCount];
    if (!identifier) return;

    const achievement = await prisma.achievement.findUnique({
      where: { identifier },
    });

    if (!achievement) return;

    // Check if user already has this achievement
    const existing = await prisma.userAchievement.findFirst({
      where: {
        userId,
        achievementId: achievement.id,
      },
    });

    if (existing) return;

    // Award achievement
    await prisma.userAchievement.create({
      data: {
        userId,
        achievementId: achievement.id,
      },
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId,
        type: 'ACHIEVEMENT_UNLOCKED',
        title: 'Achievement Unlocked!',
        message: `You've unlocked: ${achievement.name}`,
        data: { achievementId: achievement.id },
      },
    });
  } catch (error) {
    console.error('Error checking streak achievements:', error);
  }
}
