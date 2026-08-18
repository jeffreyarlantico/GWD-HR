import React, { useRef, useState } from 'react';
import { 
  FileText, 
  Upload, 
  Trash2, 
  ExternalLink, 
  FileCheck, 
  AlertCircle, 
  FolderOpen,
  Eye,
  RefreshCw,
  Link as LinkIcon
} from 'lucide-react';
import { GoogleDrivePickerModal } from '../drive/GoogleDrivePickerModal';

interface SpecialOrderAttachmentUploaderProps {
  documentUrl: string;
  onChange: (url: string) => void;
  soNumber?: string;
  label?: string;
  helperText?: string;
}

export const SpecialOrderAttachmentUploader: React.FC<SpecialOrderAttachmentUploaderProps> = ({
  documentUrl,
  onChange,
  soNumber = 'Special Order',
  label = 'Official Special Order Document / Attachment',
  helperText = 'Upload official scanned PDF or image copy of the approved Special Order, or select from Google Drive.'
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState('');
  const [fileName, setFileName] = useState<string>('');
  const [fileSize, setFileSize] = useState<string>('');
  const [showDrivePicker, setShowDrivePicker] = useState(false);
  const [showUrlFallback, setShowUrlFallback] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const processFile = (file: File) => {
    setUploadError('');

    // Check file size (limit 15MB)
    if (file.size > 15 * 1024 * 1024) {
      setUploadError('Selected file exceeds the 15MB limit. Please choose a smaller file or compress the PDF/image.');
      return;
    }

    // Format file size
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
    setFileSize(`${sizeInMB} MB`);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const result = evt.target?.result as string;
      if (result) {
        onChange(result);
      }
    };
    reader.onerror = () => {
      setUploadError('Failed to read file. Please try selecting the file again.');
    };
    reader.readAsDataURL(file);
  };

  // Handle local file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  // Handle Drag and Drop
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
      processFile(file);
    }
  };

  // Open / Preview Document
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
            `<div style="font-family:sans-serif;padding:2rem;text-align:center;"><h2>Special Order Document</h2><a href="${documentUrl}" download="${soNumber || 'special_order'}_document">Click here to download file</a></div>`
          );
        }
      }
    } else {
      window.open(documentUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const isGoogleDriveLink = documentUrl.includes('drive.google.com') || documentUrl.includes('docs.google.com');
  const isDataUrl = documentUrl.startsWith('data:');
  const isPdf = documentUrl.startsWith('data:application/pdf') || documentUrl.toLowerCase().includes('.pdf');
  const isImage = documentUrl.startsWith('data:image') || /\.(jpg|jpeg|png|webp|gif)/i.test(documentUrl);

  const getDocTypeBadge = () => {
    if (isGoogleDriveLink) return 'Google Drive Linked';
    if (isPdf) return 'PDF Document Uploaded';
    if (isImage) return 'Scanned Image Uploaded';
    if (isDataUrl) return 'Document Attached';
    if (documentUrl) return 'Web Document Linked';
    return null;
  };

  return (
    <div className="space-y-2.5 bg-slate-50/80 p-3.5 sm:p-4 rounded-xl border border-slate-200">
      {/* HEADER & BADGE */}
      <div className="flex flex-wrap items-center justify-between gap-1.5">
        <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
          <FileText className="w-4 h-4 text-amber-600" />
          <span>{label}</span>
          <span className="text-[10px] text-slate-400 font-normal">(Optional)</span>
        </label>
        
        {documentUrl && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300 shadow-2xs">
            <FileCheck className="w-3 h-3 text-emerald-600" />
            {getDocTypeBadge()}
          </span>
        )}
      </div>

      {/* DRAG & DROP / UPLOAD ACTION CONTAINER */}
      {!documentUrl ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-4 sm:p-5 text-center transition-all bg-white ${
            isDragging 
              ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-400/30' 
              : 'border-slate-300 hover:border-amber-400 hover:bg-amber-50/20'
          }`}
        >
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="w-11 h-11 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700 shadow-inner">
              <Upload className="w-5 h-5" />
            </div>

            <div className="space-y-1 max-w-md">
              <p className="text-xs font-bold text-slate-800">
                Upload Special Order File
              </p>
              <p className="text-[11px] text-slate-500">
                Drag & drop official scanned copy here, or browse files from your computer (PDF, PNG, JPG up to 15MB)
              </p>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <button
                type="button"
                id="btn-upload-so-file"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black transition shadow-xs flex items-center gap-1.5 active:scale-95 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Upload File</span>
              </button>

              <button
                type="button"
                id="btn-select-so-from-drive"
                onClick={() => setShowDrivePicker(true)}
                className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition shadow-2xs flex items-center gap-1.5 active:scale-95 cursor-pointer"
              >
                <FolderOpen className="w-4 h-4 text-amber-600" />
                <span>Select from Google Drive</span>
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        </div>
      ) : (
        /* ATTACHED FILE CARD */
        <div className="bg-white p-3.5 rounded-xl border border-slate-300 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700 shrink-0">
              <FileCheck className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-slate-900 truncate">
                {fileName || `${soNumber} Official Document`}
              </p>
              <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                <span className="font-semibold text-slate-700">{getDocTypeBadge()}</span>
                {fileSize && (
                  <>
                    <span>•</span>
                    <span className="font-mono">{fileSize}</span>
                  </>
                )}
                {isGoogleDriveLink && (
                  <>
                    <span>•</span>
                    <span className="text-blue-600 font-medium">Drive Sync</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* ACTION CONTROLS */}
          <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
            <button
              type="button"
              onClick={handleOpenDocument}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow-2xs flex items-center gap-1"
              title="Preview / View Attached Special Order"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview</span>
              <ExternalLink className="w-3 h-3 ml-0.5" />
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition flex items-center gap-1"
              title="Replace current file"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Replace</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onChange('');
                setFileName('');
                setFileSize('');
              }}
              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition flex items-center"
              title="Remove document attachment"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        </div>
      )}

      {/* ERROR ALERT */}
      {uploadError && (
        <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-700 bg-rose-50 p-2.5 rounded-lg border border-rose-200 animate-fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* OPTIONAL URL LINK TOGGLE */}
      <div className="pt-0.5">
        {!showUrlFallback && !documentUrl ? (
          <button
            type="button"
            onClick={() => setShowUrlFallback(true)}
            className="text-[11px] text-slate-500 hover:text-amber-800 font-medium flex items-center gap-1 transition"
          >
            <LinkIcon className="w-3 h-3 text-slate-400" />
            <span>Need to paste an external web link instead?</span>
          </button>
        ) : showUrlFallback ? (
          <div className="space-y-1 bg-white p-2.5 rounded-lg border border-slate-200 animate-fade-in">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
              <span>External Document Link (URL)</span>
              <button
                type="button"
                onClick={() => setShowUrlFallback(false)}
                className="text-slate-400 hover:text-slate-600 text-[10px]"
              >
                Hide
              </button>
            </div>
            <div className="relative">
              <input
                type="text"
                value={documentUrl}
                onChange={(e) => {
                  onChange(e.target.value);
                  setFileName('');
                  setFileSize('');
                }}
                placeholder="https://drive.google.com/... or https://onedrive.live.com/..."
                className="w-full pl-7 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <LinkIcon className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2" />
            </div>
          </div>
        ) : null}
        
        <p className="text-[10px] text-slate-400 mt-1">
          {helperText}
        </p>
      </div>

      {/* GOOGLE DRIVE PICKER MODAL */}
      <GoogleDrivePickerModal
        isOpen={showDrivePicker}
        onClose={() => setShowDrivePicker(false)}
        title={`Select Special Order Document (${soNumber})`}
        allowedType="documents"
        onSelectFile={(url, name) => {
          onChange(url);
          setFileName(name);
          setFileSize('Drive File');
        }}
      />
    </div>
  );
};
