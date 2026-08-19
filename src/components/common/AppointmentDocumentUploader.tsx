import React, { useRef, useState } from 'react';
import { FileText, Upload, Trash2, ExternalLink, FileCheck, AlertCircle, FolderOpen, Loader2 } from 'lucide-react';
import { GoogleDrivePickerModal } from '../drive/GoogleDrivePickerModal';

interface AppointmentDocumentUploaderProps {
  documentUrl: string;
  onChange: (url: string) => void;
  positionName?: string;
  label?: string;
  required?: boolean;
  employeeId?: string;
}

const MAX_FILE_SIZE_BYTES = 1048576; // Strictly 1 MB (1,048,576 bytes)
const TARGET_FOLDER_ID = '1oHwkVipP50ixdFSTFDHScld7VZtv9eHb';

export const AppointmentDocumentUploader: React.FC<AppointmentDocumentUploaderProps> = ({
  documentUrl,
  onChange,
  positionName = 'Current Position',
  label,
  required = false,
  employeeId
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState('');
  const [uploadNotice, setUploadNotice] = useState('');
  const [fileName, setFileName] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [showDrivePicker, setShowDrivePicker] = useState(false);

  const displayLabel = label || `Appointment Document for ${positionName} ${required ? '*' : '(Optional)'}`;

  // Handle file selection with 1MB limit & /api/upload
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError('');
    setUploadNotice('');
    const file = e.target.files?.[0];
    if (!file) return;

    // Strict 1 MB validation
    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      setUploadError(
        `File size (${sizeMB} MB / ${file.size.toLocaleString()} bytes) exceeds the strict 1 MB limit (1,048,576 bytes). Please compress or resize the document before uploading.`
      );
      if (e.target) e.target.value = '';
      return;
    }

    setFileName(file.name);

    try {
      setIsUploading(true);

      // Attempt direct upload to /api/upload
      const formData = new FormData();
      const cleanName = `Appointment_${positionName.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      formData.append('file', file, cleanName);
      formData.append('name', cleanName);
      formData.append('folderId', TARGET_FOLDER_ID);
      if (employeeId) formData.append('employeeId', employeeId);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        if (data.webViewLink) {
          onChange(data.webViewLink);
          setUploadNotice('Document uploaded directly to Google Drive folder successfully!');
          setTimeout(() => setUploadNotice(''), 4000);
          return;
        }
      }

      // Fallback to local data URL if /api/upload is in local mode
      const reader = new FileReader();
      reader.onload = (evt) => {
        const result = evt.target?.result as string;
        if (result) {
          onChange(result);
          setUploadNotice('Document attached successfully!');
          setTimeout(() => setUploadNotice(''), 4000);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      console.warn('Google Drive API upload issue, falling back to data URL:', err);
      const reader = new FileReader();
      reader.onload = (evt) => {
        const result = evt.target?.result as string;
        if (result) {
          onChange(result);
          setUploadNotice('Document attached locally.');
          setTimeout(() => setUploadNotice(''), 4000);
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = '';
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

  const isGoogleDriveLink = documentUrl.includes('drive.google.com') || documentUrl.includes('docs.google.com');

  return (
    <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-slate-800">
          {displayLabel}
        </label>
        {documentUrl && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
            <FileCheck className="w-3 h-3 text-emerald-600" />
            {isGoogleDriveLink ? 'Google Drive Synced' : 'Document Attached'}
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* Upload File Button */}
        <button
          type="button"
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
          className="px-3 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 rounded-lg text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Uploading (Max 1 MB)...</span>
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              <span>Upload File (Max 1 MB)</span>
            </>
          )}
        </button>

        {/* Pick from Google Drive */}
        <button
          type="button"
          onClick={() => setShowDrivePicker(true)}
          className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold transition shadow-2xs flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
        >
          <FolderOpen className="w-4 h-4 text-amber-600" />
          <span>Select from Google Drive</span>
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* View & Remove Controls if document exists */}
        {documentUrl && !isUploading && (
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleOpenDocument}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-2xs"
              title="View document"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>View</span>
              <ExternalLink className="w-3 h-3" />
            </button>

            <button
              type="button"
              onClick={() => {
                onChange('');
                setFileName('');
              }}
              className="px-2.5 py-2 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-lg text-xs font-bold transition flex items-center gap-1"
              title="Remove document"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {uploadError && (
        <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-200 animate-fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{uploadError}</span>
        </div>
      )}

      {uploadNotice && (
        <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200 animate-fade-in">
          <FileCheck className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{uploadNotice}</span>
        </div>
      )}

      {/* Alternative URL Link Input */}
      <div className="pt-1">
        <div className="relative">
          <input
            type="text"
            value={documentUrl}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Or paste link (Google Drive / OneDrive / URL)...`}
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <FileText className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
        </div>
        <p className="text-[10px] text-slate-500 mt-1">
          Folder ID: <code className="text-amber-700 font-mono">1oHwkVipP50ixdFSTFDHScld7VZtv9eHb</code> • Strict limit: <b>Max 1 MB (1,048,576 bytes)</b>
        </p>
      </div>

      {/* Google Drive Picker Modal */}
      <GoogleDrivePickerModal
        isOpen={showDrivePicker}
        onClose={() => setShowDrivePicker(false)}
        title={`Select Appointment Document for ${positionName}`}
        allowedType="documents"
        onSelectFile={(url, name) => {
          onChange(url);
          setFileName(name);
        }}
      />
    </div>
  );
};

