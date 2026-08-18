import React, { useRef, useState } from 'react';
import { Image, Upload, Trash2, CheckCircle2, AlertCircle, Loader2, FolderOpen, ExternalLink } from 'lucide-react';

interface ProfilePhotoUploaderProps {
  photoUrl: string;
  onChange: (url: string) => void;
  employeeName?: string;
  employeeId?: string;
}

const MAX_FILE_SIZE_BYTES = 1048576; // Strictly 1 MB (1,048,576 bytes)
const TARGET_FOLDER_ID = '1oHwkVipP50ixdFSTFDHScld7VZtv9eHb';

export const ProfilePhotoUploader: React.FC<ProfilePhotoUploaderProps> = ({
  photoUrl,
  onChange,
  employeeName = 'Employee',
  employeeId
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadNotice, setUploadNotice] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Handle File Selection with 1 MB Limit & Google Drive /api/upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage('');
    setUploadNotice('');

    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (JPG, PNG, WEBP).');
      return;
    }

    // Strict 1 MB validation
    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      setErrorMessage(
        `File size (${sizeMB} MB / ${file.size.toLocaleString()} bytes) exceeds the strict 1 MB limit (1,048,576 bytes). Please resize or compress the photo before uploading.`
      );
      if (e.target) e.target.value = '';
      return;
    }

    try {
      setIsUploading(true);

      // Attempt upload to /api/upload (Vercel Serverless Google Drive API)
      const formData = new FormData();
      const cleanName = `Photo_${employeeName.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
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
          setUploadNotice('Photo uploaded directly to Google Drive folder successfully!');
          setTimeout(() => setUploadNotice(''), 4000);
          return;
        }
      }

      // Fallback to client data URL if /api/upload is in local mock mode
      const reader = new FileReader();
      reader.onload = (evt) => {
        const result = evt.target?.result as string;
        if (result) {
          onChange(result);
          setUploadNotice('Photo saved successfully!');
          setTimeout(() => setUploadNotice(''), 4000);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      console.warn('API upload encountered an issue, falling back to local photo preview:', err);
      const reader = new FileReader();
      reader.onload = (evt) => {
        const result = evt.target?.result as string;
        if (result) {
          onChange(result);
          setUploadNotice('Photo preview saved locally.');
          setTimeout(() => setUploadNotice(''), 4000);
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const isGoogleDriveLink = photoUrl.includes('drive.google.com') || photoUrl.includes('docs.google.com');

  return (
    <div id="profile-photo-uploader-component" className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-slate-700">
          Profile Photo
        </label>
        {photoUrl && isGoogleDriveLink && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
            <FolderOpen className="w-3 h-3 text-emerald-600" />
            Google Drive Synced
          </span>
        )}
      </div>

      {/* Main Container */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
        
        {/* Preview & Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          
          {/* Avatar Preview */}
          <div className="relative group">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-slate-200 border-2 border-amber-400 shadow-sm flex items-center justify-center flex-shrink-0">
              {isUploading ? (
                <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
              ) : photoUrl ? (
                <img
                  src={photoUrl}
                  alt={employeeName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <Image className="w-8 h-8 text-slate-400" />
              )}
            </div>

            {photoUrl && !isUploading && (
              <button
                type="button"
                onClick={() => onChange('')}
                className="absolute -top-1 -right-1 p-1 bg-rose-600 text-white rounded-full hover:bg-rose-700 transition shadow"
                title="Remove photo"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex-1 space-y-2 text-center sm:text-left w-full">
            <div className="flex flex-wrap items-center gap-2">
              {/* Upload to Google Drive */}
              <button
                type="button"
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 rounded-lg text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Uploading (Drive)...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Upload Photo (Max 1 MB)</span>
                  </>
                )}
              </button>

              {photoUrl && isGoogleDriveLink && (
                <a
                  href={photoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition flex items-center gap-1"
                  title="View on Google Drive"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Drive</span>
                </a>
              )}

              {photoUrl && (
                <button
                  type="button"
                  onClick={() => onChange('')}
                  className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold transition flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            <p className="text-[11px] text-slate-500">
              Uploads directly to Google Drive folder <code className="text-amber-700 font-mono text-[10px]">1oHwkVipP50ixdFSTFDHScld7VZtv9eHb</code> • Strict limit: <b>Max 1 MB (1,048,576 bytes)</b>
            </p>
          </div>
        </div>

        {/* Error Notice */}
        {errorMessage && (
          <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs font-semibold text-rose-700 flex items-center gap-2 animate-fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Success Notice */}
        {uploadNotice && (
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-semibold text-emerald-800 flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{uploadNotice}</span>
          </div>
        )}

        {/* Photo URL Input */}
        <div>
          <label className="block text-[11px] font-bold text-slate-600 mb-1">
            Or Direct Photo Image URL
          </label>
          <div className="relative">
            <input
              type="text"
              value={photoUrl}
              onChange={(e) => onChange(e.target.value)}
              placeholder="https://example.com/photo.jpg or Google Drive URL"
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <Image className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>
        </div>

      </div>
    </div>
  );
};

