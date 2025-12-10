import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { validationResult } from 'express-validator';
import prisma from '../config/database.js';
import { generateToken } from '../utils/jwt.js';
import { AppError, asyncHandler } from '../utils/errorHandler.js';
import axios from 'axios';

// Register with email/password
export const register = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError(errors.array()[0].msg, 400));
    }

    const { email, username, password } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      return next(new AppError('Email or username already in use', 400));
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        role: 'USER',
      },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        carbonPoints: true,
        profileImage: true,
        createdAt: true,
      },
    });

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user,
        token,
      },
    });
  }
);

// Login with email/password
export const login = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError(errors.array()[0].msg, 400));
    }

    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.password) {
      return next(new AppError('Invalid email or password', 401));
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return next(new AppError('Invalid email or password', 401));
    }

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
          carbonPoints: user.carbonPoints,
          profileImage: user.profileImage,
        },
        token,
      },
    });
  }
);

// Google OAuth login/register
export const googleAuth = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { credential } = req.body;

    if (!credential) {
      return next(new AppError('Google credential is required', 400));
    }

    try {
      // Verify Google token
      const response = await axios.get(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`
      );

      const { email, sub: googleId, name, picture } = response.data;

      if (!email) {
        return next(new AppError('Unable to get email from Google', 400));
      }

      // Check if user exists
      let user = await prisma.user.findFirst({
        where: {
          OR: [{ email }, { googleId }],
        },
      });

      // Create user if doesn't exist
      if (!user) {
        // Generate unique username from email
        const baseUsername = email.split('@')[0];
        let username = baseUsername;
        let counter = 1;

        // Ensure username is unique
        while (await prisma.user.findUnique({ where: { username } })) {
          username = `${baseUsername}${counter}`;
          counter++;
        }

        user = await prisma.user.create({
          data: {
            email,
            username,
            googleId,
            profileImage: picture,
            role: 'USER',
          },
        });
      } else if (!user.googleId) {
        // Link Google account to existing email account
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            googleId,
            profileImage: user.profileImage || picture,
          },
        });
      }

      // Generate token
      const token = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      res.status(200).json({
        success: true,
        message: 'Google authentication successful',
        data: {
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            role: user.role,
            carbonPoints: user.carbonPoints,
            profileImage: user.profileImage,
          },
          token,
        },
      });
    } catch (error: any) {
      return next(new AppError('Invalid Google token', 400));
    }
  }
);

// Get current user profile
export const getMe = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Unauthorized', 401));
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        carbonPoints: true,
        profileImage: true,
        createdAt: true,
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

// Change password
export const changePassword = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user!.userId;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return next(new AppError('Current password and new password are required', 400));
    }

    if (newPassword.length < 6) {
      return next(new AppError('New password must be at least 6 characters', 400));
    }

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.password) {
      return next(new AppError('User not found', 404));
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return next(new AppError('Current password is incorrect', 401));
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
      },
    });

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  }
);
