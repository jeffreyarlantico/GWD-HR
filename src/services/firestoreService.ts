import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import {
  Employee,
  School,
  PromotionRecord,
  SchoolAssignmentRecord,
  SpecialOrder,
  ServiceCreditEarned,
  ServiceCreditUsed,
  LeaveRecord,
  DeletedEmployee,
  DeletedSchool,
  DeletedSpecialOrder,
  DeletedLeaveRecord
} from '../types';

export class FirestoreSyncService {
  // Generic collection listener
  public static subscribeToCollection<T extends { id: string }>(
    collectionName: string,
    onData: (items: T[]) => void
  ): () => void {
    const colRef = collection(db, collectionName);
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        const items: T[] = [];
        snapshot.forEach((d) => {
          items.push(d.data() as T);
        });
        onData(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, collectionName);
      }
    );
    return unsubscribe;
  }

  // Save single item
  public static async saveItem<T extends { id: string }>(collectionName: string, item: T): Promise<void> {
    const path = `${collectionName}/${item.id}`;
    try {
      await setDoc(doc(db, collectionName, item.id), item);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  // Delete single item
  public static async deleteItem(collectionName: string, id: string): Promise<void> {
    const path = `${collectionName}/${id}`;
    try {
      await deleteDoc(doc(db, collectionName, id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }

  // Batch save multiple items (useful during seed or bulk updates)
  public static async batchSaveItems<T extends { id: string }>(collectionName: string, items: T[]): Promise<void> {
    try {
      const batch = writeBatch(db);
      items.forEach((item) => {
        const ref = doc(db, collectionName, item.id);
        batch.set(ref, item);
      });
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, collectionName);
    }
  }

  // Check if collection is empty
  public static async isCollectionEmpty(collectionName: string): Promise<boolean> {
    try {
      const snapshot = await getDocs(collection(db, collectionName));
      return snapshot.empty;
    } catch (error) {
      console.warn(`[Firebase] Could not check collection ${collectionName}, assuming fallback to local.`, error);
      return true;
    }
  }
}
