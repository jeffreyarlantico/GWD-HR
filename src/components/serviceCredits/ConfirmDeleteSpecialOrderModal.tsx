import React, { useState } from 'react';
import { AlertTriangle, Trash2, X, Award, FileText, Calendar, Users, ShieldAlert } from 'lucide-react';

interface ConfirmDeleteSpecialOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  specialOrder: {
    id: string;
    soNumber: string;
    soDate: string;
    title: string;
    soDocumentUrl?: string;
    totalRecipients?: number;
    totalGranted?: number;
  } | null;
}

export const ConfirmDeleteSpecialOrderModal: React.FC<ConfirmDeleteSpecialOrderModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  specialOrder,
}) => {
  const [deleteReason, setDeleteReason] = useState('Deleted by Administrator');

  if (!isOpen || !specialOrder) return null;

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(deleteReason.trim() || 'Deleted by Administrator');
  };

  return (
    <div
      id="confirm-delete-so-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
    >
      <div
        id="confirm-delete-so-modal"
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="bg-rose-50 border-b border-rose-100 p-5 flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600 flex-shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                Confirm Special Order Deletion
              </h2>
              <p className="text-xs text-rose-700 font-medium mt-0.5">
                Review Special Order details before moving to archive
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-white/80 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleConfirm} className="p-6 space-y-5">
          {/* Warning Message Box */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start space-x-2.5 text-xs text-amber-900">
            <ShieldAlert className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <p className="font-bold">Are you sure you want to delete this Special Order?</p>
              <p className="text-amber-800 text-[11px] leading-relaxed">
                This Special Order will be moved to the{' '}
                <strong className="font-semibold text-amber-950">Deleted Records Archive</strong>.
                You can review its details, restore it at any time, or permanently purge it from the system.
              </p>
            </div>
          </div>

          {/* Record Summary Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-amber-600" />
              <span>Special Order Details</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono font-extrabold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded text-xs">
                  {specialOrder.soNumber}
                </span>
                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Issued: {specialOrder.soDate}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 font-medium block">Title / Activity</span>
                <h4 className="font-bold text-slate-900 text-sm">{specialOrder.title}</h4>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200/80">
                <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-center">
                  <span className="text-[10px] text-slate-500 font-medium flex items-center justify-center gap-1">
                    <Users className="w-3 h-3 text-slate-400" /> Affected Teachers
                  </span>
                  <span className="font-extrabold text-slate-900 text-xs mt-0.5 block">
                    {specialOrder.totalRecipients || 0} recipient{(specialOrder.totalRecipients || 0) === 1 ? '' : 's'}
                  </span>
                </div>

                <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-center">
                  <span className="text-[10px] text-slate-500 font-medium flex items-center justify-center gap-1">
                    <Award className="w-3 h-3 text-emerald-600" /> Total Granted
                  </span>
                  <span className="font-extrabold text-emerald-700 text-xs mt-0.5 block">
                    {(specialOrder.totalGranted || 0).toFixed(1)} days
                  </span>
                </div>
              </div>

              {specialOrder.soDocumentUrl && (
                <div className="pt-1 flex items-center gap-1 text-[11px] text-blue-700">
                  <FileText className="w-3.5 h-3.5" />
                  <span className="font-medium truncate">Attached document will be preserved in archive</span>
                </div>
              )}
            </div>
          </div>

          {/* Reason for Deletion */}
          <div className="space-y-1.5">
            <label
              htmlFor="delete-so-reason-input"
              className="block text-xs font-bold text-slate-700"
            >
              Reason for Deletion <span className="text-slate-400 font-normal">(optional archive note)</span>
            </label>
            <input
              id="delete-so-reason-input"
              type="text"
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              placeholder="e.g., Cancelled event, Duplicate SO entry, Rectified SO number..."
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end space-x-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition shadow-sm flex items-center space-x-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Yes, Move to Deleted Records</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
