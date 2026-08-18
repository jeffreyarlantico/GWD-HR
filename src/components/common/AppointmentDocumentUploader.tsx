import React, { useRef, useState } from 'react';
import { FileText, Upload, Trash2, ExternalLink, FileCheck, AlertCircle, CloudUpload, Loader2 } from 'lucide-react';
import { uploadHRDocumentToDrive, signInWithGoogleDrive, getDriveAccessToken } from '../../services/googleDriveService';
import { compressImageFileToDataUrl } from '../../utils/imageCompressor';

interface AppointmentDocumentUploaderProps {
  documentUrl: string;
  driveFileId?: string;
  driveFileName?: string;
  onChange: (url: string, driveFileId?: string, driveFileName?: string) => void;
  positionName?: string;
  label?: string;
  required?: boolean;
  employeeNumber?: string;
}

export const AppointmentDocumentUploader: React.FC<AppointmentDocumentUploaderProps> = ({
  documentUrl,
  driveFileId,
  driveFileName,
  onChange,
  positionName = 'Current Position',
  label,
  required = false,
  employeeNumber
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [successNotice, setSuccessNotice] = useState('');
  const [fileName, setFileName] = useState<string>(driveFileName || '');

  const displayLabel = label || `Appointment Document for ${positionName} ${required ? '*' : '(Optional)'}`;

  // Handle file selection: Uploads to Google Drive for multi-device cloud storage
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError('');
    setSuccessNotice('');
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      setUploadError('Selected file exceeds the 25MB limit. Please choose a smaller file.');
      return;
    }

    setIsUploading(true);
    setFileName(file.name);

    try {
      // Ensure Google Drive Token
      let token = await getDriveAccessToken();
      if (!token) {
        const authRes = await signInWithGoogleDrive();
        token = authRes?.accessToken || null;
      }

      if (token) {
        // Upload to Google Drive folder "Appointment Papers"
        const driveItem = await uploadHRDocumentToDrive(
          file,
          file.name,
          'Appointment',
          employeeNumber || positionName
        );
        const targetUrl = driveItem.webViewLink || `https://drive.google.com/file/d/${driveItem.id}/view`;
        onChange(targetUrl, driveItem.id, file.name);
        setSuccessNotice(`Uploaded "${file.name}" to Google Drive successfully!`);
        setTimeout(() => setSuccessNotice(''), 4000);
      } else {
        // Fallback: If image, compress it to keep under 100KB; if PDF or large doc, encourage Drive link
        if (file.type.startsWith('image/')) {
          const compressed = await compressImageFileToDataUrl(file, 800, 800, 0.75);
          onChange(compressed, undefined, file.name);
          setSuccessNotice('Document image compressed & loaded locally.');
          setTimeout(() => setSuccessNotice(''), 3000);
        } else {
          // For non-images without Drive connection, prompt user
          setUploadError('To store PDF/Office files online, please connect Google Drive or paste a shareable Google Drive / OneDrive link.');
        }
      }
    } catch (err: any) {
      console.warn('Drive upload error:', err);
      if (file.type.startsWith('image/')) {
        try {
          const compressed = await compressImageFileToDataUrl(file, 800, 800, 0.75);
          onChange(compressed, undefined, file.name);
          setUploadError(`Could not upload to Google Drive (${err.message || 'auth error'}). Saved compressed image locally.`);
        } catch {
          setUploadError(`Drive upload failed: ${err.message || 'Error'}`);
        }
      } else {
        setUploadError(`Could not upload to Google Drive (${err.message || 'auth error'}). Please paste a direct Drive or OneDrive link.`);
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
    if (documentUrl.startsWith('data:')) {
      const win = window.open();
      if (win) {
        if (documentUrl.startsWith('data:application/pdf')) {
          win.document.write(
            `<iframe src="${documentUrl}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`
          );
        } else if (documentUrl.startsWith('data:image')) {
          win.document.write(
            `<div style="display:flex;justify-content:center;align-items:center;min-height:100vh;background:#0f172a;"><img src="${documentUrl}" style="max-width:100%;max-height:100vh;object-fit:contain;"/></div>`
          );
        } else {
          win.document.write(
            `<div style="font-family:sans-serif;padding:2rem;text-align:center;"><h2>Appointment Document</h2><a href="${documentUrl}" download="appointment_document">Click here to download file</a></div>`
          );
        }
      }
    } else {
      window.open(documentUrl, '_blank', 'noopener,noreferrer');
    }
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
            <FileCheck className="w-3 h-3 text-emerald-600" />
            {isGoogleDriveUrl ? 'Stored in Google Drive' : 'Document Attached'}
          </span>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        {/* Upload File Button */}
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
              <span>Upload Document (Drive)</span>
            </>
          )}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* View & Remove Controls if document exists */}
        {documentUrl && (
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleOpenDocument}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              title="View or open uploaded appointment document"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{isGoogleDriveUrl ? 'View in Drive' : 'View Document'}</span>
              <ExternalLink className="w-3 h-3" />
            </button>

            <button
              type="button"
              onClick={() => {
                onChange('', '', '');
                setFileName('');
              }}
              className="px-2.5 py-2 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              title="Remove document"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {fileName && (
        <div className="text-[11px] font-medium text-slate-600 flex items-center gap-1.5 bg-white p-2 rounded-lg border border-slate-200">
          <FileText className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span className="font-mono text-slate-800 truncate">{fileName}</span>
          {driveFileId && (
            <span className="text-[9px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 ml-auto">
              Drive ID: {driveFileId.slice(0, 8)}...
            </span>
          )}
        </div>
      )}

      {successNotice && (
        <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
          <FileCheck className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successNotice}</span>
        </div>
      )}

      {uploadError && (
        <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 bg-rose-50 p-2 rounded-lg border border-rose-200">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Alternative URL Link Input */}
      <div className="pt-1">
        <div className="relative">
          <input
            type="text"
            value={documentUrl}
            onChange={(e) => onChange(e.target.value, driveFileId, fileName)}
            placeholder={`Or paste appointment document link for ${positionName}...`}
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <FileText className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
        </div>
        <p className="text-[10px] text-slate-500 mt-1">
          Upload file (PDF, Word, Image) to <b>Google Drive</b> or paste a shared Google Drive link.
        </p>
      </div>
    </div>
  );
};
