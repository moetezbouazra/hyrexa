import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Leaf,
  MapPin,
  Trophy,
  LogOut,
  Users,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  TrendingUp,
  Menu,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/authStore';
import NotificationDropdown from '@/components/NotificationDropdown';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import type { WasteReport, CleanupActivity } from '@/types';

interface AdminStats {
  totalUsers: number;
  totalReports: number;
  totalCleanups: number;
  pendingReports: number;
  pendingCleanups: number;
}

export default function AdminDashboard() {
  const { user, logout } = useAuthStore();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'reports' | 'cleanups'>('reports');
  const [selectedItem, setSelectedItem] = useState<WasteReport | CleanupActivity | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Redirect if not admin
  if (user?.role !== 'ADMIN') {
    window.location.href = '/dashboard';
    return null;
  }

  // Fetch admin stats
  const { data: stats } = useQuery<AdminStats>({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const response = await api.get('/admin/stats');
      return response.data.data;
    },
  });

  // Fetch pending waste reports
  const { data: pendingReports = [] } = useQuery<WasteReport[]>({
    queryKey: ['admin-pending-reports'],
    queryFn: async () => {
      const response = await api.get('/waste-reports?status=PENDING_REVIEW');
      return response.data.data?.wasteReports || [];
    },
  });

  // Fetch pending cleanups
  const { data: pendingCleanups = [] } = useQuery<CleanupActivity[]>({
    queryKey: ['admin-pending-cleanups'],
    queryFn: async () => {
      const response = await api.get('/cleanups?status=PENDING_VERIFICATION');
      return response.data.data?.cleanups || [];
    },
  });

  // Approve waste report
  const approveReportMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/waste-reports/${id}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-reports'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      toast.success('Report approved');
      setSelectedItem(null);
    },
    onError: () => {
      toast.error('Failed to approve report');
    },
  });

  // Reject waste report
  const rejectReportMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      await api.patch(`/waste-reports/${id}/reject`, { adminNotes: reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-reports'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      toast.success('Report rejected');
      setSelectedItem(null);
    },
    onError: () => {
      toast.error('Failed to reject report');
    },
  });

  // Verify cleanup
  const verifyCleanupMutation = useMutation({
    mutationFn: async ({ id, points }: { id: string; points: number }) => {
      await api.patch(`/cleanups/${id}/verify`, { pointsAwarded: points });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-cleanups'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      toast.success('Cleanup verified');
      setSelectedItem(null);
    },
    onError: () => {
      toast.error('Failed to verify cleanup');
    },
  });

  // Reject cleanup
  const rejectCleanupMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      await api.patch(`/cleanups/${id}/reject`, { adminNotes: reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-cleanups'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      toast.success('Cleanup rejected');
      setSelectedItem(null);
    },
    onError: () => {
      toast.error('Failed to reject cleanup');
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
              <span className="text-xl font-bold text-gray-900">Hyrexa Admin</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-2 md:gap-4">
              <Link to="/dashboard" className="hidden md:block">
                <Button variant="ghost">Dashboard</Button>
              </Link>
              <Link to="/map" className="hidden md:block">
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
              <Link to="/admin">
                <Button variant="ghost" size="sm" className="md:size-default">Admin</Button>
              </Link>
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
                  <Link to="/admin" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start">Admin Panel</Button>
                  </Link>
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
        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 mb-6 md:mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Users</p>
                    <p className="text-2xl font-bold">{stats?.totalUsers || 0}</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Reports</p>
                    <p className="text-2xl font-bold">{stats?.totalReports || 0}</p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Cleanups</p>
                    <p className="text-2xl font-bold">{stats?.totalCleanups || 0}</p>
                  </div>
                  <Trophy className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-yellow-800">Pending Reports</p>
                    <p className="text-2xl font-bold text-yellow-900">{stats?.pendingReports || 0}</p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card className="bg-purple-50 border-purple-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-800">Pending Cleanups</p>
                    <p className="text-2xl font-bold text-purple-900">{stats?.pendingCleanups || 0}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4 md:mb-6">
          <Button
            variant={activeTab === 'reports' ? 'default' : 'outline'}
            onClick={() => setActiveTab('reports')}
            size="sm"
            className="md:size-default flex-1 md:flex-none"
          >
            <span className="hidden sm:inline">Pending </span>Reports ({pendingReports.length})
          </Button>
          <Button
            variant={activeTab === 'cleanups' ? 'default' : 'outline'}
            onClick={() => setActiveTab('cleanups')}
            size="sm"
            className="md:size-default flex-1 md:flex-none"
          >
            <span className="hidden sm:inline">Pending </span>Cleanups ({pendingCleanups.length})
          </Button>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {/* List */}
          <Card>
            <CardHeader>
              <CardTitle>
                {activeTab === 'reports' ? 'Waste Reports' : 'Cleanup Submissions'}
              </CardTitle>
              <CardDescription>
                Review and approve/reject submissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {activeTab === 'reports' && pendingReports.map((report) => (
                  <button
                    key={report.id}
                    onClick={() => setSelectedItem(report)}
                    className={`w-full text-left p-4 rounded-lg border transition-colors ${
                      selectedItem?.id === report.id
                        ? 'bg-nature-green-50 border-nature-green-300'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium">{report.wasteType.replace(/_/g, ' ')}</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {report.locationName || `${report.latitude.toFixed(4)}, ${report.longitude.toFixed(4)}`}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Severity: {report.severity}/5 • {report.photos.length} photos
                        </p>
                      </div>
                      <Eye className="w-5 h-5 text-gray-400" />
                    </div>
                  </button>
                ))}

                {activeTab === 'cleanups' && pendingCleanups.map((cleanup) => (
                  <button
                    key={cleanup.id}
                    onClick={() => setSelectedItem(cleanup)}
                    className={`w-full text-left p-4 rounded-lg border transition-colors ${
                      selectedItem?.id === cleanup.id
                        ? 'bg-nature-green-50 border-nature-green-300'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium">Cleanup Submission</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {cleanup.afterPhotos.length} after photos
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Submitted {new Date(cleanup.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Eye className="w-5 h-5 text-gray-400" />
                    </div>
                  </button>
                ))}

                {((activeTab === 'reports' && pendingReports.length === 0) ||
                  (activeTab === 'cleanups' && pendingCleanups.length === 0)) && (
                  <p className="text-center text-gray-500 py-8">
                    No pending {activeTab} to review
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Details */}
          <Card>
            <CardHeader>
              <CardTitle>Review Details</CardTitle>
              <CardDescription>
                {selectedItem ? 'Review and make a decision' : 'Select an item to review'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedItem ? (
                activeTab === 'reports' ? (
                  <WasteReportReview
                    report={selectedItem as WasteReport}
                    onApprove={() => approveReportMutation.mutate(selectedItem.id)}
                    onReject={(reason) => rejectReportMutation.mutate({ id: selectedItem.id, reason })}
                    isLoading={approveReportMutation.isPending || rejectReportMutation.isPending}
                  />
                ) : (
                  <CleanupReview
                    cleanup={selectedItem as CleanupActivity}
                    onVerify={(points) => verifyCleanupMutation.mutate({ id: selectedItem.id, points })}
                    onReject={(reason) => rejectCleanupMutation.mutate({ id: selectedItem.id, reason })}
                    isLoading={verifyCleanupMutation.isPending || rejectCleanupMutation.isPending}
                  />
                )
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Eye className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>Select an item from the list to review</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

// Waste Report Review Component
function WasteReportReview({
  report,
  onApprove,
  onReject,
  isLoading,
}: {
  report: WasteReport;
  onApprove: () => void;
  onReject: (reason: string) => void;
  isLoading: boolean;
}) {
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

  return (
    <div className="space-y-4">
      {/* Photos */}
      <div className="grid grid-cols-2 gap-3">
        {report.photos.map((photo, index) => (
          <img
            key={index}
            src={`http://localhost:5000/api/upload/view/${photo}`}
            alt={`Waste ${index + 1}`}
            className="w-full h-32 object-cover rounded-lg"
          />
        ))}
      </div>

      {/* Details */}
      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium text-gray-700">Waste Type</label>
          <p className="text-lg">{report.wasteType.replace(/_/g, ' ')}</p>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Severity</label>
          <div className="flex gap-1 mt-1">
            {[1, 2, 3, 4, 5].map((level) => (
              <div
                key={level}
                className={`h-2 flex-1 rounded ${
                  level <= report.severity ? 'bg-red-500' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>

        {report.description && (
          <div>
            <label className="text-sm font-medium text-gray-700">Description</label>
            <p className="text-gray-600">{report.description}</p>
          </div>
        )}

        <div>
          <label className="text-sm font-medium text-gray-700">Location</label>
          <p className="text-gray-600">
            {report.locationName || 'Unknown location'}
          </p>
        </div>
      </div>

      {/* Actions */}
      {!showRejectInput ? (
        <div className="flex gap-3">
          <Button
            onClick={onApprove}
            disabled={isLoading}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Approve
          </Button>
          <Button
            onClick={() => setShowRejectInput(true)}
            disabled={isLoading}
            variant="destructive"
            className="flex-1"
          >
            <XCircle className="w-4 h-4 mr-2" />
            Reject
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <textarea
            placeholder="Reason for rejection..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="w-full px-3 py-2 border rounded-md min-h-[100px]"
          />
          <div className="flex gap-3">
            <Button
              onClick={() => {
                if (rejectReason.trim()) {
                  onReject(rejectReason);
                } else {
                  toast.error('Please provide a reason');
                }
              }}
              disabled={isLoading || !rejectReason.trim()}
              variant="destructive"
              className="flex-1"
            >
              Confirm Rejection
            </Button>
            <Button
              onClick={() => {
                setShowRejectInput(false);
                setRejectReason('');
              }}
              variant="outline"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Cleanup Review Component
function CleanupReview({
  cleanup,
  onVerify,
  onReject,
  isLoading,
}: {
  cleanup: CleanupActivity;
  onVerify: (points: number) => void;
  onReject: (reason: string) => void;
  isLoading: boolean;
}) {
  const [points, setPoints] = useState(50);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

  return (
    <div className="space-y-4">
      {/* Before Photos */}
      <div>
        <h4 className="font-semibold mb-2">Before Photos</h4>
        <div className="grid grid-cols-2 gap-3">
          {cleanup.beforePhotos.map((photo, index) => (
            <img
              key={index}
              src={`http://localhost:5000/api/upload/view/${photo}`}
              alt={`Before ${index + 1}`}
              className="w-full h-32 object-cover rounded-lg border-2 border-gray-300"
            />
          ))}
        </div>
      </div>

      {/* After Photos */}
      <div>
        <h4 className="font-semibold mb-2">After Photos</h4>
        <div className="grid grid-cols-2 gap-3">
          {cleanup.afterPhotos.map((photo, index) => (
            <img
              key={index}
              src={`http://localhost:5000/api/upload/view/${photo}`}
              alt={`After ${index + 1}`}
              className="w-full h-32 object-cover rounded-lg border-2 border-green-500"
            />
          ))}
        </div>
      </div>

      {/* Points Award */}
      {!showRejectInput && (
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Carbon Points to Award: {points}
          </label>
          <input
            type="range"
            min="10"
            max="200"
            step="10"
            value={points}
            onChange={(e) => setPoints(parseInt(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>10</span>
            <span>100</span>
            <span>200</span>
          </div>
        </div>
      )}

      {/* Actions */}
      {!showRejectInput ? (
        <div className="flex gap-3">
          <Button
            onClick={() => onVerify(points)}
            disabled={isLoading}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Verify & Award {points} Points
          </Button>
          <Button
            onClick={() => setShowRejectInput(true)}
            disabled={isLoading}
            variant="destructive"
            className="flex-1"
          >
            <XCircle className="w-4 h-4 mr-2" />
            Reject
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <textarea
            placeholder="Reason for rejection..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="w-full px-3 py-2 border rounded-md min-h-[100px]"
          />
          <div className="flex gap-3">
            <Button
              onClick={() => {
                if (rejectReason.trim()) {
                  onReject(rejectReason);
                } else {
                  toast.error('Please provide a reason');
                }
              }}
              disabled={isLoading || !rejectReason.trim()}
              variant="destructive"
              className="flex-1"
            >
              Confirm Rejection
            </Button>
            <Button
              onClick={() => {
                setShowRejectInput(false);
                setRejectReason('');
              }}
              variant="outline"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
