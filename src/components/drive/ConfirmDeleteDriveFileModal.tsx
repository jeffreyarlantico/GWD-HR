import React from 'react';
import { AlertTriangle, Trash2, X, FileText, Folder } from 'lucide-react';
import { DriveFileItem, FOLDER_MIME_TYPE } from '../../services/googleDriveService';

interface ConfirmDeleteDriveFileModalProps {
  isOpen: boolean;
  file: DriveFileItem | null;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting?: boolean;
}

export const ConfirmDeleteDriveFileModal: React.FC<ConfirmDeleteDriveFileModalProps> = ({
  isOpen,
  file,
  onClose,
  onConfirm,
  isDeleting = false,
}) => {
  if (!isOpen || !file) return null;

  const isFolder = file.mimeType === FOLDER_MIME_TYPE;

  return (
    <div
      id="confirm-delete-drive-file-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
    >
      <div
        id="confirm-delete-drive-file-modal"
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="bg-rose-50 border-b border-rose-100 p-5 flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600 flex-shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                Delete {isFolder ? 'Folder' : 'File'} from Google Drive?
              </h2>
              <p className="text-xs text-rose-700 font-medium mt-0.5">
                This action will delete the item from your Google Drive.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-white/80 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center space-x-3">
            <div className="p-2.5 bg-white border border-slate-200 rounded-lg text-slate-700">
              {isFolder ? (
                <Folder className="w-6 h-6 text-amber-500 fill-amber-100" />
              ) : (
                <FileText className="w-6 h-6 text-blue-600" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-slate-900 truncate">
                {file.name}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {isFolder ? 'Google Drive Folder' : `${file.mimeType} • ${file.size ? (parseInt(file.size) / 1024).toFixed(1) + ' KB' : 'Cloud File'}`}
              </div>
            </div>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              {isFolder
                ? 'Deleting this folder will remove all items stored inside it from your Google Drive account.'
                : 'Confirming will permanently remove this document from your Google Drive storage.'}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isDeleting}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center space-x-1.5"
            >
              {isDeleting ? (
                <span>Deleting...</span>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete from Drive</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
