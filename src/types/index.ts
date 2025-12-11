export type WasteType =
  | 'PLASTIC_BOTTLES'
  | 'PLASTIC_BAGS'
  | 'MIXED_PLASTIC'
  | 'STYROFOAM'
  | 'FISHING_GEAR'
  | 'OTHER';

export const WasteType = {
  PLASTIC_BOTTLES: 'PLASTIC_BOTTLES' as WasteType,
  PLASTIC_BAGS: 'PLASTIC_BAGS' as WasteType,
  MIXED_PLASTIC: 'MIXED_PLASTIC' as WasteType,
  STYROFOAM: 'STYROFOAM' as WasteType,
  FISHING_GEAR: 'FISHING_GEAR' as WasteType,
  OTHER: 'OTHER' as WasteType,
};

export type WasteReportStatus =
  | 'PENDING_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'CLEANED';

export const WasteReportStatus = {
  PENDING_REVIEW: 'PENDING_REVIEW' as WasteReportStatus,
  APPROVED: 'APPROVED' as WasteReportStatus,
  REJECTED: 'REJECTED' as WasteReportStatus,
  CLEANED: 'CLEANED' as WasteReportStatus,
};

export type CleanupStatus =
  | 'PENDING_VERIFICATION'
  | 'APPROVED'
  | 'REJECTED';

export const CleanupStatus = {
  PENDING_VERIFICATION: 'PENDING_VERIFICATION' as CleanupStatus,
  APPROVED: 'APPROVED' as CleanupStatus,
  REJECTED: 'REJECTED' as CleanupStatus,
};

export interface User {
  id: string;
  email: string;
  username: string;
  role: string;
  carbonPoints: number;
  profileImage?: string;
}

export interface AIDetection {
  class: string;
  confidence: number;
  bbox?: number[];
}

export interface AIAnalysisData {
  detections?: AIDetection[];
  totalObjects?: number;
  averageConfidence?: number;
  wasteCategories?: {
    plastic?: number;
    paper?: number;
    metal?: number;
    glass?: number;
    organic?: number;
    hazardous?: number;
    electronics?: number;
    other?: number;
  };
  estimatedWeight?: number;
  suggestedSeverity?: number;
  processingTime?: number;
  modelVersion?: string;
}

export interface WasteReport {
  id: string;
  latitude: number;
  longitude: number;
  locationName?: string;
  photos: string[];
  description?: string;
  wasteType: WasteType;
  severity: number;
  status: WasteReportStatus;
  reporterId: string;
  reporter?: User;
  aiAnalysisData?: AIAnalysisData | null;
  createdAt: string;
  updatedAt: string;
}

export interface VerificationData {
  beforeAnalysis?: AIAnalysisData;
  afterAnalysis?: AIAnalysisData;
  objectsRemoved?: number;
  confidence?: number;
  cleanupEffectiveness?: number;
  recommendation?: string;
}

export interface CleanupActivity {
  id: string;
  wasteReportId: string;
  userId: string;
  beforePhotos: string[];
  afterPhotos: string[];
  status: CleanupStatus;
  pointsAwarded: number;
  aiConfidenceScore?: number;
  aiAnalysisData?: VerificationData | null;
  createdAt: string;
  verifiedAt?: string;
  wasteReport?: WasteReport;
  user?: User;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  requiredPoints: number;
  category: string;
  tier?: string;
  isSpecial: boolean;
}
