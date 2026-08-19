import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
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
  StorageService.initStorage();

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

  // Firestore Sync initialization & real-time subscriptions
  const initialCloudSyncDoneRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    const syncInitialCloudData = async () => {
      if (initialCloudSyncDoneRef.current) return;
      initialCloudSyncDoneRef.current = true;

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
      if (cloud && cloud.length > 0) {
        setSchools(cloud);
        StorageService.saveSchools(cloud);
      }
    });

    const unsubEmps = FirestoreSyncService.subscribeToCollection<Employee>('employees', (cloud) => {
      if (cloud && cloud.length > 0) {
        setEmployees(cloud);
        StorageService.saveEmployees(cloud);
      }
    });

    const unsubPromos = FirestoreSyncService.subscribeToCollection<PromotionRecord>('promotions', (cloud) => {
      if (cloud && cloud.length > 0) {
        setPromotions(cloud);
        StorageService.savePromotions(cloud);
      }
    });

    const unsubAssign = FirestoreSyncService.subscribeToCollection<SchoolAssignmentRecord>('schoolAssignments', (cloud) => {
      if (cloud && cloud.length > 0) {
        setSchoolAssignments(cloud);
        StorageService.saveSchoolAssignments(cloud);
      }
    });

    const unsubSO = FirestoreSyncService.subscribeToCollection<SpecialOrder>('specialOrders', (cloud) => {
      if (cloud && cloud.length > 0) {
        setSpecialOrders(cloud);
        StorageService.saveSpecialOrders(cloud);
      }
    });

    const unsubEarned = FirestoreSyncService.subscribeToCollection<ServiceCreditEarned>('serviceCreditsEarned', (cloud) => {
      if (cloud && cloud.length > 0) {
        setEarnedCredits(cloud);
        StorageService.saveEarnedCredits(cloud);
      }
    });

    const unsubUsed = FirestoreSyncService.subscribeToCollection<ServiceCreditUsed>('serviceCreditsUsed', (cloud) => {
      if (cloud && cloud.length > 0) {
        setUsedCredits(cloud);
        StorageService.saveUsedCredits(cloud);
      }
    });

    const unsubLeave = FirestoreSyncService.subscribeToCollection<LeaveRecord>('leaveRecords', (cloud) => {
      if (cloud && cloud.length > 0) {
        setLeaveRecords(cloud);
        StorageService.saveLeaveRecords(cloud);
      }
    });

    const unsubDelEmp = FirestoreSyncService.subscribeToCollection<DeletedEmployee>('deletedEmployees', (cloud) => {
      setDeletedEmployees(cloud || []);
      StorageService.saveDeletedEmployees(cloud || []);
    });

    const unsubDelSchool = FirestoreSyncService.subscribeToCollection<DeletedSchool>('deletedSchools', (cloud) => {
      setDeletedSchools(cloud || []);
      StorageService.saveDeletedSchools(cloud || []);
    });

    const unsubDelSO = FirestoreSyncService.subscribeToCollection<DeletedSpecialOrder>('deletedSpecialOrders', (cloud) => {
      setDeletedSpecialOrders(cloud || []);
      StorageService.saveDeletedSpecialOrders(cloud || []);
    });

    const unsubDelLeave = FirestoreSyncService.subscribeToCollection<DeletedLeaveRecord>('deletedLeaveRecords', (cloud) => {
      setDeletedLeaveRecords(cloud || []);
      StorageService.saveDeletedLeaveRecords(cloud || []);
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
    const today = new Date();
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

    const nextEmployees = [...employees, newEmp];
    setEmployees(nextEmployees);
    StorageService.saveEmployees(nextEmployees);
    FirestoreSyncService.saveItem('employees', newEmp);

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
    const nextPromotions = [...promotions, initialPromotion];
    setPromotions(nextPromotions);
    StorageService.savePromotions(nextPromotions);
    FirestoreSyncService.saveItem('promotions', initialPromotion);

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
    const updatedEmp = { ...emp, ...data, updatedAt: now };
    const nextEmployees = employees.map(e => (e.id === id ? updatedEmp : e));
    
    setEmployees(nextEmployees);
    StorageService.saveEmployees(nextEmployees);
    FirestoreSyncService.saveItem('employees', updatedEmp);

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

    const nextEmployees = employees.filter(e => e.id !== id);
    const nextDeleted = [deletedRecord, ...deletedEmployees.filter(e => e.id !== id)];

    setEmployees(nextEmployees);
    setDeletedEmployees(nextDeleted);
    StorageService.saveEmployees(nextEmployees);
    StorageService.saveDeletedEmployees(nextDeleted);

    FirestoreSyncService.deleteItem('employees', id);
    FirestoreSyncService.saveItem('deletedEmployees', deletedRecord);

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

    const nextEmployees = [...employees, restoredEmp];
    const nextDeleted = deletedEmployees.filter(e => e.id !== id);

    setEmployees(nextEmployees);
    setDeletedEmployees(nextDeleted);
    StorageService.saveEmployees(nextEmployees);
    StorageService.saveDeletedEmployees(nextDeleted);

    FirestoreSyncService.saveItem('employees', restoredEmp);
    FirestoreSyncService.deleteItem('deletedEmployees', id);

    return { 
      success: true, 
      message: `${target.firstName} ${target.lastName} has been successfully restored to Employee Records.` 
    };
  };

  const permanentlyDeleteEmployee = (id: string) => {
    const target = deletedEmployees.find(e => e.id === id);
    const nextDeleted = deletedEmployees.filter(e => e.id !== id);
    setDeletedEmployees(nextDeleted);
    StorageService.saveDeletedEmployees(nextDeleted);
    FirestoreSyncService.deleteItem('deletedEmployees', id);
    
    // Clean up associated child records
    const nextPromos = promotions.filter(p => p.employeeId !== id);
    const nextAssignments = schoolAssignments.filter(sa => sa.employeeId !== id);
    const nextEarned = earnedCredits.filter(ec => ec.employeeId !== id);
    const nextUsed = usedCredits.filter(uc => uc.employeeId !== id);
    const nextLeaves = leaveRecords.filter(l => l.employeeId !== id);

    setPromotions(nextPromos);
    setSchoolAssignments(nextAssignments);
    setEarnedCredits(nextEarned);
    setUsedCredits(nextUsed);
    setLeaveRecords(nextLeaves);

    StorageService.savePromotions(nextPromos);
    StorageService.saveSchoolAssignments(nextAssignments);
    StorageService.saveEarnedCredits(nextEarned);
    StorageService.saveUsedCredits(nextUsed);
    StorageService.saveLeaveRecords(nextLeaves);

    promotions.filter(p => p.employeeId === id).forEach(p => FirestoreSyncService.deleteItem('promotions', p.id));
    schoolAssignments.filter(sa => sa.employeeId === id).forEach(sa => FirestoreSyncService.deleteItem('schoolAssignments', sa.id));
    earnedCredits.filter(ec => ec.employeeId === id).forEach(ec => FirestoreSyncService.deleteItem('serviceCreditsEarned', ec.id));
    usedCredits.filter(uc => uc.employeeId === id).forEach(uc => FirestoreSyncService.deleteItem('serviceCreditsUsed', uc.id));
    leaveRecords.filter(l => l.employeeId === id).forEach(l => FirestoreSyncService.deleteItem('leaveRecords', l.id));

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

    const nextSchools = [...schools, newSchool];
    setSchools(nextSchools);
    StorageService.saveSchools(nextSchools);
    FirestoreSyncService.saveItem('schools', newSchool);

    return { success: true, message: 'School added successfully.' };
  };

  const updateSchool = (id: string, name: string, status: 'Active' | 'Inactive') => {
    const trimmed = name.trim();
    if (!trimmed) return { success: false, message: 'School name is required.' };

    const updatedSchool: School = {
      id,
      name: trimmed,
      status,
      createdAt: schools.find(s => s.id === id)?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const nextSchools = schools.map(s => s.id === id ? updatedSchool : s);
    setSchools(nextSchools);
    StorageService.saveSchools(nextSchools);
    FirestoreSyncService.saveItem('schools', updatedSchool);
    
    // Also update schoolName across employees
    const nextEmployees = employees.map(e => e.schoolId === id ? { ...e, schoolName: trimmed } : e);
    setEmployees(nextEmployees);
    StorageService.saveEmployees(nextEmployees);
    nextEmployees.filter(e => e.schoolId === id).forEach(e => FirestoreSyncService.saveItem('employees', e));

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

    const nextSchools = schools.filter(s => s.id !== id);
    const nextDeleted = [deletedRecord, ...deletedSchools.filter(s => s.id !== id)];

    setSchools(nextSchools);
    setDeletedSchools(nextDeleted);
    StorageService.saveSchools(nextSchools);
    StorageService.saveDeletedSchools(nextDeleted);

    FirestoreSyncService.deleteItem('schools', id);
    FirestoreSyncService.saveItem('deletedSchools', deletedRecord);

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

    const nextSchools = [...schools, restoredSchool];
    const nextDeleted = deletedSchools.filter(s => s.id !== id);

    setSchools(nextSchools);
    setDeletedSchools(nextDeleted);
    StorageService.saveSchools(nextSchools);
    StorageService.saveDeletedSchools(nextDeleted);

    FirestoreSyncService.saveItem('schools', restoredSchool);
    FirestoreSyncService.deleteItem('deletedSchools', id);

    return { 
      success: true, 
      message: `"${target.name}" has been successfully restored to Active Schools.` 
    };
  };

  const permanentlyDeleteSchool = (id: string) => {
    const target = deletedSchools.find(s => s.id === id);
    const nextDeleted = deletedSchools.filter(s => s.id !== id);
    setDeletedSchools(nextDeleted);
    StorageService.saveDeletedSchools(nextDeleted);
    FirestoreSyncService.deleteItem('deletedSchools', id);

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
      const nextEmployees = employees.map(e => {
        if (e.id === employeeId) {
          const updatedEmp = {
            ...e,
            currentPosition: latest.position,
            itemNumber: latest.itemNumber || e.itemNumber,
            dateOfLatestAppointment: latest.appointmentDate || e.dateOfLatestAppointment,
            appointmentDocumentUrl: latest.appointmentPaperUrl || e.appointmentDocumentUrl,
            updatedAt: new Date().toISOString()
          };
          FirestoreSyncService.saveItem('employees', updatedEmp);
          return updatedEmp;
        }
        return e;
      });
      setEmployees(nextEmployees);
      StorageService.saveEmployees(nextEmployees);
    }
  };

  const addPromotion = (promo: Omit<PromotionRecord, 'id' | 'createdAt'>) => {
    const newRecord: PromotionRecord = {
      ...promo,
      id: `prm-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    const nextPromos = [...promotions, newRecord];
    setPromotions(nextPromos);
    StorageService.savePromotions(nextPromos);
    FirestoreSyncService.saveItem('promotions', newRecord);
    syncEmployeePositionFromPromotions(promo.employeeId, nextPromos);
  };

  const updatePromotion = (id: string, promoData: Partial<PromotionRecord>) => {
    const target = promotions.find(p => p.id === id);
    if (!target) return;
    const updatedPromo: PromotionRecord = { ...target, ...promoData };
    const nextPromos = promotions.map(p => p.id === id ? updatedPromo : p);
    setPromotions(nextPromos);
    StorageService.savePromotions(nextPromos);
    FirestoreSyncService.saveItem('promotions', updatedPromo);
    syncEmployeePositionFromPromotions(target.employeeId, nextPromos);
  };

  const deletePromotion = (id: string) => {
    const target = promotions.find(p => p.id === id);
    const nextPromos = promotions.filter(p => p.id !== id);
    setPromotions(nextPromos);
    StorageService.savePromotions(nextPromos);
    FirestoreSyncService.deleteItem('promotions', id);
    if (target) {
      syncEmployeePositionFromPromotions(target.employeeId, nextPromos);
    }
  };

  // School Assignment Actions
  const addSchoolAssignment = (assignment: Omit<SchoolAssignmentRecord, 'id' | 'createdAt'>) => {
    const newRecord: SchoolAssignmentRecord = {
      ...assignment,
      id: `sa-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    const nextAssignments = [...schoolAssignments, newRecord];
    setSchoolAssignments(nextAssignments);
    StorageService.saveSchoolAssignments(nextAssignments);
    FirestoreSyncService.saveItem('schoolAssignments', newRecord);
  };

  const updateSchoolAssignment = (id: string, assignment: Partial<SchoolAssignmentRecord>) => {
    const target = schoolAssignments.find(sa => sa.id === id);
    if (!target) return;
    const updated: SchoolAssignmentRecord = { ...target, ...assignment };
    const nextAssignments = schoolAssignments.map(sa => sa.id === id ? updated : sa);
    setSchoolAssignments(nextAssignments);
    StorageService.saveSchoolAssignments(nextAssignments);
    FirestoreSyncService.saveItem('schoolAssignments', updated);
  };

  const deleteSchoolAssignment = (id: string) => {
    const nextAssignments = schoolAssignments.filter(sa => sa.id !== id);
    setSchoolAssignments(nextAssignments);
    StorageService.saveSchoolAssignments(nextAssignments);
    FirestoreSyncService.deleteItem('schoolAssignments', id);
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
    const nextSOs = [...specialOrders, newSO];
    setSpecialOrders(nextSOs);
    StorageService.saveSpecialOrders(nextSOs);
    FirestoreSyncService.saveItem('specialOrders', newSO);
    return newSO;
  };

  const updateSpecialOrder = (id: string, soData: Partial<SpecialOrder>) => {
    const now = new Date().toISOString();
    const target = specialOrders.find(s => s.id === id);
    if (!target) return;
    const updated: SpecialOrder = { ...target, ...soData, updatedAt: now };
    const nextSOs = specialOrders.map(so => so.id === id ? updated : so);
    setSpecialOrders(nextSOs);
    StorageService.saveSpecialOrders(nextSOs);
    FirestoreSyncService.saveItem('specialOrders', updated);
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

    const nextSOs = specialOrders.filter(so => so.id !== id);
    const nextDeleted = [deletedSO, ...deletedSpecialOrders.filter(so => so.id !== id)];

    setSpecialOrders(nextSOs);
    setDeletedSpecialOrders(nextDeleted);
    StorageService.saveSpecialOrders(nextSOs);
    StorageService.saveDeletedSpecialOrders(nextDeleted);

    FirestoreSyncService.deleteItem('specialOrders', id);
    FirestoreSyncService.saveItem('deletedSpecialOrders', deletedSO);

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

    const nextSOs = [...specialOrders, restoredSO];
    const nextDeleted = deletedSpecialOrders.filter(so => so.id !== id);

    setSpecialOrders(nextSOs);
    setDeletedSpecialOrders(nextDeleted);
    StorageService.saveSpecialOrders(nextSOs);
    StorageService.saveDeletedSpecialOrders(nextDeleted);

    FirestoreSyncService.saveItem('specialOrders', restoredSO);
    FirestoreSyncService.deleteItem('deletedSpecialOrders', id);

    return {
      success: true,
      message: `Special Order ${target.soNumber} was restored successfully.`
    };
  };

  const permanentlyDeleteSpecialOrder = (id: string) => {
    const nextDeleted = deletedSpecialOrders.filter(so => so.id !== id);
    setDeletedSpecialOrders(nextDeleted);
    StorageService.saveDeletedSpecialOrders(nextDeleted);
    FirestoreSyncService.deleteItem('deletedSpecialOrders', id);
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
    const nextEarned = [...earnedCredits, newCredit];
    setEarnedCredits(nextEarned);
    StorageService.saveEarnedCredits(nextEarned);
    FirestoreSyncService.saveItem('serviceCreditsEarned', newCredit);
  };

  const addEarnedCreditsBatch = (soId: string, soNumber: string, assignments: { employeeId: string; earnedCredits: number; remarks?: string }[]) => {
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
    const nextEarned = [...earnedCredits, ...newEntries];
    setEarnedCredits(nextEarned);
    StorageService.saveEarnedCredits(nextEarned);
    FirestoreSyncService.batchSaveItems('serviceCreditsEarned', newEntries);
  };

  const updateEarnedCredit = (id: string, earnedCreditsVal: number, remarks?: string) => {
    const target = earnedCredits.find(ec => ec.id === id);
    if (!target) return;
    const updated: ServiceCreditEarned = {
      ...target,
      earnedCredits: earnedCreditsVal,
      remarks: remarks !== undefined ? remarks : target.remarks
    };
    const nextEarned = earnedCredits.map(ec => ec.id === id ? updated : ec);
    setEarnedCredits(nextEarned);
    StorageService.saveEarnedCredits(nextEarned);
    FirestoreSyncService.saveItem('serviceCreditsEarned', updated);
  };

  const deleteEarnedCredit = (id: string) => {
    const nextEarned = earnedCredits.filter(ec => ec.id !== id);
    setEarnedCredits(nextEarned);
    StorageService.saveEarnedCredits(nextEarned);
    FirestoreSyncService.deleteItem('serviceCreditsEarned', id);
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

    const nextUsed = [...usedCredits, newUsed];
    setUsedCredits(nextUsed);
    StorageService.saveUsedCredits(nextUsed);
    FirestoreSyncService.saveItem('serviceCreditsUsed', newUsed);

    return { success: true, message: 'Service credit usage recorded successfully.' };
  };

  const deleteUsedCredit = (id: string) => {
    const nextUsed = usedCredits.filter(uc => uc.id !== id);
    setUsedCredits(nextUsed);
    StorageService.saveUsedCredits(nextUsed);
    FirestoreSyncService.deleteItem('serviceCreditsUsed', id);
  };

  // Leave Actions
  const addLeaveRecord = (leave: Omit<LeaveRecord, 'id' | 'createdAt'>) => {
    const newRecord: LeaveRecord = {
      ...leave,
      id: `lvr-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    const nextLeaves = [...leaveRecords, newRecord];
    setLeaveRecords(nextLeaves);
    StorageService.saveLeaveRecords(nextLeaves);
    FirestoreSyncService.saveItem('leaveRecords', newRecord);
  };

  const updateLeaveRecord = (id: string, leave: Partial<LeaveRecord>) => {
    const target = leaveRecords.find(l => l.id === id);
    if (!target) return;
    const updated: LeaveRecord = { ...target, ...leave };
    const nextLeaves = leaveRecords.map(l => l.id === id ? updated : l);
    setLeaveRecords(nextLeaves);
    StorageService.saveLeaveRecords(nextLeaves);
    FirestoreSyncService.saveItem('leaveRecords', updated);
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

    const nextLeaves = leaveRecords.filter(l => l.id !== id);
    const nextDeleted = [deletedRecord, ...deletedLeaveRecords.filter(l => l.id !== id)];

    setLeaveRecords(nextLeaves);
    setDeletedLeaveRecords(nextDeleted);
    StorageService.saveLeaveRecords(nextLeaves);
    StorageService.saveDeletedLeaveRecords(nextDeleted);

    FirestoreSyncService.deleteItem('leaveRecords', id);
    FirestoreSyncService.saveItem('deletedLeaveRecords', deletedRecord);

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

    const nextLeaves = [...leaveRecords, restoredRecord];
    const nextDeleted = deletedLeaveRecords.filter(l => l.id !== id);

    setLeaveRecords(nextLeaves);
    setDeletedLeaveRecords(nextDeleted);
    StorageService.saveLeaveRecords(nextLeaves);
    StorageService.saveDeletedLeaveRecords(nextDeleted);

    FirestoreSyncService.saveItem('leaveRecords', restoredRecord);
    FirestoreSyncService.deleteItem('deletedLeaveRecords', id);

    return {
      success: true,
      message: `Leave record for ${employeeName || 'employee'} (${target.leaveType}) has been successfully restored.`
    };
  };

  const permanentlyDeleteLeaveRecord = (id: string) => {
    const target = deletedLeaveRecords.find(l => l.id === id);
    const nextDeleted = deletedLeaveRecords.filter(l => l.id !== id);
    setDeletedLeaveRecords(nextDeleted);
    StorageService.saveDeletedLeaveRecords(nextDeleted);
    FirestoreSyncService.deleteItem('deletedLeaveRecords', id);

    return {
      success: true,
      message: `Leave record ${target ? `(${target.leaveType})` : ''} permanently purged from system archive.`
    };
  };

  // System Reset
  const resetSystemData = () => {
    StorageService.resetToDefault();
    const freshEmployees = StorageService.getEmployees();
    const freshSchools = StorageService.getSchools();
    const freshPromos = StorageService.getPromotions();
    const freshAssignments = StorageService.getSchoolAssignments();
    const freshSOs = StorageService.getSpecialOrders();
    const freshEarned = StorageService.getEarnedCredits();
    const freshUsed = StorageService.getUsedCredits();
    const freshLeaves = StorageService.getLeaveRecords();

    setEmployees(freshEmployees);
    setDeletedEmployees([]);
    setSchools(freshSchools);
    setDeletedSchools([]);
    setDeletedLeaveRecords([]);
    setDeletedSpecialOrders([]);
    setSpecialOrders(freshSOs);
    setEarnedCredits(freshEarned);
    setUsedCredits(freshUsed);
    setPromotions(freshPromos);
    setSchoolAssignments(freshAssignments);
    setLeaveRecords(freshLeaves);

    // Sync to Firestore
    FirestoreSyncService.batchSaveItems('employees', freshEmployees);
    FirestoreSyncService.batchSaveItems('schools', freshSchools);
    FirestoreSyncService.batchSaveItems('promotions', freshPromos);
    FirestoreSyncService.batchSaveItems('schoolAssignments', freshAssignments);
    FirestoreSyncService.batchSaveItems('specialOrders', freshSOs);
    FirestoreSyncService.batchSaveItems('serviceCreditsEarned', freshEarned);
    FirestoreSyncService.batchSaveItems('serviceCreditsUsed', freshUsed);
    FirestoreSyncService.batchSaveItems('leaveRecords', freshLeaves);
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
    const newPromosToBatch: PromotionRecord[] = [];

    newEmps.forEach(imp => {
      const empNum = imp.employeeNumber.trim();
      const existingIdx = updatedEmployeeList.findIndex(e => e.employeeNumber.trim().toLowerCase() === empNum.toLowerCase());

      if (existingIdx >= 0) {
        const resolution = resolutions[empNum] || 'SKIP';
        if (resolution === 'UPDATE') {
          const updatedRecord = {
            ...updatedEmployeeList[existingIdx],
            ...imp,
            id: updatedEmployeeList[existingIdx].id,
            updatedAt: now
          };
          updatedEmployeeList[existingIdx] = updatedRecord;
          updated++;
        } else if (resolution === 'KEEP_BOTH') {
          const newId = `emp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
          const newRecord = {
            ...imp,
            id: newId,
            employeeNumber: `${empNum}-DUP`,
            createdAt: now,
            updatedAt: now
          };
          updatedEmployeeList.push(newRecord);
          newPromosToBatch.push({
            id: `prm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            employeeId: newId,
            position: newRecord.currentPosition || 'Teacher I',
            itemNumber: newRecord.itemNumber || '',
            appointmentDate: newRecord.dateOfLatestAppointment || now.split('T')[0],
            appointmentPaperUrl: newRecord.appointmentDocumentUrl || '',
            remarks: 'Initial Appointment from Import',
            createdAt: now
          });
          added++;
        } else {
          skipped++;
        }
      } else {
        const newId = `emp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        const newRecord = {
          ...imp,
          id: newId,
          createdAt: now,
          updatedAt: now
        };
        updatedEmployeeList.push(newRecord);
        newPromosToBatch.push({
          id: `prm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          employeeId: newId,
          position: newRecord.currentPosition || 'Teacher I',
          itemNumber: newRecord.itemNumber || '',
          appointmentDate: newRecord.dateOfLatestAppointment || now.split('T')[0],
          appointmentPaperUrl: newRecord.appointmentDocumentUrl || '',
          remarks: 'Initial Appointment from Import',
          createdAt: now
        });
        added++;
      }
    });

    setEmployees(updatedEmployeeList);
    StorageService.saveEmployees(updatedEmployeeList);
    FirestoreSyncService.batchSaveItems('employees', updatedEmployeeList);

    if (newPromosToBatch.length > 0) {
      const nextPromos = [...promotions, ...newPromosToBatch];
      setPromotions(nextPromos);
      StorageService.savePromotions(nextPromos);
      FirestoreSyncService.batchSaveItems('promotions', newPromosToBatch);
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
