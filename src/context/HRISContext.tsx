import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { StorageService } from '../services/storageService';
import { FirestoreSyncService } from '../services/firestoreService';
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

  // Stats
  totalActiveEmployees: number;
  totalInactiveEmployees: number;
  totalSchoolsCount: number;
  employeesPerSchool: { schoolName: string; count: number }[];
  recentlyAddedEmployees: Employee[];
  recentlyUpdatedEmployees: Employee[];
  upcomingBirthdays: BirthdayUpcoming[];

  // Actions - Employees
  addEmployee: (employeeData: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>) => { success: boolean; message: string; employee?: Employee };
  updateEmployee: (id: string, employeeData: Partial<Employee>) => { success: boolean; message: string };
  deleteEmployee: (id: string, reason?: string) => { success: boolean; message: string };
  restoreEmployee: (id: string) => { success: boolean; message: string };
  permanentlyDeleteEmployee: (id: string) => { success: boolean; message: string };
  getEmployeeFull: (id: string) => EmployeeFull | null;
  getEmployeeByNumber: (empNum: string) => Employee | null;

  // Actions - Schools
  addSchool: (name: string) => { success: boolean; message: string };
  updateSchool: (id: string, name: string, status: 'Active' | 'Inactive') => { success: boolean; message: string };
  deleteSchool: (id: string, reason?: string) => { success: boolean; message: string };
  restoreSchool: (id: string) => { success: boolean; message: string };
  permanentlyDeleteSchool: (id: string) => { success: boolean; message: string };
  
  // Actions - Promotions
  addPromotion: (promo: Omit<PromotionRecord, 'id' | 'createdAt'>) => void;
  updatePromotion: (id: string, promo: Partial<PromotionRecord>) => void;
  deletePromotion: (id: string) => void;

  // Actions - School Assignments
  addSchoolAssignment: (assignment: Omit<SchoolAssignmentRecord, 'id' | 'createdAt'>) => void;
  updateSchoolAssignment: (id: string, assignment: Partial<SchoolAssignmentRecord>) => void;
  deleteSchoolAssignment: (id: string) => void;

  // Actions - Special Orders & Service Credits
  addSpecialOrder: (so: Omit<SpecialOrder, 'id' | 'createdAt' | 'updatedAt'>) => SpecialOrder;
  updateSpecialOrder: (id: string, so: Partial<SpecialOrder>) => void;
  updateSpecialOrderFull: (
    id: string,
    soData: Partial<SpecialOrder>,
    allocations: { id?: string; employeeId: string; earnedCredits: number; remarks?: string }[],
    deletedAllocationIds?: string[]
  ) => { success: boolean; message: string };
  deleteSpecialOrder: (id: string, reason?: string) => { success: boolean; message: string };
  restoreSpecialOrder: (id: string) => { success: boolean; message: string };
  permanentlyDeleteSpecialOrder: (id: string) => { success: boolean; message: string };
  addEarnedCredit: (earned: Omit<ServiceCreditEarned, 'id' | 'createdAt'>) => void;
  addEarnedCreditsBatch: (soId: string, soNumber: string, assignments: { employeeId: string; earnedCredits: number; remarks?: string }[]) => void;
  updateEarnedCredit: (id: string, earnedCredits: number, remarks?: string) => void;
  deleteEarnedCredit: (id: string) => void;

  // Used Credits with strict validation
  addUsedCredit: (used: Omit<ServiceCreditUsed, 'id' | 'createdAt'>) => { success: boolean; message: string };
  deleteUsedCredit: (id: string) => void;

  // Helper: get available credits for employee in specific Special Order
  getAvailableCreditsForEmployeeInSO: (employeeId: string, soId: string) => number;
  // Get all Special Orders where employee has earned credits and available > 0
  getAvailableSpecialOrdersForEmployee: (employeeId: string) => { so: SpecialOrder; earned: number; used: number; available: number }[];

  // Actions - Leave
  addLeaveRecord: (leave: Omit<LeaveRecord, 'id' | 'createdAt'>) => void;
  updateLeaveRecord: (id: string, leave: Partial<LeaveRecord>) => void;
  deleteLeaveRecord: (id: string, reason?: string) => { success: boolean; message: string };
  restoreLeaveRecord: (id: string) => { success: boolean; message: string };
  permanentlyDeleteLeaveRecord: (id: string) => { success: boolean; message: string };

  // System
  resetSystemData: () => void;
  importEmployeesBatch: (newEmps: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>[], resolutions: Record<string, 'UPDATE' | 'SKIP' | 'KEEP_BOTH'>) => { added: number; updated: number; skipped: number };
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

  // Sync to Storage
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

  // Firestore Cloud Synchronization & Subscriptions
  useEffect(() => {
    let isMounted = true;

    const syncInitialCloudData = async () => {
      try {
        const isSchoolsEmpty = await FirestoreSyncService.isCollectionEmpty('schools');
        if (isSchoolsEmpty && isMounted) {
          await FirestoreSyncService.batchSaveItems('schools', StorageService.getSchools());
        }
        const isEmployeesEmpty = await FirestoreSyncService.isCollectionEmpty('employees');
        if (isEmployeesEmpty && isMounted) {
          await FirestoreSyncService.batchSaveItems('employees', StorageService.getEmployees());
        }
        const isSOEmpty = await FirestoreSyncService.isCollectionEmpty('specialOrders');
        if (isSOEmpty && isMounted) {
          await FirestoreSyncService.batchSaveItems('specialOrders', StorageService.getSpecialOrders());
        }
        const isPromosEmpty = await FirestoreSyncService.isCollectionEmpty('promotions');
        if (isPromosEmpty && isMounted) {
          await FirestoreSyncService.batchSaveItems('promotions', StorageService.getPromotions());
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
      } catch (err) {
        console.warn('[Firebase] Initial sync notice:', err);
      }
    };

    syncInitialCloudData();

    // Subscribe to collections
    const unsubSchools = FirestoreSyncService.subscribeToCollection<School>('schools', (cloud) => {
      if (cloud && cloud.length > 0) setSchools(cloud);
    });
    const unsubEmps = FirestoreSyncService.subscribeToCollection<Employee>('employees', (cloud) => {
      if (cloud && cloud.length > 0) setEmployees(cloud);
    });
    const unsubPromos = FirestoreSyncService.subscribeToCollection<PromotionRecord>('promotions', (cloud) => {
      if (cloud && cloud.length > 0) setPromotions(cloud);
    });
    const unsubAssign = FirestoreSyncService.subscribeToCollection<SchoolAssignmentRecord>('schoolAssignments', (cloud) => {
      if (cloud && cloud.length > 0) setSchoolAssignments(cloud);
    });
    const unsubSO = FirestoreSyncService.subscribeToCollection<SpecialOrder>('specialOrders', (cloud) => {
      if (cloud && cloud.length > 0) setSpecialOrders(cloud);
    });
    const unsubEarned = FirestoreSyncService.subscribeToCollection<ServiceCreditEarned>('serviceCreditsEarned', (cloud) => {
      if (cloud && cloud.length > 0) setEarnedCredits(cloud);
    });
    const unsubUsed = FirestoreSyncService.subscribeToCollection<ServiceCreditUsed>('serviceCreditsUsed', (cloud) => {
      if (cloud && cloud.length > 0) setUsedCredits(cloud);
    });
    const unsubLeave = FirestoreSyncService.subscribeToCollection<LeaveRecord>('leaveRecords', (cloud) => {
      if (cloud && cloud.length > 0) setLeaveRecords(cloud);
    });
    const unsubDelEmp = FirestoreSyncService.subscribeToCollection<DeletedEmployee>('deletedEmployees', (cloud) => {
      setDeletedEmployees(cloud);
    });
    const unsubDelSchool = FirestoreSyncService.subscribeToCollection<DeletedSchool>('deletedSchools', (cloud) => {
      setDeletedSchools(cloud);
    });
    const unsubDelSO = FirestoreSyncService.subscribeToCollection<DeletedSpecialOrder>('deletedSpecialOrders', (cloud) => {
      setDeletedSpecialOrders(cloud);
    });
    const unsubDelLeave = FirestoreSyncService.subscribeToCollection<DeletedLeaveRecord>('deletedLeaveRecords', (cloud) => {
      setDeletedLeaveRecords(cloud);
    });

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
    const today = new Date(); // e.g. 2026-08-07
    const currentYear = today.getFullYear();
    const result: BirthdayUpcoming[] = [];

    enrichedEmployees.forEach(emp => {
      if (!emp.birthday) return;
      const birthDate = new Date(emp.birthday);
      if (isNaN(birthDate.getTime())) return;

      let nextBday = new Date(currentYear, birthDate.getMonth(), birthDate.getDate());
      
      // If birthday already passed this year, check next year
      if (nextBday < today) {
        const diffDaysPassed = (today.getTime() - nextBday.getTime()) / (1000 * 3600 * 24);
        if (diffDaysPassed > 1) { // passed more than 1 day ago
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

  const addEmployee = (data: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>) => {
    // Unique Check
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

    setEmployees(prev => [...prev, newEmp]);

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
    setPromotions(prev => [...prev, initialPromotion]);

    return {
      success: true,
      message: 'Employee record created successfully.',
      employee: newEmp
    };
  };

  const updateEmployee = (id: string, data: Partial<Employee>) => {
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
    setEmployees(prev =>
      prev.map(e => (e.id === id ? { ...e, ...data, updatedAt: now } : e))
    );
    return { success: true, message: 'Employee updated successfully.' };
  };

  const deleteEmployee = (id: string, reason?: string) => {
    const target = employees.find(e => e.id === id);
    if (!target) return { success: false, message: 'Employee record not found.' };

    const deletedRecord: DeletedEmployee = {
      ...target,
      deletedAt: new Date().toISOString(),
      deleteReason: reason || 'Deleted by Administrator'
    };

    setDeletedEmployees(prev => [deletedRecord, ...prev.filter(e => e.id !== id)]);
    setEmployees(prev => prev.filter(e => e.id !== id));

    return { 
      success: true, 
      message: `${target.firstName} ${target.lastName} was moved to the Deleted Personnel archive.` 
    };
  };

  const restoreEmployee = (id: string) => {
    const target = deletedEmployees.find(e => e.id === id);
    if (!target) return { success: false, message: 'Deleted employee record not found.' };

    // Check if duplicate employee number currently in active list
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

    setEmployees(prev => [...prev, restoredEmp]);
    setDeletedEmployees(prev => prev.filter(e => e.id !== id));

    return { 
      success: true, 
      message: `${target.firstName} ${target.lastName} has been successfully restored to Employee Records.` 
    };
  };

  const permanentlyDeleteEmployee = (id: string) => {
    const target = deletedEmployees.find(e => e.id === id);
    setDeletedEmployees(prev => prev.filter(e => e.id !== id));
    
    // Clean up associated child records
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
  const addSchool = (name: string) => {
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
    setSchools(prev => [...prev, newSchool]);
    return { success: true, message: 'School added successfully.' };
  };

  const updateSchool = (id: string, name: string, status: 'Active' | 'Inactive') => {
    const trimmed = name.trim();
    if (!trimmed) return { success: false, message: 'School name is required.' };

    setSchools(prev => prev.map(s => s.id === id ? { ...s, name: trimmed, status, updatedAt: new Date().toISOString() } : s));
    
    // Also update schoolName across employees
    setEmployees(prev => prev.map(e => e.schoolId === id ? { ...e, schoolName: trimmed } : e));

    return { success: true, message: 'School updated successfully.' };
  };

  const deleteSchool = (id: string, reason?: string) => {
    const target = schools.find(s => s.id === id);
    if (!target) return { success: false, message: 'School not found.' };

    const deletedRecord: DeletedSchool = {
      ...target,
      deletedAt: new Date().toISOString(),
      deleteReason: reason || 'Deleted by Administrator'
    };

    setDeletedSchools(prev => [deletedRecord, ...prev.filter(s => s.id !== id)]);
    setSchools(prev => prev.filter(s => s.id !== id));

    return { 
      success: true, 
      message: `"${target.name}" was moved to the Deleted Schools archive.` 
    };
  };

  const restoreSchool = (id: string) => {
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

    setSchools(prev => [...prev, restoredSchool]);
    setDeletedSchools(prev => prev.filter(s => s.id !== id));

    return { 
      success: true, 
      message: `"${target.name}" has been successfully restored to Active Schools.` 
    };
  };

  const permanentlyDeleteSchool = (id: string) => {
    const target = deletedSchools.find(s => s.id === id);
    setDeletedSchools(prev => prev.filter(s => s.id !== id));

    return { 
      success: true, 
      message: `"${target ? target.name : 'School'}" has been permanently deleted from the system.` 
    };
  };

  // Promotion Actions
  const syncEmployeePositionFromPromotions = (employeeId: string, allPromos: PromotionRecord[]) => {
    const empPromos = allPromos
      .filter(p => p.employeeId === employeeId)
      .sort((a, b) => {
        const dateDiff = new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime();
        if (dateDiff !== 0) return dateDiff;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

    if (empPromos.length > 0) {
      const latest = empPromos[0];
      setEmployees(empList => empList.map(e => {
        if (e.id === employeeId) {
          return {
            ...e,
            currentPosition: latest.position,
            itemNumber: latest.itemNumber || e.itemNumber,
            dateOfLatestAppointment: latest.appointmentDate || e.dateOfLatestAppointment,
            appointmentDocumentUrl: latest.appointmentPaperUrl || e.appointmentDocumentUrl,
            updatedAt: new Date().toISOString()
          };
        }
        return e;
      }));
    }
  };

  const addPromotion = (promo: Omit<PromotionRecord, 'id' | 'createdAt'>) => {
    const newRecord: PromotionRecord = {
      ...promo,
      id: `prm-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    setPromotions(prev => {
      const nextPromos = [...prev, newRecord];
      syncEmployeePositionFromPromotions(promo.employeeId, nextPromos);
      return nextPromos;
    });
  };

  const updatePromotion = (id: string, promoData: Partial<PromotionRecord>) => {
    setPromotions(prev => {
      const nextPromos = prev.map(p => p.id === id ? { ...p, ...promoData } : p);
      const target = nextPromos.find(p => p.id === id);
      if (target) {
        syncEmployeePositionFromPromotions(target.employeeId, nextPromos);
      }
      return nextPromos;
    });
  };

  const deletePromotion = (id: string) => {
    setPromotions(prev => {
      const target = prev.find(p => p.id === id);
      const nextPromos = prev.filter(p => p.id !== id);
      if (target) {
        syncEmployeePositionFromPromotions(target.employeeId, nextPromos);
      }
      return nextPromos;
    });
  };

  // School Assignment Actions
  const addSchoolAssignment = (assignment: Omit<SchoolAssignmentRecord, 'id' | 'createdAt'>) => {
    const newRecord: SchoolAssignmentRecord = {
      ...assignment,
      id: `sa-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    setSchoolAssignments(prev => [...prev, newRecord]);
  };

  const updateSchoolAssignment = (id: string, assignment: Partial<SchoolAssignmentRecord>) => {
    setSchoolAssignments(prev => prev.map(sa => sa.id === id ? { ...sa, ...assignment } : sa));
  };

  const deleteSchoolAssignment = (id: string) => {
    setSchoolAssignments(prev => prev.filter(sa => sa.id !== id));
  };

  // Special Orders & Service Credits
  const addSpecialOrder = (soData: Omit<SpecialOrder, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newSO: SpecialOrder = {
      ...soData,
      id: `so-${Date.now()}`,
      createdAt: now,
      updatedAt: now
    };
    setSpecialOrders(prev => [...prev, newSO]);
    return newSO;
  };

  const updateSpecialOrder = (id: string, soData: Partial<SpecialOrder>) => {
    const now = new Date().toISOString();
    setSpecialOrders(prev => prev.map(so => so.id === id ? { ...so, ...soData, updatedAt: now } : so));
    if (soData.soNumber) {
      setEarnedCredits(prev => prev.map(ec => ec.soId === id ? { ...ec, soNumber: soData.soNumber! } : ec));
      setUsedCredits(prev => prev.map(uc => uc.soId === id ? { ...uc, soNumber: soData.soNumber! } : uc));
    }
  };

  const updateSpecialOrderFull = (
    id: string,
    soData: Partial<SpecialOrder>,
    allocations: { id?: string; employeeId: string; earnedCredits: number; remarks?: string }[],
    deletedAllocationIds?: string[]
  ) => {
    const target = specialOrders.find(s => s.id === id);
    if (!target) return { success: false, message: 'Special Order not found.' };

    const now = new Date().toISOString();
    const newSONumber = soData.soNumber ? soData.soNumber.trim() : target.soNumber;

    // 1. Update the Special Order record
    setSpecialOrders(prev => prev.map(so => so.id === id ? { ...so, ...soData, updatedAt: now } : so));

    // 2. If soNumber changed, update usedCredits
    if (soData.soNumber && soData.soNumber !== target.soNumber) {
      setUsedCredits(prev => prev.map(uc => uc.soId === id ? { ...uc, soNumber: newSONumber } : uc));
    }

    // 3. Update earned credits:
    const deletedSet = new Set(deletedAllocationIds || []);

    setEarnedCredits(prev => {
      // Remove any explicit deleted allocation IDs
      let currentList = prev.filter(ec => !deletedSet.has(ec.id));

      const existingAllocMap = new Map<string, typeof allocations[0]>();
      const newAllocations: typeof allocations = [];

      allocations.forEach(a => {
        if (a.id) {
          existingAllocMap.set(a.id, a);
        } else {
          newAllocations.push(a);
        }
      });

      // Update existing
      currentList = currentList.map(ec => {
        if (ec.soId === id) {
          const updated = existingAllocMap.get(ec.id);
          if (updated) {
            return {
              ...ec,
              soNumber: newSONumber,
              earnedCredits: updated.earnedCredits,
              remarks: updated.remarks !== undefined ? updated.remarks : ec.remarks
            };
          } else if (soData.soNumber) {
            return {
              ...ec,
              soNumber: newSONumber
            };
          }
        }
        return ec;
      });

      // Append new allocations
      if (newAllocations.length > 0) {
        const newEntries: ServiceCreditEarned[] = newAllocations.map((na, idx) => ({
          id: `sce-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
          soId: id,
          soNumber: newSONumber,
          employeeId: na.employeeId,
          earnedCredits: na.earnedCredits,
          remarks: na.remarks || `Granted via ${newSONumber}`,
          createdAt: now
        }));
        currentList = [...currentList, ...newEntries];
      }

      return currentList;
    });

    return {
      success: true,
      message: `Special Order ${newSONumber} has been successfully updated.`
    };
  };

  const deleteSpecialOrder = (id: string, reason?: string) => {
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

    setDeletedSpecialOrders(prev => [deletedSO, ...prev.filter(so => so.id !== id)]);
    setSpecialOrders(prev => prev.filter(so => so.id !== id));

    return {
      success: true,
      message: `Special Order ${target.soNumber} ("${target.title}") was moved to Deleted Records.`
    };
  };

  const restoreSpecialOrder = (id: string) => {
    const target = deletedSpecialOrders.find(so => so.id === id);
    if (!target) return { success: false, message: 'Deleted Special Order not found.' };

    const { deletedAt, deleteReason, totalRecipients, totalGrantedCredits, ...rest } = target;
    const restoredSO: SpecialOrder = {
      ...rest
    };

    setSpecialOrders(prev => [...prev, restoredSO]);
    setDeletedSpecialOrders(prev => prev.filter(so => so.id !== id));

    return {
      success: true,
      message: `Special Order ${target.soNumber} was restored successfully.`
    };
  };

  const permanentlyDeleteSpecialOrder = (id: string) => {
    setDeletedSpecialOrders(prev => prev.filter(so => so.id !== id));
    return {
      success: true,
      message: 'Special Order permanently erased from the system.'
    };
  };

  const addEarnedCredit = (earned: Omit<ServiceCreditEarned, 'id' | 'createdAt'>) => {
    const newCredit: ServiceCreditEarned = {
      ...earned,
      id: `sce-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString()
    };
    setEarnedCredits(prev => [...prev, newCredit]);
  };

  const addEarnedCreditsBatch = (soId: string, soNumber: string, assignments: { employeeId: string; earnedCredits: number; remarks?: string }[]) => {
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
    setEarnedCredits(prev => [...prev, ...newEntries]);
  };

  const updateEarnedCredit = (id: string, earnedCredits: number, remarks?: string) => {
    setEarnedCredits(prev => prev.map(ec => ec.id === id ? { ...ec, earnedCredits, remarks: remarks !== undefined ? remarks : ec.remarks } : ec));
  };

  const deleteEarnedCredit = (id: string) => {
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
  const addUsedCredit = (usedData: Omit<ServiceCreditUsed, 'id' | 'createdAt'>) => {
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

    setUsedCredits(prev => [...prev, newUsed]);
    return { success: true, message: 'Service credit usage recorded successfully.' };
  };

  const deleteUsedCredit = (id: string) => {
    setUsedCredits(prev => prev.filter(uc => uc.id !== id));
  };

  // Leave Actions
  const addLeaveRecord = (leave: Omit<LeaveRecord, 'id' | 'createdAt'>) => {
    const newRecord: LeaveRecord = {
      ...leave,
      id: `lvr-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    setLeaveRecords(prev => [...prev, newRecord]);
  };

  const updateLeaveRecord = (id: string, leave: Partial<LeaveRecord>) => {
    setLeaveRecords(prev => prev.map(l => l.id === id ? { ...l, ...leave } : l));
  };

  const deleteLeaveRecord = (id: string, reason?: string) => {
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

    setDeletedLeaveRecords(prev => [deletedRecord, ...prev.filter(l => l.id !== id)]);
    setLeaveRecords(prev => prev.filter(l => l.id !== id));

    return {
      success: true,
      message: `Leave record for ${empName} (${target.leaveType}, ${target.numberOfDays} days) was moved to Deleted Records.`
    };
  };

  const restoreLeaveRecord = (id: string) => {
    const target = deletedLeaveRecords.find(l => l.id === id);
    if (!target) return { success: false, message: 'Deleted leave record not found.' };

    const { deletedAt, deleteReason, employeeName, employeeNumber, schoolName, ...rest } = target;
    const restoredRecord: LeaveRecord = {
      ...rest
    };

    setLeaveRecords(prev => [...prev, restoredRecord]);
    setDeletedLeaveRecords(prev => prev.filter(l => l.id !== id));

    return {
      success: true,
      message: `Leave record for ${employeeName || 'employee'} (${target.leaveType}) has been successfully restored.`
    };
  };

  const permanentlyDeleteLeaveRecord = (id: string) => {
    const target = deletedLeaveRecords.find(l => l.id === id);
    setDeletedLeaveRecords(prev => prev.filter(l => l.id !== id));

    return {
      success: true,
      message: `Leave record ${target ? `(${target.leaveType})` : ''} permanently purged from system archive.`
    };
  };

  // System Reset
  const resetSystemData = () => {
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
  };

  // Batch Import from Excel / Google Sheets
  const importEmployeesBatch = (
    newEmps: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>[],
    resolutions: Record<string, 'UPDATE' | 'SKIP' | 'KEEP_BOTH'>
  ) => {
    let added = 0;
    let updated = 0;
    let skipped = 0;

    const now = new Date().toISOString();
    const updatedEmployeeList = [...employees];

    newEmps.forEach(imp => {
      const empNum = imp.employeeNumber.trim();
      const existingIdx = updatedEmployeeList.findIndex(e => e.employeeNumber.trim().toLowerCase() === empNum.toLowerCase());

      if (existingIdx >= 0) {
        const resolution = resolutions[empNum] || 'SKIP';
        if (resolution === 'UPDATE') {
          updatedEmployeeList[existingIdx] = {
            ...updatedEmployeeList[existingIdx],
            ...imp,
            id: updatedEmployeeList[existingIdx].id, // preserve ID
            updatedAt: now
          };
          updated++;
        } else if (resolution === 'KEEP_BOTH') {
          const newId = `emp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
          updatedEmployeeList.push({
            ...imp,
            id: newId,
            employeeNumber: `${empNum}-DUP`,
            createdAt: now,
            updatedAt: now
          });
          added++;
        } else {
          skipped++;
        }
      } else {
        const newId = `emp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        updatedEmployeeList.push({
          ...imp,
          id: newId,
          createdAt: now,
          updatedAt: now
        });
        added++;
      }
    });

    setEmployees(updatedEmployeeList);
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
        updateSpecialOrderFull,
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
