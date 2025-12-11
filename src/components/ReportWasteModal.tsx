import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, MapPin, Camera, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { WasteType } from '@/types';

interface ReportWasteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialLocation?: { lat: number; lng: number };
}

export default function ReportWasteModal({
  isOpen,
  onClose,
  onSuccess,
  initialLocation,
}: ReportWasteModalProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    latitude: initialLocation?.lat || 0,
    longitude: initialLocation?.lng || 0,
    locationName: '',
    description: '',
    wasteType: 'PLASTIC_BOTTLES' as WasteType,
    severity: 3,
  });
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);

  // Update location when initialLocation changes
  useEffect(() => {
    if (initialLocation) {
      setFormData(prev => ({
        ...prev,
        latitude: initialLocation.lat,
        longitude: initialLocation.lng,
      }));
    }
  }, [initialLocation]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + photos.length > 4) {
      toast.error('Maximum 4 photos allowed');
      return;
    }

    setPhotos([...photos, ...files]);
    
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
    setPhotos(photos.filter((_, i) => i !== index));
    setPhotoPreviews(photoPreviews.filter((_, i) => i !== index));
  };

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData({
            ...formData,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          toast.success('Location obtained!');
        },
        (error) => {
          toast.error('Failed to get location: ' + error.message);
        }
      );
    } else {
      toast.error('Geolocation is not supported by your browser');
    }
  };

  const handleSubmit = async () => {
    if (photos.length === 0) {
      toast.error('Please add at least one photo');
      return;
    }

    if (!formData.latitude || !formData.longitude) {
      toast.error('Please provide location');
      return;
    }

    setLoading(true);

    try {
      // Upload photos first
      const photoKeys: string[] = [];
      
      for (const photo of photos) {
        const photoFormData = new FormData();
        photoFormData.append('file', photo);
        photoFormData.append('type', 'waste-report');
        
        const uploadResponse = await api.post('/upload', photoFormData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        
        photoKeys.push(uploadResponse.data.data.key);
      }

      // Create waste report
      await api.post('/waste-reports', {
        ...formData,
        photos: photoKeys,
      });

      toast.success('Waste report submitted successfully!');
      onSuccess();
      onClose();
      
      // Reset form
      setStep(1);
      setFormData({
        latitude: 0,
        longitude: 0,
        locationName: '',
        description: '',
        wasteType: 'PLASTIC_BOTTLES',
        severity: 3,
      });
      setPhotos([]);
      setPhotoPreviews([]);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit report');
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
          className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4"
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Report Waste</h2>
              <p className="text-sm text-gray-600">
                Step {step} of 3
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress bar */}
          <div className="px-6 pt-4">
            <div className="flex gap-2">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`h-2 flex-1 rounded-full ${
                    s <= step ? 'bg-nature-green-600' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-6">
            {step === 1 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Location Details</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleGetLocation}
                      className="w-full"
                    >
                      <MapPin className="w-4 h-4 mr-2" />
                      Use Current Location
                    </Button>
                  </div>
                  {formData.latitude && formData.longitude ? (
                    <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      Location set: {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-500 mt-2">
                      Click the button or click on the map to set location
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location Name (Optional)
                  </label>
                  <Input
                    placeholder="e.g., Beach near lighthouse"
                    value={formData.locationName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData({ ...formData, locationName: e.target.value })
                    }
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Waste Details</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Waste Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.wasteType}
                    onChange={(e) =>
                      setFormData({ ...formData, wasteType: e.target.value as WasteType })
                    }
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="PLASTIC_BOTTLES">Plastic Bottles</option>
                    <option value="PLASTIC_BAGS">Plastic Bags</option>
                    <option value="MIXED_PLASTIC">Mixed Plastic</option>
                    <option value="STYROFOAM">Styrofoam</option>
                    <option value="FISHING_GEAR">Fishing Gear</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Severity: {formData.severity}/5
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={formData.severity}
                    onChange={(e) =>
                      setFormData({ ...formData, severity: parseInt(e.target.value) })
                    }
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Minor</span>
                    <span>Moderate</span>
                    <span>Severe</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    placeholder="Describe the waste situation..."
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-md min-h-[100px]"
                  />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Upload Photos</h3>
                <p className="text-sm text-gray-600">
                  Add up to 4 photos of the waste <span className="text-red-500">*</span>
                </p>

                {/* Photo previews */}
                {photoPreviews.length > 0 && (
                  <div className="grid grid-cols-2 gap-4">
                    {photoPreviews.map((preview, index) => (
                      <div key={index} className="relative">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-40 object-cover rounded-lg"
                        />
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
                {photos.length < 4 && (
                  <label className="block">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-nature-green-500 transition-colors">
                      <Camera className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">
                        Click to upload photos or take a picture
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {photos.length}/4 photos uploaded
                      </p>
                    </div>
                  </label>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-between">
            {step > 1 ? (
              <Button variant="outline" onClick={() => setStep(step - 1)}>
                Back
              </Button>
            ) : (
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
            )}

            {step < 3 ? (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={step === 1 && (!formData.latitude || !formData.longitude)}
                className="bg-nature-green-600 hover:bg-nature-green-700"
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={loading || photos.length === 0}
                className="bg-nature-green-600 hover:bg-nature-green-700"
              >
                {loading ? 'Submitting...' : 'Submit Report'}
              </Button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
