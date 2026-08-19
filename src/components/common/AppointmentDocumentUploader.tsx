import React, { useRef, useState } from 'react';
import { FileText, Upload, Trash2, ExternalLink, FileCheck, AlertCircle } from 'lucide-react';

interface AppointmentDocumentUploaderProps {
  documentUrl: string;
  onChange: (url: string) => void;
  positionName?: string;
  label?: string;
  required?: boolean;
}

export const AppointmentDocumentUploader: React.FC<AppointmentDocumentUploaderProps> = ({
  documentUrl,
  onChange,
  positionName = 'Current Position',
  label,
  required = false
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState('');
  const [fileName, setFileName] = useState<string>('');

  const displayLabel = label || `Appointment Document for ${positionName} ${required ? '*' : '(Optional)'}`;

  // Handle local file selection (PDF, Image, Doc)
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError('');
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (limit 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Selected file exceeds the 10MB limit. Please choose a smaller file or paste a web link.');
      return;
    }

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const result = evt.target?.result as string;
      if (result) {
        onChange(result);
      }
    };
    reader.onerror = () => {
      setUploadError('Failed to read file. Please try again or paste a link.');
    };
    reader.readAsDataURL(file);
  };

  const handleOpenDocument = () => {
    if (!documentUrl) return;
    if (documentUrl.startsWith('data:')) {
      // For data URLs, open in a new window/tab
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

  const isDataUrl = documentUrl.startsWith('data:');
  const isPdf = isDataUrl && documentUrl.includes('application/pdf');
  const isImage = isDataUrl && documentUrl.includes('image/');

  return (
    <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-slate-800">
          {displayLabel}
        </label>
        {documentUrl && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
            <FileCheck className="w-3 h-3 text-emerald-600" />
            Document Attached
          </span>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        {/* Upload File Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5 shrink-0"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Appointment File</span>
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
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1"
              title="View or download uploaded appointment document"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>View Document</span>
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
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Or paste appointment document link for ${positionName}...`}
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <FileText className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
        </div>
        <p className="text-[10px] text-slate-500 mt-1">
          Upload PDF/image/document file for <b>{positionName}</b> (e.g., appointment paper, Oath of Office) or paste a document link.
        </p>
      </div>
    </div>
  );
};
