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

export class FirestoreSyncService {
  /**
   * Fetch all documents from a Firestore collection asynchronously
   */
  public static async fetchCollection<T extends { id: string }>(collectionName: string): Promise<T[]> {
    try {
      const colRef = collection(db, collectionName);
      const snapshot = await getDocs(colRef);
      const items: T[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as T);
      });
      return items;
    } catch (error) {
      console.error(`[Firebase] Failed to fetch collection "${collectionName}":`, error);
      handleFirestoreError(error, OperationType.GET, collectionName);
    }
  }

  /**
   * Real-time subscription to a Firestore collection with error callback
   */
  public static subscribeToCollection<T extends { id: string }>(
    collectionName: string,
    onData: (items: T[]) => void,
    onError?: (error: unknown) => void
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
        console.error(`[Firebase] onSnapshot error on collection "${collectionName}":`, error);
        if (onError) {
          onError(error);
        }
        handleFirestoreError(error, OperationType.GET, collectionName);
      }
    );
    return unsubscribe;
  }

  /**
   * Save / overwrite a single document in Firestore
   */
  public static async saveItem<T extends { id: string }>(collectionName: string, item: T): Promise<void> {
    const path = `${collectionName}/${item.id}`;
    try {
      await setDoc(doc(db, collectionName, item.id), item);
      console.info(`[Firebase] Document successfully written to ${path}`);
    } catch (error) {
      console.error(`[Firebase] Write failed on ${path}:`, error);
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  /**
   * Delete a single document from Firestore
   */
  public static async deleteItem(collectionName: string, id: string): Promise<void> {
    const path = `${collectionName}/${id}`;
    try {
      await deleteDoc(doc(db, collectionName, id));
      console.info(`[Firebase] Document successfully deleted from ${path}`);
    } catch (error) {
      console.error(`[Firebase] Delete failed on ${path}:`, error);
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }

  /**
   * Batch save multiple items (handles chunking for batches > 400 items)
   */
  public static async batchSaveItems<T extends { id: string }>(collectionName: string, items: T[]): Promise<void> {
    if (!items || items.length === 0) return;

    const CHUNK_SIZE = 400; // Firestore limit is 500 operations per batch
    for (let i = 0; i < items.length; i += CHUNK_SIZE) {
      const chunk = items.slice(i, i + CHUNK_SIZE);
      try {
        const batch = writeBatch(db);
        chunk.forEach((item) => {
          const ref = doc(db, collectionName, item.id);
          batch.set(ref, item);
        });
        await batch.commit();
        console.info(`[Firebase] Committed batch of ${chunk.length} items to "${collectionName}"`);
      } catch (error) {
        console.error(`[Firebase] Batch write failed for collection "${collectionName}":`, error);
        handleFirestoreError(error, OperationType.WRITE, collectionName);
      }
    }
  }

  /**
   * Check if collection is empty
   */
  public static async isCollectionEmpty(collectionName: string): Promise<boolean> {
    try {
      const snapshot = await getDocs(collection(db, collectionName));
      return snapshot.empty;
    } catch (error) {
      console.warn(`[Firebase] Could not verify collection "${collectionName}" emptiness, assuming true:`, error);
      return true;
    }
  }
}
