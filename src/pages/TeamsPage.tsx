import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Leaf,
  MapPin,
  Trophy,
  LogOut,
  Users,
  Plus,
  UserPlus,
  UserMinus,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/store/authStore';
import NotificationDropdown from '@/components/NotificationDropdown';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface Team {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  members: Array<{
    id: string;
    userId: string;
    role: string;
    user: {
      id: string;
      username: string;
      profileImage: string | null;
      carbonPoints: number;
    };
  }>;
  _count: {
    members: number;
  };
  totalPoints?: number;
}

export default function TeamsPage() {
  const { user, logout } = useAuthStore();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamDescription, setTeamDescription] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'leaderboard'>('all');

  // Fetch teams
  const { data: teams = [], isLoading } = useQuery<Team[]>({
    queryKey: ['teams'],
    queryFn: async () => {
      const response = await api.get('/teams');
      return response.data.data;
    },
  });

  // Fetch team leaderboard
  const { data: leaderboard = [] } = useQuery<Team[]>({
    queryKey: ['team-leaderboard'],
    queryFn: async () => {
      const response = await api.get('/teams/leaderboard');
      return response.data.data;
    },
  });

  // Create team mutation
  const createTeamMutation = useMutation({
    mutationFn: async (data: { name: string; description: string }) => {
      const response = await api.post('/teams', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      setShowCreateModal(false);
      setTeamName('');
      setTeamDescription('');
      toast.success('Team created successfully');
    },
    onError: () => {
      toast.error('Failed to create team');
    },
  });

  // Join team mutation
  const joinTeamMutation = useMutation({
    mutationFn: async (teamId: string) => {
      const response = await api.post(`/teams/${teamId}/join`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success('Joined team successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to join team');
    },
  });

  // Leave team mutation
  const leaveTeamMutation = useMutation({
    mutationFn: async (teamId: string) => {
      const response = await api.post(`/teams/${teamId}/leave`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success('Left team successfully');
    },
    onError: () => {
      toast.error('Failed to leave team');
    },
  });

  const handleCreateTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (teamName.trim().length < 3) {
      toast.error('Team name must be at least 3 characters');
      return;
    }
    createTeamMutation.mutate({ name: teamName, description: teamDescription });
  };

  const isUserInTeam = (team: Team) => {
    return team.members.some((member) => member.userId === user?.id);
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
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
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Teams</h1>
              <p className="text-gray-600">Join forces to make a bigger impact</p>
            </div>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Team
            </Button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <Button
              variant={activeTab === 'all' ? 'default' : 'outline'}
              onClick={() => setActiveTab('all')}
            >
              All Teams
            </Button>
            <Button
              variant={activeTab === 'leaderboard' ? 'default' : 'outline'}
              onClick={() => setActiveTab('leaderboard')}
            >
              <Trophy className="w-4 h-4 mr-2" />
              Team Leaderboard
            </Button>
          </div>

          {/* Teams Grid */}
          {activeTab === 'all' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {isLoading ? (
                <div className="col-span-full text-center py-12 text-gray-500">
                  Loading teams...
                </div>
              ) : teams.length === 0 ? (
                <div className="col-span-full text-center py-12 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>No teams yet. Be the first to create one!</p>
                </div>
              ) : (
                teams.map((team) => (
                  <motion.div
                    key={team.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <Card className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Users className="w-5 h-5 text-nature-green-600" />
                          {team.name}
                        </CardTitle>
                        {team.description && (
                          <CardDescription>{team.description}</CardDescription>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {/* Team Stats */}
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Members</span>
                            <span className="font-medium">{team._count.members}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Total Points</span>
                            <span className="font-medium">
                              {team.members.reduce(
                                (sum, member) => sum + member.user.carbonPoints,
                                0
                              )}
                            </span>
                          </div>

                          {/* Member Avatars */}
                          <div className="flex -space-x-2">
                            {team.members.slice(0, 5).map((member) => (
                              <div
                                key={member.id}
                                className="w-8 h-8 rounded-full bg-nature-green-100 border-2 border-white flex items-center justify-center"
                                title={member.user.username}
                              >
                                {member.user.profileImage ? (
                                  <img
                                    src={`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/upload/view/${member.user.profileImage}`}
                                    alt={member.user.username}
                                    className="w-full h-full rounded-full object-cover"
                                  />
                                ) : (
                                  <span className="text-xs font-medium text-nature-green-700">
                                    {member.user.username[0].toUpperCase()}
                                  </span>
                                )}
                              </div>
                            ))}
                            {team._count.members > 5 && (
                              <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center">
                                <span className="text-xs font-medium text-gray-600">
                                  +{team._count.members - 5}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Action Button */}
                          {isUserInTeam(team) ? (
                            <Button
                              variant="outline"
                              className="w-full"
                              onClick={() => leaveTeamMutation.mutate(team.id)}
                              disabled={leaveTeamMutation.isPending}
                            >
                              <UserMinus className="w-4 h-4 mr-2" />
                              Leave Team
                            </Button>
                          ) : (
                            <Button
                              className="w-full"
                              onClick={() => joinTeamMutation.mutate(team.id)}
                              disabled={joinTeamMutation.isPending}
                            >
                              <UserPlus className="w-4 h-4 mr-2" />
                              Join Team
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
            </div>
          )}

          {/* Team Leaderboard */}
          {activeTab === 'leaderboard' && (
            <div className="space-y-4">
              {leaderboard.map((team, index) => (
                <motion.div
                  key={team.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card
                    className={`${
                      index < 3
                        ? index === 0
                          ? 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-300'
                          : index === 1
                          ? 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-300'
                          : 'bg-gradient-to-r from-orange-50 to-orange-100 border-orange-300'
                        : ''
                    }`}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white shadow-sm">
                          <span className="text-xl font-bold text-gray-900">
                            #{index + 1}
                          </span>
                        </div>

                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{team.name}</h3>
                          <p className="text-sm text-gray-600">
                            {team._count.members} members
                          </p>
                        </div>

                        <div className="text-right">
                          <div className="flex items-center gap-2 text-2xl font-bold text-nature-green-600">
                            <TrendingUp className="w-6 h-6" />
                            {team.totalPoints}
                          </div>
                          <p className="text-sm text-gray-600">carbon points</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Create Team Modal */}
        {showCreateModal && (
          <>
            <div
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setShowCreateModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-lg shadow-xl z-50 p-6"
            >
              <h2 className="text-2xl font-bold mb-4">Create New Team</h2>
              <form onSubmit={handleCreateTeam} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Team Name *
                  </label>
                  <Input
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="Enter team name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={teamDescription}
                    onChange={(e) => setTeamDescription(e.target.value)}
                    placeholder="What's your team about?"
                    className="w-full px-3 py-2 border rounded-md min-h-[100px]"
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createTeamMutation.isPending}
                    className="flex-1"
                  >
                    {createTeamMutation.isPending ? 'Creating...' : 'Create Team'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </main>
    </div>
  );
}
