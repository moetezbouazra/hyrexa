import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Create a challenge (Admin only)
export async function createChallenge(req: Request, res: Response) {
  try {
    const userId = req.user!.userId;
    const { title, description, pointsReward, startDate, endDate, targetCount } = req.body;

    if (!title || !description || !pointsReward) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, and points reward are required',
      });
    }

    const challenge = await prisma.challenge.create({
      data: {
        title,
        description,
        pointsReward: parseInt(pointsReward),
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : null,
        targetCount: targetCount ? parseInt(targetCount) : null,
        createdBy: userId,
      },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Challenge created successfully',
      data: challenge,
    });
  } catch (error: any) {
    console.error('Error creating challenge:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create challenge',
      error: error.message,
    });
  }
}

// Get all challenges
export async function getChallenges(req: Request, res: Response) {
  try {
    const { active } = req.query;
    const now = new Date();

    const where: any = {};

    if (active === 'true') {
      where.startDate = { lte: now };
      where.OR = [{ endDate: null }, { endDate: { gte: now } }];
    }

    const challenges = await prisma.challenge.findMany({
      where,
      select: {
        id: true,
        title: true,
        description: true,
        pointsReward: true,
        startDate: true,
        endDate: true,
        targetCount: true,
        createdAt: true,
        createdBy: true,
        creator: {
          select: {
            id: true,
            username: true,
          },
        },
      },
      orderBy: {
        startDate: 'desc',
      },
    });

    res.json({
      success: true,
      data: challenges,
    });
  } catch (error: any) {
    console.error('Error fetching challenges:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch challenges',
      error: error.message,
    });
  }
}

// Get single challenge
export async function getChallenge(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const challenge = await prisma.challenge.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        pointsReward: true,
        startDate: true,
        endDate: true,
        targetCount: true,
        createdAt: true,
        createdBy: true,
        creator: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'Challenge not found',
      });
    }

    res.json({
      success: true,
      data: challenge,
    });
  } catch (error: any) {
    console.error('Error fetching challenge:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch challenge',
      error: error.message,
    });
  }
}

// Delete challenge (Admin only)
export async function deleteChallenge(req: Request, res: Response) {
  try {
    const { id } = req.params;

    await prisma.challenge.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Challenge deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting challenge:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete challenge',
      error: error.message,
    });
  }
}
