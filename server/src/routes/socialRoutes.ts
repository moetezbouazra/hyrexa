import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  createPost,
  getPosts,
  getPost,
  getUserPosts,
  deletePost,
  addComment,
  deleteComment,
  toggleLike,
} from '../controllers/socialController';

const router = express.Router();

// Get all posts (feed) - public
router.get('/', authenticate, getPosts);

// Get single post - public
router.get('/:id', authenticate, getPost);

// Get user's posts - public
router.get('/user/:username', authenticate, getUserPosts);

// Create post - protected
router.post('/', authenticate, createPost);

// Delete post - protected
router.delete('/:id', authenticate, deletePost);

// Add comment - protected
router.post('/:id/comments', authenticate, addComment);

// Delete comment - protected
router.delete('/comments/:commentId', authenticate, deleteComment);

// Toggle like - protected
router.post('/:id/like', authenticate, toggleLike);

export default router;
