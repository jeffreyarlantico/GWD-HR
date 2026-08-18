import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDocs, 
  onSnapshot, 
  writeBatch,
  Unsubscribe
} from 'firebase/firestore';
import { db, ensureFirebaseAuth, handleFirestoreError, OperationType } from './firebase';
import { sanitizeDocumentForFirestore } from '../utils/imageCompressor';
import { 
  Employee, 
  School, 
  SpecialOrder, 
  ServiceCreditEarned, 
  ServiceCreditUsed, 
  LeaveRecord, 
  PromotionRecord, 
  SchoolAssignmentRecord, 
  DeletedEmployee, 
  DeletedSchool,
  DeletedLeaveRecord,
  DeletedSpecialOrder
} from '../types';

export class FirestoreSyncService {
  
  // ==========================================
  // SYNC RECORD HELPERS
  // ==========================================

  public static async saveEmployee(employee: Employee): Promise<void> {
    await ensureFirebaseAuth();
    const cleanEmp = sanitizeDocumentForFirestore(employee);
    const path = `employees/${cleanEmp.id}`;
    try {
      await setDoc(doc(db, 'employees', cleanEmp.id), cleanEmp);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  public static async deleteEmployee(employeeId: string): Promise<void> {
    await ensureFirebaseAuth();
    const path = `employees/${employeeId}`;
    try {
      await deleteDoc(doc(db, 'employees', employeeId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }

  public static async saveSchool(school: School): Promise<void> {
    await ensureFirebaseAuth();
    const cleanSchool = sanitizeDocumentForFirestore(school);
    const path = `schools/${cleanSchool.id}`;
    try {
      await setDoc(doc(db, 'schools', cleanSchool.id), cleanSchool);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  public static async deleteSchool(schoolId: string): Promise<void> {
    await ensureFirebaseAuth();
    const path = `schools/${schoolId}`;
    try {
      await deleteDoc(doc(db, 'schools', schoolId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }

  public static async saveSpecialOrder(so: SpecialOrder): Promise<void> {
    await ensureFirebaseAuth();
    const cleanSo = sanitizeDocumentForFirestore(so);
    const path = `specialOrders/${cleanSo.id}`;
    try {
      await setDoc(doc(db, 'specialOrders', cleanSo.id), cleanSo);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  public static async deleteSpecialOrder(soId: string): Promise<void> {
    await ensureFirebaseAuth();
    const path = `specialOrders/${soId}`;
    try {
      await deleteDoc(doc(db, 'specialOrders', soId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }

  public static async saveEarnedCredit(credit: ServiceCreditEarned): Promise<void> {
    await ensureFirebaseAuth();
    const clean = sanitizeDocumentForFirestore(credit);
    const path = `earnedCredits/${clean.id}`;
    try {
      await setDoc(doc(db, 'earnedCredits', clean.id), clean);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  public static async deleteEarnedCredit(creditId: string): Promise<void> {
    await ensureFirebaseAuth();
    const path = `earnedCredits/${creditId}`;
    try {
      await deleteDoc(doc(db, 'earnedCredits', creditId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }

  public static async saveUsedCredit(credit: ServiceCreditUsed): Promise<void> {
    await ensureFirebaseAuth();
    const clean = sanitizeDocumentForFirestore(credit);
    const path = `usedCredits/${clean.id}`;
    try {
      await setDoc(doc(db, 'usedCredits', clean.id), clean);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  public static async deleteUsedCredit(creditId: string): Promise<void> {
    await ensureFirebaseAuth();
    const path = `usedCredits/${creditId}`;
    try {
      await deleteDoc(doc(db, 'usedCredits', creditId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }

  public static async saveLeaveRecord(leave: LeaveRecord): Promise<void> {
    await ensureFirebaseAuth();
    const clean = sanitizeDocumentForFirestore(leave);
    const path = `leaveRecords/${clean.id}`;
    try {
      await setDoc(doc(db, 'leaveRecords', clean.id), clean);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  public static async deleteLeaveRecord(leaveId: string): Promise<void> {
    await ensureFirebaseAuth();
    const path = `leaveRecords/${leaveId}`;
    try {
      await deleteDoc(doc(db, 'leaveRecords', leaveId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }

  public static async savePromotion(promo: PromotionRecord): Promise<void> {
    await ensureFirebaseAuth();
    const clean = sanitizeDocumentForFirestore(promo);
    const path = `promotions/${clean.id}`;
    try {
      await setDoc(doc(db, 'promotions', clean.id), clean);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  public static async saveSchoolAssignment(assignment: SchoolAssignmentRecord): Promise<void> {
    await ensureFirebaseAuth();
    const clean = sanitizeDocumentForFirestore(assignment);
    const path = `schoolAssignments/${clean.id}`;
    try {
      await setDoc(doc(db, 'schoolAssignments', clean.id), clean);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  public static async saveDeletedRecord(deleted: any): Promise<void> {
    await ensureFirebaseAuth();
    const clean = sanitizeDocumentForFirestore(deleted);
    const path = `deletedRecords/${clean.id}`;
    try {
      await setDoc(doc(db, 'deletedRecords', clean.id), clean);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  public static async deleteDeletedRecord(id: string): Promise<void> {
    await ensureFirebaseAuth();
    const path = `deletedRecords/${id}`;
    try {
      await deleteDoc(doc(db, 'deletedRecords', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }

  public static async saveDocument(collectionName: string, id: string, data: any): Promise<void> {
    await ensureFirebaseAuth();
    const clean = sanitizeDocumentForFirestore(data);
    const path = `${collectionName}/${id}`;
    try {
      await setDoc(doc(db, collectionName, id), clean);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  public static async deleteDocument(collectionName: string, id: string): Promise<void> {
    await ensureFirebaseAuth();
    const path = `${collectionName}/${id}`;
    try {
      await deleteDoc(doc(db, collectionName, id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }

  // ==========================================
  // BATCH FULL SYNC TO FIRESTORE
  // ==========================================

  public static async syncFullDatasetToFirestore(dataset: {
    employees: Employee[];
    schools: School[];
    specialOrders: SpecialOrder[];
    earnedCredits: ServiceCreditEarned[];
    usedCredits: ServiceCreditUsed[];
    leaveRecords: LeaveRecord[];
    promotions: PromotionRecord[];
    schoolAssignments: SchoolAssignmentRecord[];
    deletedEmployees?: DeletedEmployee[];
    deletedSchools?: DeletedSchool[];
    deletedLeaves?: DeletedLeaveRecord[];
    deletedSpecialOrders?: DeletedSpecialOrder[];
  }): Promise<{ syncedCount: number }> {
    await ensureFirebaseAuth();
    let synced = 0;
    
    const items: Array<{ col: string; id: string; data: any }> = [];

    dataset.employees?.forEach(e => items.push({ col: 'employees', id: e.id, data: sanitizeDocumentForFirestore(e) }));
    dataset.schools?.forEach(s => items.push({ col: 'schools', id: s.id, data: sanitizeDocumentForFirestore(s) }));
    dataset.specialOrders?.forEach(so => items.push({ col: 'specialOrders', id: so.id, data: sanitizeDocumentForFirestore(so) }));
    dataset.earnedCredits?.forEach(ec => items.push({ col: 'earnedCredits', id: ec.id, data: sanitizeDocumentForFirestore(ec) }));
    dataset.usedCredits?.forEach(uc => items.push({ col: 'usedCredits', id: uc.id, data: sanitizeDocumentForFirestore(uc) }));
    dataset.leaveRecords?.forEach(lr => items.push({ col: 'leaveRecords', id: lr.id, data: sanitizeDocumentForFirestore(lr) }));
    dataset.promotions?.forEach(p => items.push({ col: 'promotions', id: p.id, data: sanitizeDocumentForFirestore(p) }));
    dataset.schoolAssignments?.forEach(sa => items.push({ col: 'schoolAssignments', id: sa.id, data: sanitizeDocumentForFirestore(sa) }));
    
    dataset.deletedEmployees?.forEach(de => items.push({ col: 'deletedRecords', id: de.id, data: sanitizeDocumentForFirestore({ ...de, recordType: 'EMPLOYEE' }) }));
    dataset.deletedSchools?.forEach(ds => items.push({ col: 'deletedRecords', id: ds.id, data: sanitizeDocumentForFirestore({ ...ds, recordType: 'SCHOOL' }) }));
    dataset.deletedLeaves?.forEach(dl => items.push({ col: 'deletedRecords', id: dl.id, data: sanitizeDocumentForFirestore({ ...dl, recordType: 'LEAVE_RECORD' }) }));
    dataset.deletedSpecialOrders?.forEach(dso => items.push({ col: 'deletedRecords', id: dso.id, data: sanitizeDocumentForFirestore({ ...dso, recordType: 'SPECIAL_ORDER' }) }));

    const CHUNK_SIZE = 250;
    for (let i = 0; i < items.length; i += CHUNK_SIZE) {
      const chunk = items.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);
      chunk.forEach(item => {
        batch.set(doc(db, item.col, item.id), item.data);
      });
      try {
        await batch.commit();
        synced += chunk.length;
      } catch (error) {
        console.error(`Batch sync error at chunk ${i}:`, error);
        // Fallback: write individually so valid items still sync
        for (const item of chunk) {
          try {
            await setDoc(doc(db, item.col, item.id), item.data);
            synced += 1;
          } catch (itemErr) {
            console.warn(`Could not sync item ${item.col}/${item.id}:`, itemErr);
          }
        }
      }
    }

    return { syncedCount: synced };
  }

  // ==========================================
  // FETCH ALL FROM FIRESTORE
  // ==========================================

  public static async fetchAllFromFirestore(): Promise<{
    employees: Employee[];
    schools: School[];
    specialOrders: SpecialOrder[];
    earnedCredits: ServiceCreditEarned[];
    usedCredits: ServiceCreditUsed[];
    leaveRecords: LeaveRecord[];
    promotions: PromotionRecord[];
    schoolAssignments: SchoolAssignmentRecord[];
    deletedRecords: any[];
  } | null> {
    try {
      await ensureFirebaseAuth();
      const [
        empSnap, 
        schoolSnap, 
        soSnap, 
        earnedSnap, 
        usedSnap, 
        leaveSnap, 
        promoSnap, 
        assignSnap,
        deletedSnap
      ] = await Promise.all([
        getDocs(collection(db, 'employees')),
        getDocs(collection(db, 'schools')),
        getDocs(collection(db, 'specialOrders')),
        getDocs(collection(db, 'earnedCredits')),
        getDocs(collection(db, 'usedCredits')),
        getDocs(collection(db, 'leaveRecords')),
        getDocs(collection(db, 'promotions')),
        getDocs(collection(db, 'schoolAssignments')),
        getDocs(collection(db, 'deletedRecords'))
      ]);

      const employees = empSnap.docs.map(d => d.data() as Employee);
      const schools = schoolSnap.docs.map(d => d.data() as School);
      const specialOrders = soSnap.docs.map(d => d.data() as SpecialOrder);
      const earnedCredits = earnedSnap.docs.map(d => d.data() as ServiceCreditEarned);
      const usedCredits = usedSnap.docs.map(d => d.data() as ServiceCreditUsed);
      const leaveRecords = leaveSnap.docs.map(d => d.data() as LeaveRecord);
      const promotions = promoSnap.docs.map(d => d.data() as PromotionRecord);
      const schoolAssignments = assignSnap.docs.map(d => d.data() as SchoolAssignmentRecord);
      const deletedRecords = deletedSnap.docs.map(d => d.data());

      return {
        employees,
        schools,
        specialOrders,
        earnedCredits,
        usedCredits,
        leaveRecords,
        promotions,
        schoolAssignments,
        deletedRecords
      };
    } catch (error) {
      console.warn('Firestore fetch all returned error:', error);
      return null;
    }
  }

  // ==========================================
  // REAL-TIME MULTI-DEVICE SUBSCRIBER
  // ==========================================

  public static subscribeToRealtimeUpdates(callbacks: {
    onEmployees?: (employees: Employee[]) => void;
    onSchools?: (schools: School[]) => void;
    onSpecialOrders?: (orders: SpecialOrder[]) => void;
    onEarnedCredits?: (credits: ServiceCreditEarned[]) => void;
    onUsedCredits?: (credits: ServiceCreditUsed[]) => void;
    onLeaveRecords?: (leaves: LeaveRecord[]) => void;
    onPromotions?: (promos: PromotionRecord[]) => void;
    onAssignments?: (assigns: SchoolAssignmentRecord[]) => void;
  }): Unsubscribe {
    const unsubs: Unsubscribe[] = [];

    ensureFirebaseAuth().then(() => {
      if (callbacks.onEmployees) {
        unsubs.push(onSnapshot(collection(db, 'employees'), (snap) => {
          if (!snap.empty || snap.docs.length > 0) {
            callbacks.onEmployees!(snap.docs.map(d => d.data() as Employee));
          }
        }, (err) => console.warn('Employees listener error:', err)));
      }

      if (callbacks.onSchools) {
        unsubs.push(onSnapshot(collection(db, 'schools'), (snap) => {
          if (!snap.empty || snap.docs.length > 0) {
            callbacks.onSchools!(snap.docs.map(d => d.data() as School));
          }
        }, (err) => console.warn('Schools listener error:', err)));
      }

      if (callbacks.onSpecialOrders) {
        unsubs.push(onSnapshot(collection(db, 'specialOrders'), (snap) => {
          callbacks.onSpecialOrders!(snap.docs.map(d => d.data() as SpecialOrder));
        }, (err) => console.warn('SpecialOrders listener error:', err)));
      }

      if (callbacks.onEarnedCredits) {
        unsubs.push(onSnapshot(collection(db, 'earnedCredits'), (snap) => {
          callbacks.onEarnedCredits!(snap.docs.map(d => d.data() as ServiceCreditEarned));
        }, (err) => console.warn('EarnedCredits listener error:', err)));
      }

      if (callbacks.onUsedCredits) {
        unsubs.push(onSnapshot(collection(db, 'usedCredits'), (snap) => {
          callbacks.onUsedCredits!(snap.docs.map(d => d.data() as ServiceCreditUsed));
        }, (err) => console.warn('UsedCredits listener error:', err)));
      }

      if (callbacks.onLeaveRecords) {
        unsubs.push(onSnapshot(collection(db, 'leaveRecords'), (snap) => {
          callbacks.onLeaveRecords!(snap.docs.map(d => d.data() as LeaveRecord));
        }, (err) => console.warn('LeaveRecords listener error:', err)));
      }

      if (callbacks.onPromotions) {
        unsubs.push(onSnapshot(collection(db, 'promotions'), (snap) => {
          callbacks.onPromotions!(snap.docs.map(d => d.data() as PromotionRecord));
        }, (err) => console.warn('Promotions listener error:', err)));
      }

      if (callbacks.onAssignments) {
        unsubs.push(onSnapshot(collection(db, 'schoolAssignments'), (snap) => {
          callbacks.onAssignments!(snap.docs.map(d => d.data() as SchoolAssignmentRecord));
        }, (err) => console.warn('Assignments listener error:', err)));
      }
    });

    return () => {
      unsubs.forEach(unsub => {
        try { unsub(); } catch (e) {}
      });
    };
  }
}
