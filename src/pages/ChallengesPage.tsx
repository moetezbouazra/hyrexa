import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Leaf,
  MapPin,
  Trophy,
  LogOut,
  Target,
  Calendar,
  Award,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/authStore';
import NotificationDropdown from '@/components/NotificationDropdown';
import api from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';

interface Challenge {
  id: string;
  title: string;
  description: string;
  pointsReward: number;
  startDate: string;
  endDate: string | null;
  targetCount: number | null;
  createdAt: string;
  creator: {
    id: string;
    username: string;
  };
}

export default function ChallengesPage() {
  const { user, logout } = useAuthStore();

  // Fetch active challenges
  const { data: challenges = [], isLoading } = useQuery<Challenge[]>({
    queryKey: ['challenges'],
    queryFn: async () => {
      const response = await api.get('/challenges?active=true');
      return response.data.data;
    },
  });

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const isActive = (challenge: Challenge) => {
    const now = new Date();
    const start = new Date(challenge.startDate);
    const end = challenge.endDate ? new Date(challenge.endDate) : null;
    return start <= now && (!end || end >= now);
  };

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
              <Link to="/social">
                <Button variant="ghost">Feed</Button>
              </Link>
              <Link to="/teams">
                <Button variant="ghost">Teams</Button>
              </Link>
              <Link to="/challenges">
                <Button variant="ghost">Challenges</Button>
              </Link>
              <Link to={`/profile/${user?.username}`}>
                <Button variant="ghost">Profile</Button>
              </Link>
              {user?.role === 'ADMIN' && (
                <Link to="/admin">
                  <Button variant="ghost">Admin</Button>
                </Link>
              )}
              <NotificationDropdown />
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Community Challenges</h1>
          <p className="text-gray-600 mb-8">
            Complete challenges to earn bonus points and special achievements
          </p>

          {/* Challenges Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              <div className="col-span-full text-center py-12 text-gray-500">
                Loading challenges...
              </div>
            ) : challenges.length === 0 ? (
              <div className="col-span-full text-center py-12 text-gray-500">
                <Target className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>No active challenges at the moment</p>
              </div>
            ) : (
              challenges.map((challenge, index) => (
                <motion.div
                  key={challenge.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card
                    className={`h-full ${
                      isActive(challenge)
                        ? 'border-nature-green-300 bg-gradient-to-br from-nature-green-50 to-white'
                        : 'opacity-75'
                    }`}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <Target className="w-5 h-5 text-nature-green-600" />
                          {challenge.title}
                        </CardTitle>
                        {isActive(challenge) && (
                          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                            Active
                          </span>
                        )}
                      </div>
                      <CardDescription>{challenge.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Reward */}
                      <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <Award className="w-5 h-5 text-yellow-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Reward</p>
                          <p className="text-lg font-bold text-yellow-600">
                            {challenge.pointsReward} points
                          </p>
                        </div>
                      </div>

                      {/* Target */}
                      {challenge.targetCount && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Target</span>
                          <span className="font-medium">
                            {challenge.targetCount} cleanups
                          </span>
                        </div>
                      )}

                      {/* Timeline */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>
                            Started {formatDistanceToNow(new Date(challenge.startDate), { addSuffix: true })}
                          </span>
                        </div>
                        {challenge.endDate && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock className="w-4 h-4" />
                            <span>
                              Ends {formatDistanceToNow(new Date(challenge.endDate), { addSuffix: true })}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Progress would go here */}
                      <Button className="w-full" disabled={!isActive(challenge)}>
                        {isActive(challenge) ? 'Participate' : 'Ended'}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
