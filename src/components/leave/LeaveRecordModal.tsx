import React, { useState, useEffect } from 'react';
import { useHRIS } from '../../context/HRISContext';
import { useAuth } from '../../context/AuthContext';
import { LeaveType } from '../../types';
import { CalendarOff, Save, X, User, Building2, Search, CheckCircle2, AlertCircle } from 'lucide-react';
import { AppointmentDocumentUploader } from '../common/AppointmentDocumentUploader';

interface LeaveRecordModalProps {
  employeeId?: string;
  onClose: () => void;
}

export const LeaveRecordModal: React.FC<LeaveRecordModalProps> = ({ employeeId = '', onClose }) => {
  const { addLeaveRecord, employees } = useHRIS();
  const { role } = useAuth();

  const [selectedEmpId, setSelectedEmpId] = useState<string>(employeeId);
  const [empSearch, setEmpSearch] = useState('');
  const [leaveType, setLeaveType] = useState<LeaveType>('Maternity Leave');
  const [dateFrom, setDateFrom] = useState(new Date().toISOString().split('T')[0]);
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [numberOfDays, setNumberOfDays] = useState<number>(1);
  const [documentUrl, setDocumentUrl] = useState('');
  const [remarks, setRemarks] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Sorted list of employees for selection
  const sortedEmployees = [...employees].sort((a, b) => a.lastName.localeCompare(b.lastName));
  const filteredEmployees = sortedEmployees.filter(emp => {
    const fullName = `${emp.lastName}, ${emp.firstName} ${emp.middleName || ''}`.toLowerCase();
    const search = empSearch.toLowerCase();
    return fullName.includes(search) || emp.employeeNumber.includes(search) || emp.schoolName.toLowerCase().includes(search);
  });

  const selectedEmployee = employees.find(e => e.id === selectedEmpId);

  // Auto-calculate work/calendar days when dates change
  useEffect(() => {
    if (dateFrom && dateTo) {
      const dFrom = new Date(dateFrom);
      const dTo = new Date(dateTo);
      if (!isNaN(dFrom.getTime()) && !isNaN(dTo.getTime()) && dTo >= dFrom) {
        const diffTime = Math.abs(dTo.getTime() - dFrom.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        setNumberOfDays(diffDays);
      }
    }
  }, [dateFrom, dateTo]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (role !== 'ADMIN') {
      setErrorMsg('Access Denied: Only Administrators are authorized to record leave entries.');
      return;
    }

    if (!selectedEmpId) {
      setErrorMsg('Please select an employee first before saving the leave record.');
      return;
    }

    if (!dateFrom || !dateTo || numberOfDays <= 0) {
      setErrorMsg('Please enter valid dates and number of days.');
      return;
    }

    addLeaveRecord({
      employeeId: selectedEmpId,
      leaveType,
      dateFrom,
      dateTo,
      numberOfDays: Number(numberOfDays),
      documentUrl: documentUrl.trim(),
      remarks: remarks.trim(),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white text-slate-900 rounded-xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
        
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <CalendarOff className="w-5 h-5 text-amber-600" />
            <div>
              <h3 className="font-bold text-base text-slate-900">Record Employee Leave Entry</h3>
              <p className="text-[11px] text-slate-500">Select employee first, then log leave details</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          {/* STEP 1: Select Employee First */}
          <div className="bg-amber-50/60 p-3.5 rounded-xl border border-amber-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="block font-extrabold text-slate-900 flex items-center gap-1.5">
                <User className="w-4 h-4 text-amber-600" />
                <span>1. Select Employee *</span>
              </label>
              {selectedEmployee && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Employee Selected
                </span>
              )}
            </div>

            {/* Search Filter for Employee */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={empSearch}
                onChange={(e) => setEmpSearch(e.target.value)}
                placeholder="Search teacher by name, ID, or school..."
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Employee Dropdown */}
            <select
              required
              value={selectedEmpId}
              onChange={(e) => setSelectedEmpId(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold"
            >
              <option value="">-- Click to Select Employee --</option>
              {filteredEmployees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.lastName}, {emp.firstName} {emp.middleName ? `${emp.middleName[0]}.` : ''} — {emp.currentPosition} (#{emp.employeeNumber}) • {emp.schoolName}
                </option>
              ))}
            </select>

            {/* Selected Employee Preview Card */}
            {selectedEmployee ? (
              <div className="bg-white p-2.5 rounded-lg border border-amber-300 shadow-2xs flex items-center justify-between text-xs">
                <div>
                  <p className="font-extrabold text-slate-900">
                    {selectedEmployee.lastName}, {selectedEmployee.firstName} {selectedEmployee.middleName || ''}
                  </p>
                  <p className="text-[11px] text-amber-800 font-semibold">
                    {selectedEmployee.currentPosition} • ID #{selectedEmployee.employeeNumber}
                  </p>
                </div>
                <div className="text-right text-[11px] text-slate-500 flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-slate-400" />
                  <span>{selectedEmployee.schoolName}</span>
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-amber-800 italic">
                * Please pick an employee from the dropdown above to proceed.
              </p>
            )}
          </div>

          {/* STEP 2: Leave Details */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-800 border-b border-slate-100 pb-1 flex items-center gap-1.5">
              <CalendarOff className="w-3.5 h-3.5 text-amber-600" />
              <span>2. Enter Leave Details</span>
            </h4>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Leave Type *</label>
              <select
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value as LeaveType)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold"
              >
                <option value="Maternity Leave">Maternity Leave</option>
                <option value="Leave Without Pay (LWOP)">Leave Without Pay (LWOP)</option>
                <option value="Paternity Leave">Paternity Leave</option>
                <option value="Sick Leave">Sick Leave</option>
                <option value="Vacation Leave">Vacation Leave</option>
                <option value="Special Privilege Leave">Special Privilege Leave</option>
                <option value="Study Leave">Study Leave</option>
                <option value="Rehabilitation Leave">Rehabilitation Leave</option>
                <option value="Others">Others</option>
              </select>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Date From *</label>
                <input
                  type="date"
                  required
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Date To *</label>
                <input
                  type="date"
                  required
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1"># Days *</label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  required
                  value={numberOfDays}
                  onChange={(e) => setNumberOfDays(parseFloat(e.target.value) || 1)}
                  className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Supporting Document */}
            <AppointmentDocumentUploader
              documentUrl={documentUrl}
              onChange={setDocumentUrl}
              positionName={leaveType}
              label={`Supporting Document / Medical Cert (${leaveType})`}
            />

            <div>
              <label className="block font-bold text-slate-700 mb-1">Remarks / Details</label>
              <textarea
                rows={2}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="e.g. Approved medical leave with attached division clearance..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {errorMsg && (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedEmpId || role !== 'ADMIN'}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold rounded-lg flex items-center space-x-1 transition shadow-xs"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Leave Entry</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

