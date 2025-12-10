import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Create a team
export async function createTeam(req: Request, res: Response) {
  try {
    const userId = req.user!.userId;
    const { name, description } = req.body;

    if (!name || name.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Team name must be at least 3 characters',
      });
    }

    const team = await prisma.team.create({
      data: {
        name,
        description,
        createdBy: userId,
        members: {
          create: {
            userId,
            role: 'ADMIN',
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                profileImage: true,
                carbonPoints: true,
              },
            },
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Team created successfully',
      data: team,
    });
  } catch (error: any) {
    console.error('Error creating team:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create team',
      error: error.message,
    });
  }
}

// Get all teams
export async function getTeams(req: Request, res: Response) {
  try {
    const teams = await prisma.team.findMany({
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                profileImage: true,
                carbonPoints: true,
              },
            },
          },
        },
        _count: {
          select: {
            members: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      success: true,
      data: teams,
    });
  } catch (error: any) {
    console.error('Error fetching teams:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch teams',
      error: error.message,
    });
  }
}

// Get single team
export async function getTeam(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                profileImage: true,
                carbonPoints: true,
              },
            },
          },
        },
      },
    });

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found',
      });
    }

    res.json({
      success: true,
      data: team,
    });
  } catch (error: any) {
    console.error('Error fetching team:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch team',
      error: error.message,
    });
  }
}

// Join a team
export async function joinTeam(req: Request, res: Response) {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    // Check if user is already a member
    const existing = await prisma.teamMembership.findFirst({
      where: {
        userId,
        teamId: id,
      },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Already a member of this team',
      });
    }

    const membership = await prisma.teamMembership.create({
      data: {
        userId,
        teamId: id,
        role: 'MEMBER',
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profileImage: true,
          },
        },
        team: true,
      },
    });

    res.json({
      success: true,
      message: 'Joined team successfully',
      data: membership,
    });
  } catch (error: any) {
    console.error('Error joining team:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to join team',
      error: error.message,
    });
  }
}

// Leave a team
export async function leaveTeam(req: Request, res: Response) {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const membership = await prisma.teamMembership.findFirst({
      where: {
        userId,
        teamId: id,
      },
    });

    if (!membership) {
      return res.status(404).json({
        success: false,
        message: 'Not a member of this team',
      });
    }

    await prisma.teamMembership.delete({
      where: { id: membership.id },
    });

    res.json({
      success: true,
      message: 'Left team successfully',
    });
  } catch (error: any) {
    console.error('Error leaving team:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to leave team',
      error: error.message,
    });
  }
}

// Get team leaderboard (by total team points)
export async function getTeamLeaderboard(req: Request, res: Response) {
  try {
    const teams = await prisma.team.findMany({
      include: {
        members: {
          include: {
            user: {
              select: {
                carbonPoints: true,
              },
            },
          },
        },
        _count: {
          select: {
            members: true,
          },
        },
      },
    });

    // Calculate total points for each team
    const teamsWithPoints = teams.map((team) => {
      const totalPoints = team.members.reduce(
        (sum, member) => sum + member.user.carbonPoints,
        0
      );
      return {
        ...team,
        totalPoints,
      };
    });

    // Sort by total points
    teamsWithPoints.sort((a, b) => b.totalPoints - a.totalPoints);

    res.json({
      success: true,
      data: teamsWithPoints,
    });
  } catch (error: any) {
    console.error('Error fetching team leaderboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch team leaderboard',
      error: error.message,
    });
  }
}
