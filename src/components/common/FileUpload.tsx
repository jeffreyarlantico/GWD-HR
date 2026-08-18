import React, { useRef, useState } from 'react';
import { 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ExternalLink, 
  Trash2, 
  FileText, 
  Image as ImageIcon,
  FolderOpen
} from 'lucide-react';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';

const MAX_FILE_SIZE_BYTES = 1048576; // Strictly 1 MB (1,048,576 bytes)
const TARGET_FOLDER_ID = '1oHwkVipP50ixdFSTFDHScld7VZtv9eHb';

export interface FileUploadProps {
  /** The target Employee document ID in Firestore */
  employeeId: string;
  /** Type of document being uploaded ('photo' or 'document' or custom name) */
  documentType: 'photo' | 'document' | string;
  /** Optional existing URL link for the file */
  currentUrl?: string;
  /** Optional callback invoked when upload & Firestore update complete */
  onUploadSuccess?: (driveUrl: string, fileId?: string) => void;
  /** Optional custom label */
  label?: string;
  /** Optional helper description text */
  helperText?: string;
  /** Accepted file formats (defaults: images for photo, documents/images for document) */
  accept?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  employeeId,
  documentType,
  currentUrl = '',
  onUploadSuccess,
  label,
  helperText,
  accept
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileUrl, setFileUrl] = useState<string>(currentUrl);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string>('');

  const isPhoto = documentType === 'photo';
  const defaultLabel = isPhoto ? 'Employee Profile Photo' : 'HR / Appointment Document';
  const defaultAccept = isPhoto ? 'image/jpeg,image/png,image/webp' : '.pdf,image/*,.doc,.docx';
  const defaultHelper = isPhoto
    ? 'Upload official photo (Max 1 MB, JPG/PNG). Saves directly to Google Drive & Firestore.'
    : 'Upload document (Max 1 MB, PDF/DOC/JPG). Saves directly to Google Drive & Firestore.';

  // Determine target Firestore field name based on documentType
  const targetFirestoreField = isPhoto ? 'photoUrl' : 'documentUrl';

  // Handle upload & Firestore synchronization
  const handleFileUpload = async (file: File) => {
    setErrorMessage('');
    setSuccessMessage('');

    // 1. Client-Side Validation: Reject files exceeding strictly 1 MB
    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
      setErrorMessage(
        `File rejected: Size is ${sizeInMB} MB (${file.size.toLocaleString()} bytes). The strict limit is 1 MB (1,048,576 bytes). Please resize or compress your file.`
      );
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    try {
      setIsUploading(true);

      // 2. Prepare multipart form data for /api/upload
      const cleanFileName = `${documentType.toUpperCase()}_${employeeId}_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const formData = new FormData();
      formData.append('file', file, cleanFileName);
      formData.append('name', cleanFileName);
      formData.append('folderId', TARGET_FOLDER_ID);
      formData.append('employeeId', employeeId);
      formData.append('documentType', documentType);

      // 3. Send file to Vercel Serverless Function /api/upload
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || `Upload failed with HTTP status ${response.status}`);
      }

      const viewLink = data.viewLink || data.webViewLink;
      const returnedFileId = data.fileId;

      if (!viewLink) {
        throw new Error('Google Drive API did not return a valid view link.');
      }

      setFileUrl(viewLink);
      setFileName(data.fileName || file.name);

      // 4. Update Firestore Employee Document using updateDoc() (or setDoc merge)
      if (employeeId) {
        const employeeDocRef = doc(db, 'employees', employeeId);
        try {
          await updateDoc(employeeDocRef, {
            [targetFirestoreField]: viewLink,
            updatedAt: new Date().toISOString(),
          });
        } catch (updateError: any) {
          // If document doesn't exist yet, fallback to setDoc with merge
          if (updateError?.code === 'not-found') {
            await setDoc(
              employeeDocRef,
              {
                id: employeeId,
                [targetFirestoreField]: viewLink,
                updatedAt: new Date().toISOString(),
              },
              { merge: true }
            );
          } else {
            console.warn('Firestore updateDoc notice:', updateError);
          }
        }
      }

      setSuccessMessage('File successfully uploaded to Google Drive & saved to Firestore permanently!');
      
      if (onUploadSuccess) {
        onUploadSuccess(viewLink, returnedFileId);
      }

      setTimeout(() => setSuccessMessage(''), 6000);
    } catch (err: any) {
      console.error('Error in FileUpload component:', err);
      setErrorMessage(
        err.message || 'An error occurred during upload. Please check your network and Google Drive configuration.'
      );
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleRemove = async () => {
    setFileUrl('');
    setFileName('');
    setSuccessMessage('');
    setErrorMessage('');

    if (employeeId) {
      try {
        const employeeDocRef = doc(db, 'employees', employeeId);
        await updateDoc(employeeDocRef, {
          [targetFirestoreField]: '',
          updatedAt: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('Error clearing Firestore link:', err);
      }
    }

    if (onUploadSuccess) {
      onUploadSuccess('');
    }
  };

  const activeUrl = fileUrl || currentUrl;
  const isGoogleDriveLink = activeUrl.includes('drive.google.com') || activeUrl.includes('docs.google.com');

  return (
    <div id={`file-uploader-${documentType}`} className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
      {/* Header Label & Badge */}
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
          {isPhoto ? <ImageIcon className="w-4 h-4 text-amber-600" /> : <FileText className="w-4 h-4 text-amber-600" />}
          <span>{label || defaultLabel}</span>
        </label>

        {activeUrl && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            {isGoogleDriveLink ? 'Google Drive & Firestore Synced' : 'File Saved'}
          </span>
        )}
      </div>

      {/* Upload Drag & Drop Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-4 sm:p-5 text-center transition-all bg-white ${
          isDragging
            ? 'border-amber-500 bg-amber-50/50 ring-2 ring-amber-400/30'
            : 'border-slate-300 hover:border-amber-400 hover:bg-slate-50/40'
        }`}
      >
        {isUploading ? (
          <div className="py-4 flex flex-col items-center justify-center space-y-2.5">
            <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
            <div className="text-center space-y-1">
              <p className="text-xs font-bold text-slate-800">
                Uploading to Google Drive & Saving to Firestore...
              </p>
              <p className="text-[11px] text-slate-500 font-mono">
                Folder: 1oHwkVipP50ixdFSTFDHScld7VZtv9eHb
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-2.5">
            <div className="w-11 h-11 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700 shadow-inner">
              <Upload className="w-5 h-5" />
            </div>

            <div className="space-y-0.5">
              <p className="text-xs font-bold text-slate-800">
                Click button to browse or drag and drop file here
              </p>
              <p className="text-[11px] text-slate-500">
                Strict Limit: <b className="text-amber-700 font-semibold">Max 1 MB (1,048,576 bytes)</b> • Direct Google Drive Upload
              </p>
            </div>

            <div className="pt-1">
              <button
                type="button"
                id={`btn-upload-${documentType}`}
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-black transition shadow-xs flex items-center gap-1.5 active:scale-95 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Select & Upload {isPhoto ? 'Photo' : 'Document'}</span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept={accept || defaultAccept}
                onChange={onFileInputChange}
                className="hidden"
              />
            </div>
          </div>
        )}
      </div>

      {/* Active File Preview & Actions */}
      {activeUrl && !isUploading && (
        <div className="bg-white p-3 rounded-xl border border-slate-300 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-fade-in">
          <div className="flex items-center space-x-3 overflow-hidden">
            {isPhoto ? (
              <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 border border-amber-300 shrink-0 flex items-center justify-center">
                <img
                  src={activeUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300 shrink-0 flex items-center justify-center text-amber-700">
                <FolderOpen className="w-5 h-5 text-amber-600" />
              </div>
            )}

            <div className="truncate">
              <p className="font-bold text-slate-900 truncate">
                {fileName || (isPhoto ? 'Employee Profile Photo' : 'HR Appointment Document')}
              </p>
              <p className="text-[10px] text-slate-500 truncate font-mono mt-0.5">
                {activeUrl}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
            <a
              href={activeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-2xs"
            >
              <span>Preview in Drive</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            <button
              type="button"
              onClick={handleRemove}
              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition"
              title="Remove document link"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Error Alert Box */}
      {errorMessage && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-800 flex items-start gap-2 animate-fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-bold text-rose-900">Upload Validation Error</p>
            <p className="text-[11px] text-rose-700 font-normal leading-relaxed">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Success Alert Box */}
      {successMessage && (
        <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-900 flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Helper text */}
      <p className="text-[10px] text-slate-400">
        {helperText || defaultHelper}
      </p>
    </div>
  );
};
