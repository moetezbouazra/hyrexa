import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Create a social post
export async function createPost(req: Request, res: Response) {
  try {
    const userId = req.user!.userId;
    const { content, photos } = req.body;

    if (!content && (!photos || photos.length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'Post must have content or photos',
      });
    }

    const post = await prisma.socialPost.create({
      data: {
        userId,
        content,
        photos: photos || [],
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profileImage: true,
          },
        },
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data: post,
    });
  } catch (error: any) {
    console.error('Error creating post:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create post',
      error: error.message,
    });
  }
}

// Get all posts (feed)
export async function getPosts(req: Request, res: Response) {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const posts = await prisma.socialPost.findMany({
      skip,
      take: parseInt(limit as string),
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profileImage: true,
            carbonPoints: true,
          },
        },
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
      },
    });

    // Check if current user has liked each post
    const userId = req.user?.userId;
    const postsWithLikeStatus = await Promise.all(
      posts.map(async (post) => {
        const userLike = userId
          ? await prisma.postLike.findUnique({
              where: {
                userId_postId: {
                  userId,
                  postId: post.id,
                },
              },
            })
          : null;

        return {
          ...post,
          isLiked: !!userLike,
        };
      })
    );

    const total = await prisma.socialPost.count();

    res.json({
      success: true,
      data: {
        posts: postsWithLikeStatus,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          pages: Math.ceil(total / parseInt(limit as string)),
        },
      },
    });
  } catch (error: any) {
    console.error('Error fetching posts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch posts',
      error: error.message,
    });
  }
}

// Get single post with comments
export async function getPost(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    const post = await prisma.socialPost.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profileImage: true,
            carbonPoints: true,
          },
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                profileImage: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
      },
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    // Check if current user has liked this post
    const userLike = userId
      ? await prisma.postLike.findUnique({
          where: {
            userId_postId: {
              userId,
              postId: post.id,
            },
          },
        })
      : null;

    res.json({
      success: true,
      data: {
        ...post,
        isLiked: !!userLike,
      },
    });
  } catch (error: any) {
    console.error('Error fetching post:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch post',
      error: error.message,
    });
  }
}

// Get user's posts
export async function getUserPosts(req: Request, res: Response) {
  try {
    const { username } = req.params;
    const currentUserId = req.user?.userId;

    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const posts = await prisma.socialPost.findMany({
      where: { userId: user.id },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profileImage: true,
          },
        },
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
      },
    });

    // Check if current user has liked each post
    const postsWithLikeStatus = await Promise.all(
      posts.map(async (post) => {
        const userLike = currentUserId
          ? await prisma.postLike.findUnique({
              where: {
                userId_postId: {
                  userId: currentUserId,
                  postId: post.id,
                },
              },
            })
          : null;

        return {
          ...post,
          isLiked: !!userLike,
        };
      })
    );

    res.json({
      success: true,
      data: postsWithLikeStatus,
    });
  } catch (error: any) {
    console.error('Error fetching user posts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user posts',
      error: error.message,
    });
  }
}

// Delete post
export async function deletePost(req: Request, res: Response) {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    // Check if post exists and belongs to user
    const post = await prisma.socialPost.findUnique({
      where: { id },
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    if (post.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own posts',
      });
    }

    await prisma.socialPost.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Post deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting post:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete post',
      error: error.message,
    });
  }
}

// Add comment
export async function addComment(req: Request, res: Response) {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Comment content is required',
      });
    }

    const comment = await prisma.comment.create({
      data: {
        postId: id,
        userId,
        content,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profileImage: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: comment,
    });
  } catch (error: any) {
    console.error('Error adding comment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add comment',
      error: error.message,
    });
  }
}

// Delete comment
export async function deleteComment(req: Request, res: Response) {
  try {
    const userId = req.user!.userId;
    const { commentId } = req.params;

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found',
      });
    }

    if (comment.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own comments',
      });
    }

    await prisma.comment.delete({
      where: { id: commentId },
    });

    res.json({
      success: true,
      message: 'Comment deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting comment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete comment',
      error: error.message,
    });
  }
}

// Toggle like
export async function toggleLike(req: Request, res: Response) {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    // Check if like exists
    const existingLike = await prisma.postLike.findUnique({
      where: {
        userId_postId: {
          userId,
          postId: id,
        },
      },
    });

    if (existingLike) {
      // Unlike
      await prisma.postLike.delete({
        where: {
          userId_postId: {
            userId,
            postId: id,
          },
        },
      });

      res.json({
        success: true,
        message: 'Post unliked',
        data: { isLiked: false },
      });
    } else {
      // Like
      await prisma.postLike.create({
        data: {
          userId,
          postId: id,
        },
      });

      res.json({
        success: true,
        message: 'Post liked',
        data: { isLiked: true },
      });
    }
  } catch (error: any) {
    console.error('Error toggling like:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle like',
      error: error.message,
    });
  }
}
