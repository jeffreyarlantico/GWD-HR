import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';

/**
 * Sanitizes object by removing undefined keys because Firestore rejects undefined values.
 */
export function sanitizeForFirestore<T>(data: T): Record<string, unknown> {
  const clean: Record<string, unknown> = {};
  if (!data || typeof data !== 'object') return clean;

  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    if (value !== undefined) {
      if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        clean[key] = sanitizeForFirestore(value);
      } else {
        clean[key] = value;
      }
    }
  }
  return clean;
}

export class FirestoreSyncService {
  // Generic collection listener
  public static subscribeToCollection<T extends { id: string }>(
    collectionName: string,
    onData: (items: T[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    try {
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
          console.warn(`[Firestore] Subscription warning for ${collectionName}:`, error.message);
          if (onError) onError(error);
        }
      );
      return unsubscribe;
    } catch (err) {
      console.warn(`[Firestore] Failed to subscribe to ${collectionName}:`, err);
      return () => {};
    }
  }

  // Save single item
  public static async saveItem<T extends { id: string }>(collectionName: string, item: T): Promise<void> {
    try {
      const cleanData = sanitizeForFirestore(item);
      await setDoc(doc(db, collectionName, item.id), cleanData);
    } catch (error) {
      console.error(`[Firestore] Error saving item to ${collectionName}/${item.id}:`, error);
    }
  }

  // Delete single item
  public static async deleteItem(collectionName: string, id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, collectionName, id));
    } catch (error) {
      console.error(`[Firestore] Error deleting item from ${collectionName}/${id}:`, error);
    }
  }

  // Batch save multiple items (useful during seed, import or bulk updates)
  public static async batchSaveItems<T extends { id: string }>(collectionName: string, items: T[]): Promise<void> {
    if (!items || items.length === 0) return;
    try {
      // Firestore batch limit is 500 operations
      const chunkSize = 400;
      for (let i = 0; i < items.length; i += chunkSize) {
        const chunk = items.slice(i, i + chunkSize);
        const batch = writeBatch(db);
        chunk.forEach((item) => {
          const ref = doc(db, collectionName, item.id);
          const cleanData = sanitizeForFirestore(item);
          batch.set(ref, cleanData);
        });
        await batch.commit();
      }
    } catch (error) {
      console.error(`[Firestore] Error batch saving to ${collectionName}:`, error);
    }
  }

  // Batch delete items
  public static async batchDeleteItems(collectionName: string, ids: string[]): Promise<void> {
    if (!ids || ids.length === 0) return;
    try {
      const chunkSize = 400;
      for (let i = 0; i < ids.length; i += chunkSize) {
        const chunk = ids.slice(i, i + chunkSize);
        const batch = writeBatch(db);
        chunk.forEach((id) => {
          const ref = doc(db, collectionName, id);
          batch.delete(ref);
        });
        await batch.commit();
      }
    } catch (error) {
      console.error(`[Firestore] Error batch deleting from ${collectionName}:`, error);
    }
  }

  // Check if collection is empty
  public static async isCollectionEmpty(collectionName: string): Promise<boolean> {
    try {
      const snapshot = await getDocs(collection(db, collectionName));
      return snapshot.empty;
    } catch (error) {
      console.warn(`[Firestore] Could not check collection ${collectionName}, fallback to local.`, error);
      return true;
    }
  }
}
