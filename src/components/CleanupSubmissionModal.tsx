import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Camera, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import type { WasteReport } from '@/types';

interface CleanupSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  wasteReport: WasteReport;
}

export default function CleanupSubmissionModal({
  isOpen,
  onClose,
  onSuccess,
  wasteReport,
}: CleanupSubmissionModalProps) {
  const [loading, setLoading] = useState(false);
  const [afterPhotos, setAfterPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + afterPhotos.length > 4) {
      toast.error('Maximum 4 photos allowed');
      return;
    }

    setAfterPhotos([...afterPhotos, ...files]);
    
    // Create previews
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setAfterPhotos(afterPhotos.filter((_, i) => i !== index));
    setPhotoPreviews(photoPreviews.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (afterPhotos.length === 0) {
      toast.error('Please add at least one after photo');
      return;
    }

    setLoading(true);

    try {
      // Upload after photos
      const photoKeys: string[] = [];
      
      for (const photo of afterPhotos) {
        const photoFormData = new FormData();
        photoFormData.append('file', photo);
        photoFormData.append('type', 'cleanup');
        
        const uploadResponse = await api.post('/upload', photoFormData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        
        photoKeys.push(uploadResponse.data.data.key);
      }

      // Submit cleanup
      await api.post('/cleanups', {
        wasteReportId: wasteReport.id,
        afterPhotos: photoKeys,
      });

      toast.success('Cleanup submitted for verification!');
      onSuccess();
      onClose();
      
      // Reset form
      setAfterPhotos([]);
      setPhotoPreviews([]);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit cleanup');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto m-4"
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Submit Cleanup</h2>
              <p className="text-sm text-gray-600">
                Upload photos of the cleaned area
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-6 space-y-6">
            {/* Before Photos */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Camera className="w-5 h-5" />
                Before Photos (Original Report)
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {wasteReport.photos.map((photo, index) => (
                  <div key={index} className="relative">
                    <img
                      src={`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/upload/view/${photo}`}
                      alt={`Before ${index + 1}`}
                      className="w-full h-40 object-cover rounded-lg border-2 border-gray-200"
                    />
                    <div className="absolute top-2 left-2 px-2 py-1 bg-white rounded-full text-xs font-medium">
                      Before
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* After Photos */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                After Photos (Cleaned Area) <span className="text-red-500">*</span>
              </h3>
              
              {photoPreviews.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                  {photoPreviews.map((preview, index) => (
                    <div key={index} className="relative">
                      <img
                        src={preview}
                        alt={`After ${index + 1}`}
                        className="w-full h-40 object-cover rounded-lg border-2 border-green-500"
                      />
                      <div className="absolute top-2 left-2 px-2 py-1 bg-green-500 text-white rounded-full text-xs font-medium">
                        After
                      </div>
                      <button
                        onClick={() => removePhoto(index)}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload button */}
              {afterPhotos.length < 4 && (
                <label className="block">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <div className="border-2 border-dashed border-green-300 rounded-lg p-8 text-center cursor-pointer hover:border-green-500 transition-colors bg-green-50">
                    <Camera className="w-12 h-12 mx-auto text-green-500 mb-2" />
                    <p className="text-sm text-gray-700 font-medium">
                      Upload photos of the cleaned area
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {afterPhotos.length}/4 photos uploaded
                    </p>
                  </div>
                </label>
              )}
            </div>

            {/* Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Verification Process</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Your cleanup will be reviewed by our AI system and admin team</li>
                <li>• Make sure the after photos clearly show the cleaned area</li>
                <li>• You'll earn carbon points once verified</li>
                <li>• The verification usually takes 24-48 hours</li>
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-between">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>

            <Button
              onClick={handleSubmit}
              disabled={loading || afterPhotos.length === 0}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? 'Submitting...' : 'Submit Cleanup'}
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
