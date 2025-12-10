import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Leaf,
  MapPin,
  Trophy,
  LogOut,
  User,
  Lock,
  Bell,
  Trash2,
  Save,
  Camera,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/store/authStore';
import NotificationDropdown from '@/components/NotificationDropdown';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { user, logout } = useAuthStore();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'notifications'>('profile');

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    username: user?.username || '',
    email: user?.email || '',
  });
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await api.patch('/users/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      toast.success('Profile updated successfully');
    },
    onError: () => {
      toast.error('Failed to update profile');
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const response = await api.patch('/auth/change-password', data);
      return response.data;
    },
    onSuccess: () => {
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Password changed successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to change password');
    },
  });

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImage(file);
      setProfileImagePreview(URL.createObjectURL(file));
    }
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('username', profileForm.username);
    formData.append('email', profileForm.email);
    if (profileImage) {
      formData.append('profileImage', profileImage);
    }
    updateProfileMutation.mutate(formData);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    changePasswordMutation.mutate({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    });
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

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600 mb-8">Manage your account settings and preferences</p>

          <div className="flex gap-6">
            {/* Sidebar */}
            <div className="w-64 flex-shrink-0">
              <Card>
                <CardContent className="p-4 space-y-2">
                  <button
                    onClick={() => setActiveTab('profile')}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                      activeTab === 'profile'
                        ? 'bg-nature-green-50 text-nature-green-700 font-medium'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <User className="w-5 h-5 inline-block mr-3" />
                    Profile
                  </button>
                  <button
                    onClick={() => setActiveTab('password')}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                      activeTab === 'password'
                        ? 'bg-nature-green-50 text-nature-green-700 font-medium'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <Lock className="w-5 h-5 inline-block mr-3" />
                    Password
                  </button>
                  <button
                    onClick={() => setActiveTab('notifications')}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                      activeTab === 'notifications'
                        ? 'bg-nature-green-50 text-nature-green-700 font-medium'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <Bell className="w-5 h-5 inline-block mr-3" />
                    Notifications
                  </button>
                </CardContent>
              </Card>
            </div>

            {/* Content */}
            <div className="flex-1">
              {activeTab === 'profile' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>Update your profile details and photo</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleProfileSubmit} className="space-y-6">
                      {/* Profile Image */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Profile Photo
                        </label>
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            {profileImagePreview || user?.profileImage ? (
                              <img
                                src={profileImagePreview || `http://localhost:5000/api/upload/view/${user?.profileImage}`}
                                alt="Profile"
                                className="w-20 h-20 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-20 h-20 rounded-full bg-nature-green-100 flex items-center justify-center">
                                <User className="w-10 h-10 text-nature-green-600" />
                              </div>
                            )}
                            <label
                              htmlFor="profile-image"
                              className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-md cursor-pointer hover:bg-gray-50"
                            >
                              <Camera className="w-4 h-4 text-gray-600" />
                            </label>
                            <input
                              id="profile-image"
                              type="file"
                              accept="image/*"
                              onChange={handleProfileImageChange}
                              className="hidden"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Username */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Username
                        </label>
                        <Input
                          value={profileForm.username}
                          onChange={(e) =>
                            setProfileForm({ ...profileForm, username: e.target.value })
                          }
                          placeholder="Enter username"
                          required
                        />
                      </div>

                      {/* Email */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email
                        </label>
                        <Input
                          type="email"
                          value={profileForm.email}
                          onChange={(e) =>
                            setProfileForm({ ...profileForm, email: e.target.value })
                          }
                          placeholder="Enter email"
                          required
                        />
                      </div>

                      <Button type="submit" disabled={updateProfileMutation.isPending}>
                        <Save className="w-4 h-4 mr-2" />
                        {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              )}

              {activeTab === 'password' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Change Password</CardTitle>
                    <CardDescription>Update your password to keep your account secure</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handlePasswordSubmit} className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Current Password
                        </label>
                        <Input
                          type="password"
                          value={passwordForm.currentPassword}
                          onChange={(e) =>
                            setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                          }
                          placeholder="Enter current password"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          New Password
                        </label>
                        <Input
                          type="password"
                          value={passwordForm.newPassword}
                          onChange={(e) =>
                            setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                          }
                          placeholder="Enter new password"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Confirm New Password
                        </label>
                        <Input
                          type="password"
                          value={passwordForm.confirmPassword}
                          onChange={(e) =>
                            setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                          }
                          placeholder="Confirm new password"
                          required
                        />
                      </div>

                      <Button type="submit" disabled={changePasswordMutation.isPending}>
                        <Lock className="w-4 h-4 mr-2" />
                        {changePasswordMutation.isPending ? 'Changing...' : 'Change Password'}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              )}

              {activeTab === 'notifications' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Notification Preferences</CardTitle>
                    <CardDescription>Choose what notifications you want to receive</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between py-3 border-b">
                      <div>
                        <h4 className="font-medium">Achievement Unlocked</h4>
                        <p className="text-sm text-gray-600">Get notified when you unlock new achievements</p>
                      </div>
                      <input type="checkbox" defaultChecked className="w-5 h-5" />
                    </div>

                    <div className="flex items-center justify-between py-3 border-b">
                      <div>
                        <h4 className="font-medium">Report Status</h4>
                        <p className="text-sm text-gray-600">Updates on your waste report approvals/rejections</p>
                      </div>
                      <input type="checkbox" defaultChecked className="w-5 h-5" />
                    </div>

                    <div className="flex items-center justify-between py-3 border-b">
                      <div>
                        <h4 className="font-medium">Cleanup Verification</h4>
                        <p className="text-sm text-gray-600">Get notified when your cleanups are verified</p>
                      </div>
                      <input type="checkbox" defaultChecked className="w-5 h-5" />
                    </div>

                    <div className="flex items-center justify-between py-3 border-b">
                      <div>
                        <h4 className="font-medium">Nearby Waste</h4>
                        <p className="text-sm text-gray-600">Alerts for waste reports near your location</p>
                      </div>
                      <input type="checkbox" className="w-5 h-5" />
                    </div>

                    <Button className="mt-4">
                      <Save className="w-4 h-4 mr-2" />
                      Save Preferences
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
