import React, { useRef, useState, useEffect } from 'react';
import { 
  FileText, 
  Upload, 
  Trash2, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  Cloud, 
  CloudUpload, 
  Loader2, 
  Folder,
  Lock,
  Sparkles
} from 'lucide-react';
import { 
  uploadHRDocumentToDrive, 
  signInWithGoogleDrive, 
  getDriveAccessToken, 
  DriveFileItem 
} from '../../services/googleDriveService';

interface GoogleDriveDocumentUploaderProps {
  documentUrl: string;
  driveFileId?: string;
  driveFileName?: string;
  onChange: (url: string, driveFileId?: string, driveFileName?: string) => void;
  category: 'Appointment' | 'SpecialOrder' | 'Promotion' | 'Leave' | 'Certificate' | 'ProfilePhoto';
  identifier?: string;
  label?: string;
  required?: boolean;
  helpText?: string;
}

export const GoogleDriveDocumentUploader: React.FC<GoogleDriveDocumentUploaderProps> = ({
  documentUrl,
  driveFileId,
  driveFileName,
  onChange,
  category,
  identifier,
  label,
  required = false,
  helpText
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successNotice, setSuccessNotice] = useState('');
  const [isConnectingDrive, setIsConnectingDrive] = useState(false);
  const [isDriveConnected, setIsDriveConnected] = useState(false);

  // Check Drive access token on mount
  useEffect(() => {
    getDriveAccessToken().then(token => {
      setIsDriveConnected(!!token);
    });
  }, []);

  const displayLabel = label || `${category} Document ${required ? '*' : '(Optional)'}`;

  const handleConnectDrive = async () => {
    setIsConnectingDrive(true);
    setErrorMessage('');
    try {
      const res = await signInWithGoogleDrive();
      if (res?.accessToken) {
        setIsDriveConnected(true);
        setSuccessNotice('Google Drive connected successfully!');
        setTimeout(() => setSuccessNotice(''), 3000);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to authenticate with Google Drive.');
    } finally {
      setIsConnectingDrive(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage('');
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      setErrorMessage('File size exceeds the 25MB limit. Please choose a smaller file.');
      return;
    }

    setIsUploading(true);
    setSuccessNotice('');

    try {
      // 1. Ensure Drive Token
      let token = await getDriveAccessToken();
      if (!token) {
        const authRes = await signInWithGoogleDrive();
        token = authRes?.accessToken || null;
        if (!token) {
          throw new Error('Google Drive authorization required to upload documents.');
        }
        setIsDriveConnected(true);
      }

      // 2. Upload to Google Drive Subfolder
      const driveFile: DriveFileItem = await uploadHRDocumentToDrive(
        file,
        file.name,
        category,
        identifier
      );

      const targetUrl = driveFile.webViewLink || `https://drive.google.com/file/d/${driveFile.id}/view`;
      
      // 3. Update Firestore Reference
      onChange(targetUrl, driveFile.id, file.name);
      setSuccessNotice(`Document "${file.name}" uploaded to Google Drive!`);
      setTimeout(() => setSuccessNotice(''), 4000);
    } catch (err: any) {
      console.error('Drive upload failed:', err);
      // Fallback: If Google Drive popup was blocked or user declined, allow data URL temporary preview with clear warning
      if (err.message?.includes('popup') || err.message?.includes('closed')) {
        setErrorMessage('Google Drive sign-in popup was closed. Please enable popups or try again.');
      } else {
        setErrorMessage(`Drive Upload Error: ${err.message || 'Could not upload file to Google Drive.'}`);
      }
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleOpenDocument = () => {
    if (!documentUrl) return;
    window.open(documentUrl, '_blank', 'noopener,noreferrer');
  };

  const isGoogleDriveUrl = documentUrl.includes('drive.google.com') || !!driveFileId;

  return (
    <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-slate-800">
          {displayLabel}
        </label>
        {documentUrl && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            {isGoogleDriveUrl ? 'Google Drive Document' : 'Document Attached'}
          </span>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        {/* Upload Button */}
        <button
          type="button"
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
          className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 rounded-lg text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
              <span>Uploading to Google Drive...</span>
            </>
          ) : (
            <>
              <CloudUpload className="w-4 h-4 text-slate-950" />
              <span>Upload to Google Drive</span>
            </>
          )}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* View & Remove Controls */}
        {documentUrl && (
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleOpenDocument}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              title="Open document from Google Drive"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>View in Google Drive</span>
            </button>

            <button
              type="button"
              onClick={() => onChange('', '', '')}
              className="px-2.5 py-2 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              title="Remove document reference"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {driveFileName && (
        <div className="text-[11px] font-medium text-slate-600 flex items-center gap-1.5 bg-white p-2 rounded-lg border border-slate-200">
          <FileText className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span className="font-mono text-slate-800 truncate">{driveFileName}</span>
          {driveFileId && (
            <span className="text-[9px] text-slate-400 font-mono ml-auto">ID: {driveFileId.slice(0, 8)}...</span>
          )}
        </div>
      )}

      {successNotice && (
        <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successNotice}</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 bg-rose-50 p-2 rounded-lg border border-rose-200">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Manual Link Input */}
      <div className="pt-1">
        <div className="relative">
          <input
            type="text"
            value={documentUrl}
            onChange={(e) => onChange(e.target.value, driveFileId, driveFileName)}
            placeholder={`Or paste direct Google Drive document URL...`}
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <Cloud className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
        </div>
        <p className="text-[10px] text-slate-500 mt-1">
          {helpText || `Files uploaded will be stored in your authorized Google Drive and linked in Firestore for multi-device access.`}
        </p>
      </div>
    </div>
  );
};
