import React, { useRef, useState } from 'react';
import { Image, Upload, Trash2, CheckCircle2, Loader2, CloudUpload, ExternalLink, AlertCircle } from 'lucide-react';
import { compressImageFileToDataUrl } from '../../utils/imageCompressor';
import { 
  uploadHRDocumentToDrive, 
  signInWithGoogleDrive, 
  getDriveAccessToken 
} from '../../services/googleDriveService';

interface ProfilePhotoUploaderProps {
  photoUrl: string;
  photoDriveFileId?: string;
  photoDriveFileName?: string;
  onChange: (url: string, driveFileId?: string, driveFileName?: string) => void;
  employeeName?: string;
  employeeNumber?: string;
}

export const ProfilePhotoUploader: React.FC<ProfilePhotoUploaderProps> = ({
  photoUrl,
  photoDriveFileId,
  photoDriveFileName,
  onChange,
  employeeName = 'Employee',
  employeeNumber = ''
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploadingToDrive, setIsUploadingToDrive] = useState(false);
  const [uploadNotice, setUploadNotice] = useState('');
  const [driveError, setDriveError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [lastSelectedFile, setLastSelectedFile] = useState<File | null>(null);

  // Core processor for chosen file
  const processAndUploadFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (JPG, PNG, WEBP).');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      alert('Image file size should be less than 15MB.');
      return;
    }

    setLastSelectedFile(file);
    setIsProcessing(true);
    setDriveError('');
    setUploadNotice('');

    try {
      // 1. Optimize and compress avatar locally to ~320x320 JPEG (< 35KB) for fast instant rendering and Firestore sync
      const compressedDataUrl = await compressImageFileToDataUrl(file, 320, 320, 0.8);
      
      // 2. Check Google Drive connectivity
      const token = await getDriveAccessToken();
      
      if (token) {
        setIsUploadingToDrive(true);
        try {
          const driveItem = await uploadHRDocumentToDrive(
            file,
            file.name,
            'ProfilePhoto',
            employeeNumber || employeeName
          );

          onChange(compressedDataUrl, driveItem.id, driveItem.name || file.name);
          setUploadNotice(`Profile photo saved to Google Drive and optimized for HRIS! (Folder: Profile Photos)`);
        } catch (driveErr: any) {
          console.warn('Drive upload error:', driveErr);
          onChange(compressedDataUrl, undefined, undefined);
          setDriveError(`Could not upload to Google Drive (${driveErr.message || 'auth error'}). Saved locally.`);
        } finally {
          setIsUploadingToDrive(false);
        }
      } else {
        // Not signed in to Google Drive yet: save compressed photo locally & offer 1-click Drive backup
        onChange(compressedDataUrl, undefined, undefined);
        setUploadNotice('Photo optimized & loaded locally. Connect Google Drive below to back it up in Drive.');
      }
    } catch (err: any) {
      console.error('Error processing photo:', err);
      alert('Failed to process image file. Please try another image.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processAndUploadFile(file);
    if (e.target) {
      e.target.value = '';
    }
  };

  // Drag & Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processAndUploadFile(file);
    }
  };

  // Explicit Save / Re-upload to Google Drive
  const handleConnectAndSaveToDrive = async () => {
    setIsUploadingToDrive(true);
    setDriveError('');
    try {
      const authResult = await signInWithGoogleDrive();
      if (!authResult?.accessToken) {
        throw new Error('Could not authorize with Google Drive.');
      }

      // If we have the original file from current session, upload it directly
      if (lastSelectedFile) {
        const driveItem = await uploadHRDocumentToDrive(
          lastSelectedFile,
          lastSelectedFile.name,
          'ProfilePhoto',
          employeeNumber || employeeName
        );
        onChange(photoUrl, driveItem.id, driveItem.name || lastSelectedFile.name);
        setUploadNotice('Profile photo successfully uploaded to Google Drive!');
      } else if (photoUrl && photoUrl.startsWith('data:')) {
        // Convert data URL back to Blob and upload
        const response = await fetch(photoUrl);
        const blob = await response.blob();
        const driveItem = await uploadHRDocumentToDrive(
          blob,
          `${employeeNumber || 'employee'}_photo.jpg`,
          'ProfilePhoto',
          employeeNumber || employeeName
        );
        onChange(photoUrl, driveItem.id, driveItem.name);
        setUploadNotice('Profile photo successfully uploaded to Google Drive!');
      } else {
        setUploadNotice('Google Drive connected! Select a photo to upload directly.');
      }
    } catch (err: any) {
      console.error('Save to Drive error:', err);
      setDriveError(err.message || 'Failed to connect to Google Drive');
    } finally {
      setIsUploadingToDrive(false);
    }
  };

  const handleRemovePhoto = () => {
    onChange('', undefined, undefined);
    setLastSelectedFile(null);
    setUploadNotice('');
    setDriveError('');
  };

  return (
    <div id="profile-photo-uploader-component" className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-slate-700">
          Profile Photo & Cloud Backup
        </label>
        {photoDriveFileId && (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
            <CheckCircle2 className="w-3 h-3 text-blue-600" />
            <span>Saved in Google Drive</span>
          </span>
        )}
      </div>

      {/* Main Container */}
      <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`p-4 rounded-xl border transition-all space-y-4 ${
          isDragging 
            ? 'bg-amber-50 border-2 border-dashed border-amber-500 shadow-sm' 
            : 'bg-slate-50 border-slate-200'
        }`}
      >
        
        {/* Preview & Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          
          {/* Avatar Preview */}
          <div className="relative group flex-shrink-0">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-slate-200 border-2 border-amber-400 shadow-sm flex items-center justify-center">
              {isProcessing || isUploadingToDrive ? (
                <div className="flex flex-col items-center justify-center p-2 text-amber-700">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : photoUrl ? (
                <img
                  src={photoUrl}
                  alt={employeeName}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <Image className="w-8 h-8 text-slate-400" />
              )}
            </div>

            {photoUrl && !isProcessing && !isUploadingToDrive && (
              <button
                type="button"
                onClick={handleRemovePhoto}
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
              {/* Upload Local File */}
              <button
                type="button"
                disabled={isProcessing || isUploadingToDrive}
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 rounded-lg text-xs font-bold transition shadow-xs flex items-center gap-1.5"
              >
                {isProcessing || isUploadingToDrive ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                <span>{photoUrl ? 'Change Photo' : 'Select Photo'}</span>
              </button>

              {/* Save to Drive Action if not yet synced */}
              {photoUrl && !photoDriveFileId && (
                <button
                  type="button"
                  disabled={isProcessing || isUploadingToDrive}
                  onClick={handleConnectAndSaveToDrive}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition shadow-xs flex items-center gap-1.5"
                  title="Upload this photo directly to Google Drive"
                >
                  {isUploadingToDrive ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CloudUpload className="w-3.5 h-3.5" />
                  )}
                  <span>Save to Google Drive</span>
                </button>
              )}

              {/* View in Drive Link */}
              {photoDriveFileId && (
                <a
                  href={`https://drive.google.com/file/d/${photoDriveFileId}/view`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold transition flex items-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>View in Drive</span>
                </a>
              )}

              {photoUrl && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
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
              Select or drop an image file (JPG, PNG, WEBP). Photos are automatically backed up to <span className="font-semibold text-slate-700">Google Drive (Profile Photos)</span> and optimized for HRIS records.
            </p>
          </div>
        </div>

        {/* Success Notice */}
        {uploadNotice && (
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-semibold text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{uploadNotice}</span>
          </div>
        )}

        {/* Drive Error / Warning Notice */}
        {driveError && (
          <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs font-medium text-amber-900 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <span>{driveError}</span>
              <button
                type="button"
                onClick={handleConnectAndSaveToDrive}
                className="ml-2 underline font-bold text-amber-950 hover:text-blue-700"
              >
                Connect Drive & Retry
              </button>
            </div>
          </div>
        )}

        {/* Direct Photo URL Input */}
        <div>
          <label className="block text-[11px] font-bold text-slate-600 mb-1">
            Or Direct Web Photo URL
          </label>
          <div className="relative">
            <input
              type="text"
              value={photoUrl}
              onChange={(e) => onChange(e.target.value, photoDriveFileId, photoDriveFileName)}
              placeholder="https://example.com/photo.jpg"
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <Image className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>
        </div>

      </div>
    </div>
  );
};
