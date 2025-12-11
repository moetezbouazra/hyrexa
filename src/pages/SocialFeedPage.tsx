import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Leaf,
  MapPin,
  Trophy,
  LogOut,
  Heart,
  MessageCircle,
  Send,
  Image as ImageIcon,
  X,
  Trash2,
  Menu,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/store/authStore';
import NotificationDropdown from '@/components/NotificationDropdown';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

interface User {
  id: string;
  username: string;
  profileImage: string | null;
  carbonPoints?: number;
}

interface Post {
  id: string;
  content: string;
  photos: string[];
  createdAt: string;
  user: User;
  _count: {
    comments: number;
    likes: number;
  };
  isLiked: boolean;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: User;
}

export default function SocialFeedPage() {
  const { user, logout } = useAuthStore();
  const queryClient = useQueryClient();

  const [postContent, setPostContent] = useState('');
  const [postPhotos, setPostPhotos] = useState<File[]>([]);
  const [photoPreview, setPhotoPreview] = useState<string[]>([]);
  const [selectedPost, setSelectedPost] = useState<string | null>(null);
  const [commentContent, setCommentContent] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Fetch posts
  const { data: postsData, isLoading } = useQuery({
    queryKey: ['social-posts'],
    queryFn: async () => {
      const response = await api.get('/social');
      return response.data.data;
    },
  });

  const posts: Post[] = postsData?.posts || [];

  // Fetch comments for selected post
  const { data: postDetail } = useQuery({
    queryKey: ['post-detail', selectedPost],
    queryFn: async () => {
      if (!selectedPost) return null;
      const response = await api.get(`/social/${selectedPost}`);
      return response.data.data;
    },
    enabled: !!selectedPost,
  });

  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await api.post('/social', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-posts'] });
      setPostContent('');
      setPostPhotos([]);
      setPhotoPreview([]);
      toast.success('Post created successfully');
    },
    onError: () => {
      toast.error('Failed to create post');
    },
  });

  // Toggle like mutation
  const toggleLikeMutation = useMutation({
    mutationFn: async (postId: string) => {
      const response = await api.post(`/social/${postId}/like`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-posts'] });
      queryClient.invalidateQueries({ queryKey: ['post-detail'] });
    },
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async ({ postId, content }: { postId: string; content: string }) => {
      const response = await api.post(`/social/${postId}/comments`, { content });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post-detail', selectedPost] });
      queryClient.invalidateQueries({ queryKey: ['social-posts'] });
      setCommentContent('');
    },
    onError: () => {
      toast.error('Failed to add comment');
    },
  });

  // Delete post mutation
  const deletePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      await api.delete(`/social/${postId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-posts'] });
      toast.success('Post deleted');
    },
    onError: () => {
      toast.error('Failed to delete post');
    },
  });

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + postPhotos.length > 4) {
      toast.error('Maximum 4 photos allowed');
      return;
    }

    // Just store files and create previews, don't upload yet
    setPostPhotos((prev) => [...prev, ...files]);
    files.forEach((file) => {
      setPhotoPreview((prev) => [...prev, URL.createObjectURL(file)]);
    });
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim() && postPhotos.length === 0) {
      toast.error('Post must have content or photos');
      return;
    }

    // Upload photos and collect keys
    const photoKeys: string[] = [];
    for (const file of postPhotos) {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      try {
        const response = await api.post('/upload', uploadFormData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        photoKeys.push(response.data.data.key);
      } catch (error) {
        toast.error('Failed to upload photo');
        return;
      }
    }

    // Create post with content and photo keys
    try {
      const response = await api.post('/social', {
        content: postContent,
        photos: photoKeys,
      });
      
      queryClient.invalidateQueries({ queryKey: ['social-posts'] });
      setPostContent('');
      setPostPhotos([]);
      setPhotoPreview([]);
      toast.success('Post created successfully');
    } catch (error) {
      toast.error('Failed to create post');
    }
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim() || !selectedPost) return;
    addCommentMutation.mutate({ postId: selectedPost, content: commentContent });
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-nature-green-50 via-white to-nature-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="bg-nature-green-100 rounded-full p-2">
                <Leaf className="w-6 h-6 text-nature-green-600" />
              </div>
              <span className="text-xl font-bold text-gray-900">Hyrexa</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-2 md:gap-4">
              <Link to="/dashboard" className="hidden md:block">
                <Button variant="ghost" size="sm" className="md:size-default">Dashboard</Button>
              </Link>
              <Link to="/map" className="hidden lg:block">
                <Button variant="ghost">
                  <MapPin className="w-4 h-4 mr-2" />
                  Map
                </Button>
              </Link>
              <Link to="/leaderboard" className="hidden lg:block">
                <Button variant="ghost">
                  <Trophy className="w-4 h-4 mr-2" />
                  Leaderboard
                </Button>
              </Link>
              <Link to="/social">
                <Button variant="ghost" size="sm" className="md:size-default">Feed</Button>
              </Link>
              <Link to="/teams" className="hidden lg:block">
                <Button variant="ghost">Teams</Button>
              </Link>
              <Link to="/challenges" className="hidden lg:block">
                <Button variant="ghost">Challenges</Button>
              </Link>
              <Link to={`/profile/${user?.username}`} className="hidden md:block">
                <Button variant="ghost">Profile</Button>
              </Link>
              {user?.role === 'ADMIN' && (
                <Link to="/admin" className="hidden md:block">
                  <Button variant="ghost">Admin</Button>
                </Link>
              )}
              <NotificationDropdown />
              <Button variant="outline" onClick={handleLogout} size="sm" className="md:size-default">
                <LogOut className="w-4 h-4 md:mr-2" />
                <span className="hidden md:inline">Logout</span>
              </Button>
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-md hover:bg-gray-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Navigation Dropdown */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="lg:hidden border-t"
              >
                <nav className="py-4 space-y-2">
                  <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start">Dashboard</Button>
                  </Link>
                  <Link to="/map" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start">
                      <MapPin className="w-4 h-4 mr-2" />
                      Map
                    </Button>
                  </Link>
                  <Link to="/leaderboard" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start">
                      <Trophy className="w-4 h-4 mr-2" />
                      Leaderboard
                    </Button>
                  </Link>
                  <Link to="/social" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start">Feed</Button>
                  </Link>
                  <Link to="/teams" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start">Teams</Button>
                  </Link>
                  <Link to="/challenges" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start">Challenges</Button>
                  </Link>
                  <Link to={`/profile/${user?.username}`} onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start">Profile</Button>
                  </Link>
                  {user?.role === 'ADMIN' && (
                    <Link to="/admin" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start">Admin</Button>
                    </Link>
                  )}
                  <Button variant="outline" onClick={handleLogout} className="w-full justify-start">
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                </nav>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Community Feed</h1>

          {/* Create Post Card */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <form onSubmit={handleCreatePost} className="space-y-4">
                <textarea
                  placeholder="Share your cleanup story or environmental tips..."
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md min-h-[100px] resize-none focus:ring-2 focus:ring-nature-green-500 focus:border-transparent"
                />

                {/* Photo Preview */}
                {photoPreview.length > 0 && (
                  <div className="grid grid-cols-4 gap-2">
                    {photoPreview.map((preview, index) => (
                      <div key={index} className="relative">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-20 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setPhotoPreview(photoPreview.filter((_, i) => i !== index));
                            setPostPhotos(postPhotos.filter((_, i) => i !== index));
                          }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                    <Button type="button" variant="outline" size="sm" asChild>
                      <span>
                        <ImageIcon className="w-4 h-4 mr-2" />
                        Add Photos ({postPhotos.length}/4)
                      </span>
                    </Button>
                  </label>

                  <Button type="submit" disabled={createPostMutation.isPending}>
                    <Send className="w-4 h-4 mr-2" />
                    {createPostMutation.isPending ? 'Posting...' : 'Post'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Posts Feed */}
          <div className="space-y-6">
            {isLoading ? (
              <div className="text-center py-12 text-gray-500">Loading posts...</div>
            ) : posts.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>No posts yet. Be the first to share!</p>
              </div>
            ) : (
              posts.map((post) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card>
                    <CardContent className="pt-6">
                      {/* Post Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Link to={`/profile/${post.user.username}`}>
                            {post.user.profileImage ? (
                              <img
                                src={`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/upload/view/${post.user.profileImage}`}
                                alt={post.user.username}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-nature-green-100 flex items-center justify-center">
                                <span className="text-nature-green-700 font-medium">
                                  {post.user.username[0].toUpperCase()}
                                </span>
                              </div>
                            )}
                          </Link>
                          <div>
                            <Link
                              to={`/profile/${post.user.username}`}
                              className="font-medium hover:text-nature-green-600"
                            >
                              {post.user.username}
                            </Link>
                            {post.user.carbonPoints !== undefined && (
                              <span className="text-sm text-gray-500 ml-2">
                                {post.user.carbonPoints} pts
                              </span>
                            )}
                            <p className="text-xs text-gray-500">
                              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                        </div>

                        {post.user.id === user?.id && (
                          <button
                            onClick={() => deletePostMutation.mutate(post.id)}
                            className="text-gray-400 hover:text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Post Content */}
                      {post.content && <p className="text-gray-800 mb-4">{post.content}</p>}

                      {/* Post Photos */}
                      {post.photos.length > 0 && (
                        <div
                          className={`grid gap-2 mb-4 ${
                            post.photos.length === 1
                              ? 'grid-cols-1'
                              : post.photos.length === 2
                              ? 'grid-cols-2'
                              : 'grid-cols-2'
                          }`}
                        >
                          {post.photos.map((photo, index) => (
                            <img
                              key={index}
                              src={`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/upload/view/${photo}`}
                              alt={`Post ${index + 1}`}
                              className="w-full h-48 object-cover rounded-lg"
                            />
                          ))}
                        </div>
                      )}

                      {/* Post Actions */}
                      <div className="flex items-center gap-6 pt-4 border-t">
                        <button
                          onClick={() => toggleLikeMutation.mutate(post.id)}
                          className={`flex items-center gap-2 transition-colors ${
                            post.isLiked ? 'text-red-500' : 'text-gray-600 hover:text-red-500'
                          }`}
                        >
                          <Heart className={`w-5 h-5 ${post.isLiked ? 'fill-current' : ''}`} />
                          <span className="text-sm font-medium">{post._count.likes}</span>
                        </button>

                        <button
                          onClick={() => setSelectedPost(post.id)}
                          className="flex items-center gap-2 text-gray-600 hover:text-nature-green-600 transition-colors"
                        >
                          <MessageCircle className="w-5 h-5" />
                          <span className="text-sm font-medium">{post._count.comments}</span>
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>

        {/* Comments Modal */}
        <AnimatePresence>
          {selectedPost && postDetail && (
            <>
              <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setSelectedPost(null)} />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-2xl bg-white rounded-lg shadow-xl z-50 flex flex-col max-h-[90vh]"
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between p-4 border-b">
                  <h3 className="font-semibold text-lg">Comments</h3>
                  <button onClick={() => setSelectedPost(null)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Comments List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {postDetail.comments.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No comments yet</p>
                  ) : (
                    postDetail.comments.map((comment: Comment) => (
                      <div key={comment.id} className="flex gap-3">
                        {comment.user.profileImage ? (
                          <img
                            src={`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/upload/view/${comment.user.profileImage}`}
                            alt={comment.user.username}
                            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-nature-green-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-nature-green-700 text-sm font-medium">
                              {comment.user.username[0].toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="bg-gray-100 rounded-lg px-3 py-2">
                            <Link to={`/profile/${comment.user.username}`} className="font-medium text-sm hover:text-nature-green-600">
                              {comment.user.username}
                            </Link>
                            <p className="text-sm text-gray-800 mt-1">{comment.content}</p>
                          </div>
                          <p className="text-xs text-gray-500 mt-1 ml-3">
                            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Add Comment Form */}
                <form onSubmit={handleAddComment} className="p-4 border-t">
                  <div className="flex gap-2">
                    <Input
                      value={commentContent}
                      onChange={(e) => setCommentContent(e.target.value)}
                      placeholder="Write a comment..."
                      className="flex-1"
                    />
                    <Button type="submit" disabled={addCommentMutation.isPending || !commentContent.trim()}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </form>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
