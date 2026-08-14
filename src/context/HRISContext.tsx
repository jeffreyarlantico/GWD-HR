import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { StorageService } from '../services/storageService';
import { 
  Employee, EmployeeFull, School, SpecialOrder, ServiceCreditEarned, 
  ServiceCreditUsed, PromotionRecord, SchoolAssignmentRecord, LeaveRecord,
  BirthdayUpcoming
} from '../types';

interface HRISContextType {
  employees: Employee[];
  schools: School[];
  specialOrders: SpecialOrder[];
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
  getEmployeeFull: (id: string) => EmployeeFull | null;
  getEmployeeByNumber: (empNum: string) => Employee | null;

  // Actions - Schools
  addSchool: (name: string) => { success: boolean; message: string };
  updateSchool: (id: string, name: string, status: 'Active' | 'Inactive') => { success: boolean; message: string };
  
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
  deleteLeaveRecord: (id: string) => void;

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
  const [schools, setSchools] = useState<School[]>(() => StorageService.getSchools());
  const [specialOrders, setSpecialOrders] = useState<SpecialOrder[]>(() => StorageService.getSpecialOrders());
  const [earnedCredits, setEarnedCredits] = useState<ServiceCreditEarned[]>(() => StorageService.getEarnedCredits());
  const [usedCredits, setUsedCredits] = useState<ServiceCreditUsed[]>(() => StorageService.getUsedCredits());
  const [promotions, setPromotions] = useState<PromotionRecord[]>(() => StorageService.getPromotions());
  const [schoolAssignments, setSchoolAssignments] = useState<SchoolAssignmentRecord[]>(() => StorageService.getSchoolAssignments());
  const [leaveRecords, setLeaveRecords] = useState<LeaveRecord[]>(() => StorageService.getLeaveRecords());

  // Sync to Storage
  useEffect(() => StorageService.saveEmployees(employees), [employees]);
  useEffect(() => StorageService.saveSchools(schools), [schools]);
  useEffect(() => StorageService.saveSpecialOrders(specialOrders), [specialOrders]);
  useEffect(() => StorageService.saveEarnedCredits(earnedCredits), [earnedCredits]);
  useEffect(() => StorageService.saveUsedCredits(usedCredits), [usedCredits]);
  useEffect(() => StorageService.savePromotions(promotions), [promotions]);
  useEffect(() => StorageService.saveSchoolAssignments(schoolAssignments), [schoolAssignments]);
  useEffect(() => StorageService.saveLeaveRecords(leaveRecords), [leaveRecords]);

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

  const deleteLeaveRecord = (id: string) => {
    setLeaveRecords(prev => prev.filter(l => l.id !== id));
  };

  // System Reset
  const resetSystemData = () => {
    StorageService.resetToDefault();
    setEmployees(StorageService.getEmployees());
    setSchools(StorageService.getSchools());
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
        schools,
        specialOrders,
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
        getEmployeeFull,
        getEmployeeByNumber,

        addSchool,
        updateSchool,

        addPromotion,
        updatePromotion,
        deletePromotion,

        addSchoolAssignment,
        updateSchoolAssignment,
        deleteSchoolAssignment,

        addSpecialOrder,
        updateSpecialOrder,
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
