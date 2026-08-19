import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { StorageService } from '../services/storageService';
import { FirestoreSyncService } from '../services/firestoreService';
import { 
  Employee, EmployeeFull, DeletedEmployee, School, DeletedSchool, DeletedLeaveRecord, DeletedSpecialOrder, SpecialOrder, ServiceCreditEarned, 
  ServiceCreditUsed, PromotionRecord, SchoolAssignmentRecord, LeaveRecord,
  BirthdayUpcoming
} from '../types';
import { ToastContainer, ToastItem } from '../components/common/ToastContainer';

export type CloudSyncStatus = 'connected' | 'syncing' | 'error' | 'offline';

interface HRISContextType {
  employees: Employee[];
  deletedEmployees: DeletedEmployee[];
  schools: School[];
  deletedSchools: DeletedSchool[];
  deletedLeaveRecords: DeletedLeaveRecord[];
  specialOrders: SpecialOrder[];
  deletedSpecialOrders: DeletedSpecialOrder[];
  earnedCredits: ServiceCreditEarned[];
  usedCredits: ServiceCreditUsed[];
  promotions: PromotionRecord[];
  schoolAssignments: SchoolAssignmentRecord[];
  leaveRecords: LeaveRecord[];

  // Cloud Sync Status
  cloudStatus: CloudSyncStatus;
  lastCloudSync: Date | null;
  refreshCloudData: () => Promise<void>;

  // Toast Notifications
  toasts: ToastItem[];
  showToast: (type: 'success' | 'error' | 'warning' | 'info', message: string, title?: string, duration?: number) => void;
  dismissToast: (id: string) => void;

  // Stats
  totalActiveEmployees: number;
  totalInactiveEmployees: number;
  totalSchoolsCount: number;
  employeesPerSchool: { schoolName: string; count: number }[];
  recentlyAddedEmployees: Employee[];
  recentlyUpdatedEmployees: Employee[];
  upcomingBirthdays: BirthdayUpcoming[];

  // Actions - Employees
  addEmployee: (employeeData: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>) => Promise<{ success: boolean; message: string; employee?: Employee }>;
  updateEmployee: (id: string, employeeData: Partial<Employee>) => Promise<{ success: boolean; message: string }>;
  deleteEmployee: (id: string, reason?: string) => Promise<{ success: boolean; message: string }>;
  restoreEmployee: (id: string) => Promise<{ success: boolean; message: string }>;
  permanentlyDeleteEmployee: (id: string) => Promise<{ success: boolean; message: string }>;
  getEmployeeFull: (id: string) => EmployeeFull | null;
  getEmployeeByNumber: (empNum: string) => Employee | null;

  // Actions - Schools
  addSchool: (name: string) => Promise<{ success: boolean; message: string }>;
  updateSchool: (id: string, name: string, status: 'Active' | 'Inactive') => Promise<{ success: boolean; message: string }>;
  deleteSchool: (id: string, reason?: string) => Promise<{ success: boolean; message: string }>;
  restoreSchool: (id: string) => Promise<{ success: boolean; message: string }>;
  permanentlyDeleteSchool: (id: string) => Promise<{ success: boolean; message: string }>;
  
  // Actions - Promotions
  addPromotion: (promo: Omit<PromotionRecord, 'id' | 'createdAt'>) => Promise<void>;
  updatePromotion: (id: string, promo: Partial<PromotionRecord>) => Promise<void>;
  deletePromotion: (id: string) => Promise<void>;

  // Actions - School Assignments
  addSchoolAssignment: (assignment: Omit<SchoolAssignmentRecord, 'id' | 'createdAt'>) => Promise<void>;
  updateSchoolAssignment: (id: string, assignment: Partial<SchoolAssignmentRecord>) => Promise<void>;
  deleteSchoolAssignment: (id: string) => Promise<void>;

  // Actions - Special Orders & Service Credits
  addSpecialOrder: (so: Omit<SpecialOrder, 'id' | 'createdAt' | 'updatedAt'>) => Promise<SpecialOrder>;
  updateSpecialOrder: (id: string, so: Partial<SpecialOrder>) => Promise<void>;
  deleteSpecialOrder: (id: string, reason?: string) => Promise<{ success: boolean; message: string }>;
  restoreSpecialOrder: (id: string) => Promise<{ success: boolean; message: string }>;
  permanentlyDeleteSpecialOrder: (id: string) => Promise<{ success: boolean; message: string }>;
  addEarnedCredit: (earned: Omit<ServiceCreditEarned, 'id' | 'createdAt'>) => Promise<void>;
  addEarnedCreditsBatch: (soId: string, soNumber: string, assignments: { employeeId: string; earnedCredits: number; remarks?: string }[]) => Promise<void>;
  updateEarnedCredit: (id: string, earnedCredits: number, remarks?: string) => Promise<void>;
  deleteEarnedCredit: (id: string) => Promise<void>;

  // Used Credits with strict validation
  addUsedCredit: (used: Omit<ServiceCreditUsed, 'id' | 'createdAt'>) => Promise<{ success: boolean; message: string }>;
  deleteUsedCredit: (id: string) => Promise<void>;

  // Helper: get available credits for employee in specific Special Order
  getAvailableCreditsForEmployeeInSO: (employeeId: string, soId: string) => number;
  // Get all Special Orders where employee has earned credits and available > 0
  getAvailableSpecialOrdersForEmployee: (employeeId: string) => { so: SpecialOrder; earned: number; used: number; available: number }[];

  // Actions - Leave
  addLeaveRecord: (leave: Omit<LeaveRecord, 'id' | 'createdAt'>) => Promise<void>;
  updateLeaveRecord: (id: string, leave: Partial<LeaveRecord>) => Promise<void>;
  deleteLeaveRecord: (id: string, reason?: string) => Promise<{ success: boolean; message: string }>;
  restoreLeaveRecord: (id: string) => Promise<{ success: boolean; message: string }>;
  permanentlyDeleteLeaveRecord: (id: string) => Promise<{ success: boolean; message: string }>;

  // System
  resetSystemData: () => Promise<void>;
  importEmployeesBatch: (newEmps: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>[], resolutions: Record<string, 'UPDATE' | 'SKIP' | 'KEEP_BOTH'>) => Promise<{ added: number; updated: number; skipped: number }>;
}

const HRISContext = createContext<HRISContextType | undefined>(undefined);

