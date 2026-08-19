/**
 * Storage Service for Guimba West District HRIS
 * Uses LocalStorage with fallback
 */

import { INITIAL_EMPLOYEES, INITIAL_EARNED_CREDITS, INITIAL_LEAVE_RECORDS, INITIAL_PROMOTIONS, INITIAL_SCHOOL_ASSIGNMENTS, INITIAL_SCHOOLS, INITIAL_SPECIAL_ORDERS, INITIAL_USED_CREDITS } from '../data/initialData';
import { Employee, DeletedEmployee, DeletedSchool, DeletedLeaveRecord, DeletedSpecialOrder, LeaveRecord, PromotionRecord, School, SchoolAssignmentRecord, ServiceCreditEarned, ServiceCreditUsed, SpecialOrder } from '../types';

const STORAGE_KEYS = {
  EMPLOYEES: 'gw_hris_employees_v1',
  DELETED_EMPLOYEES: 'gw_hris_deleted_employees_v1',
  SCHOOLS: 'gw_hris_schools_v1',
  DELETED_SCHOOLS: 'gw_hris_deleted_schools_v1',
  PROMOTIONS: 'gw_hris_promotions_v1',
  SCHOOL_ASSIGNMENTS: 'gw_hris_school_assignments_v1',
  SPECIAL_ORDERS: 'gw_hris_special_orders_v1',
  DELETED_SPECIAL_ORDERS: 'gw_hris_deleted_special_orders_v1',
  EARNED_CREDITS: 'gw_hris_earned_credits_v1',
  USED_CREDITS: 'gw_hris_used_credits_v1',
  LEAVE_RECORDS: 'gw_hris_leave_records_v1',
  DELETED_LEAVE_RECORDS: 'gw_hris_deleted_leave_records_v1',
};

