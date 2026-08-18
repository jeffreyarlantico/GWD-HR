import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { StorageService } from '../services/storageService';
import { testFirestoreConnection } from '../services/firebase';
import { FirestoreSyncService } from '../services/firestoreSyncService';
import { 
  Employee, EmployeeFull, DeletedEmployee, School, DeletedSchool, DeletedLeaveRecord, DeletedSpecialOrder, SpecialOrder, ServiceCreditEarned, 
  ServiceCreditUsed, PromotionRecord, SchoolAssignmentRecord, LeaveRecord,
  BirthdayUpcoming
} from '../types';

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

  // Firestore Sync & Status
  isFirestoreConnected: boolean;
  isLoadingCloudData: boolean;
  syncAllToFirestore: () => Promise<{ success: boolean; message: string }>;
  fetchFromFirestore: () => Promise<{ success: boolean; message: string }>;

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
  const [isFirestoreConnected, setIsFirestoreConnected] = useState<boolean>(false);
  const [isLoadingCloudData, setIsLoadingCloudData] = useState<boolean>(true);

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

  // 1. Initialize Storage & Cloud Firestore on boot
  useEffect(() => {
    StorageService.initStorage();

    const initCloudData = async () => {
      try {
        const connected = await testFirestoreConnection();
        setIsFirestoreConnected(connected);

        if (connected) {
          // Fetch existing data from Firestore
          const cloudData = await FirestoreSyncService.fetchAllFromFirestore();
          
          if (cloudData && cloudData.employees.length > 0) {
            // Firestore has existing cloud data -> load directly
            setEmployees(cloudData.employees);
            if (cloudData.schools.length > 0) setSchools(cloudData.schools);
            if (cloudData.specialOrders.length > 0) setSpecialOrders(cloudData.specialOrders);
            if (cloudData.earnedCredits.length > 0) setEarnedCredits(cloudData.earnedCredits);
            if (cloudData.usedCredits.length > 0) setUsedCredits(cloudData.usedCredits);
            if (cloudData.leaveRecords.length > 0) setLeaveRecords(cloudData.leaveRecords);
            if (cloudData.promotions.length > 0) setPromotions(cloudData.promotions);
            if (cloudData.schoolAssignments.length > 0) setSchoolAssignments(cloudData.schoolAssignments);
          } else {
            // First time connection / Firestore empty: sync current local dataset up to Firestore
            const initialLocalData = {
              employees: StorageService.getEmployees(),
              schools: StorageService.getSchools(),
              specialOrders: StorageService.getSpecialOrders(),
              earnedCredits: StorageService.getEarnedCredits(),
              usedCredits: StorageService.getUsedCredits(),
              leaveRecords: StorageService.getLeaveRecords(),
              promotions: StorageService.getPromotions(),
              schoolAssignments: StorageService.getSchoolAssignments()
            };
            await FirestoreSyncService.syncFullDatasetToFirestore(initialLocalData);
          }

          // Subscribe to real-time updates for multi-device sync
          FirestoreSyncService.subscribeToRealtimeUpdates({
            onEmployees: (updated) => setEmployees(updated),
            onSchools: (updated) => setSchools(updated),
            onSpecialOrders: (updated) => setSpecialOrders(updated),
            onEarnedCredits: (updated) => setEarnedCredits(updated),
            onUsedCredits: (updated) => setUsedCredits(updated),
            onLeaveRecords: (updated) => setLeaveRecords(updated),
            onPromotions: (updated) => setPromotions(updated),
            onAssignments: (updated) => setSchoolAssignments(updated)
          });
        }
      } catch (err) {
        console.warn('Firestore cloud initialization:', err);
        setIsFirestoreConnected(false);
      } finally {
        setIsLoadingCloudData(false);
      }
    };

    initCloudData();
  }, []);

  // Offline/Cache local backup
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

  const addEmployee = async (data: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>) => {
    const existing = getEmployeeByNumber(data.employeeNumber);
    if (existing) {
      return {
        success: false,
        message: `Employee Number "${data.employeeNumber}" already belongs to ${existing.firstName} ${existing.lastName}. Duplicate Employee Numbers are not allowed.`
      };
    }

    const now = new Date().toISOString();
    const newEmp: Employee = {
      ...data,
      id: `emp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: now,
      updatedAt: now,
    };

    // Initial Appointment Record
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

    // Persist online to Cloud Firestore
    try {
      await FirestoreSyncService.saveEmployee(newEmp);
      await FirestoreSyncService.savePromotion(initialPromotion);
    } catch (err: any) {
      console.error('Firestore saveEmployee error:', err);
    }

    setEmployees(prev => [...prev, newEmp]);
    setPromotions(prev => [...prev, initialPromotion]);

    return {
      success: true,
      message: 'Employee record created and saved online to Cloud Firestore.',
      employee: newEmp
    };
  };

  const updateEmployee = async (id: string, data: Partial<Employee>) => {
    const emp = employees.find(e => e.id === id);
    if (!emp) return { success: false, message: 'Employee not found.' };

    if (data.employeeNumber && data.employeeNumber !== emp.employeeNumber) {
      const existing = getEmployeeByNumber(data.employeeNumber);
      if (existing) {
        return {
          success: false,
          message: `Employee Number "${data.employeeNumber}" is already in use by another record.`
        };
      }
    }

    const now = new Date().toISOString();
    const updatedEmp: Employee = { ...emp, ...data, updatedAt: now };

    // Persist online to Cloud Firestore
    try {
      await FirestoreSyncService.saveEmployee(updatedEmp);
    } catch (err: any) {
      console.error('Firestore updateEmployee error:', err);
    }

    setEmployees(prev => prev.map(e => (e.id === id ? updatedEmp : e)));
    return { success: true, message: 'Employee updated and synchronized online.' };
  };

  const deleteEmployee = async (id: string, reason?: string) => {
    const target = employees.find(e => e.id === id);
    if (!target) return { success: false, message: 'Employee record not found.' };

    const deletedRecord: DeletedEmployee = {
      ...target,
      deletedAt: new Date().toISOString(),
      deleteReason: reason || 'Deleted by Administrator'
    };

    // Remove from Firestore active employees
    try {
      await FirestoreSyncService.deleteDocument('employees', id);
    } catch (err: any) {
      console.error('Firestore deleteEmployee error:', err);
    }

    setDeletedEmployees(prev => [deletedRecord, ...prev.filter(e => e.id !== id)]);
    setEmployees(prev => prev.filter(e => e.id !== id));

    return { 
      success: true, 
      message: `${target.firstName} ${target.lastName} was moved to the Deleted Personnel archive.` 
    };
  };

  const restoreEmployee = async (id: string) => {
    const target = deletedEmployees.find(e => e.id === id);
    if (!target) return { success: false, message: 'Deleted employee record not found.' };

    const duplicate = employees.find(e => e.employeeNumber.trim().toLowerCase() === target.employeeNumber.trim().toLowerCase());
    if (duplicate) {
      return { 
        success: false, 
        message: `Cannot restore. Employee #${target.employeeNumber} is currently assigned to active record: ${duplicate.firstName} ${duplicate.lastName}.` 
      };
    }

    const { deletedAt, deleteReason, ...rest } = target;
    const restoredEmp: Employee = {
      ...rest,
      updatedAt: new Date().toISOString()
    };

    try {
      await FirestoreSyncService.saveEmployee(restoredEmp);
    } catch (err: any) {
      console.error('Firestore restoreEmployee error:', err);
    }

    setEmployees(prev => [...prev, restoredEmp]);
    setDeletedEmployees(prev => prev.filter(e => e.id !== id));

    return { 
      success: true, 
      message: `${target.firstName} ${target.lastName} has been successfully restored to Employee Records.` 
    };
  };

  const permanentlyDeleteEmployee = async (id: string) => {
    const target = deletedEmployees.find(e => e.id === id);
    
    // Purge from Firestore
    try {
      await FirestoreSyncService.deleteDocument('employees', id);
    } catch (err: any) {
      console.error('Firestore permanentlyDeleteEmployee error:', err);
    }

    setDeletedEmployees(prev => prev.filter(e => e.id !== id));
    setPromotions(prev => prev.filter(p => p.employeeId !== id));
    setSchoolAssignments(prev => prev.filter(sa => sa.employeeId !== id));
    setEarnedCredits(prev => prev.filter(ec => ec.employeeId !== id));
    setUsedCredits(prev => prev.filter(uc => uc.employeeId !== id));
    setLeaveRecords(prev => prev.filter(l => l.employeeId !== id));

    return { 
      success: true, 
      message: `${target ? `${target.firstName} ${target.lastName}` : 'Employee'} has been permanently deleted from the system.` 
    };
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

    try {
      await FirestoreSyncService.saveSchool(newSchool);
    } catch (err: any) {
      console.error('Firestore saveSchool error:', err);
    }

    setSchools(prev => [...prev, newSchool]);
    return { success: true, message: 'School added successfully to Cloud Firestore.' };
  };

  const updateSchool = async (id: string, name: string, status: 'Active' | 'Inactive') => {
    const trimmed = name.trim();
    if (!trimmed) return { success: false, message: 'School name is required.' };

    const updatedSchool: School = {
      id,
      name: trimmed,
      status,
      createdAt: schools.find(s => s.id === id)?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      await FirestoreSyncService.saveSchool(updatedSchool);
    } catch (err: any) {
      console.error('Firestore updateSchool error:', err);
    }

    setSchools(prev => prev.map(s => s.id === id ? updatedSchool : s));
    setEmployees(prev => prev.map(e => e.schoolId === id ? { ...e, schoolName: trimmed } : e));

    return { success: true, message: 'School updated and synchronized.' };
  };

  const deleteSchool = async (id: string, reason?: string) => {
    const target = schools.find(s => s.id === id);
    if (!target) return { success: false, message: 'School not found.' };

    const deletedRecord: DeletedSchool = {
      ...target,
      deletedAt: new Date().toISOString(),
      deleteReason: reason || 'Deleted by Administrator'
    };

    try {
      await FirestoreSyncService.deleteDocument('schools', id);
    } catch (err: any) {
      console.error('Firestore deleteSchool error:', err);
    }

    setDeletedSchools(prev => [deletedRecord, ...prev.filter(s => s.id !== id)]);
    setSchools(prev => prev.filter(s => s.id !== id));

    return { 
      success: true, 
      message: `"${target.name}" was moved to the Deleted Schools archive.` 
    };
  };

  const restoreSchool = async (id: string) => {
    const target = deletedSchools.find(s => s.id === id);
    if (!target) return { success: false, message: 'Deleted school not found.' };

    const duplicate = schools.find(s => s.name.trim().toLowerCase() === target.name.trim().toLowerCase());
    if (duplicate) {
      return { 
        success: false, 
        message: `Cannot restore. An active school named "${target.name}" already exists.` 
      };
    }

    const { deletedAt, deleteReason, ...rest } = target;
    const restoredSchool: School = {
      ...rest,
      updatedAt: new Date().toISOString()
    };

    try {
      await FirestoreSyncService.saveSchool(restoredSchool);
    } catch (err: any) {
      console.error('Firestore restoreSchool error:', err);
    }

    setSchools(prev => [...prev, restoredSchool]);
    setDeletedSchools(prev => prev.filter(s => s.id !== id));

    return { 
      success: true, 
      message: `"${target.name}" has been successfully restored to Active Schools.` 
    };
  };

  const permanentlyDeleteSchool = async (id: string) => {
    const target = deletedSchools.find(s => s.id === id);
    try {
      await FirestoreSyncService.deleteDocument('schools', id);
    } catch (err: any) {
      console.error('Firestore permanentlyDeleteSchool error:', err);
    }
    setDeletedSchools(prev => prev.filter(s => s.id !== id));

    return { 
      success: true, 
      message: `"${target ? target.name : 'School'}" has been permanently deleted from the system.` 
    };
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
        const updated: Employee = {
          ...targetEmp,
          currentPosition: latest.position,
          itemNumber: latest.itemNumber || targetEmp.itemNumber,
          dateOfLatestAppointment: latest.appointmentDate || targetEmp.dateOfLatestAppointment,
          appointmentDocumentUrl: latest.appointmentPaperUrl || targetEmp.appointmentDocumentUrl,
          updatedAt: new Date().toISOString()
        };
        try {
          await FirestoreSyncService.saveEmployee(updated);
        } catch (err) {
          console.warn('Sync employee position error:', err);
        }
        setEmployees(empList => empList.map(e => e.id === employeeId ? updated : e));
      }
    }
  };

  const addPromotion = async (promo: Omit<PromotionRecord, 'id' | 'createdAt'>) => {
    const newRecord: PromotionRecord = {
      ...promo,
      id: `prm-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    try {
      await FirestoreSyncService.savePromotion(newRecord);
    } catch (err) {
      console.error('Firestore savePromotion error:', err);
    }
    setPromotions(prev => {
      const nextPromos = [...prev, newRecord];
      syncEmployeePositionFromPromotions(promo.employeeId, nextPromos);
      return nextPromos;
    });
  };

  const updatePromotion = async (id: string, promoData: Partial<PromotionRecord>) => {
    const existing = promotions.find(p => p.id === id);
    if (!existing) return;
    const updated: PromotionRecord = { ...existing, ...promoData };
    try {
      await FirestoreSyncService.savePromotion(updated);
    } catch (err) {
      console.error('Firestore updatePromotion error:', err);
    }
    setPromotions(prev => {
      const nextPromos = prev.map(p => p.id === id ? updated : p);
      syncEmployeePositionFromPromotions(existing.employeeId, nextPromos);
      return nextPromos;
    });
  };

  const deletePromotion = async (id: string) => {
    const existing = promotions.find(p => p.id === id);
    try {
      await FirestoreSyncService.deleteDocument('promotions', id);
    } catch (err) {
      console.error('Firestore deletePromotion error:', err);
    }
    setPromotions(prev => {
      const nextPromos = prev.filter(p => p.id !== id);
      if (existing) {
        syncEmployeePositionFromPromotions(existing.employeeId, nextPromos);
      }
      return nextPromos;
    });
  };

  // School Assignment Actions
  const addSchoolAssignment = async (assignment: Omit<SchoolAssignmentRecord, 'id' | 'createdAt'>) => {
    const newRecord: SchoolAssignmentRecord = {
      ...assignment,
      id: `sa-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    try {
      await FirestoreSyncService.saveSchoolAssignment(newRecord);
    } catch (err) {
      console.error('Firestore saveSchoolAssignment error:', err);
    }
    setSchoolAssignments(prev => [...prev, newRecord]);
  };

  const updateSchoolAssignment = async (id: string, assignment: Partial<SchoolAssignmentRecord>) => {
    const existing = schoolAssignments.find(sa => sa.id === id);
    if (!existing) return;
    const updated: SchoolAssignmentRecord = { ...existing, ...assignment };
    try {
      await FirestoreSyncService.saveSchoolAssignment(updated);
    } catch (err) {
      console.error('Firestore updateSchoolAssignment error:', err);
    }
    setSchoolAssignments(prev => prev.map(sa => sa.id === id ? updated : sa));
  };

  const deleteSchoolAssignment = async (id: string) => {
    try {
      await FirestoreSyncService.deleteDocument('schoolAssignments', id);
    } catch (err) {
      console.error('Firestore deleteSchoolAssignment error:', err);
    }
    setSchoolAssignments(prev => prev.filter(sa => sa.id !== id));
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
      await FirestoreSyncService.saveSpecialOrder(newSO);
    } catch (err) {
      console.error('Firestore saveSpecialOrder error:', err);
    }
    setSpecialOrders(prev => [...prev, newSO]);
    return newSO;
  };

  const updateSpecialOrder = async (id: string, soData: Partial<SpecialOrder>) => {
    const existing = specialOrders.find(s => s.id === id);
    if (!existing) return;
    const now = new Date().toISOString();
    const updatedSO: SpecialOrder = { ...existing, ...soData, updatedAt: now };
    try {
      await FirestoreSyncService.saveSpecialOrder(updatedSO);
    } catch (err) {
      console.error('Firestore updateSpecialOrder error:', err);
    }
    setSpecialOrders(prev => prev.map(so => so.id === id ? updatedSO : so));
  };

  const deleteSpecialOrder = async (id: string, reason?: string) => {
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

    try {
      await FirestoreSyncService.deleteDocument('specialOrders', id);
    } catch (err) {
      console.error('Firestore deleteSpecialOrder error:', err);
    }

    setDeletedSpecialOrders(prev => [deletedSO, ...prev.filter(so => so.id !== id)]);
    setSpecialOrders(prev => prev.filter(so => so.id !== id));

    return {
      success: true,
      message: `Special Order ${target.soNumber} ("${target.title}") was moved to Deleted Records.`
    };
  };

  const restoreSpecialOrder = async (id: string) => {
    const target = deletedSpecialOrders.find(so => so.id === id);
    if (!target) return { success: false, message: 'Deleted Special Order not found.' };

    const { deletedAt, deleteReason, totalRecipients, totalGrantedCredits, ...rest } = target;
    const restoredSO: SpecialOrder = {
      ...rest
    };

    try {
      await FirestoreSyncService.saveSpecialOrder(restoredSO);
    } catch (err) {
      console.error('Firestore restoreSpecialOrder error:', err);
    }

    setSpecialOrders(prev => [...prev, restoredSO]);
    setDeletedSpecialOrders(prev => prev.filter(so => so.id !== id));

    return {
      success: true,
      message: `Special Order ${target.soNumber} was restored successfully.`
    };
  };

  const permanentlyDeleteSpecialOrder = async (id: string) => {
    try {
      await FirestoreSyncService.deleteDocument('specialOrders', id);
    } catch (err) {
      console.error('Firestore permanentlyDeleteSpecialOrder error:', err);
    }
    setDeletedSpecialOrders(prev => prev.filter(so => so.id !== id));
    return {
      success: true,
      message: 'Special Order permanently erased from the system.'
    };
  };

  const addEarnedCredit = async (earned: Omit<ServiceCreditEarned, 'id' | 'createdAt'>) => {
    const newCredit: ServiceCreditEarned = {
      ...earned,
      id: `sce-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString()
    };
    try {
      await FirestoreSyncService.saveEarnedCredit(newCredit);
    } catch (err) {
      console.error('Firestore saveEarnedCredit error:', err);
    }
    setEarnedCredits(prev => [...prev, newCredit]);
  };

  const addEarnedCreditsBatch = async (soId: string, soNumber: string, assignments: { employeeId: string; earnedCredits: number; remarks?: string }[]) => {
    const now = new Date().toISOString();
    const newEntries: ServiceCreditEarned[] = assignments.map((as, idx) => ({
      id: `sce-${Date.now()}-${idx}`,
      soId,
      soNumber,
      employeeId: as.employeeId,
      earnedCredits: as.earnedCredits,
      remarks: as.remarks || '',
      createdAt: now
    }));

    for (const entry of newEntries) {
      try {
        await FirestoreSyncService.saveEarnedCredit(entry);
      } catch (err) {
        console.error('Firestore batch saveEarnedCredit error:', err);
      }
    }
    setEarnedCredits(prev => [...prev, ...newEntries]);
  };

  const updateEarnedCredit = async (id: string, earnedCreditsAmount: number, remarks?: string) => {
    const existing = earnedCredits.find(ec => ec.id === id);
    if (!existing) return;
    const updated: ServiceCreditEarned = { 
      ...existing, 
      earnedCredits: earnedCreditsAmount, 
      remarks: remarks !== undefined ? remarks : existing.remarks 
    };
    try {
      await FirestoreSyncService.saveEarnedCredit(updated);
    } catch (err) {
      console.error('Firestore updateEarnedCredit error:', err);
    }
    setEarnedCredits(prev => prev.map(ec => ec.id === id ? updated : ec));
  };

  const deleteEarnedCredit = async (id: string) => {
    try {
      await FirestoreSyncService.deleteDocument('earnedCredits', id);
    } catch (err) {
      console.error('Firestore deleteEarnedCredit error:', err);
    }
    setEarnedCredits(prev => prev.filter(ec => ec.id !== id));
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
    const available = getAvailableCreditsForEmployeeInSO(usedData.employeeId, usedData.soId);

    if (usedData.usedCredits > available) {
      return {
        success: false,
        message: `Insufficient service credits in the selected Special Order. Available: ${available.toFixed(1)} day(s), Attempted Deduction: ${usedData.usedCredits.toFixed(1)} day(s). Please choose another Special Order or enter a smaller amount.`
      };
    }

    const newUsed: ServiceCreditUsed = {
      ...usedData,
      id: `scu-${Date.now()}`,
      createdAt: new Date().toISOString()
    };

    try {
      await FirestoreSyncService.saveUsedCredit(newUsed);
    } catch (err) {
      console.error('Firestore saveUsedCredit error:', err);
    }

    setUsedCredits(prev => [...prev, newUsed]);
    return { success: true, message: 'Service credit usage recorded and synchronized online.' };
  };

  const deleteUsedCredit = async (id: string) => {
    try {
      await FirestoreSyncService.deleteDocument('usedCredits', id);
    } catch (err) {
      console.error('Firestore deleteUsedCredit error:', err);
    }
    setUsedCredits(prev => prev.filter(uc => uc.id !== id));
  };

  // Leave Actions
  const addLeaveRecord = async (leave: Omit<LeaveRecord, 'id' | 'createdAt'>) => {
    const newRecord: LeaveRecord = {
      ...leave,
      id: `lvr-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    try {
      await FirestoreSyncService.saveLeaveRecord(newRecord);
    } catch (err) {
      console.error('Firestore saveLeaveRecord error:', err);
    }
    setLeaveRecords(prev => [...prev, newRecord]);
  };

  const updateLeaveRecord = async (id: string, leave: Partial<LeaveRecord>) => {
    const existing = leaveRecords.find(l => l.id === id);
    if (!existing) return;
    const updated: LeaveRecord = { ...existing, ...leave };
    try {
      await FirestoreSyncService.saveLeaveRecord(updated);
    } catch (err) {
      console.error('Firestore updateLeaveRecord error:', err);
    }
    setLeaveRecords(prev => prev.map(l => l.id === id ? updated : l));
  };

  const deleteLeaveRecord = async (id: string, reason?: string) => {
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

    try {
      await FirestoreSyncService.deleteDocument('leaveRecords', id);
    } catch (err) {
      console.error('Firestore deleteLeaveRecord error:', err);
    }

    setDeletedLeaveRecords(prev => [deletedRecord, ...prev.filter(l => l.id !== id)]);
    setLeaveRecords(prev => prev.filter(l => l.id !== id));

    return {
      success: true,
      message: `Leave record for ${empName} (${target.leaveType}, ${target.numberOfDays} days) was moved to Deleted Records.`
    };
  };

  const restoreLeaveRecord = async (id: string) => {
    const target = deletedLeaveRecords.find(l => l.id === id);
    if (!target) return { success: false, message: 'Deleted leave record not found.' };

    const { deletedAt, deleteReason, employeeName, employeeNumber, schoolName, ...rest } = target;
    const restoredRecord: LeaveRecord = {
      ...rest
    };

    try {
      await FirestoreSyncService.saveLeaveRecord(restoredRecord);
    } catch (err) {
      console.error('Firestore restoreLeaveRecord error:', err);
    }

    setLeaveRecords(prev => [...prev, restoredRecord]);
    setDeletedLeaveRecords(prev => prev.filter(l => l.id !== id));

    return {
      success: true,
      message: `Leave record for ${employeeName || 'employee'} (${target.leaveType}) has been successfully restored.`
    };
  };

  const permanentlyDeleteLeaveRecord = async (id: string) => {
    const target = deletedLeaveRecords.find(l => l.id === id);
    try {
      await FirestoreSyncService.deleteDocument('leaveRecords', id);
    } catch (err) {
      console.error('Firestore permanentlyDeleteLeaveRecord error:', err);
    }
    setDeletedLeaveRecords(prev => prev.filter(l => l.id !== id));

    return {
      success: true,
      message: `Leave record ${target ? `(${target.leaveType})` : ''} permanently purged from system archive.`
    };
  };

  // System Reset
  const resetSystemData = async () => {
    StorageService.resetToDefault();
    StorageService.saveDeletedEmployees([]);
    StorageService.saveDeletedSchools([]);
    StorageService.saveDeletedLeaveRecords([]);
    StorageService.saveDeletedSpecialOrders([]);
    
    const freshEmps = StorageService.getEmployees();
    const freshSchools = StorageService.getSchools();
    const freshSO = StorageService.getSpecialOrders();
    const freshEarned = StorageService.getEarnedCredits();
    const freshUsed = StorageService.getUsedCredits();
    const freshPromos = StorageService.getPromotions();
    const freshSA = StorageService.getSchoolAssignments();
    const freshLeaves = StorageService.getLeaveRecords();

    setEmployees(freshEmps);
    setDeletedEmployees([]);
    setSchools(freshSchools);
    setDeletedSchools([]);
    setDeletedLeaveRecords([]);
    setDeletedSpecialOrders([]);
    setSpecialOrders(freshSO);
    setEarnedCredits(freshEarned);
    setUsedCredits(freshUsed);
    setPromotions(freshPromos);
    setSchoolAssignments(freshSA);
    setLeaveRecords(freshLeaves);

    // Sync fresh seed to Firestore
    try {
      await FirestoreSyncService.syncFullDatasetToFirestore({
        employees: freshEmps,
        schools: freshSchools,
        specialOrders: freshSO,
        earnedCredits: freshEarned,
        usedCredits: freshUsed,
        leaveRecords: freshLeaves,
        promotions: freshPromos,
        schoolAssignments: freshSA
      });
    } catch (err) {
      console.error('Firestore reset sync error:', err);
    }
  };

  // Batch Import from Excel / Google Sheets
  const importEmployeesBatch = async (
    newEmps: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>[],
    resolutions: Record<string, 'UPDATE' | 'SKIP' | 'KEEP_BOTH'>
  ) => {
    let added = 0;
    let updated = 0;
    let skipped = 0;

    const now = new Date().toISOString();
    const updatedEmployeeList = [...employees];

    for (const imp of newEmps) {
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
          try {
            await FirestoreSyncService.saveEmployee(updatedRecord);
          } catch (err) {
            console.error('Firestore batch update error:', err);
          }
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
          try {
            await FirestoreSyncService.saveEmployee(newRecord);
          } catch (err) {
            console.error('Firestore batch save error:', err);
          }
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
        try {
          await FirestoreSyncService.saveEmployee(newRecord);
        } catch (err) {
          console.error('Firestore batch save error:', err);
        }
        added++;
      }
    }

    setEmployees(updatedEmployeeList);
    return { added, updated, skipped };
  };

  // Firestore Sync operations
  const syncAllToFirestore = async (): Promise<{ success: boolean; message: string }> => {
    try {
      const result = await FirestoreSyncService.syncFullDatasetToFirestore({
        employees,
        schools,
        specialOrders,
        earnedCredits,
        usedCredits,
        leaveRecords,
        promotions,
        schoolAssignments
      });
      return { success: true, message: `Successfully synchronized ${result.syncedCount} records to Firebase Firestore Database.` };
    } catch (error) {
      console.error('Firestore full sync error:', error);
      return { success: false, message: error instanceof Error ? error.message : 'Failed to sync to Firestore' };
    }
  };

  const fetchFromFirestore = async (): Promise<{ success: boolean; message: string }> => {
    try {
      const data = await FirestoreSyncService.fetchAllFromFirestore();
      if (!data) {
        return { success: false, message: 'Could not fetch records from Firestore or permission denied.' };
      }
      if (data.employees.length > 0) setEmployees(data.employees);
      if (data.schools.length > 0) setSchools(data.schools);
      if (data.specialOrders.length > 0) setSpecialOrders(data.specialOrders);
      if (data.earnedCredits.length > 0) setEarnedCredits(data.earnedCredits);
      if (data.usedCredits.length > 0) setUsedCredits(data.usedCredits);
      if (data.leaveRecords.length > 0) setLeaveRecords(data.leaveRecords);
      if (data.promotions.length > 0) setPromotions(data.promotions);
      if (data.schoolAssignments.length > 0) setSchoolAssignments(data.schoolAssignments);

      return { 
        success: true, 
        message: `Successfully loaded ${data.employees.length} employees and district records from Firestore.` 
      };
    } catch (error) {
      console.error('Firestore fetch error:', error);
      return { success: false, message: error instanceof Error ? error.message : 'Failed to fetch from Firestore' };
    }
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

        isFirestoreConnected,
        isLoadingCloudData,
        syncAllToFirestore,
        fetchFromFirestore,

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