export const HRISProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize Storage
  useEffect(() => {
    StorageService.initStorage();
  }, []);

  const [employees, setEmployees] = useState<Employee[]>(() => StorageService.getEmployees());
  const [deletedEmployees, setDeletedEmployees] = useState<DeletedEmployee[]>(() => StorageService.getDeletedEmployees());
  const [schools, setSchools] = useState<School[]>(() => StorageService.getSchools());
  const [deletedSchools, setDeletedSchools] = useState<DeletedSchool[]>(() => StorageService.getDeletedSchools());
  const [specialOrders, setSpecialOrders] = useState<SpecialOrder[]>(() => StorageService.getSpecialOrders());
  const [deletedSpecialOrders, setDeletedSpecialOrders] = useState<DeletedSpecialOrder[]>(() => StorageService.getDeletedSpecialOrders());
  const [earnedCredits, setEarnedCredits] = useState<ServiceCreditEarned[]>(() => StorageService.getEarnedCredits());
  const [usedCredits, setUsedCredits] = useState<ServiceCreditUsed[]>(() => StorageService.getUsedCredits());
  const [promotions, setPromotions] = useState<PromotionRecord[]>(() => StorageService.getPromotions());
  const [schoolAssignments, setSchoolAssignments] = useState<SchoolAssignmentRecord[]>(() => StorageService.getSchoolAssignments());
  const [leaveRecords, setLeaveRecords] = useState<LeaveRecord[]>(() => StorageService.getLeaveRecords());
  const [deletedLeaveRecords, setDeletedLeaveRecords] = useState<DeletedLeaveRecord[]>(() => StorageService.getDeletedLeaveRecords());

  // Cloud Status & Toast State
  const [cloudStatus, setCloudStatus] = useState<CloudSyncStatus>('syncing');
  const [lastCloudSync, setLastCloudSync] = useState<Date | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // Toast Dispatcher
  const showToast = useCallback((
    type: 'success' | 'error' | 'warning' | 'info',
    message: string,
    title?: string,
    duration: number = 4000
  ) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newToast: ToastItem = { id, type, message, title, timestamp: Date.now() };
    setToasts(prev => [...prev, newToast]);

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Sync to Local Storage as fast cache
  useEffect(() => StorageService.saveEmployees(employees), [employees]);
  useEffect(() => StorageService.saveDeletedEmployees(deletedEmployees), [deletedEmployees]);
  useEffect(() => StorageService.saveSchools(schools), [schools]);
  useEffect(() => StorageService.saveDeletedSchools(deletedSchools), [deletedSchools]);
  useEffect(() => StorageService.saveSpecialOrders(specialOrders), [specialOrders]);
  useEffect(() => StorageService.saveDeletedSpecialOrders(deletedSpecialOrders), [deletedSpecialOrders]);
  useEffect(() => StorageService.saveEarnedCredits(earnedCredits), [earnedCredits]);
  useEffect(() => StorageService.saveUsedCredits(usedCredits), [usedCredits]);
  useEffect(() => StorageService.savePromotions(promotions), [promotions]);
  useEffect(() => StorageService.saveSchoolAssignments(schoolAssignments), [schoolAssignments]);
  useEffect(() => StorageService.saveLeaveRecords(leaveRecords), [leaveRecords]);
  useEffect(() => StorageService.saveDeletedLeaveRecords(deletedLeaveRecords), [deletedLeaveRecords]);

  // Initial Fetch & Real-time onSnapshot Subscriptions on page load
  useEffect(() => {
    let isMounted = true;

    const initializeFirestore = async () => {
      try {
        setCloudStatus('syncing');

        // Check if Firestore collections are empty (e.g. fresh database)
        const isSchoolsEmpty = await FirestoreSyncService.isCollectionEmpty('schools');
        if (isSchoolsEmpty && isMounted) {
          console.info('[Firebase] Seeding initial schools to Firestore...');
          await FirestoreSyncService.batchSaveItems('schools', StorageService.getSchools());
        }

        const isEmployeesEmpty = await FirestoreSyncService.isCollectionEmpty('employees');
        if (isEmployeesEmpty && isMounted) {
          console.info('[Firebase] Seeding initial employees to Firestore...');
          await FirestoreSyncService.batchSaveItems('employees', StorageService.getEmployees());
        }

        const isPromosEmpty = await FirestoreSyncService.isCollectionEmpty('promotions');
        if (isPromosEmpty && isMounted) {
          await FirestoreSyncService.batchSaveItems('promotions', StorageService.getPromotions());
        }

        const isSOEmpty = await FirestoreSyncService.isCollectionEmpty('specialOrders');
        if (isSOEmpty && isMounted) {
          await FirestoreSyncService.batchSaveItems('specialOrders', StorageService.getSpecialOrders());
        }

        const isAssignEmpty = await FirestoreSyncService.isCollectionEmpty('schoolAssignments');
        if (isAssignEmpty && isMounted) {
          await FirestoreSyncService.batchSaveItems('schoolAssignments', StorageService.getSchoolAssignments());
        }

        const isEarnedEmpty = await FirestoreSyncService.isCollectionEmpty('serviceCreditsEarned');
        if (isEarnedEmpty && isMounted) {
          await FirestoreSyncService.batchSaveItems('serviceCreditsEarned', StorageService.getEarnedCredits());
        }

        const isUsedEmpty = await FirestoreSyncService.isCollectionEmpty('serviceCreditsUsed');
        if (isUsedEmpty && isMounted) {
          await FirestoreSyncService.batchSaveItems('serviceCreditsUsed', StorageService.getUsedCredits());
        }

        const isLeaveEmpty = await FirestoreSyncService.isCollectionEmpty('leaveRecords');
        if (isLeaveEmpty && isMounted) {
          await FirestoreSyncService.batchSaveItems('leaveRecords', StorageService.getLeaveRecords());
        }

        if (isMounted) {
          setCloudStatus('connected');
          setLastCloudSync(new Date());
        }
      } catch (err) {
        console.error('[Firebase] Error during initial Firestore synchronization:', err);
        if (isMounted) {
          setCloudStatus('error');
        }
      }
    };

    initializeFirestore();

    // Subscribe to Firestore collections with onSnapshot listeners
    const onSnapshotErrorHandler = (collectionName: string) => (err: unknown) => {
      console.error(`[Firebase] onSnapshot error on collection "${collectionName}":`, err);
      setCloudStatus('error');
    };

    const unsubSchools = FirestoreSyncService.subscribeToCollection<School>('schools', (cloud) => {
      if (cloud && cloud.length > 0) {
        setSchools(cloud);
      }
      setCloudStatus('connected');
      setLastCloudSync(new Date());
    }, onSnapshotErrorHandler('schools'));

    const unsubEmps = FirestoreSyncService.subscribeToCollection<Employee>('employees', (cloud) => {
      if (cloud && cloud.length > 0) {
        setEmployees(cloud);
      }
      setCloudStatus('connected');
      setLastCloudSync(new Date());
    }, onSnapshotErrorHandler('employees'));

    const unsubPromos = FirestoreSyncService.subscribeToCollection<PromotionRecord>('promotions', (cloud) => {
      if (cloud && cloud.length > 0) {
        setPromotions(cloud);
      }
    }, onSnapshotErrorHandler('promotions'));

    const unsubAssign = FirestoreSyncService.subscribeToCollection<SchoolAssignmentRecord>('schoolAssignments', (cloud) => {
      if (cloud && cloud.length > 0) {
        setSchoolAssignments(cloud);
      }
    }, onSnapshotErrorHandler('schoolAssignments'));

    const unsubSO = FirestoreSyncService.subscribeToCollection<SpecialOrder>('specialOrders', (cloud) => {
      if (cloud && cloud.length > 0) {
        setSpecialOrders(cloud);
      }
    }, onSnapshotErrorHandler('specialOrders'));

    const unsubEarned = FirestoreSyncService.subscribeToCollection<ServiceCreditEarned>('serviceCreditsEarned', (cloud) => {
      if (cloud && cloud.length > 0) {
        setEarnedCredits(cloud);
      }
    }, onSnapshotErrorHandler('serviceCreditsEarned'));

    const unsubUsed = FirestoreSyncService.subscribeToCollection<ServiceCreditUsed>('serviceCreditsUsed', (cloud) => {
      if (cloud && cloud.length > 0) {
        setUsedCredits(cloud);
      }
    }, onSnapshotErrorHandler('serviceCreditsUsed'));

    const unsubLeave = FirestoreSyncService.subscribeToCollection<LeaveRecord>('leaveRecords', (cloud) => {
      if (cloud && cloud.length > 0) {
        setLeaveRecords(cloud);
      }
    }, onSnapshotErrorHandler('leaveRecords'));

    const unsubDelEmp = FirestoreSyncService.subscribeToCollection<DeletedEmployee>('deletedEmployees', (cloud) => {
      setDeletedEmployees(cloud || []);
    }, onSnapshotErrorHandler('deletedEmployees'));

    const unsubDelSchool = FirestoreSyncService.subscribeToCollection<DeletedSchool>('deletedSchools', (cloud) => {
      setDeletedSchools(cloud || []);
    }, onSnapshotErrorHandler('deletedSchools'));

    const unsubDelSO = FirestoreSyncService.subscribeToCollection<DeletedSpecialOrder>('deletedSpecialOrders', (cloud) => {
      setDeletedSpecialOrders(cloud || []);
    }, onSnapshotErrorHandler('deletedSpecialOrders'));

    const unsubDelLeave = FirestoreSyncService.subscribeToCollection<DeletedLeaveRecord>('deletedLeaveRecords', (cloud) => {
      setDeletedLeaveRecords(cloud || []);
    }, onSnapshotErrorHandler('deletedLeaveRecords'));

    return () => {
      isMounted = false;
      unsubSchools();
      unsubEmps();
      unsubPromos();
      unsubAssign();
      unsubSO();
      unsubEarned();
      unsubUsed();
      unsubLeave();
      unsubDelEmp();
      unsubDelSchool();
      unsubDelSO();
      unsubDelLeave();
    };
  }, []);

  // Force manual refresh from Firestore
  const refreshCloudData = async () => {
    try {
      setCloudStatus('syncing');
      const [cloudEmps, cloudSchools, cloudPromos, cloudSO, cloudLeave] = await Promise.all([
        FirestoreSyncService.fetchCollection<Employee>('employees'),
        FirestoreSyncService.fetchCollection<School>('schools'),
        FirestoreSyncService.fetchCollection<PromotionRecord>('promotions'),
        FirestoreSyncService.fetchCollection<SpecialOrder>('specialOrders'),
        FirestoreSyncService.fetchCollection<LeaveRecord>('leaveRecords'),
      ]);

      if (cloudEmps.length > 0) setEmployees(cloudEmps);
      if (cloudSchools.length > 0) setSchools(cloudSchools);
      if (cloudPromos.length > 0) setPromotions(cloudPromos);
      if (cloudSO.length > 0) setSpecialOrders(cloudSO);
      if (cloudLeave.length > 0) setLeaveRecords(cloudLeave);

      setCloudStatus('connected');
      setLastCloudSync(new Date());
      showToast('success', 'Refreshed all employee and school data from Firestore cloud database.', 'Cloud Synchronized');
    } catch (err: any) {
      console.error('[Firebase] Manual refresh failed:', err);
      setCloudStatus('error');
      showToast('error', `Failed to sync from Firestore: ${err?.message || 'Network error'}`, 'Cloud Sync Failed');
    }
  };

  // Dynamic enrichment of employees based on latest promotion appointment date
  const enrichedEmployees = useMemo(() => {
    return employees.map(emp => {
      const empPromos = promotions
        .filter(p => p.employeeId === emp.id)
        .sort((a, b) => {
          const timeA = new Date(a.appointmentDate).getTime();
          const timeB = new Date(b.appointmentDate).getTime();
          if (timeB !== timeA) return timeB - timeA;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

      if (empPromos.length > 0) {
        const latest = empPromos[0];
        return {
          ...emp,
          currentPosition: latest.position || emp.currentPosition || 'Teacher I',
          itemNumber: latest.itemNumber || emp.itemNumber || '',
          dateOfLatestAppointment: latest.appointmentDate || emp.dateOfLatestAppointment || '',
          appointmentDocumentUrl: latest.appointmentPaperUrl || emp.appointmentDocumentUrl || ''
        };
      }
      return emp;
    });
  }, [employees, promotions]);

  // Statistics
  const totalActiveEmployees = useMemo(() => enrichedEmployees.filter(e => e.status === 'Active').length, [enrichedEmployees]);
  const totalInactiveEmployees = useMemo(() => enrichedEmployees.filter(e => e.status === 'Inactive').length, [enrichedEmployees]);
  const totalSchoolsCount = useMemo(() => schools.length, [schools]);

  const employeesPerSchool = useMemo(() => {
    const counts: Record<string, number> = {};
    schools.forEach(sch => {
      counts[sch.name] = 0;
    });
    enrichedEmployees.filter(e => e.status === 'Active').forEach(e => {
      if (counts[e.schoolName] !== undefined) {
        counts[e.schoolName] += 1;
      } else if (e.schoolName) {
        counts[e.schoolName] = 1;
      }
    });
    return Object.entries(counts).map(([schoolName, count]) => ({ schoolName, count }));
  }, [schools, enrichedEmployees]);

  const sortedEmployeesByLastName = useMemo(() => {
    return [...enrichedEmployees].sort((a, b) => a.lastName.localeCompare(b.lastName));
  }, [enrichedEmployees]);

  const recentlyAddedEmployees = useMemo(() => {
    return [...enrichedEmployees]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [enrichedEmployees]);

  const recentlyUpdatedEmployees = useMemo(() => {
    return [...enrichedEmployees]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5);
  }, [enrichedEmployees]);

  // Upcoming Birthdays within 30 days
  const upcomingBirthdays = useMemo(() => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const result: BirthdayUpcoming[] = [];

    enrichedEmployees.forEach(emp => {
      if (!emp.birthday) return;
      const birthDate = new Date(emp.birthday);
      if (isNaN(birthDate.getTime())) return;

      let nextBday = new Date(currentYear, birthDate.getMonth(), birthDate.getDate());
      
      if (nextBday < today) {
        const diffDaysPassed = (today.getTime() - nextBday.getTime()) / (1000 * 3600 * 24);
        if (diffDaysPassed > 1) {
          nextBday = new Date(currentYear + 1, birthDate.getMonth(), birthDate.getDate());
        }
      }

      const timeDiff = nextBday.getTime() - today.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

      if (daysDiff >= 0 && daysDiff <= 30) {
        const ageTurning = nextBday.getFullYear() - birthDate.getFullYear();
        result.push({
          employee: emp,
          birthdayThisYear: nextBday,
          daysRemaining: daysDiff,
          ageTurning
        });
      }
    });

    return result.sort((a, b) => a.daysRemaining - b.daysRemaining);
  }, [enrichedEmployees]);

  // Employee Helper Functions
  const getEmployeeByNumber = (empNum: string): Employee | null => {
    return enrichedEmployees.find(e => e.employeeNumber.trim().toLowerCase() === empNum.trim().toLowerCase()) || null;
  };

  /**
   * Add New Employee - Asynchronously writes to Firestore collection 'employees' & 'promotions'
   */
  const addEmployee = async (data: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      // Duplicate Employee Number Check
      const existing = getEmployeeByNumber(data.employeeNumber);
      if (existing) {
        const msg = `Employee Number "${data.employeeNumber}" already belongs to ${existing.firstName} ${existing.lastName}. Duplicate Employee Numbers are not allowed.`;
        showToast('warning', msg, 'Duplicate Employee Number');
        return {
          success: false,
          message: msg
        };
      }

      const now = new Date().toISOString();
      const newEmp: Employee = {
        ...data,
        id: `emp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        createdAt: now,
        updatedAt: now,
      };

      // Automatically create initial position appointment record
      const initialPromotion: PromotionRecord = {
        id: `prm-${Date.now()}`,
        employeeId: newEmp.id,
        position: newEmp.currentPosition || 'Teacher I',
        itemNumber: newEmp.itemNumber || '',
        appointmentDate: newEmp.dateOfLatestAppointment || newEmp.dateOfOriginalAppointment || new Date().toISOString().split('T')[0],
        appointmentPaperUrl: newEmp.appointmentDocumentUrl || '',
        remarks: 'Initial Appointment Record',
        createdAt: now
      };

      // 1. Asynchronously persist to Firestore database
      await FirestoreSyncService.saveItem('employees', newEmp);
      await FirestoreSyncService.saveItem('promotions', initialPromotion);

      // 2. Update local state immediately
      setEmployees(prev => {
        if (prev.some(e => e.id === newEmp.id)) return prev;
        return [...prev, newEmp];
      });
      setPromotions(prev => {
        if (prev.some(p => p.id === initialPromotion.id)) return prev;
        return [...prev, initialPromotion];
      });

      setCloudStatus('connected');
      setLastCloudSync(new Date());

      const successMsg = `${newEmp.firstName} ${newEmp.lastName} (#${newEmp.employeeNumber}) saved to Firestore.`;
      showToast('success', successMsg, 'Employee Created');

      return {
        success: true,
        message: 'Employee record created and saved to Firestore successfully.',
        employee: newEmp
      };
    } catch (error: any) {
      const errMsg = error?.message || 'Failed to save employee to Firestore.';
      console.error('[Firebase Error] addEmployee failed:', error);
      showToast('error', `Could not persist employee: ${errMsg}`, 'Firestore Error');
      return {
        success: false,
        message: `Failed to save employee to Firestore: ${errMsg}`
      };
    }
  };

  /**
   * Update Employee - Asynchronously writes to Firestore collection 'employees'
   */
  const updateEmployee = async (id: string, data: Partial<Employee>) => {
    try {
      const emp = employees.find(e => e.id === id);
      if (!emp) return { success: false, message: 'Employee not found.' };

      if (data.employeeNumber && data.employeeNumber !== emp.employeeNumber) {
        const existing = getEmployeeByNumber(data.employeeNumber);
        if (existing && existing.id !== id) {
          const msg = `Employee Number "${data.employeeNumber}" is already in use by another record.`;
          showToast('warning', msg, 'Duplicate Employee Number');
          return {
            success: false,
            message: msg
          };
        }
      }

      const now = new Date().toISOString();
      const updatedEmp: Employee = { ...emp, ...data, updatedAt: now };

      // 1. Asynchronously save update to Firestore
      await FirestoreSyncService.saveItem('employees', updatedEmp);

      // 2. Update local state
      setEmployees(prev =>
        prev.map(e => (e.id === id ? updatedEmp : e))
      );

      setCloudStatus('connected');
      setLastCloudSync(new Date());

      showToast('success', `Updated record for ${updatedEmp.firstName} ${updatedEmp.lastName}.`, 'Saved to Cloud');
      return { success: true, message: 'Employee updated successfully in Firestore.' };
    } catch (error: any) {
      const errMsg = error?.message || 'Failed to update employee in Firestore.';
      console.error('[Firebase Error] updateEmployee failed:', error);
      showToast('error', `Update failed: ${errMsg}`, 'Firestore Error');
      return { success: false, message: errMsg };
    }
  };

  /**
   * Delete Employee - Moves record to deletedEmployees collection in Firestore
   */
  const deleteEmployee = async (id: string, reason?: string) => {
    try {
      const target = employees.find(e => e.id === id);
      if (!target) return { success: false, message: 'Employee record not found.' };

      const deletedRecord: DeletedEmployee = {
        ...target,
        deletedAt: new Date().toISOString(),
        deleteReason: reason || 'Deleted by Administrator'
      };

      // 1. Asynchronously remove from 'employees' and add to 'deletedEmployees'
      await FirestoreSyncService.deleteItem('employees', id);
      await FirestoreSyncService.saveItem('deletedEmployees', deletedRecord);

      // 2. Update local state
      setDeletedEmployees(prev => [deletedRecord, ...prev.filter(e => e.id !== id)]);
      setEmployees(prev => prev.filter(e => e.id !== id));

      const msg = `${target.firstName} ${target.lastName} was moved to the Deleted Personnel archive.`;
      showToast('info', msg, 'Moved to Archive');

      return { 
        success: true, 
        message: msg 
      };
    } catch (error: any) {
      const errMsg = error?.message || 'Failed to archive employee in Firestore.';
      console.error('[Firebase Error] deleteEmployee failed:', error);
      showToast('error', errMsg, 'Firestore Error');
      return { success: false, message: errMsg };
    }
  };

  /**
   * Restore Employee - Moves record back to employees collection in Firestore
   */
  const restoreEmployee = async (id: string) => {
    try {
      const target = deletedEmployees.find(e => e.id === id);
      if (!target) return { success: false, message: 'Deleted employee record not found.' };

      // Check if duplicate employee number currently in active list
      const duplicate = employees.find(e => e.employeeNumber.trim().toLowerCase() === target.employeeNumber.trim().toLowerCase());
      if (duplicate) {
        const msg = `Cannot restore. Employee #${target.employeeNumber} is currently assigned to active record: ${duplicate.firstName} ${duplicate.lastName}.`;
        showToast('warning', msg, 'Cannot Restore');
        return { 
          success: false, 
          message: msg 
        };
      }

      const { deletedAt, deleteReason, ...rest } = target;
      const restoredEmp: Employee = {
        ...rest,
        updatedAt: new Date().toISOString()
      };

      // 1. Save restored record to Firestore and remove from archive
      await FirestoreSyncService.saveItem('employees', restoredEmp);
      await FirestoreSyncService.deleteItem('deletedEmployees', id);

      // 2. Update local state
      setEmployees(prev => [...prev, restoredEmp]);
      setDeletedEmployees(prev => prev.filter(e => e.id !== id));

      const msg = `${target.firstName} ${target.lastName} has been successfully restored to Employee Records.`;
      showToast('success', msg, 'Employee Restored');

      return { 
        success: true, 
        message: msg 
      };
    } catch (error: any) {
      const errMsg = error?.message || 'Failed to restore employee in Firestore.';
      console.error('[Firebase Error] restoreEmployee failed:', error);
      showToast('error', errMsg, 'Firestore Error');
      return { success: false, message: errMsg };
    }
  };

  /**
   * Permanently Delete Employee - Erases record and child data from Firestore
   */
  const permanentlyDeleteEmployee = async (id: string) => {
    try {
      const target = deletedEmployees.find(e => e.id === id);

      // Clean up Firestore documents
      await FirestoreSyncService.deleteItem('deletedEmployees', id);

      const promosToDelete = promotions.filter(p => p.employeeId === id);
      for (const p of promosToDelete) {
        await FirestoreSyncService.deleteItem('promotions', p.id);
      }

      const assignToDelete = schoolAssignments.filter(sa => sa.employeeId === id);
      for (const sa of assignToDelete) {
        await FirestoreSyncService.deleteItem('schoolAssignments', sa.id);
      }

      const earnedToDelete = earnedCredits.filter(ec => ec.employeeId === id);
      for (const ec of earnedToDelete) {
        await FirestoreSyncService.deleteItem('serviceCreditsEarned', ec.id);
      }

      const usedToDelete = usedCredits.filter(uc => uc.employeeId === id);
      for (const uc of usedToDelete) {
        await FirestoreSyncService.deleteItem('serviceCreditsUsed', uc.id);
      }

      const leaveToDelete = leaveRecords.filter(l => l.employeeId === id);
      for (const l of leaveToDelete) {
        await FirestoreSyncService.deleteItem('leaveRecords', l.id);
      }

      // Update local state
      setDeletedEmployees(prev => prev.filter(e => e.id !== id));
      setPromotions(prev => prev.filter(p => p.employeeId !== id));
      setSchoolAssignments(prev => prev.filter(sa => sa.employeeId !== id));
      setEarnedCredits(prev => prev.filter(ec => ec.employeeId !== id));
      setUsedCredits(prev => prev.filter(uc => uc.employeeId !== id));
      setLeaveRecords(prev => prev.filter(l => l.employeeId !== id));

      const msg = `${target ? `${target.firstName} ${target.lastName}` : 'Employee'} has been permanently deleted from Firestore.`;
      showToast('info', msg, 'Permanently Deleted');

      return { 
        success: true, 
        message: msg 
      };
    } catch (error: any) {
      const errMsg = error?.message || 'Failed to permanently delete from Firestore.';
      console.error('[Firebase Error] permanentlyDeleteEmployee failed:', error);
      showToast('error', errMsg, 'Firestore Error');
      return { success: false, message: errMsg };
    }
  };

  const getEmployeeFull = (id: string): EmployeeFull | null => {
    const emp = enrichedEmployees.find(e => e.id === id);
    if (!emp) return null;

    const empPromos = promotions.filter(p => p.employeeId === id).sort((a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime());
    const empAssignments = schoolAssignments.filter(sa => sa.employeeId === id).sort((a, b) => new Date(a.effectiveDateFrom).getTime() - new Date(b.effectiveDateFrom).getTime());
    const empEarned = earnedCredits.filter(ec => ec.employeeId === id);
    const empUsed = usedCredits.filter(uc => uc.employeeId === id);
    const empLeaves = leaveRecords.filter(l => l.employeeId === id).sort((a, b) => new Date(b.dateFrom).getTime() - new Date(a.dateFrom).getTime());

    const totalEarnedCredits = empEarned.reduce((sum, item) => sum + (item.earnedCredits || 0), 0);
    const totalUsedCredits = empUsed.reduce((sum, item) => sum + (item.usedCredits || 0), 0);
    const availableCredits = Math.max(0, totalEarnedCredits - totalUsedCredits);

    return {
      ...emp,
      promotions: empPromos,
      schoolAssignments: empAssignments,
      earnedCredits: empEarned,
      usedCredits: empUsed,
      leaveRecords: empLeaves,
      totalEarnedCredits,
      totalUsedCredits,
      availableCredits
    };
  };

  // School actions
  const addSchool = async (name: string) => {
    try {
      const trimmed = name.trim();
      if (!trimmed) return { success: false, message: 'School name is required.' };
      const exists = schools.some(s => s.name.toLowerCase() === trimmed.toLowerCase());
      if (exists) return { success: false, message: 'A school with this name already exists in Guimba West District.' };

      const newSchool: School = {
        id: `sch-${Date.now()}`,
        name: trimmed,
        status: 'Active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await FirestoreSyncService.saveItem('schools', newSchool);
      setSchools(prev => [...prev, newSchool]);
      showToast('success', `"${trimmed}" added to schools.`, 'School Added');
      return { success: true, message: 'School added successfully.' };
    } catch (error: any) {
      console.error('[Firebase Error] addSchool failed:', error);
      showToast('error', error?.message || 'Failed to add school to Firestore.', 'Firestore Error');
      return { success: false, message: error?.message || 'Failed to add school.' };
    }
  };

  const updateSchool = async (id: string, name: string, status: 'Active' | 'Inactive') => {
    try {
      const trimmed = name.trim();
      if (!trimmed) return { success: false, message: 'School name is required.' };

      const updatedSchool: School = {
        id,
        name: trimmed,
        status,
        createdAt: schools.find(s => s.id === id)?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await FirestoreSyncService.saveItem('schools', updatedSchool);

      setSchools(prev => prev.map(s => s.id === id ? updatedSchool : s));
      
      // Also update schoolName across employees
      const updatedEmps = employees.map(e => e.schoolId === id ? { ...e, schoolName: trimmed } : e);
      setEmployees(updatedEmps);

      showToast('success', `"${trimmed}" updated successfully.`, 'School Updated');
      return { success: true, message: 'School updated successfully.' };
    } catch (error: any) {
      console.error('[Firebase Error] updateSchool failed:', error);
      showToast('error', error?.message || 'Failed to update school in Firestore.', 'Firestore Error');
      return { success: false, message: error?.message || 'Failed to update school.' };
    }
  };

  const deleteSchool = async (id: string, reason?: string) => {
    try {
      const target = schools.find(s => s.id === id);
      if (!target) return { success: false, message: 'School not found.' };

      const deletedRecord: DeletedSchool = {
        ...target,
        deletedAt: new Date().toISOString(),
        deleteReason: reason || 'Deleted by Administrator'
      };

      await FirestoreSyncService.deleteItem('schools', id);
      await FirestoreSyncService.saveItem('deletedSchools', deletedRecord);

      setDeletedSchools(prev => [deletedRecord, ...prev.filter(s => s.id !== id)]);
      setSchools(prev => prev.filter(s => s.id !== id));

      const msg = `"${target.name}" was moved to the Deleted Schools archive.`;
      showToast('info', msg, 'Moved to Archive');
      return { 
        success: true, 
        message: msg 
      };
    } catch (error: any) {
      console.error('[Firebase Error] deleteSchool failed:', error);
      showToast('error', error?.message || 'Failed to delete school in Firestore.', 'Firestore Error');
      return { success: false, message: error?.message || 'Failed to delete school.' };
    }
  };

  const restoreSchool = async (id: string) => {
    try {
      const target = deletedSchools.find(s => s.id === id);
      if (!target) return { success: false, message: 'Deleted school not found.' };

      const duplicate = schools.find(s => s.name.trim().toLowerCase() === target.name.trim().toLowerCase());
      if (duplicate) {
        const msg = `Cannot restore. An active school named "${target.name}" already exists.`;
        showToast('warning', msg, 'Cannot Restore');
        return { 
          success: false, 
          message: msg 
        };
      }

      const { deletedAt, deleteReason, ...rest } = target;
      const restoredSchool: School = {
        ...rest,
        updatedAt: new Date().toISOString()
      };

      await FirestoreSyncService.saveItem('schools', restoredSchool);
      await FirestoreSyncService.deleteItem('deletedSchools', id);

      setSchools(prev => [...prev, restoredSchool]);
      setDeletedSchools(prev => prev.filter(s => s.id !== id));

      const msg = `"${target.name}" has been successfully restored to Active Schools.`;
      showToast('success', msg, 'School Restored');
      return { 
        success: true, 
        message: msg 
      };
    } catch (error: any) {
      console.error('[Firebase Error] restoreSchool failed:', error);
      showToast('error', error?.message || 'Failed to restore school.', 'Firestore Error');
      return { success: false, message: error?.message || 'Failed to restore school.' };
    }
  };

  const permanentlyDeleteSchool = async (id: string) => {
    try {
      const target = deletedSchools.find(s => s.id === id);
      await FirestoreSyncService.deleteItem('deletedSchools', id);
      setDeletedSchools(prev => prev.filter(s => s.id !== id));

      const msg = `"${target ? target.name : 'School'}" has been permanently deleted.`;
      showToast('info', msg, 'Permanently Deleted');
      return { 
        success: true, 
        message: msg 
      };
    } catch (error: any) {
      console.error('[Firebase Error] permanentlyDeleteSchool failed:', error);
      showToast('error', error?.message || 'Failed to permanently delete school.', 'Firestore Error');
      return { success: false, message: error?.message || 'Failed to delete school.' };
    }
  };

  // Promotion Actions
  const syncEmployeePositionFromPromotions = async (employeeId: string, allPromos: PromotionRecord[]) => {
    const empPromos = allPromos
      .filter(p => p.employeeId === employeeId)
      .sort((a, b) => {
        const dateDiff = new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime();
        if (dateDiff !== 0) return dateDiff;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

    if (empPromos.length > 0) {
      const latest = empPromos[0];
      const targetEmp = employees.find(e => e.id === employeeId);
      if (targetEmp) {
        const updatedTarget: Employee = {
          ...targetEmp,
          currentPosition: latest.position,
          itemNumber: latest.itemNumber || targetEmp.itemNumber,
          dateOfLatestAppointment: latest.appointmentDate || targetEmp.dateOfLatestAppointment,
          appointmentDocumentUrl: latest.appointmentPaperUrl || targetEmp.appointmentDocumentUrl,
          updatedAt: new Date().toISOString()
        };
        await FirestoreSyncService.saveItem('employees', updatedTarget);
        setEmployees(empList => empList.map(e => (e.id === employeeId ? updatedTarget : e)));
      }
    }
  };

  const addPromotion = async (promo: Omit<PromotionRecord, 'id' | 'createdAt'>) => {
    try {
      const newRecord: PromotionRecord = {
        ...promo,
        id: `prm-${Date.now()}`,
        createdAt: new Date().toISOString()
      };
      await FirestoreSyncService.saveItem('promotions', newRecord);
      setPromotions(prev => {
        const nextPromos = [...prev, newRecord];
        syncEmployeePositionFromPromotions(promo.employeeId, nextPromos);
        return nextPromos;
      });
      showToast('success', `Promotion / appointment paper for ${promo.position} saved to Firestore.`, 'Promotion Recorded');
    } catch (error: any) {
      console.error('[Firebase Error] addPromotion failed:', error);
      showToast('error', error?.message || 'Failed to save promotion in Firestore.', 'Firestore Error');
    }
  };

  const updatePromotion = async (id: string, promoData: Partial<PromotionRecord>) => {
    try {
      const existing = promotions.find(p => p.id === id);
      if (!existing) return;
      const updated: PromotionRecord = { ...existing, ...promoData };
      await FirestoreSyncService.saveItem('promotions', updated);
      setPromotions(prev => {
        const nextPromos = prev.map(p => p.id === id ? updated : p);
        syncEmployeePositionFromPromotions(existing.employeeId, nextPromos);
        return nextPromos;
      });
      showToast('success', 'Promotion appointment updated.', 'Saved to Cloud');
    } catch (error: any) {
      console.error('[Firebase Error] updatePromotion failed:', error);
      showToast('error', error?.message || 'Failed to update promotion.', 'Firestore Error');
    }
  };

  const deletePromotion = async (id: string) => {
    try {
      const target = promotions.find(p => p.id === id);
      await FirestoreSyncService.deleteItem('promotions', id);
      setPromotions(prev => {
        const nextPromos = prev.filter(p => p.id !== id);
        if (target) {
          syncEmployeePositionFromPromotions(target.employeeId, nextPromos);
        }
        return nextPromos;
      });
      showToast('info', 'Promotion record deleted.', 'Deleted');
    } catch (error: any) {
      console.error('[Firebase Error] deletePromotion failed:', error);
      showToast('error', error?.message || 'Failed to delete promotion.', 'Firestore Error');
    }
  };

  // School Assignment Actions
  const addSchoolAssignment = async (assignment: Omit<SchoolAssignmentRecord, 'id' | 'createdAt'>) => {
    try {
      const newRecord: SchoolAssignmentRecord = {
        ...assignment,
        id: `sa-${Date.now()}`,
        createdAt: new Date().toISOString()
      };
      await FirestoreSyncService.saveItem('schoolAssignments', newRecord);
      setSchoolAssignments(prev => [...prev, newRecord]);
      showToast('success', `Station assignment to ${assignment.schoolName} saved to Firestore.`, 'Assignment Saved');
    } catch (error: any) {
      console.error('[Firebase Error] addSchoolAssignment failed:', error);
      showToast('error', error?.message || 'Failed to save school assignment.', 'Firestore Error');
    }
  };

  const updateSchoolAssignment = async (id: string, assignment: Partial<SchoolAssignmentRecord>) => {
    try {
      const existing = schoolAssignments.find(sa => sa.id === id);
      if (!existing) return;
      const updated: SchoolAssignmentRecord = { ...existing, ...assignment };
      await FirestoreSyncService.saveItem('schoolAssignments', updated);
      setSchoolAssignments(prev => prev.map(sa => sa.id === id ? updated : sa));
      showToast('success', 'School assignment updated.', 'Saved to Cloud');
    } catch (error: any) {
      console.error('[Firebase Error] updateSchoolAssignment failed:', error);
      showToast('error', error?.message || 'Failed to update assignment.', 'Firestore Error');
    }
  };

  const deleteSchoolAssignment = async (id: string) => {
    try {
      await FirestoreSyncService.deleteItem('schoolAssignments', id);
      setSchoolAssignments(prev => prev.filter(sa => sa.id !== id));
      showToast('info', 'School assignment removed.', 'Deleted');
    } catch (error: any) {
      console.error('[Firebase Error] deleteSchoolAssignment failed:', error);
      showToast('error', error?.message || 'Failed to delete assignment.', 'Firestore Error');
    }
  };

  // Special Orders & Service Credits
  const addSpecialOrder = async (soData: Omit<SpecialOrder, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newSO: SpecialOrder = {
      ...soData,
      id: `so-${Date.now()}`,
      createdAt: now,
      updatedAt: now
    };
    try {
      await FirestoreSyncService.saveItem('specialOrders', newSO);
      setSpecialOrders(prev => [...prev, newSO]);
      showToast('success', `Special Order ${newSO.soNumber} saved to Firestore.`, 'Special Order Created');
    } catch (error: any) {
      console.error('[Firebase Error] addSpecialOrder failed:', error);
      showToast('error', error?.message || 'Failed to save Special Order to Firestore.', 'Firestore Error');
    }
    return newSO;
  };

  const updateSpecialOrder = async (id: string, soData: Partial<SpecialOrder>) => {
    try {
      const existing = specialOrders.find(so => so.id === id);
      if (!existing) return;
      const now = new Date().toISOString();
      const updated: SpecialOrder = { ...existing, ...soData, updatedAt: now };
      await FirestoreSyncService.saveItem('specialOrders', updated);
      setSpecialOrders(prev => prev.map(so => so.id === id ? updated : so));
      showToast('success', `Special Order ${updated.soNumber} updated.`, 'Saved to Cloud');
    } catch (error: any) {
      console.error('[Firebase Error] updateSpecialOrder failed:', error);
      showToast('error', error?.message || 'Failed to update Special Order.', 'Firestore Error');
    }
  };

  const deleteSpecialOrder = async (id: string, reason?: string) => {
    try {
      const target = specialOrders.find(so => so.id === id);
      if (!target) return { success: false, message: 'Special Order not found.' };

      const totalGranted = earnedCredits
        .filter(ec => ec.soId === id)
        .reduce((sum, item) => sum + (item.earnedCredits || 0), 0);

      const recipientCount = earnedCredits.filter(ec => ec.soId === id).length;

      const deletedSO: DeletedSpecialOrder = {
        ...target,
        deletedAt: new Date().toISOString(),
        deleteReason: reason || 'Deleted by Administrator',
        totalRecipients: recipientCount,
        totalGrantedCredits: totalGranted
      };

      await FirestoreSyncService.deleteItem('specialOrders', id);
      await FirestoreSyncService.saveItem('deletedSpecialOrders', deletedSO);

      setDeletedSpecialOrders(prev => [deletedSO, ...prev.filter(so => so.id !== id)]);
      setSpecialOrders(prev => prev.filter(so => so.id !== id));

      const msg = `Special Order ${target.soNumber} ("${target.title}") was moved to Deleted Records.`;
      showToast('info', msg, 'Moved to Archive');
      return {
        success: true,
        message: msg
      };
    } catch (error: any) {
      console.error('[Firebase Error] deleteSpecialOrder failed:', error);
      showToast('error', error?.message || 'Failed to delete Special Order.', 'Firestore Error');
      return { success: false, message: error?.message || 'Failed to delete Special Order.' };
    }
  };

  const restoreSpecialOrder = async (id: string) => {
    try {
      const target = deletedSpecialOrders.find(so => so.id === id);
      if (!target) return { success: false, message: 'Deleted Special Order not found.' };

      const { deletedAt, deleteReason, totalRecipients, totalGrantedCredits, ...rest } = target;
      const restoredSO: SpecialOrder = {
        ...rest
      };

      await FirestoreSyncService.saveItem('specialOrders', restoredSO);
      await FirestoreSyncService.deleteItem('deletedSpecialOrders', id);

      setSpecialOrders(prev => [...prev, restoredSO]);
      setDeletedSpecialOrders(prev => prev.filter(so => so.id !== id));

      const msg = `Special Order ${target.soNumber} was restored successfully.`;
      showToast('success', msg, 'Restored');
      return {
        success: true,
        message: msg
      };
    } catch (error: any) {
      console.error('[Firebase Error] restoreSpecialOrder failed:', error);
      showToast('error', error?.message || 'Failed to restore Special Order.', 'Firestore Error');
      return { success: false, message: error?.message || 'Failed to restore.' };
    }
  };

  const permanentlyDeleteSpecialOrder = async (id: string) => {
    try {
      await FirestoreSyncService.deleteItem('deletedSpecialOrders', id);
      setDeletedSpecialOrders(prev => prev.filter(so => so.id !== id));
      showToast('info', 'Special Order permanently erased from archive.', 'Purged');
      return {
        success: true,
        message: 'Special Order permanently erased from the system.'
      };
    } catch (error: any) {
      console.error('[Firebase Error] permanentlyDeleteSpecialOrder failed:', error);
      showToast('error', error?.message || 'Failed to erase Special Order.', 'Firestore Error');
      return { success: false, message: error?.message || 'Failed to delete.' };
    }
  };

  const addEarnedCredit = async (earned: Omit<ServiceCreditEarned, 'id' | 'createdAt'>) => {
    try {
      const newCredit: ServiceCreditEarned = {
        ...earned,
        id: `sce-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        createdAt: new Date().toISOString()
      };
      await FirestoreSyncService.saveItem('serviceCreditsEarned', newCredit);
      setEarnedCredits(prev => [...prev, newCredit]);
      showToast('success', `Earned service credit recorded for employee.`, 'Credits Saved');
    } catch (error: any) {
      console.error('[Firebase Error] addEarnedCredit failed:', error);
      showToast('error', error?.message || 'Failed to save earned credit.', 'Firestore Error');
    }
  };

  const addEarnedCreditsBatch = async (soId: string, soNumber: string, assignments: { employeeId: string; earnedCredits: number; remarks?: string }[]) => {
    try {
      const now = new Date().toISOString();
      const newEntries: ServiceCreditEarned[] = assignments.map((as, idx) => ({
        id: `sce-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
        soId,
        soNumber,
        employeeId: as.employeeId,
        earnedCredits: as.earnedCredits,
        remarks: as.remarks || '',
        createdAt: now
      }));
      await FirestoreSyncService.batchSaveItems('serviceCreditsEarned', newEntries);
      setEarnedCredits(prev => [...prev, ...newEntries]);
      showToast('success', `Allocated service credits to ${newEntries.length} personnel in Firestore.`, 'Batch Credits Saved');
    } catch (error: any) {
      console.error('[Firebase Error] addEarnedCreditsBatch failed:', error);
      showToast('error', error?.message || 'Failed to save batch credits.', 'Firestore Error');
    }
  };

  const updateEarnedCredit = async (id: string, earnedCreditsVal: number, remarks?: string) => {
    try {
      const target = earnedCredits.find(ec => ec.id === id);
      if (!target) return;
      const updated: ServiceCreditEarned = { ...target, earnedCredits: earnedCreditsVal, remarks: remarks !== undefined ? remarks : target.remarks };
      await FirestoreSyncService.saveItem('serviceCreditsEarned', updated);
      setEarnedCredits(prev => prev.map(ec => ec.id === id ? updated : ec));
      showToast('success', 'Earned credit record updated.', 'Saved to Cloud');
    } catch (error: any) {
      console.error('[Firebase Error] updateEarnedCredit failed:', error);
      showToast('error', error?.message || 'Failed to update earned credit.', 'Firestore Error');
    }
  };

  const deleteEarnedCredit = async (id: string) => {
    try {
      await FirestoreSyncService.deleteItem('serviceCreditsEarned', id);
      setEarnedCredits(prev => prev.filter(ec => ec.id !== id));
      showToast('info', 'Earned credit removed.', 'Deleted');
    } catch (error: any) {
      console.error('[Firebase Error] deleteEarnedCredit failed:', error);
      showToast('error', error?.message || 'Failed to delete earned credit.', 'Firestore Error');
    }
  };

  // Helper: Available credits for employee in specific Special Order
  const getAvailableCreditsForEmployeeInSO = (employeeId: string, soId: string): number => {
    const totalEarnedInSO = earnedCredits
      .filter(ec => ec.employeeId === employeeId && ec.soId === soId)
      .reduce((sum, item) => sum + (item.earnedCredits || 0), 0);

    const totalUsedInSO = usedCredits
      .filter(uc => uc.employeeId === employeeId && uc.soId === soId)
      .reduce((sum, item) => sum + (item.usedCredits || 0), 0);

    return Math.max(0, totalEarnedInSO - totalUsedInSO);
  };

  // Get list of Special Orders where employee has earned credits and available > 0
  const getAvailableSpecialOrdersForEmployee = (employeeId: string) => {
    const employeeEarnedSOIds = Array.from(new Set(earnedCredits.filter(ec => ec.employeeId === employeeId).map(ec => ec.soId)));

    return employeeEarnedSOIds.map(soId => {
      const so = specialOrders.find(s => s.id === soId);
      const totalEarned = earnedCredits
        .filter(ec => ec.employeeId === employeeId && ec.soId === soId)
        .reduce((sum, item) => sum + (item.earnedCredits || 0), 0);

      const totalUsed = usedCredits
        .filter(uc => uc.employeeId === employeeId && uc.soId === soId)
        .reduce((sum, item) => sum + (item.usedCredits || 0), 0);

      const available = totalEarned - totalUsed;

      return {
        so: so || { id: soId, soNumber: 'SO-Unknown', soDate: '', title: 'Special Order', createdAt: '', updatedAt: '' },
        earned: totalEarned,
        used: totalUsed,
        available: Math.max(0, available)
      };
    }).filter(item => item.available > 0);
  };

  // Add Used Credit with Strict Over-deduction Check
  const addUsedCredit = async (usedData: Omit<ServiceCreditUsed, 'id' | 'createdAt'>) => {
    try {
      const available = getAvailableCreditsForEmployeeInSO(usedData.employeeId, usedData.soId);

      if (usedData.usedCredits > available) {
        const msg = `Insufficient service credits in the selected Special Order. Available: ${available.toFixed(1)} day(s), Attempted: ${usedData.usedCredits.toFixed(1)} day(s).`;
        showToast('warning', msg, 'Over-deduction Alert');
        return {
          success: false,
          message: msg
        };
      }

      const newUsed: ServiceCreditUsed = {
        ...usedData,
        id: `scu-${Date.now()}`,
        createdAt: new Date().toISOString()
      };

      await FirestoreSyncService.saveItem('serviceCreditsUsed', newUsed);
      setUsedCredits(prev => [...prev, newUsed]);

      showToast('success', `${usedData.usedCredits} day(s) deducted from Special Order ${usedData.soNumber}.`, 'Usage Saved');
      return { success: true, message: 'Service credit usage recorded successfully in Firestore.' };
    } catch (error: any) {
      console.error('[Firebase Error] addUsedCredit failed:', error);
      showToast('error', error?.message || 'Failed to record credit usage.', 'Firestore Error');
      return { success: false, message: error?.message || 'Failed to record usage.' };
    }
  };

  const deleteUsedCredit = async (id: string) => {
    try {
      await FirestoreSyncService.deleteItem('serviceCreditsUsed', id);
      setUsedCredits(prev => prev.filter(uc => uc.id !== id));
      showToast('info', 'Credit deduction cancelled and restored to balance.', 'Restored');
    } catch (error: any) {
      console.error('[Firebase Error] deleteUsedCredit failed:', error);
      showToast('error', error?.message || 'Failed to delete credit usage.', 'Firestore Error');
    }
  };

  // Leave Actions
  const addLeaveRecord = async (leave: Omit<LeaveRecord, 'id' | 'createdAt'>) => {
    try {
      const newRecord: LeaveRecord = {
        ...leave,
        id: `lvr-${Date.now()}`,
        createdAt: new Date().toISOString()
      };
      await FirestoreSyncService.saveItem('leaveRecords', newRecord);
      setLeaveRecords(prev => [...prev, newRecord]);
      showToast('success', `Leave application (${leave.leaveType}) saved to Firestore.`, 'Leave Saved');
    } catch (error: any) {
      console.error('[Firebase Error] addLeaveRecord failed:', error);
      showToast('error', error?.message || 'Failed to save leave record.', 'Firestore Error');
    }
  };

  const updateLeaveRecord = async (id: string, leave: Partial<LeaveRecord>) => {
    try {
      const existing = leaveRecords.find(l => l.id === id);
      if (!existing) return;
      const updated: LeaveRecord = { ...existing, ...leave };
      await FirestoreSyncService.saveItem('leaveRecords', updated);
      setLeaveRecords(prev => prev.map(l => l.id === id ? updated : l));
      showToast('success', 'Leave record updated.', 'Saved to Cloud');
    } catch (error: any) {
      console.error('[Firebase Error] updateLeaveRecord failed:', error);
      showToast('error', error?.message || 'Failed to update leave record.', 'Firestore Error');
    }
  };

  const deleteLeaveRecord = async (id: string, reason?: string) => {
    try {
      const target = leaveRecords.find(l => l.id === id);
      if (!target) return { success: false, message: 'Leave record not found.' };

      const emp = employees.find(e => e.id === target.employeeId);
      const empName = emp ? `${emp.lastName}, ${emp.firstName} ${emp.middleName || ''} ${emp.extensionName || ''}`.trim() : 'Unknown Employee';

      const deletedRecord: DeletedLeaveRecord = {
        ...target,
        deletedAt: new Date().toISOString(),
        deleteReason: reason || 'Deleted by Administrator',
        employeeName: empName,
        employeeNumber: emp?.employeeNumber || '',
        schoolName: emp?.schoolName || ''
      };

      await FirestoreSyncService.deleteItem('leaveRecords', id);
      await FirestoreSyncService.saveItem('deletedLeaveRecords', deletedRecord);

      setDeletedLeaveRecords(prev => [deletedRecord, ...prev.filter(l => l.id !== id)]);
      setLeaveRecords(prev => prev.filter(l => l.id !== id));

      const msg = `Leave record for ${empName} (${target.leaveType}, ${target.numberOfDays} days) was moved to Deleted Records.`;
      showToast('info', msg, 'Moved to Archive');
      return {
        success: true,
        message: msg
      };
    } catch (error: any) {
      console.error('[Firebase Error] deleteLeaveRecord failed:', error);
      showToast('error', error?.message || 'Failed to delete leave record.', 'Firestore Error');
      return { success: false, message: error?.message || 'Failed to delete leave record.' };
    }
  };

  const restoreLeaveRecord = async (id: string) => {
    try {
      const target = deletedLeaveRecords.find(l => l.id === id);
      if (!target) return { success: false, message: 'Deleted leave record not found.' };

      const { deletedAt, deleteReason, employeeName, employeeNumber, schoolName, ...rest } = target;
      const restoredRecord: LeaveRecord = {
        ...rest
      };

      await FirestoreSyncService.saveItem('leaveRecords', restoredRecord);
      await FirestoreSyncService.deleteItem('deletedLeaveRecords', id);

      setLeaveRecords(prev => [...prev, restoredRecord]);
      setDeletedLeaveRecords(prev => prev.filter(l => l.id !== id));

      const msg = `Leave record for ${employeeName || 'employee'} (${target.leaveType}) has been restored.`;
      showToast('success', msg, 'Restored');
      return {
        success: true,
        message: msg
      };
    } catch (error: any) {
      console.error('[Firebase Error] restoreLeaveRecord failed:', error);
      showToast('error', error?.message || 'Failed to restore leave record.', 'Firestore Error');
      return { success: false, message: error?.message || 'Failed to restore.' };
    }
  };

  const permanentlyDeleteLeaveRecord = async (id: string) => {
    try {
      await FirestoreSyncService.deleteItem('deletedLeaveRecords', id);
      setDeletedLeaveRecords(prev => prev.filter(l => l.id !== id));
      showToast('info', 'Leave record permanently purged from system archive.', 'Purged');
      return {
        success: true,
        message: 'Leave record permanently purged from system archive.'
      };
    } catch (error: any) {
      console.error('[Firebase Error] permanentlyDeleteLeaveRecord failed:', error);
      showToast('error', error?.message || 'Failed to permanently delete leave record.', 'Firestore Error');
      return { success: false, message: error?.message || 'Failed to delete.' };
    }
  };

  // System Reset
  const resetSystemData = async () => {
    StorageService.resetToDefault();
    StorageService.saveDeletedEmployees([]);
    StorageService.saveDeletedSchools([]);
    StorageService.saveDeletedLeaveRecords([]);
    StorageService.saveDeletedSpecialOrders([]);
    setEmployees(StorageService.getEmployees());
    setDeletedEmployees([]);
    setSchools(StorageService.getSchools());
    setDeletedSchools([]);
    setDeletedLeaveRecords([]);
    setDeletedSpecialOrders([]);
    setSpecialOrders(StorageService.getSpecialOrders());
    setEarnedCredits(StorageService.getEarnedCredits());
    setUsedCredits(StorageService.getUsedCredits());
    setPromotions(StorageService.getPromotions());
    setSchoolAssignments(StorageService.getSchoolAssignments());
    setLeaveRecords(StorageService.getLeaveRecords());

    try {
      // Re-seed Firestore with default data
      await FirestoreSyncService.batchSaveItems('employees', StorageService.getEmployees());
      await FirestoreSyncService.batchSaveItems('schools', StorageService.getSchools());
      await FirestoreSyncService.batchSaveItems('specialOrders', StorageService.getSpecialOrders());
      await FirestoreSyncService.batchSaveItems('promotions', StorageService.getPromotions());
      await FirestoreSyncService.batchSaveItems('schoolAssignments', StorageService.getSchoolAssignments());
      await FirestoreSyncService.batchSaveItems('serviceCreditsEarned', StorageService.getEarnedCredits());
      await FirestoreSyncService.batchSaveItems('serviceCreditsUsed', StorageService.getUsedCredits());
      await FirestoreSyncService.batchSaveItems('leaveRecords', StorageService.getLeaveRecords());
      showToast('info', 'System reset to default seed records in Firestore.', 'System Reset');
    } catch (error) {
      console.error('[Firebase Error] Failed to re-seed during reset:', error);
    }
  };

  // Batch Import from Excel / Google Sheets with full Firestore batch save
  const importEmployeesBatch = async (
    newEmps: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>[],
    resolutions: Record<string, 'UPDATE' | 'SKIP' | 'KEEP_BOTH'>
  ) => {
    let added = 0;
    let updated = 0;
    let skipped = 0;

    const now = new Date().toISOString();
    const updatedEmployeeList = [...employees];
    const empsToSaveToCloud: Employee[] = [];

    newEmps.forEach(imp => {
      const empNum = imp.employeeNumber.trim();
      const existingIdx = updatedEmployeeList.findIndex(e => e.employeeNumber.trim().toLowerCase() === empNum.toLowerCase());

      if (existingIdx >= 0) {
        const resolution = resolutions[empNum] || 'SKIP';
        if (resolution === 'UPDATE') {
          const updatedRecord: Employee = {
            ...updatedEmployeeList[existingIdx],
            ...imp,
            id: updatedEmployeeList[existingIdx].id,
            updatedAt: now
          };
          updatedEmployeeList[existingIdx] = updatedRecord;
          empsToSaveToCloud.push(updatedRecord);
          updated++;
        } else if (resolution === 'KEEP_BOTH') {
          const newId = `emp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
          const newRecord: Employee = {
            ...imp,
            id: newId,
            employeeNumber: `${empNum}-DUP`,
            createdAt: now,
            updatedAt: now
          };
          updatedEmployeeList.push(newRecord);
          empsToSaveToCloud.push(newRecord);
          added++;
        } else {
          skipped++;
        }
      } else {
        const newId = `emp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        const newRecord: Employee = {
          ...imp,
          id: newId,
          createdAt: now,
          updatedAt: now
        };
        updatedEmployeeList.push(newRecord);
        empsToSaveToCloud.push(newRecord);
        added++;
      }
    });

    try {
      if (empsToSaveToCloud.length > 0) {
        await FirestoreSyncService.batchSaveItems('employees', empsToSaveToCloud);
      }
      setEmployees(updatedEmployeeList);
      showToast('success', `Imported ${added} new and updated ${updated} employees in Firestore.`, 'Batch Import Finished');
    } catch (error: any) {
      console.error('[Firebase Error] Batch import write failed:', error);
      showToast('error', error?.message || 'Failed to save batch imports to Firestore.', 'Firestore Error');
    }

    return { added, updated, skipped };
  };

  return (
    <HRISContext.Provider
      value={{
        employees: sortedEmployeesByLastName,
        deletedEmployees,
        schools,
        deletedSchools,
        deletedLeaveRecords,
        specialOrders,
        deletedSpecialOrders,
        earnedCredits,
        usedCredits,
        promotions,
        schoolAssignments,
        leaveRecords,

        cloudStatus,
        lastCloudSync,
        refreshCloudData,

        toasts,
        showToast,
        dismissToast,

        totalActiveEmployees,
        totalInactiveEmployees,
        totalSchoolsCount,
        employeesPerSchool,
        recentlyAddedEmployees,
        recentlyUpdatedEmployees,
        upcomingBirthdays,

        addEmployee,
        updateEmployee,
        deleteEmployee,
        restoreEmployee,
        permanentlyDeleteEmployee,
        getEmployeeFull,
        getEmployeeByNumber,

        addSchool,
        updateSchool,
        deleteSchool,
        restoreSchool,
        permanentlyDeleteSchool,

        addPromotion,
        updatePromotion,
        deletePromotion,

        addSchoolAssignment,
        updateSchoolAssignment,
        deleteSchoolAssignment,

        addSpecialOrder,
        updateSpecialOrder,
        deleteSpecialOrder,
        restoreSpecialOrder,
        permanentlyDeleteSpecialOrder,
        addEarnedCredit,
        addEarnedCreditsBatch,
        updateEarnedCredit,
        deleteEarnedCredit,

        addUsedCredit,
        deleteUsedCredit,
        getAvailableCreditsForEmployeeInSO,
        getAvailableSpecialOrdersForEmployee,

        addLeaveRecord,
        updateLeaveRecord,
        deleteLeaveRecord,
        restoreLeaveRecord,
        permanentlyDeleteLeaveRecord,

        resetSystemData,
        importEmployeesBatch,
      }}
    >
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </HRISContext.Provider>
  );
};

export const useHRIS = () => {
  const context = useContext(HRISContext);
  if (!context) {
    throw new Error('useHRIS must be used within an HRISProvider');
  }
  return context;
};
