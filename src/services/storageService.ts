/**
 * Storage Service for Guimba West District HRIS
 * Uses LocalStorage with fallback & IndexedDB ready structure
 */

import { INITIAL_EMPLOYEES, INITIAL_EARNED_CREDITS, INITIAL_LEAVE_RECORDS, INITIAL_PROMOTIONS, INITIAL_SCHOOL_ASSIGNMENTS, INITIAL_SCHOOLS, INITIAL_SPECIAL_ORDERS, INITIAL_USED_CREDITS } from '../data/initialData';
import { Employee, LeaveRecord, PromotionRecord, School, SchoolAssignmentRecord, ServiceCreditEarned, ServiceCreditUsed, SpecialOrder } from '../types';

const STORAGE_KEYS = {
  EMPLOYEES: 'gw_hris_employees_v1',
  SCHOOLS: 'gw_hris_schools_v1',
  PROMOTIONS: 'gw_hris_promotions_v1',
  SCHOOL_ASSIGNMENTS: 'gw_hris_school_assignments_v1',
  SPECIAL_ORDERS: 'gw_hris_special_orders_v1',
  EARNED_CREDITS: 'gw_hris_earned_credits_v1',
  USED_CREDITS: 'gw_hris_used_credits_v1',
  LEAVE_RECORDS: 'gw_hris_leave_records_v1',
};

function getItem<T>(key: string, defaultValue: T): T {
  try {
    const data = localStorage.getItem(key);
    if (!data) return defaultValue;
    return JSON.parse(data) as T;
  } catch (err) {
    console.error(`Error reading ${key} from storage:`, err);
    return defaultValue;
  }
}

function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error writing ${key} to storage:`, err);
  }
}

export class StorageService {
  public static initStorage(): void {
    if (!localStorage.getItem(STORAGE_KEYS.EMPLOYEES)) {
      setItem(STORAGE_KEYS.EMPLOYEES, INITIAL_EMPLOYEES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.SCHOOLS)) {
      setItem(STORAGE_KEYS.SCHOOLS, INITIAL_SCHOOLS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.PROMOTIONS)) {
      setItem(STORAGE_KEYS.PROMOTIONS, INITIAL_PROMOTIONS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.SCHOOL_ASSIGNMENTS)) {
      setItem(STORAGE_KEYS.SCHOOL_ASSIGNMENTS, INITIAL_SCHOOL_ASSIGNMENTS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.SPECIAL_ORDERS)) {
      setItem(STORAGE_KEYS.SPECIAL_ORDERS, INITIAL_SPECIAL_ORDERS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.EARNED_CREDITS)) {
      setItem(STORAGE_KEYS.EARNED_CREDITS, INITIAL_EARNED_CREDITS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.USED_CREDITS)) {
      setItem(STORAGE_KEYS.USED_CREDITS, INITIAL_USED_CREDITS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.LEAVE_RECORDS)) {
      setItem(STORAGE_KEYS.LEAVE_RECORDS, INITIAL_LEAVE_RECORDS);
    }
  }

  public static resetToDefault(): void {
    setItem(STORAGE_KEYS.EMPLOYEES, INITIAL_EMPLOYEES);
    setItem(STORAGE_KEYS.SCHOOLS, INITIAL_SCHOOLS);
    setItem(STORAGE_KEYS.PROMOTIONS, INITIAL_PROMOTIONS);
    setItem(STORAGE_KEYS.SCHOOL_ASSIGNMENTS, INITIAL_SCHOOL_ASSIGNMENTS);
    setItem(STORAGE_KEYS.SPECIAL_ORDERS, INITIAL_SPECIAL_ORDERS);
    setItem(STORAGE_KEYS.EARNED_CREDITS, INITIAL_EARNED_CREDITS);
    setItem(STORAGE_KEYS.USED_CREDITS, INITIAL_USED_CREDITS);
    setItem(STORAGE_KEYS.LEAVE_RECORDS, INITIAL_LEAVE_RECORDS);
  }

  // Employees
  public static getEmployees(): Employee[] {
    return getItem<Employee[]>(STORAGE_KEYS.EMPLOYEES, []);
  }

  public static saveEmployees(employees: Employee[]): void {
    setItem(STORAGE_KEYS.EMPLOYEES, employees);
  }

  // Schools
  public static getSchools(): School[] {
    return getItem<School[]>(STORAGE_KEYS.SCHOOLS, []);
  }

  public static saveSchools(schools: School[]): void {
    setItem(STORAGE_KEYS.SCHOOLS, schools);
  }

  // Promotions
  public static getPromotions(): PromotionRecord[] {
    return getItem<PromotionRecord[]>(STORAGE_KEYS.PROMOTIONS, []);
  }

  public static savePromotions(promotions: PromotionRecord[]): void {
    setItem(STORAGE_KEYS.PROMOTIONS, promotions);
  }

  // School Assignments
  public static getSchoolAssignments(): SchoolAssignmentRecord[] {
    return getItem<SchoolAssignmentRecord[]>(STORAGE_KEYS.SCHOOL_ASSIGNMENTS, []);
  }

  public static saveSchoolAssignments(assignments: SchoolAssignmentRecord[]): void {
    setItem(STORAGE_KEYS.SCHOOL_ASSIGNMENTS, assignments);
  }

  // Special Orders
  public static getSpecialOrders(): SpecialOrder[] {
    return getItem<SpecialOrder[]>(STORAGE_KEYS.SPECIAL_ORDERS, []);
  }

  public static saveSpecialOrders(specialOrders: SpecialOrder[]): void {
    setItem(STORAGE_KEYS.SPECIAL_ORDERS, specialOrders);
  }

  // Earned Credits
  public static getEarnedCredits(): ServiceCreditEarned[] {
    return getItem<ServiceCreditEarned[]>(STORAGE_KEYS.EARNED_CREDITS, []);
  }

  public static saveEarnedCredits(credits: ServiceCreditEarned[]): void {
    setItem(STORAGE_KEYS.EARNED_CREDITS, credits);
  }

  // Used Credits
  public static getUsedCredits(): ServiceCreditUsed[] {
    return getItem<ServiceCreditUsed[]>(STORAGE_KEYS.USED_CREDITS, []);
  }

  public static saveUsedCredits(credits: ServiceCreditUsed[]): void {
    setItem(STORAGE_KEYS.USED_CREDITS, credits);
  }

  // Leave Records
  public static getLeaveRecords(): LeaveRecord[] {
    return getItem<LeaveRecord[]>(STORAGE_KEYS.LEAVE_RECORDS, []);
  }

  public static saveLeaveRecords(records: LeaveRecord[]): void {
    setItem(STORAGE_KEYS.LEAVE_RECORDS, records);
  }
}
