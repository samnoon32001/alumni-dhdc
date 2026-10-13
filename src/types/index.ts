export type UserRole = 'super_admin' | 'teacher' | 'student' | 'alumni';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  name: string;
  email?: string;
  phone?: string;
  admissionNumber?: string;
  studentId?: string;
  alumniId?: string;
  status: 'active' | 'inactive';
  password?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AlumniZone {
  id: string;
  name: string;
  region: string;
  description?: string;
  isActive: boolean;
  _count?: {
    alumni?: number;
  };
}

export interface Alumni {
  id: string;
  admissionNumber: string;
  name: string;
  gender?: string;
  dob?: string;
  bloodGroup?: string;
  photoUrl?: string;
  email?: string;
  phone?: string;
  whatsappNumber?: string;
  zoneId?: string;
  zoneName?: string;
  zone?: AlumniZone;
  permanentAddress?: string;
  currentCity?: string;
  currentState?: string;
  currentCountry?: string;
  postalCode?: string;
  admissionYear?: string;
  passoutBatchYear: string;
  completedClass: string;
  finalGradeOrPercentage?: string;
  currentStatus?: 'Higher Studies' | 'Employed' | 'Business' | 'Research' | string;
  currentInstitution?: string;
  courseOrDegree?: string;
  designation?: string;
  organizationOrCompany?: string;
  isProfileCompleted: boolean;
  completedSteps: number;
  isPublicProfile: boolean;
  showContactNumber: boolean;
  showEmail: boolean;
  willingToMentor: boolean;
  studentId?: string;
  userId?: string;
  verificationStatus: 'VERIFIED' | 'PENDING' | 'REJECTED';
  bio?: string;
  createdAt: string;
  updatedAt: string;
  donations?: AlumniDonation[];
  readNotificationIds?: string[];
}

export interface AlumniAnnouncement {
  id: string;
  title: string;
  content: string;
  category: 'General' | 'Event' | 'Reunion' | 'Donation Drive' | 'Urgent' | string;
  targetZoneId?: string;
  targetBatch?: string;
  priority: 'normal' | 'high' | 'urgent';
  attachmentUrl?: string;
  bannerUrl?: string;
  isPinned: boolean;
  publishedAt: string;
  expiresAt?: string;
  createdBy?: string;
  createdByName?: string;
}

export interface IFLAHFundLevel {
  id: string;
  name: string;
  target: number;
}

export interface LevelBreakdownItem {
  levelId: string;
  levelName: string;
  target: number;
  paid: number;
  balance: number;
  isPaid: boolean;
}

export interface AlumniDonationCycle {
  id: string;
  academicYear: string;
  cycle: string;
  label: string;
  startDate: string;
  endDate: string;
  defaultTarget: number;
  isCurrent: boolean;
  description?: string;
  levels?: IFLAHFundLevel[];
  createdAt: string;
  donations?: AlumniDonation[];
  _count?: {
    donations?: number;
  };
}

export interface AlumniPaymentRecord {
  id: string;
  donationId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  transactionRef?: string;
  receiptNumber?: string;
  notes?: string;
  levelId?: string;
  levelName?: string;
  recordedByName?: string;
  createdAt: string;
}

export interface AlumniDonation {
  id: string;
  alumniId: string;
  admissionNumber: string;
  alumniName: string;
  cycleId: string;
  cycle?: AlumniDonationCycle;
  targetAmount: number;
  paidAmount: number;
  balanceAmount: number;
  status: 'PENDING' | 'PARTIAL' | 'COMPLETED' | 'OVERDUE';
  lastPaymentDate?: string;
  paymentMethod?: string;
  transactionRef?: string;
  receiptNumber?: string;
  receiptUrl?: string;
  notes?: string;
  recordedBy?: string;
  recordedByName?: string;
  createdAt: string;
  updatedAt: string;
  payments?: AlumniPaymentRecord[];
  levelsBreakdown?: LevelBreakdownItem[];
  alumni?: {
    name: string;
    admissionNumber: string;
    zoneName?: string | null;
    photoUrl?: string | null;
    phone?: string | null;
    passoutBatchYear?: string;
  };
}

export interface Class10StudentCandidate {
  id: string;
  admissionNumber: string;
  name: string;
  classId: string;
  className: string;
  academicYear: string;
  phone?: string;
  email?: string;
  photoUrl?: string;
  dob?: string;
  gender?: string;
  address?: string;
  bloodGroup?: string;
  status: string;
  isAlumni: boolean;
  alumniId?: string;
  cceTotalMarks?: number;
  ccePercentage?: number;
  cceAverage?: string;
}
