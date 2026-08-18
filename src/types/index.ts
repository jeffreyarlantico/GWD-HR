/**
 * Guimba West District HRIS Types
 */

export type Role = 'ADMIN' | 'VIEW_ONLY';

export type EmployeeStatus = 'Active' | 'Inactive';

export type SchoolStatus = 'Active' | 'Inactive';

export type LeaveType = 
  | 'Maternity Leave'
  | 'Paternity Leave'
  | 'Leave Without Pay (LWOP)'
  | 'Sick Leave'
  | 'Vacation Leave'
  | 'Special Privilege Leave'
  | 'Study Leave'
  | 'Rehabilitation Leave'
  | 'Others';

export interface School {
  id: string;
  name: string;
  status: SchoolStatus;
  createdAt: string;
  updatedAt: string;
}

export interface PromotionRecord {
  id: string;
  employeeId: string;
  position: string;
  itemNumber: string;
  appointmentDate: string; // YYYY-MM-DD
  appointmentPaperUrl?: string; // Google Drive / Cloud URL
  driveFileId?: string; // Google Drive File ID
  driveFileName?: string; // Original uploaded document filename
  remarks?: string;
  createdAt: string;
}

export interface SchoolAssignmentRecord {
  id: string;
  employeeId: string;
  schoolId: string;
  schoolName: string;
  effectiveDateFrom: string; // YYYY-MM-DD
  effectiveDateTo?: string; // YYYY-MM-DD or 'Present'
  remarks?: string;
  createdAt: string;
}

export interface SpecialOrder {
  id: string;
  soNumber: string; // e.g., SO-2026-001
  soDate: string; // YYYY-MM-DD
  title: string; // Title of Service Credit Activity
  soDocumentUrl?: string; // Google Drive / Cloud URL
  driveFileId?: string; // Google Drive File ID
  driveFileName?: string; // Original uploaded document filename
  createdAt: string;
  updatedAt: string;
}

// Earned service credits per employee under a Special Order
export interface ServiceCreditEarned {
  id: string;
  soId: string;
  soNumber: string;
  employeeId: string;
  earnedCredits: number; // e.g. 1.5, 3.0
  remarks?: string;
  createdAt: string;
}

// Used service credits deducted from a specific Special Order
export interface ServiceCreditUsed {
  id: string;
  employeeId: string;
  soId: string;
  soNumber: string;
  dateUsed: string; // YYYY-MM-DD
  usedCredits: number;
  remarks?: string;
  createdAt: string;
}

export interface LeaveRecord {
  id: string;
  employeeId: string;
  leaveType: LeaveType;
  dateFrom: string; // YYYY-MM-DD
  dateTo: string; // YYYY-MM-DD
  numberOfDays: number;
  remarks?: string;
  documentUrl?: string; // Google Drive / Cloud URL
  driveFileId?: string; // Google Drive File ID
  driveFileName?: string; // Original uploaded document filename
  createdAt: string;
}

export interface Employee {
  id: string;
  // Personal Info
  profilePhotoUrl?: string;
  photoDriveFileId?: string;
  photoDriveFileName?: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  extensionName?: string; // e.g. Jr., III
  birthday: string; // YYYY-MM-DD

  // Employment Info
  employeeNumber: string; // Unique ID (e.g. 4839201)
  currentPosition: string; // e.g. Teacher I, Teacher III, Master Teacher I, Head Teacher III, Principal I
  itemNumber: string;
  dateOfLatestAppointment: string; // YYYY-MM-DD
  dateOfOriginalAppointment: string; // YYYY-MM-DD
  appointmentDocumentUrl?: string; // Uploaded appointment document/file for current position
  appointmentDriveFileId?: string; // Google Drive File ID
  appointmentDriveFileName?: string; // Google Drive Document Name
  schoolId: string;
  schoolName: string;
  status: EmployeeStatus;

  // Government Info
  tinNumber: string;
  lbpAccountNumber: string;
  gsisNumber: string;
  philhealthNumber: string;
  pagibigNumber: string;

  // Metadata
  createdAt: string;
  updatedAt: string;
}

// Full calculated employee details with history
export interface EmployeeFull extends Employee {
  promotions: PromotionRecord[];
  schoolAssignments: SchoolAssignmentRecord[];
  earnedCredits: ServiceCreditEarned[];
  usedCredits: ServiceCreditUsed[];
  leaveRecords: LeaveRecord[];
  totalEarnedCredits: number;
  totalUsedCredits: number;
  availableCredits: number;
}

export type DuplicateResolution = 'UPDATE' | 'SKIP' | 'KEEP_BOTH';

export interface ImportPreviewRow {
  rowIndex: number;
  data: Partial<Employee>;
  isDuplicate: boolean;
  existingEmployee?: Employee;
  resolution?: DuplicateResolution;
  statusText?: string;
}

export interface BirthdayUpcoming {
  employee: Employee;
  birthdayThisYear: Date;
  daysRemaining: number;
  ageTurning: number;
}

export interface DeletedEmployee extends Employee {
  deletedAt: string;
  deleteReason?: string;
}

export interface DeletedSchool extends School {
  deletedAt: string;
  deleteReason?: string;
}

export interface DeletedLeaveRecord extends LeaveRecord {
  deletedAt: string;
  deleteReason?: string;
  employeeName?: string;
  employeeNumber?: string;
  schoolName?: string;
}

export interface DeletedSpecialOrder extends SpecialOrder {
  deletedAt: string;
  deleteReason?: string;
  totalRecipients?: number;
  totalGrantedCredits?: number;
}