function getItem<T>(key: string, defaultValue: T): T {
  try {
    const data = localStorage.getItem(key);
    if (data === null || data === undefined) return defaultValue;
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
    if (localStorage.getItem(STORAGE_KEYS.EMPLOYEES) === null) {
      setItem(STORAGE_KEYS.EMPLOYEES, INITIAL_EMPLOYEES);
    }
    if (localStorage.getItem(STORAGE_KEYS.SCHOOLS) === null) {
      setItem(STORAGE_KEYS.SCHOOLS, INITIAL_SCHOOLS);
    }
    if (localStorage.getItem(STORAGE_KEYS.PROMOTIONS) === null) {
      setItem(STORAGE_KEYS.PROMOTIONS, INITIAL_PROMOTIONS);
    }
    if (localStorage.getItem(STORAGE_KEYS.SCHOOL_ASSIGNMENTS) === null) {
      setItem(STORAGE_KEYS.SCHOOL_ASSIGNMENTS, INITIAL_SCHOOL_ASSIGNMENTS);
    }
    if (localStorage.getItem(STORAGE_KEYS.SPECIAL_ORDERS) === null) {
      setItem(STORAGE_KEYS.SPECIAL_ORDERS, INITIAL_SPECIAL_ORDERS);
    }
    if (localStorage.getItem(STORAGE_KEYS.EARNED_CREDITS) === null) {
      setItem(STORAGE_KEYS.EARNED_CREDITS, INITIAL_EARNED_CREDITS);
    }
    if (localStorage.getItem(STORAGE_KEYS.USED_CREDITS) === null) {
      setItem(STORAGE_KEYS.USED_CREDITS, INITIAL_USED_CREDITS);
    }
    if (localStorage.getItem(STORAGE_KEYS.LEAVE_RECORDS) === null) {
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
    setItem(STORAGE_KEYS.DELETED_EMPLOYEES, []);
    setItem(STORAGE_KEYS.DELETED_SCHOOLS, []);
    setItem(STORAGE_KEYS.DELETED_LEAVE_RECORDS, []);
    setItem(STORAGE_KEYS.DELETED_SPECIAL_ORDERS, []);
  }

  // Employees
  public static getEmployees(): Employee[] {
    const data = getItem<Employee[] | null>(STORAGE_KEYS.EMPLOYEES, null);
    if (data === null) {
      setItem(STORAGE_KEYS.EMPLOYEES, INITIAL_EMPLOYEES);
      return INITIAL_EMPLOYEES;
    }
    return data;
  }

  public static saveEmployees(employees: Employee[]): void {
    setItem(STORAGE_KEYS.EMPLOYEES, employees);
  }

  // Schools
  public static getSchools(): School[] {
    const data = getItem<School[] | null>(STORAGE_KEYS.SCHOOLS, null);
    if (data === null) {
      setItem(STORAGE_KEYS.SCHOOLS, INITIAL_SCHOOLS);
      return INITIAL_SCHOOLS;
    }
    return data;
  }

  public static saveSchools(schools: School[]): void {
    setItem(STORAGE_KEYS.SCHOOLS, schools);
  }

  // Promotions
  public static getPromotions(): PromotionRecord[] {
    const data = getItem<PromotionRecord[] | null>(STORAGE_KEYS.PROMOTIONS, null);
    if (data === null) {
      setItem(STORAGE_KEYS.PROMOTIONS, INITIAL_PROMOTIONS);
      return INITIAL_PROMOTIONS;
    }
    return data;
  }

  public static savePromotions(promotions: PromotionRecord[]): void {
    setItem(STORAGE_KEYS.PROMOTIONS, promotions);
  }

  // School Assignments
  public static getSchoolAssignments(): SchoolAssignmentRecord[] {
    const data = getItem<SchoolAssignmentRecord[] | null>(STORAGE_KEYS.SCHOOL_ASSIGNMENTS, null);
    if (data === null) {
      setItem(STORAGE_KEYS.SCHOOL_ASSIGNMENTS, INITIAL_SCHOOL_ASSIGNMENTS);
      return INITIAL_SCHOOL_ASSIGNMENTS;
    }
    return data;
  }

  public static saveSchoolAssignments(assignments: SchoolAssignmentRecord[]): void {
    setItem(STORAGE_KEYS.SCHOOL_ASSIGNMENTS, assignments);
  }

  // Special Orders
  public static getSpecialOrders(): SpecialOrder[] {
    const data = getItem<SpecialOrder[] | null>(STORAGE_KEYS.SPECIAL_ORDERS, null);
    if (data === null) {
      setItem(STORAGE_KEYS.SPECIAL_ORDERS, INITIAL_SPECIAL_ORDERS);
      return INITIAL_SPECIAL_ORDERS;
    }
    return data;
  }

  public static saveSpecialOrders(specialOrders: SpecialOrder[]): void {
    setItem(STORAGE_KEYS.SPECIAL_ORDERS, specialOrders);
  }

  // Earned Credits
  public static getEarnedCredits(): ServiceCreditEarned[] {
    const data = getItem<ServiceCreditEarned[] | null>(STORAGE_KEYS.EARNED_CREDITS, null);
    if (data === null) {
      setItem(STORAGE_KEYS.EARNED_CREDITS, INITIAL_EARNED_CREDITS);
      return INITIAL_EARNED_CREDITS;
    }
    return data;
  }

  public static saveEarnedCredits(credits: ServiceCreditEarned[]): void {
    setItem(STORAGE_KEYS.EARNED_CREDITS, credits);
  }

  // Used Credits
  public static getUsedCredits(): ServiceCreditUsed[] {
    const data = getItem<ServiceCreditUsed[] | null>(STORAGE_KEYS.USED_CREDITS, null);
    if (data === null) {
      setItem(STORAGE_KEYS.USED_CREDITS, INITIAL_USED_CREDITS);
      return INITIAL_USED_CREDITS;
    }
    return data;
  }

  public static saveUsedCredits(credits: ServiceCreditUsed[]): void {
    setItem(STORAGE_KEYS.USED_CREDITS, credits);
  }

  // Leave Records
  public static getLeaveRecords(): LeaveRecord[] {
    const data = getItem<LeaveRecord[] | null>(STORAGE_KEYS.LEAVE_RECORDS, null);
    if (data === null) {
      setItem(STORAGE_KEYS.LEAVE_RECORDS, INITIAL_LEAVE_RECORDS);
      return INITIAL_LEAVE_RECORDS;
    }
    return data;
  }

  public static saveLeaveRecords(records: LeaveRecord[]): void {
    setItem(STORAGE_KEYS.LEAVE_RECORDS, records);
  }

  // Deleted Employees (Trash / Archive)
  public static getDeletedEmployees(): DeletedEmployee[] {
    return getItem<DeletedEmployee[]>(STORAGE_KEYS.DELETED_EMPLOYEES, []);
  }

  public static saveDeletedEmployees(employees: DeletedEmployee[]): void {
    setItem(STORAGE_KEYS.DELETED_EMPLOYEES, employees);
  }

  // Deleted Schools (Trash / Archive)
  public static getDeletedSchools(): DeletedSchool[] {
    return getItem<DeletedSchool[]>(STORAGE_KEYS.DELETED_SCHOOLS, []);
  }

  public static saveDeletedSchools(schools: DeletedSchool[]): void {
    setItem(STORAGE_KEYS.DELETED_SCHOOLS, schools);
  }

  // Deleted Leave Records (Trash / Archive)
  public static getDeletedLeaveRecords(): DeletedLeaveRecord[] {
    return getItem<DeletedLeaveRecord[]>(STORAGE_KEYS.DELETED_LEAVE_RECORDS, []);
  }

  public static saveDeletedLeaveRecords(records: DeletedLeaveRecord[]): void {
    setItem(STORAGE_KEYS.DELETED_LEAVE_RECORDS, records);
  }

  // Deleted Special Orders (Trash / Archive)
  public static getDeletedSpecialOrders(): DeletedSpecialOrder[] {
    return getItem<DeletedSpecialOrder[]>(STORAGE_KEYS.DELETED_SPECIAL_ORDERS, []);
  }

  public static saveDeletedSpecialOrders(orders: DeletedSpecialOrder[]): void {
    setItem(STORAGE_KEYS.DELETED_SPECIAL_ORDERS, orders);
  }
}
