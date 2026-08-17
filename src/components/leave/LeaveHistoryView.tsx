import React, { useState } from 'react';
import { useHRIS } from '../../context/HRISContext';
import { useAuth } from '../../context/AuthContext';
import { CalendarOff, FileText, ExternalLink, Plus, Search, Trash2, CheckCircle, AlertTriangle } from 'lucide-react';
import { LeaveRecordModal } from './LeaveRecordModal';
import { ConfirmDeleteLeaveModal } from './ConfirmDeleteLeaveModal';
import { LeaveRecord } from '../../types';

export const LeaveHistoryView: React.FC = () => {
  const { leaveRecords, employees, deleteLeaveRecord } = useHRIS();
  const { role } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<{
    id: string;
    leaveType: string;
    dateFrom: string;
    dateTo: string;
    numberOfDays: number;
    remarks?: string;
    employeeName?: string;
    schoolName?: string;
  } | null>(null);

  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4500);
  };

  const handleOpenDoc = (url: string) => {
    if (!url) return;
    if (url.startsWith('data:')) {
      const win = window.open();
      if (win) {
        if (url.startsWith('data:application/pdf')) {
          win.document.write(
            `<iframe src="${url}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`
          );
        } else if (url.startsWith('data:image')) {
          win.document.write(
            `<div style="display:flex;justify-content:center;align-items:center;min-height:100vh;background:#0f172a;"><img src="${url}" style="max-width:100%;max-height:100vh;object-fit:contain;"/></div>`
          );
        } else {
          win.document.write(
            `<div style="font-family:sans-serif;padding:2rem;text-align:center;"><h2>Leave Document</h2><a href="${url}" download="leave_document">Click here to download file</a></div>`
          );
        }
      }
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleInitiateDelete = (lvr: LeaveRecord) => {
    const emp = employees.find(e => e.id === lvr.employeeId);
    setRecordToDelete({
      id: lvr.id,
      leaveType: lvr.leaveType,
      dateFrom: lvr.dateFrom,
      dateTo: lvr.dateTo,
      numberOfDays: lvr.numberOfDays,
      remarks: lvr.remarks,
      employeeName: emp ? `${emp.lastName}, ${emp.firstName}` : lvr.employeeId,
      schoolName: emp?.schoolName || ''
    });
  };

  const handleConfirmDelete = (reason: string) => {
    if (!recordToDelete) return;
    const res = deleteLeaveRecord(recordToDelete.id, reason);
    setRecordToDelete(null);
    if (res.success) {
      showToast('success', res.message);
    } else {
      showToast('error', res.message);
    }
  };

  const filteredLeaves = leaveRecords.filter(lvr => {
    const emp = employees.find(e => e.id === lvr.employeeId);
    const name = emp ? `${emp.lastName}, ${emp.firstName}`.toLowerCase() : '';
    const term = searchTerm.toLowerCase();
    return (
      name.includes(term) ||
      lvr.leaveType.toLowerCase().includes(term) ||
      (lvr.remarks && lvr.remarks.toLowerCase().includes(term))
    );
  });

  return (
    <div id="leave-history-module" className="space-y-6 pb-16">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs font-semibold shadow-sm transition ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-rose-50 text-rose-900 border-rose-200'
          }`}
        >
          <div className="flex items-center space-x-2">
            {toastMessage.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-slate-600 ml-4 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">
            <CalendarOff className="w-4 h-4" />
            <span>Guimba West District • Leave Log</span>
          </div>
          <h1 className="text-xl font-extrabold text-slate-900">
            District Leave Records ({leaveRecords.length})
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Log of recorded leaves (Maternity Leave, LWOP, etc.). Select employee first to add leave entries.
          </p>
        </div>

        {role === 'ADMIN' && (
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl transition shadow-sm flex items-center space-x-2 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Record Leave Entry</span>
          </button>
        )}
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search leave records by employee name, leave type, or remarks..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Leave Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        {filteredLeaves.length === 0 ? (
          <p className="text-xs text-slate-500 py-8 text-center">No leave records match your search query.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase">
                <tr>
                  <th className="py-2.5 px-3">Employee</th>
                  <th className="py-2.5 px-3">Leave Type</th>
                  <th className="py-2.5 px-3">Date From</th>
                  <th className="py-2.5 px-3">Date To</th>
                  <th className="py-2.5 px-3"># Days</th>
                  <th className="py-2.5 px-3">Supporting Doc</th>
                  <th className="py-2.5 px-3">Remarks</th>
                  {role === 'ADMIN' && <th className="py-2.5 px-3 text-right">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLeaves.map(lvr => {
                  const emp = employees.find(e => e.id === lvr.employeeId);
                  return (
                    <tr key={lvr.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        {emp ? `${emp.lastName}, ${emp.firstName}` : lvr.employeeId}
                        <div className="text-[10px] text-slate-400 font-normal">{emp?.schoolName}</div>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">{lvr.leaveType}</td>
                      <td className="py-2.5 px-3">{lvr.dateFrom}</td>
                      <td className="py-2.5 px-3">{lvr.dateTo}</td>
                      <td className="py-2.5 px-3 font-extrabold text-amber-800">{lvr.numberOfDays} days</td>
                      <td className="py-2.5 px-3">
                        {lvr.documentUrl ? (
                          <button
                            type="button"
                            onClick={() => handleOpenDoc(lvr.documentUrl)}
                            className="inline-flex items-center space-x-1 text-blue-700 hover:underline font-bold"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>View Doc</span>
                            <ExternalLink className="w-3 h-3 ml-0.5" />
                          </button>
                        ) : (
                          <span className="text-slate-400 italic">No document</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">{lvr.remarks || '—'}</td>
                      {role === 'ADMIN' && (
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => handleInitiateDelete(lvr)}
                            className="text-rose-600 hover:text-rose-800 p-1.5 rounded-lg hover:bg-rose-50 transition"
                            title="Delete leave record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Leave Modal */}
      {showModal && (
        <LeaveRecordModal
          onClose={() => setShowModal(false)}
        />
      )}

      {/* Confirm Delete Leave Modal */}
      <ConfirmDeleteLeaveModal
        isOpen={Boolean(recordToDelete)}
        onClose={() => setRecordToDelete(null)}
        onConfirm={handleConfirmDelete}
        leaveRecord={recordToDelete}
      />

    </div>
  );
};

