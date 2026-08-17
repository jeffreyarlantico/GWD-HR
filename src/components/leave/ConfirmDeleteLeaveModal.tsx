import React, { useState } from 'react';
import { AlertTriangle, Trash2, X, CalendarOff, User, Building, Calendar, FileText } from 'lucide-react';

interface ConfirmDeleteLeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  leaveRecord: {
    id: string;
    leaveType: string;
    dateFrom: string;
    dateTo: string;
    numberOfDays: number;
    remarks?: string;
    employeeName?: string;
    schoolName?: string;
  } | null;
}

export const ConfirmDeleteLeaveModal: React.FC<ConfirmDeleteLeaveModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  leaveRecord,
}) => {
  const [deleteReason, setDeleteReason] = useState('Deleted by Administrator');

  if (!isOpen || !leaveRecord) return null;

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(deleteReason.trim() || 'Deleted by Administrator');
  };

  return (
    <div
      id="confirm-delete-leave-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
    >
      <div
        id="confirm-delete-leave-modal"
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
                Confirm Leave Record Deletion
              </h2>
              <p className="text-xs text-rose-700 font-medium mt-0.5">
                Please verify the leave transaction details before proceeding
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
            <CalendarOff className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <p className="font-bold">Are you sure you want to delete this leave entry?</p>
              <p className="text-amber-800 text-[11px] leading-relaxed">
                After deletion, this entry will be safely moved to the{' '}
                <strong className="font-semibold text-amber-950">Deleted Records Archive</strong>,
                where it can be reviewed, restored anytime, or permanently purged.
              </p>
            </div>
          </div>

          {/* Record Summary Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              <span>Leave Record Details</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {leaveRecord.employeeName && (
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                    <User className="w-3 h-3" /> Personnel
                  </span>
                  <span className="font-bold text-slate-900 block truncate">
                    {leaveRecord.employeeName}
                  </span>
                </div>
              )}

              {leaveRecord.schoolName && (
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                    <Building className="w-3 h-3" /> School Station
                  </span>
                  <span className="font-bold text-slate-800 block truncate">
                    {leaveRecord.schoolName}
                  </span>
                </div>
              )}

              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-400 font-medium">Leave Type</span>
                <span className="font-bold text-amber-900 bg-amber-100/70 border border-amber-200 px-2 py-0.5 rounded text-[11px] inline-block">
                  {leaveRecord.leaveType}
                </span>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Inclusive Dates
                </span>
                <span className="font-bold text-slate-800 block">
                  {leaveRecord.dateFrom} to {leaveRecord.dateTo}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs">
              <span className="text-slate-500">Duration:</span>
              <span className="font-extrabold text-slate-900 bg-white border border-slate-300 px-2.5 py-0.5 rounded-full shadow-2xs">
                {leaveRecord.numberOfDays} {leaveRecord.numberOfDays === 1 ? 'day' : 'days'}
              </span>
            </div>

            {leaveRecord.remarks && (
              <div className="pt-1 text-[11px] text-slate-500 italic">
                Remarks: "{leaveRecord.remarks}"
              </div>
            )}
          </div>

          {/* Reason for Deletion */}
          <div className="space-y-1.5">
            <label
              htmlFor="delete-leave-reason-input"
              className="block text-xs font-bold text-slate-700"
            >
              Reason for Deletion <span className="text-slate-400 font-normal">(optional archive note)</span>
            </label>
            <input
              id="delete-leave-reason-input"
              type="text"
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              placeholder="e.g., Application cancelled, Duplicate record, Incorrect leave type..."
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
