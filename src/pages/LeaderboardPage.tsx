import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Leaf,
  Trophy,
  MapPin,
  LogOut,
  Medal,
  TrendingUp,
  Award,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';

interface LeaderboardUser {
  id: string;
  username: string;
  profileImage?: string;
  carbonPoints: number;
  _count: {
    cleanupActivities: number;
  };
}

type Period = 'all' | 'weekly' | 'monthly';

export default function LeaderboardPage() {
  const { user, logout } = useAuthStore();
  const [period, setPeriod] = useState<Period>('all');

  const { data: leaderboard = [] } = useQuery<LeaderboardUser[]>({
    queryKey: ['leaderboard', period],
    queryFn: async () => {
      const response = await api.get(`/users/leaderboard?period=${period}&limit=50`);
      return response.data.data.users;
    },
  });

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-6 h-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-amber-600" />;
    return null;
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'from-yellow-50 to-yellow-100 border-yellow-300';
    if (rank === 2) return 'from-gray-50 to-gray-100 border-gray-300';
    if (rank === 3) return 'from-amber-50 to-amber-100 border-amber-300';
    return 'from-white to-gray-50 border-gray-200';
  };

  const currentUserRank = leaderboard.findIndex((u) => u.id === user?.id) + 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-nature-green-50 via-white to-nature-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="bg-nature-green-100 rounded-full p-2">
                <Leaf className="w-6 h-6 text-nature-green-600" />
              </div>
              <span className="text-xl font-bold text-gray-900">Hyrexa</span>
            </Link>

            <nav className="flex items-center gap-4">
              <Link to="/dashboard">
                <Button variant="ghost">Dashboard</Button>
              </Link>
              <Link to="/map">
                <Button variant="ghost">
                  <MapPin className="w-4 h-4 mr-2" />
                  Map
                </Button>
              </Link>
              <Link to="/leaderboard">
                <Button variant="ghost">
                  <Trophy className="w-4 h-4 mr-2" />
                  Leaderboard
                </Button>
              </Link>
              <Link to={`/profile/${user?.username}`}>
                <Button variant="ghost">Profile</Button>
              </Link>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-block p-4 bg-yellow-100 rounded-full mb-4">
            <Trophy className="w-12 h-12 text-yellow-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Leaderboard</h1>
          <p className="text-gray-600">
            Top eco-warriors making a difference
          </p>
        </motion.div>

        {/* Period Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-center gap-2">
                <Button
                  variant={period === 'all' ? 'default' : 'outline'}
                  onClick={() => setPeriod('all')}
                >
                  All Time
                </Button>
                <Button
                  variant={period === 'monthly' ? 'default' : 'outline'}
                  onClick={() => setPeriod('monthly')}
                >
                  This Month
                </Button>
                <Button
                  variant={period === 'weekly' ? 'default' : 'outline'}
                  onClick={() => setPeriod('weekly')}
                >
                  This Week
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Current User Rank */}
        {currentUserRank > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6"
          >
            <Card className="bg-gradient-to-r from-nature-green-50 to-nature-blue-50 border-nature-green-300">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-3xl font-bold text-nature-green-600">
                      #{currentUserRank}
                    </div>
                    <div>
                      <p className="font-semibold">Your Rank</p>
                      <p className="text-sm text-gray-600">
                        {user?.carbonPoints.toLocaleString()} points
                      </p>
                    </div>
                  </div>
                  <TrendingUp className="w-8 h-8 text-nature-green-600" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Leaderboard List */}
        <div className="space-y-3">
          {leaderboard.map((leaderUser, index) => {
            const rank = index + 1;
            const isCurrentUser = leaderUser.id === user?.id;

            return (
              <motion.div
                key={leaderUser.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.05 }}
              >
                <Link to={`/profile/${leaderUser.username}`}>
                  <Card
                    className={`transition-all hover:shadow-lg cursor-pointer ${
                      isCurrentUser ? 'ring-2 ring-nature-green-500' : ''
                    } ${rank <= 3 ? `bg-gradient-to-r ${getRankColor(rank)}` : ''}`}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        {/* Rank */}
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white shadow-sm">
                          {getRankIcon(rank) || (
                            <span className="text-lg font-bold text-gray-700">
                              {rank}
                            </span>
                          )}
                        </div>

                        {/* Avatar */}
                        <div className="flex-shrink-0">
                          {leaderUser.profileImage ? (
                            <img
                              src={`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/upload/view/${leaderUser.profileImage}`}
                              alt={leaderUser.username}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-nature-green-100 flex items-center justify-center">
                              <span className="text-lg font-bold text-nature-green-600">
                                {leaderUser.username[0].toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-lg truncate flex items-center gap-2">
                            {leaderUser.username}
                            {isCurrentUser && (
                              <span className="text-xs px-2 py-0.5 bg-nature-green-500 text-white rounded-full">
                                You
                              </span>
                            )}
                          </p>
                          <p className="text-sm text-gray-600">
                            {leaderUser._count.cleanupActivities} cleanups completed
                          </p>
                        </div>

                        {/* Points */}
                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            <Leaf className="w-5 h-5 text-nature-green-600" />
                            <span className="text-2xl font-bold text-nature-green-600">
                              {leaderUser.carbonPoints.toLocaleString()}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600">points</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            );
          })}

          {leaderboard.length === 0 && (
            <Card>
              <CardContent className="pt-12 pb-12 text-center">
                <Award className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">
                  No data available for this period. Be the first to make an impact!
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
