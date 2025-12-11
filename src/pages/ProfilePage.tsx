import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Leaf,
  Trophy,
  MapPin,
  LogOut,
  Award,
  Calendar,
  Share2,
  AlertTriangle,
  Menu,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface UserProfile {
  id: string;
  username: string;
  profileImage?: string;
  carbonPoints: number;
  createdAt: string;
  _count: {
    wasteReports: number;
    cleanupActivities: number;
  };
  achievements: Array<{
    id: string;
    achievement: {
      id: string;
      name: string;
      description: string;
      icon: string;
      requiredPoints: number;
    };
    unlockedAt: string;
  }>;
  cleanupActivities: Array<{
    id: string;
    pointsAwarded: number;
    verifiedAt: string;
    wasteReport: {
      latitude: number;
      longitude: number;
      wasteType: string;
      severity: number;
    };
  }>;
}

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { user: currentUser, logout } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: profile, isLoading } = useQuery<UserProfile>({
    queryKey: ['user-profile', username],
    queryFn: async () => {
      const response = await api.get(`/users/profile/${username}`);
      return response.data.data.user;
    },
    enabled: !!username,
  });

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success('Profile link copied to clipboard!');
  };

  const isOwnProfile = currentUser?.username === username;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-nature-green-50 via-white to-nature-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-nature-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-nature-green-50 via-white to-nature-blue-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-12 pb-12 text-center">
            <AlertTriangle className="w-16 h-16 mx-auto text-yellow-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2">User Not Found</h2>
            <p className="text-gray-600 mb-4">
              The user you're looking for doesn't exist.
            </p>
            <Link to="/dashboard">
              <Button>Go to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

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

            {/* Desktop/Mobile Navigation */}
            <div className="flex items-center gap-2">
            <nav className="hidden lg:flex items-center gap-2 md:gap-4">
              {currentUser ? (
                // Authenticated user navigation
                <>
                  <Link to="/dashboard" className="hidden md:block">
                    <Button variant="ghost" size="sm" className="md:size-default">Dashboard</Button>
                  </Link>
                  <Link to="/map">
                    <Button variant="ghost" size="sm" className="md:size-default">
                      <MapPin className="w-4 h-4 md:mr-2" />
                      <span className="hidden sm:inline">Map</span>
                    </Button>
                  </Link>
                  <Link to="/leaderboard" className="hidden lg:block">
                    <Button variant="ghost">
                      <Trophy className="w-4 h-4 mr-2" />
                      Leaderboard
                    </Button>
                  </Link>
                  <Link to="/social" className="hidden lg:block">
                    <Button variant="ghost">Feed</Button>
                  </Link>
                  <Link to="/teams" className="hidden lg:block">
                    <Button variant="ghost">Teams</Button>
                  </Link>
                  <Link to="/challenges" className="hidden lg:block">
                    <Button variant="ghost">Challenges</Button>
                  </Link>
                  <Link to={`/profile/${currentUser?.username}`} className="hidden md:block">
                    <Button variant="ghost">Profile</Button>
                  </Link>
                  {currentUser?.role === 'ADMIN' && (
                    <Link to="/admin" className="hidden md:block">
                      <Button variant="ghost">Admin</Button>
                    </Link>
                  )}
                  <Button variant="outline" onClick={handleLogout} size="sm" className="md:size-default">
                    <LogOut className="w-4 h-4 md:mr-2" />
                    <span className="hidden md:inline">Logout</span>
                  </Button>
                </>
              ) : (
                // Guest user navigation
                <Link to="/login">
                  <Button>Login</Button>
                </Link>
              )}
            </nav>

            {/* Mobile Menu Button (only show if authenticated) */}
            {currentUser && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-md hover:bg-gray-100"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            )}
            </div>
          </div>

          {/* Mobile Navigation Dropdown (only show if authenticated) */}
          {currentUser && (
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
                    <Link to={`/profile/${currentUser?.username}`} onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start">Profile</Button>
                    </Link>
                    {currentUser?.role === 'ADMIN' && (
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
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="mb-8">
            <CardContent className="pt-8">
              <div className="flex flex-col md:flex-row items-center gap-6">
                {/* Avatar */}
                {profile.profileImage ? (
                  <img
                    src={`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/upload/view/${profile.profileImage}`}
                    alt={profile.username}
                    className="w-32 h-32 rounded-full object-cover ring-4 ring-nature-green-100"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-nature-green-100 flex items-center justify-center ring-4 ring-nature-green-200">
                    <span className="text-5xl font-bold text-nature-green-600">
                      {profile.username[0].toUpperCase()}
                    </span>
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 text-center md:text-left">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {profile.username}
                  </h1>
                  <p className="text-gray-600 flex items-center justify-center md:justify-start gap-2 mb-4">
                    <Calendar className="w-4 h-4" />
                    Joined {new Date(profile.createdAt).toLocaleDateString('en-US', {
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                  <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-nature-green-600">
                        {profile.carbonPoints.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">Carbon Points</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-nature-blue-600">
                        {profile._count.cleanupActivities}
                      </div>
                      <div className="text-sm text-gray-600">Cleanups</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">
                        {profile._count.wasteReports}
                      </div>
                      <div className="text-sm text-gray-600">Reports</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {profile.achievements.length}
                      </div>
                      <div className="text-sm text-gray-600">Achievements</div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  <Button onClick={handleShare} variant="outline">
                    <Share2 className="w-4 h-4 mr-2" />
                    Share Profile
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Achievements */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Achievements
                </CardTitle>
                <CardDescription>
                  Badges earned by {isOwnProfile ? 'you' : profile.username}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {profile.achievements.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4">
                    {profile.achievements.map((ua) => (
                      <div
                        key={ua.id}
                        className="p-4 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200"
                      >
                        <div className="text-4xl mb-2 text-center">
                          {ua.achievement.icon}
                        </div>
                        <h4 className="font-semibold text-sm text-center">
                          {ua.achievement.name}
                        </h4>
                        <p className="text-xs text-gray-600 text-center mt-1">
                          {ua.achievement.requiredPoints} points
                        </p>
                        <p className="text-xs text-purple-600 text-center mt-1">
                          {new Date(ua.unlockedAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    No achievements yet
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Cleanups */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  Recent Cleanups
                </CardTitle>
                <CardDescription>
                  Latest verified cleanup activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                {profile.cleanupActivities.length > 0 ? (
                  <div className="space-y-4">
                    {profile.cleanupActivities.map((cleanup) => (
                      <div
                        key={cleanup.id}
                        className="p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">
                              {cleanup.wasteReport.wasteType.replace(/_/g, ' ')}
                            </h4>
                            <p className="text-sm text-gray-600 mt-1">
                              Severity: {cleanup.wasteReport.severity}/5
                            </p>
                            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(cleanup.verifiedAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-1 text-nature-green-600 font-semibold">
                              <Leaf className="w-4 h-4" />
                              +{cleanup.pointsAwarded}
                            </div>
                            <p className="text-xs text-gray-500">points</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    No cleanups yet
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
