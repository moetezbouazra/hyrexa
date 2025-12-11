import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Leaf,
  MapPin,
  Trophy,
  Filter,
  Plus,
  X,
  Camera,
  LogOut,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/store/authStore';
import NotificationDropdown from '@/components/NotificationDropdown';
import api from '@/lib/api';
import Map from '@/components/Map';
import ReportWasteModal from '@/components/ReportWasteModal';
import CleanupSubmissionModal from '@/components/CleanupSubmissionModal';
import { WasteReport, WasteType, WasteReportStatus } from '@/types';

export default function MapPage() {
  const { user, logout } = useAuthStore();
  const queryClient = useQueryClient();
  const [selectedReport, setSelectedReport] = useState<WasteReport | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showCleanupModal, setShowCleanupModal] = useState(false);
  const [filterType, setFilterType] = useState<WasteType | 'ALL'>('ALL');
  const [filterStatus, setFilterStatus] = useState<WasteReportStatus | 'ALL'>('ALL');

  // Fetch waste reports
  const { data: wasteReports = [] } = useQuery<WasteReport[]>({
    queryKey: ['waste-reports', filterType, filterStatus],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterType !== 'ALL') params.append('wasteType', filterType);
      if (filterStatus !== 'ALL') params.append('status', filterStatus);
      
      const response = await api.get(`/waste-reports?${params.toString()}`);
      // The API returns { data: { wasteReports: [], pagination: {} } }
      return response.data.data?.wasteReports || [];
    },
  });

  const handleReportSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['waste-reports'] });
  };

  const handleMarkerClick = (report: WasteReport) => {
    setSelectedReport(report);
  };

  const handleCloseDetail = () => {
    setSelectedReport(null);
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b z-10">
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

      <div className="flex-1 flex relative">
        {/* Sidebar */}
        <motion.div
          initial={{ x: -300 }}
          animate={{ x: 0 }}
          className="w-80 bg-white border-r shadow-lg overflow-y-auto"
        >
          <div className="p-4 space-y-4">
            {/* Report Button */}
            <Button
              onClick={() => setShowReportModal(true)}
              className="w-full bg-nature-green-600 hover:bg-nature-green-700"
              size="lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              Report Waste
            </Button>

            <ReportWasteModal
              isOpen={showReportModal}
              onClose={() => setShowReportModal(false)}
              onSuccess={handleReportSuccess}
            />

            {/* Filters */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">
                    Waste Type
                  </label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as WasteType | 'ALL')}
                    className="w-full px-3 py-2 border rounded-md text-sm"
                  >
                    <option value="ALL">All Types</option>
                    <option value="PLASTIC_BOTTLES">Plastic Bottles</option>
                    <option value="PLASTIC_BAGS">Plastic Bags</option>
                    <option value="MIXED_PLASTIC">Mixed Plastic</option>
                    <option value="STYROFOAM">Styrofoam</option>
                    <option value="FISHING_GEAR">Fishing Gear</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">
                    Status
                  </label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as WasteReportStatus | 'ALL')}
                    className="w-full px-3 py-2 border rounded-md text-sm"
                  >
                    <option value="ALL">All Status</option>
                    <option value="PENDING_REVIEW">Pending Review</option>
                    <option value="APPROVED">Approved</option>
                    <option value="CLEANED">Cleaned</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Reports List */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">
                  Waste Reports ({wasteReports.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {wasteReports.map((report) => (
                    <button
                      key={report.id}
                      onClick={() => setSelectedReport(report)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selectedReport?.id === report.id
                          ? 'bg-nature-green-50 border-nature-green-300'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 mt-0.5 text-yellow-600" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">
                            {report.wasteType.replace(/_/g, ' ')}
                          </h4>
                          <p className="text-xs text-gray-600 truncate">
                            {report.locationName || `${report.latitude.toFixed(4)}, ${report.longitude.toFixed(4)}`}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100">
                              Severity: {report.severity}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                  {wasteReports.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No waste reports found
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Map */}
        <div className="flex-1 relative">
          <Map
            wasteReports={wasteReports}
            onMarkerClick={handleMarkerClick}
            selectedReportId={selectedReport?.id}
          />
        </div>

        {/* Report Detail Panel */}
        <AnimatePresence>
          {selectedReport && (
            <motion.div
              initial={{ x: 400 }}
              animate={{ x: 0 }}
              exit={{ x: 400 }}
              className="absolute right-0 top-0 bottom-0 w-96 bg-white shadow-2xl overflow-y-auto z-20"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-bold">Report Details</h2>
                  <button
                    onClick={handleCloseDetail}
                    className="p-2 hover:bg-gray-100 rounded-full"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Photos */}
                {selectedReport.photos && selectedReport.photos.length > 0 && (
                  <div className="mb-4">
                    <div className="grid grid-cols-2 gap-2">
                      {selectedReport.photos.map((photo, index) => (
                        <div key={index} className="w-full h-32 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                          <img
                            src={`http://localhost:5000/api/upload/view/${photo}`}
                            alt={`Waste ${index + 1}`}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                parent.innerHTML = `<div class="text-xs text-gray-500 text-center p-2">Image unavailable</div>`;
                              }
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Details */}
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Waste Type</label>
                    <p className="text-lg">
                      {selectedReport.wasteType.replace(/_/g, ' ')}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">Severity</label>
                    <div className="flex gap-1 mt-1">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          className={`h-2 flex-1 rounded ${
                            level <= selectedReport.severity
                              ? 'bg-red-500'
                              : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Level {selectedReport.severity} of 5
                    </p>
                  </div>

                  {selectedReport.description && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Description</label>
                      <p className="text-gray-600">{selectedReport.description}</p>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium text-gray-700">Location</label>
                    <p className="text-gray-600">
                      {selectedReport.locationName || 'Unknown location'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {selectedReport.latitude.toFixed(6)}, {selectedReport.longitude.toFixed(6)}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">Status</label>
                    <p>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm ${
                        selectedReport.status === 'APPROVED'
                          ? 'bg-green-100 text-green-800'
                          : selectedReport.status === 'CLEANED'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {selectedReport.status.replace(/_/g, ' ')}
                      </span>
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">Reported</label>
                    <p className="text-gray-600">
                      {new Date(selectedReport.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>

                  {selectedReport.status === 'APPROVED' && (
                    <Button 
                      onClick={() => setShowCleanupModal(true)}
                      className="w-full bg-nature-blue-600 hover:bg-nature-blue-700"
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Submit Cleanup
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cleanup Modal */}
        {showCleanupModal && selectedReport && (
          <CleanupSubmissionModal
            isOpen={showCleanupModal}
            onClose={() => setShowCleanupModal(false)}
            onSuccess={handleReportSuccess}
            wasteReport={selectedReport}
          />
        )}
      </div>
    </div>
  );
}
