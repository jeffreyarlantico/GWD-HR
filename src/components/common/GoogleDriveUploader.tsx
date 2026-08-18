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
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';

const MAX_FILE_SIZE_BYTES = 1048576; // Strictly 1 MB (1,048,576 bytes)
const TARGET_FOLDER_ID = '1oHwkVipP50ixdFSTFDHScld7VZtv9eHb';

export interface GoogleDriveUploaderProps {
  /** Current URL (Google Drive link or data URL) */
  currentUrl?: string;
  /** Callback when upload completes with Google Drive webViewLink */
  onUploadSuccess: (driveUrl: string, fileDetails?: { id: string; name: string }) => void;
  /** Optional Firestore Employee ID to automatically persist the link */
  employeeId?: string;
  /** Firestore field to update on the employee document (e.g. 'photoUrl' or 'documentUrl') */
  firestoreField?: 'photoUrl' | 'documentUrl' | string;
  /** Label for the upload field */
  label?: string;
  /** Helper text displayed below */
  helperText?: string;
  /** Accepted file formats (e.g. "image/*" or ".pdf,.jpg,.png,.docx") */
  accept?: string;
  /** Upload mode / context ('photo' | 'document') */
  mode?: 'photo' | 'document';
  /** Optional custom filename prefix */
  fileNamePrefix?: string;
}

export const GoogleDriveUploader: React.FC<GoogleDriveUploaderProps> = ({
  currentUrl = '',
  onUploadSuccess,
  employeeId,
  firestoreField,
  label,
  helperText,
  accept = 'image/*,.pdf,.doc,.docx',
  mode = 'document',
  fileNamePrefix = 'GuimbaWest'
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');

  const defaultLabel = mode === 'photo' ? 'Employee Profile Photo' : 'HR / Appointment Document';
  const defaultHelper = mode === 'photo'
    ? 'Upload official photo directly to Guimba West Google Drive (Max 1 MB, JPG/PNG).'
    : 'Upload document directly to Guimba West Google Drive folder (Max 1 MB, PDF/DOC/JPG).';

  // Format bytes to human-readable size
  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(2)} MB`;
  };

  // Upload handler
  const handleFileUpload = async (file: File) => {
    setErrorMessage('');
    setSuccessMessage('');
    setUploadProgress(0);

    // 1. Strict Client-Side File Size Validation (Max 1 MB)
    if (file.size > MAX_FILE_SIZE_BYTES) {
      const actualSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      setErrorMessage(
        `File size (${actualSizeMB} MB / ${file.size.toLocaleString()} bytes) exceeds the strict 1 MB limit (1,048,576 bytes). Please resize or compress your file before uploading.`
      );
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(25);

      // 2. Prepare Multipart Form Data
      const formData = new FormData();
      const cleanFileName = `${fileNamePrefix}_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      formData.append('file', file, cleanFileName);
      formData.append('name', cleanFileName);
      formData.append('folderId', TARGET_FOLDER_ID);

      setUploadProgress(50);

      // 3. Post to Vercel Serverless Function /api/upload
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      setUploadProgress(75);

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || `Upload failed with status code ${response.status}`);
      }

      const driveUrl = data.webViewLink || data.webContentLink;
      setUploadedFileName(data.fileName || file.name);

      // 4. Update Firestore Employee Document if employeeId & firestoreField are specified
      if (employeeId && firestoreField) {
        setUploadProgress(90);
        try {
          const empDocRef = doc(db, 'employees', employeeId);
          await setDoc(
            empDocRef,
            {
              [firestoreField]: driveUrl,
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          );
        } catch (dbErr: any) {
          console.warn('Google Drive upload succeeded, but Firestore sync encountered an issue:', dbErr);
        }
      }

      setUploadProgress(100);
      setSuccessMessage('Successfully uploaded to Google Drive folder!');
      onUploadSuccess(driveUrl, { id: data.fileId, name: data.fileName || file.name });

      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err: any) {
      console.error('Error during Google Drive upload:', err);
      setErrorMessage(
        err.message || 'An error occurred while uploading the file to Google Drive. Please check your network and API credentials.'
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

  const isGoogleDriveLink = currentUrl.includes('drive.google.com') || currentUrl.includes('docs.google.com');

  return (
    <div id="google-drive-uploader" className="space-y-2.5 bg-slate-50 p-4 rounded-xl border border-slate-200">
      {/* Header Label */}
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
          {mode === 'photo' ? <ImageIcon className="w-4 h-4 text-amber-600" /> : <FileText className="w-4 h-4 text-amber-600" />}
          <span>{label || defaultLabel}</span>
        </label>

        {currentUrl && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            {isGoogleDriveLink ? 'Google Drive Synced' : 'File Linked'}
          </span>
        )}
      </div>

      {/* Upload Dropzone / Button Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-4 transition-all text-center bg-white ${
          isDragging 
            ? 'border-amber-500 bg-amber-50/50 ring-2 ring-amber-400/30' 
            : 'border-slate-300 hover:border-amber-400 hover:bg-slate-50/50'
        }`}
      >
        {isUploading ? (
          /* Loading & Progress State */
          <div className="py-4 flex flex-col items-center justify-center space-y-2.5">
            <Loader2 className="w-7 h-7 text-amber-600 animate-spin" />
            <div className="text-center space-y-1">
              <p className="text-xs font-bold text-slate-800">
                Uploading to Google Drive...
              </p>
              <p className="text-[11px] text-slate-500 font-mono">
                Folder: 1oHwkVipP50ixdFSTFDHScld7VZtv9eHb
              </p>
            </div>

            {/* Progress Bar */}
            <div className="w-48 bg-slate-100 rounded-full h-1.5 overflow-hidden border border-slate-200">
              <div
                className="bg-amber-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        ) : (
          /* Idle Action State */
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700">
              <Upload className="w-5 h-5" />
            </div>

            <div>
              <p className="text-xs font-bold text-slate-800">
                Click to browse or drag and drop file here
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Strict Limit: <b className="text-amber-700">Max 1 MB (1,048,576 bytes)</b> • Direct Google Drive Upload
              </p>
            </div>

            <div className="pt-1 flex items-center gap-2">
              <button
                type="button"
                id="btn-trigger-gdrive-file"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-xs font-black transition shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Select & Upload File</span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept={accept}
                onChange={onFileInputChange}
                className="hidden"
              />
            </div>
          </div>
        )}
      </div>

      {/* Current File Preview & View Controls */}
      {currentUrl && !isUploading && (
        <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2.5 overflow-hidden">
            <FolderOpen className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <div className="truncate">
              <p className="font-semibold text-slate-800 truncate">
                {uploadedFileName || (mode === 'photo' ? 'Profile Photo' : 'Attached HR Document')}
              </p>
              <p className="text-[10px] text-slate-500 truncate font-mono">
                {currentUrl}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 flex-shrink-0">
            <a
              href={currentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-bold transition flex items-center gap-1 shadow-2xs"
            >
              <span>View in Drive</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            <button
              type="button"
              onClick={() => onUploadSuccess('')}
              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-md transition"
              title="Remove link"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Error Message Notice */}
      {errorMessage && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs font-semibold text-rose-700 flex items-start gap-2 animate-fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-bold">Upload Rejected</p>
            <p className="text-[11px] text-rose-600 font-normal leading-relaxed">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Success Notice */}
      {successMessage && (
        <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-semibold text-emerald-800 flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
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
