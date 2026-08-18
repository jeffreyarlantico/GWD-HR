/**
 * Utility for client-side image compression and base64 optimization
 * Prevents Firestore 1MB document size limits by keeping avatar/document previews lightweight (~15KB - 40KB)
 */

export const compressImageFileToDataUrl = (
  file: File | Blob,
  maxWidth = 320,
  maxHeight = 320,
  quality = 0.8
): Promise<string> => {
  return new Promise((resolve, reject) => {
    // If not an image, reject
    if (file.type && !file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string || '');
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions preserving aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(width, 1);
        canvas.height = Math.max(height, 1);

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(readerEvent.target?.result as string || '');
          return;
        }

        // Use high quality image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Convert to lightweight JPEG data URL
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };

      img.onerror = () => {
        resolve(readerEvent.target?.result as string || '');
      };

      img.src = readerEvent.target?.result as string;
    };

    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

/**
 * Compresses an existing base64 data URI if it exceeds a threshold (e.g. 50KB)
 */
export const compressDataUrlIfNeeded = (
  dataUrl: string,
  maxWidth = 300,
  maxHeight = 300,
  quality = 0.75
): Promise<string> => {
  return new Promise((resolve) => {
    if (!dataUrl || !dataUrl.startsWith('data:image/')) {
      resolve(dataUrl);
      return;
    }

    // If already small (< 60KB approx 80,000 characters), no need to compress
    if (dataUrl.length < 80000) {
      resolve(dataUrl);
      return;
    }

    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = Math.max(width, 1);
      canvas.height = Math.max(height, 1);

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'medium';
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const compressed = canvas.toDataURL('image/jpeg', quality);
      resolve(compressed);
    };

    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
};

/**
 * Synchronous safety check to prune or truncate strings that would exceed Firestore document limits (1MB)
 */
export const sanitizeDocumentForFirestore = <T extends Record<string, any>>(docData: T): T => {
  if (!docData || typeof docData !== 'object') return docData;

  const sanitized: any = Array.isArray(docData) ? [...docData] : { ...docData };

  for (const key of Object.keys(sanitized)) {
    const value = sanitized[key];
    if (typeof value === 'string') {
      // If a single string exceeds 400KB and is a data URI, replace or truncate safely
      if (value.length > 400000 && value.startsWith('data:')) {
        console.warn(`[Firestore Sanitizer] Truncating oversized data URL in field "${key}" (length: ${value.length}) to prevent Firestore 1MB rejection.`);
        // If it's a PDF data URI that wasn't moved to Google Drive, notify or remove base64 payload to keep metadata safe
        if (value.startsWith('data:application/pdf') || value.startsWith('data:image/')) {
          sanitized[key] = ''; // Remove oversized inline base64 to avoid corrupting Firestore sync
        }
      }
    } else if (value && typeof value === 'object') {
      sanitized[key] = sanitizeDocumentForFirestore(value);
    }
  }

  return sanitized;
};
