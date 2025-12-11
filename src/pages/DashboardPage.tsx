import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Leaf,
  Trophy,
  MapPin,
  AlertTriangle,
  Plus,
  Award,
  TrendingUp,
  Calendar,
  Users,
  LogOut,
  Flame,
  Menu,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/authStore';
import NotificationDropdown from '@/components/NotificationDropdown';
import api from '@/lib/api';

interface DashboardStats {
  carbonPoints: number;
  totalCleanups: number;
  totalReports: number;
  achievementsCount: number;
}

interface DailyStreak {
  id: string;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string;
}

interface RecentActivity {
  id: string;
  type: 'cleanup' | 'report' | 'achievement';
  title: string;
  description: string;
  date: string;
  points?: number;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  unlockedAt?: string;
}

export default function DashboardPage() {
  const { user, logout } = useAuthStore();
  const [greeting, setGreeting] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await api.get('/users/me/stats');
      return response.data.data;
    },
  });

  const { data: recentActivities } = useQuery<RecentActivity[]>({
    queryKey: ['recent-activities'],
    queryFn: async () => {
      const response = await api.get('/users/me/activities?limit=5');
      return response.data.data;
    },
  });

  const { data: achievements } = useQuery<Achievement[]>({
    queryKey: ['user-achievements'],
    queryFn: async () => {
      const response = await api.get('/users/me/achievements');
      return response.data.data;
    },
  });

  const { data: streak } = useQuery<DailyStreak>({
    queryKey: ['user-streak'],
    queryFn: async () => {
      const response = await api.get('/streaks');
      return response.data.data;
    },
  });

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
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900">
            {greeting}, {user?.username}! 👋
          </h1>
          <p className="text-gray-600 mt-2">
            Ready to make an impact today? Here's your environmental journey so far.
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-6 mb-6 md:mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-gradient-to-br from-nature-green-50 to-nature-green-100 border-nature-green-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-nature-green-900">
                    Carbon Points
                  </CardTitle>
                  <Leaf className="w-5 h-5 text-nature-green-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-nature-green-900">
                  {stats?.carbonPoints.toLocaleString() || 0}
                </div>
                <p className="text-xs text-nature-green-700 mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Keep up the great work!
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-gradient-to-br from-nature-blue-50 to-nature-blue-100 border-nature-blue-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-nature-blue-900">
                    Cleanups
                  </CardTitle>
                  <Trophy className="w-5 h-5 text-nature-blue-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-nature-blue-900">
                  {stats?.totalCleanups || 0}
                </div>
                <p className="text-xs text-nature-blue-700 mt-1">
                  Areas cleaned successfully
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-yellow-900">
                    Reports
                  </CardTitle>
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-900">
                  {stats?.totalReports || 0}
                </div>
                <p className="text-xs text-yellow-700 mt-1">
                  Waste issues reported
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-purple-900">
                    Achievements
                  </CardTitle>
                  <Award className="w-5 h-5 text-purple-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-900">
                  {stats?.achievementsCount || 0}
                </div>
                <p className="text-xs text-purple-700 mt-1">
                  Badges unlocked
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-orange-900">
                    Daily Streak
                  </CardTitle>
                  <Flame className="w-5 h-5 text-orange-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-900">
                  {streak?.currentStreak || 0}
                </div>
                <p className="text-xs text-orange-700 mt-1">
                  {streak?.currentStreak === 1 ? 'day' : 'days'} in a row
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-8"
        >
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Take action and earn carbon points
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4">
              <Link to="/map?action=report">
                <Button className="bg-nature-green-600 hover:bg-nature-green-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Report Waste
                </Button>
              </Link>
              <Link to="/map">
                <Button variant="outline">
                  <MapPin className="w-4 h-4 mr-2" />
                  View Map
                </Button>
              </Link>
              <Link to="/leaderboard">
                <Button variant="outline">
                  <Users className="w-4 h-4 mr-2" />
                  Leaderboard
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Your latest contributions</CardDescription>
              </CardHeader>
              <CardContent>
                {recentActivities && recentActivities.length > 0 ? (
                  <div className="space-y-4">
                    {recentActivities.map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <div className="mt-1">
                          {activity.type === 'cleanup' && (
                            <Trophy className="w-5 h-5 text-nature-blue-600" />
                          )}
                          {activity.type === 'report' && (
                            <AlertTriangle className="w-5 h-5 text-yellow-600" />
                          )}
                          {activity.type === 'achievement' && (
                            <Award className="w-5 h-5 text-purple-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">
                            {activity.title}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {activity.description}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                            <Calendar className="w-3 h-3" />
                            {new Date(activity.date).toLocaleDateString()}
                            {activity.points && (
                              <>
                                <span>•</span>
                                <span className="text-nature-green-600 font-medium">
                                  +{activity.points} points
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    No recent activity. Start by reporting waste or joining a cleanup!
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Achievements */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Achievements</CardTitle>
                <CardDescription>Your earned badges</CardDescription>
              </CardHeader>
              <CardContent>
                {achievements && achievements.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4">
                    {achievements.slice(0, 6).map((achievement) => (
                      <div
                        key={achievement.id}
                        className="flex flex-col items-center p-4 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200"
                      >
                        <div className="text-4xl mb-2">{achievement.icon}</div>
                        <h4 className="font-semibold text-sm text-center text-gray-900">
                          {achievement.name}
                        </h4>
                        <p className="text-xs text-gray-600 text-center mt-1">
                          {achievement.points} points
                        </p>
                        {achievement.unlockedAt && (
                          <p className="text-xs text-purple-600 mt-1">
                            {new Date(achievement.unlockedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    No achievements yet. Complete actions to earn badges!
                  </p>
                )}
                {achievements && achievements.length > 6 && (
                  <Link to={`/profile/${user?.username}`}>
                    <Button variant="outline" className="w-full mt-4">
                      View All Achievements
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
