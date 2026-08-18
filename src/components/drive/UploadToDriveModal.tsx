import React, { useState, useRef } from 'react';
import { Upload, X, FileText, CheckCircle2, AlertCircle, Folder } from 'lucide-react';
import { uploadFileToGoogleDrive, DriveFileItem } from '../../services/googleDriveService';

interface UploadToDriveModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFolderId: string;
  currentFolderName: string;
  onUploadSuccess: (newFile: DriveFileItem) => void;
}

export const UploadToDriveModal: React.FC<UploadToDriveModalProps> = ({
  isOpen,
  onClose,
  currentFolderId,
  currentFolderName,
  onUploadSuccess,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [customFileName, setCustomFileName] = useState('');
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage('');
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!customFileName) {
        setCustomFileName(file.name);
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!customFileName) {
        setCustomFileName(file.name);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMessage('Please select a file to upload.');
      return;
    }

    try {
      setIsUploading(true);
      setErrorMessage('');
      const uploaded = await uploadFileToGoogleDrive({
        name: customFileName.trim() || selectedFile.name,
        file: selectedFile,
        parentFolderId: currentFolderId,
        description: description.trim() || undefined,
      });

      setSuccessMessage('File uploaded successfully to Google Drive!');
      setTimeout(() => {
        onUploadSuccess(uploaded);
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error('Upload failed:', err);
      setErrorMessage(err.message || 'Failed to upload file to Google Drive.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div
      id="upload-to-drive-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
    >
      <div
        id="upload-to-drive-modal"
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="bg-amber-500 text-slate-950 p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Upload className="w-5 h-5" />
            <h2 className="text-sm font-black tracking-wide uppercase">
              Upload Document to Google Drive
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={isUploading}
            className="text-slate-950/70 hover:text-slate-950 p-1.5 rounded-lg hover:bg-amber-400/50 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Target Folder Banner */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center space-x-2 text-slate-700">
            <Folder className="w-4 h-4 text-amber-500 fill-amber-100 shrink-0" />
            <div className="min-w-0 flex-1">
              <span className="text-slate-500 text-[11px]">Uploading into: </span>
              <span className="font-bold text-slate-900">{currentFolderName || 'Root Drive Folder'}</span>
            </div>
          </div>

          {/* Drag & Drop Box */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition ${
              selectedFile
                ? 'border-emerald-400 bg-emerald-50/50'
                : 'border-slate-300 hover:border-amber-500 bg-slate-50 hover:bg-amber-50/20'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              className="hidden"
            />
            {selectedFile ? (
              <div className="space-y-1.5">
                <div className="w-10 h-10 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <p className="font-bold text-slate-900 truncate">{selectedFile.name}</p>
                <p className="text-[11px] text-slate-500">
                  {(selectedFile.size / 1024).toFixed(1)} KB • Click to change file
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="w-10 h-10 mx-auto rounded-full bg-slate-200/80 text-slate-600 flex items-center justify-center">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-slate-800">
                    Click to select a file or drag & drop here
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Supports PDFs, scanned records, images, Word, Excel, and text documents
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* File Name Field */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              File Name in Google Drive *
            </label>
            <input
              type="text"
              value={customFileName}
              onChange={(e) => setCustomFileName(e.target.value)}
              placeholder="e.g., Special_Order_No_2026_01.pdf"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              required
            />
          </div>

          {/* Optional Description */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Description / Notes (Optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Service Credits SO for District Training Workshop"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Messages */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading || !selectedFile}
              className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl font-black shadow-xs transition flex items-center space-x-2 disabled:opacity-50"
            >
              {isUploading ? (
                <span>Uploading...</span>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Upload to Drive</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
