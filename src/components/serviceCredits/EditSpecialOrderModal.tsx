import React, { useState, useEffect, useMemo } from 'react';
import { 
  Award, 
  X, 
  Calendar, 
  FileText, 
  Users, 
  Search, 
  Building2, 
  Save, 
  Trash2, 
  AlertCircle, 
  CheckCircle2, 
  Plus, 
  Filter,
  Info
} from 'lucide-react';
import { SpecialOrder, Employee, ServiceCreditEarned, ServiceCreditUsed, School } from '../../types';
import { SpecialOrderAttachmentUploader } from '../common/SpecialOrderAttachmentUploader';

interface EditSpecialOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  specialOrder: SpecialOrder | null;
  employees: Employee[];
  schools: School[];
  earnedCredits: ServiceCreditEarned[];
  usedCredits: ServiceCreditUsed[];
  onSave: (updatedSO: {
    id: string;
    soNumber: string;
    soDate: string;
    title: string;
    soDocumentUrl?: string;
    allocations: {
      id?: string;
      employeeId: string;
      earnedCredits: number;
      remarks?: string;
    }[];
    deletedAllocationIds: string[];
  }) => { success: boolean; message: string };
}

interface AllocationItem {
  id?: string; // existing earned record id if any
  employeeId: string;
  employeeName: string;
  employeeNumber: string;
  schoolName: string;
  position: string;
  earnedCredits: number;
  usedCredits: number;
  remarks: string;
  isNew?: boolean;
}

export const EditSpecialOrderModal: React.FC<EditSpecialOrderModalProps> = ({
  isOpen,
  onClose,
  specialOrder,
  employees,
  schools,
  earnedCredits,
  usedCredits,
  onSave
}) => {
  // Form State
  const [soNumber, setSoNumber] = useState('');
  const [soDate, setSoDate] = useState('');
  const [title, setTitle] = useState('');
  const [soDocumentUrl, setSoDocumentUrl] = useState('');

  // Allocations State
  const [allocations, setAllocations] = useState<AllocationItem[]>([]);
  const [deletedAllocationIds, setDeletedAllocationIds] = useState<string[]>([]);

  // Search & Filter for adding new teachers
  const [showAddTeachersSection, setShowAddTeachersSection] = useState(false);
  const [teacherSearch, setTeacherSearch] = useState('');
  const [schoolFilter, setSchoolFilter] = useState('ALL');
  const [newSelectedTeachersMap, setNewSelectedTeachersMap] = useState<Record<string, number>>({});

  // Feedback states
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Initialize form when modal opens with a special order
  useEffect(() => {
    if (specialOrder && isOpen) {
      setSoNumber(specialOrder.soNumber || '');
      setSoDate(specialOrder.soDate || new Date().toISOString().split('T')[0]);
      setTitle(specialOrder.title || '');
      setSoDocumentUrl(specialOrder.soDocumentUrl || '');
      setErrorMessage('');
      setSuccessMessage('');
      setDeletedAllocationIds([]);
      setNewSelectedTeachersMap({});
      setShowAddTeachersSection(false);

      // Find existing earned credits for this SO
      const existingEarned = earnedCredits.filter(ec => ec.soId === specialOrder.id);
      const existingUsed = usedCredits.filter(uc => uc.soId === specialOrder.id);

      const mapped: AllocationItem[] = existingEarned.map(ec => {
        const emp = employees.find(e => e.id === ec.employeeId);
        const empUsed = existingUsed
          .filter(uc => uc.employeeId === ec.employeeId)
          .reduce((sum, u) => sum + (u.usedCredits || 0), 0);

        return {
          id: ec.id,
          employeeId: ec.employeeId,
          employeeName: emp ? `${emp.lastName}, ${emp.firstName} ${emp.middleName || ''}`.trim() : 'Unknown Employee',
          employeeNumber: emp?.employeeNumber || '—',
          schoolName: emp?.schoolName || 'Unassigned',
          position: emp?.currentPosition || 'Teacher',
          earnedCredits: ec.earnedCredits || 0,
          usedCredits: empUsed,
          remarks: ec.remarks || '',
          isNew: false
        };
      });

      setAllocations(mapped);
    }
  }, [specialOrder, isOpen, earnedCredits, usedCredits, employees]);

  // Set of employee IDs already in allocations
  const assignedEmployeeIds = useMemo(() => {
    return new Set(allocations.map(a => a.employeeId));
  }, [allocations]);

  // Filter available teachers to add
  const availableTeachersToAdd = useMemo(() => {
    return employees.filter(emp => {
      // Don't show if already in allocations
      if (assignedEmployeeIds.has(emp.id)) return false;

      // School filter
      if (schoolFilter !== 'ALL') {
        const targetSchool = schools.find(s => s.id === schoolFilter || s.name === schoolFilter);
        const targetSchoolId = targetSchool ? targetSchool.id : schoolFilter;
        const targetSchoolName = targetSchool ? targetSchool.name.trim().toLowerCase() : schoolFilter.trim().toLowerCase();

        const empSchoolId = (emp.schoolId || '').trim();
        const empSchoolName = (emp.schoolName || '').trim().toLowerCase();

        const matchesId = Boolean(empSchoolId && empSchoolId === targetSchoolId);
        const matchesName = Boolean(empSchoolName && (empSchoolName === targetSchoolName || empSchoolName === targetSchoolId.toLowerCase()));
        const matchesDirect = empSchoolId === schoolFilter || empSchoolName === schoolFilter.trim().toLowerCase();

        if (!matchesId && !matchesName && !matchesDirect) {
          return false;
        }
      }

      // Search query
      if (teacherSearch.trim()) {
        const q = teacherSearch.toLowerCase().trim();
        const fullName = `${emp.lastName}, ${emp.firstName} ${emp.middleName || ''}`.toLowerCase();
        const empNum = (emp.employeeNumber || '').toLowerCase();
        const pos = (emp.currentPosition || (emp as any).position || '').toLowerCase();
        const sch = (emp.schoolName || '').toLowerCase();
        return fullName.includes(q) || empNum.includes(q) || pos.includes(q) || sch.includes(q);
      }

      return true;
    });
  }, [employees, assignedEmployeeIds, schoolFilter, teacherSearch, schools]);

  // Quick apply batch days to visible searched teachers
  const handleApplyBatchDays = (days: number) => {
    if (days <= 0) return;
    setNewSelectedTeachersMap(prev => {
      const next = { ...prev };
      availableTeachersToAdd.forEach(emp => {
        next[emp.id] = days;
      });
      return next;
    });
  };

  // Add selected teachers into the active allocations list
  const handleAddSelectedTeachers = () => {
    const toAdd: AllocationItem[] = [];
    Object.entries(newSelectedTeachersMap).forEach(([empId, credits]) => {
      if (credits > 0) {
        const emp = employees.find(e => e.id === empId);
        if (emp) {
          toAdd.push({
            employeeId: emp.id,
            employeeName: `${emp.lastName}, ${emp.firstName} ${emp.middleName || ''}`.trim(),
            employeeNumber: emp.employeeNumber || '—',
            schoolName: emp.schoolName || 'Unassigned',
            position: emp.currentPosition || 'Teacher',
            earnedCredits: credits,
            usedCredits: 0,
            remarks: `Granted via ${soNumber || 'SO'}`,
            isNew: true
          });
        }
      }
    });

    if (toAdd.length === 0) {
      setErrorMessage('Please assign at least 0.5 day to one or more teachers before adding.');
      return;
    }

    setAllocations(prev => [...prev, ...toAdd]);
    setNewSelectedTeachersMap({});
    setErrorMessage('');
    setShowAddTeachersSection(false);
  };

  // Update allocation credits
  const handleCreditChange = (index: number, newCredits: number) => {
    setAllocations(prev => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        earnedCredits: newCredits
      };
      return copy;
    });
  };

  // Update allocation remarks
  const handleRemarksChange = (index: number, remarks: string) => {
    setAllocations(prev => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        remarks
      };
      return copy;
    });
  };

  // Remove allocation
  const handleRemoveAllocation = (index: number) => {
    const item = allocations[index];
    if (item.usedCredits > 0) {
      setErrorMessage(
        `Cannot remove ${item.employeeName}. They have ${item.usedCredits.toFixed(1)} day(s) already deducted from this Special Order. You must cancel the deductions first.`
      );
      return;
    }

    if (item.id) {
      setDeletedAllocationIds(prev => [...prev, item.id!]);
    }

    setAllocations(prev => prev.filter((_, i) => i !== index));
    setErrorMessage('');
  };

  // Total summary calculations
  const totalGranted = useMemo(() => {
    return allocations.reduce((sum, item) => sum + (Number(item.earnedCredits) || 0), 0);
  }, [allocations]);

  const totalUsed = useMemo(() => {
    return allocations.reduce((sum, item) => sum + (Number(item.usedCredits) || 0), 0);
  }, [allocations]);

  // Form Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!specialOrder) return;

    // Validate SO fields
    if (!soNumber.trim()) {
      setErrorMessage('Special Order Number is required.');
      return;
    }
    if (!soDate) {
      setErrorMessage('Special Order Date is required.');
      return;
    }
    if (!title.trim()) {
      setErrorMessage('Special Order Title is required.');
      return;
    }

    // Validate allocations: cannot have credit <= 0 or credit < used
    for (const item of allocations) {
      if (item.earnedCredits <= 0) {
        setErrorMessage(`Granted credits for ${item.employeeName} must be greater than 0.`);
        return;
      }
      if (item.earnedCredits < item.usedCredits) {
        setErrorMessage(
          `Granted credits for ${item.employeeName} (${item.earnedCredits}d) cannot be less than credits already used (${item.usedCredits}d).`
        );
        return;
      }
    }

    setIsSaving(true);

    try {
      const result = onSave({
        id: specialOrder.id,
        soNumber: soNumber.trim(),
        soDate,
        title: title.trim(),
        soDocumentUrl: soDocumentUrl.trim() || undefined,
        allocations: allocations.map(a => ({
          id: a.id,
          employeeId: a.employeeId,
          earnedCredits: Number(a.earnedCredits),
          remarks: a.remarks
        })),
        deletedAllocationIds
      });

      if (result.success) {
        setSuccessMessage(result.message || 'Special Order updated successfully.');
        setTimeout(() => {
          setIsSaving(false);
          onClose();
        }, 1000);
      } else {
        setIsSaving(false);
        setErrorMessage(result.message || 'Failed to update Special Order.');
      }
    } catch (err: any) {
      setIsSaving(false);
      setErrorMessage(err.message || 'An unexpected error occurred while saving.');
    }
  };

  if (!isOpen || !specialOrder) return null;

  return (
    <div
      id="edit-special-order-modal-backdrop"
      className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-sm overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div
        id="edit-special-order-modal"
        className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-[#0F2942] text-white p-5 relative border-b border-slate-700">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-amber-300 font-mono tracking-wide uppercase">
                    Edit Special Order
                  </span>
                  <span className="text-slate-400 text-xs">•</span>
                  <span className="text-[11px] font-mono text-slate-300 bg-white/10 px-2 py-0.5 rounded">
                    {specialOrder.soNumber}
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white mt-0.5">
                  Update Special Order & Service Credit Allocations
                </h2>
              </div>
            </div>

            <button
              onClick={onClose}
              disabled={isSaving}
              className="text-slate-400 hover:text-white p-1.5 rounded-xl bg-white/5 hover:bg-white/15 transition flex-shrink-0"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* FEEDBACK ALERTS */}
        {errorMessage && (
          <div className="mx-5 mt-4 p-3 bg-rose-50 border-l-4 border-rose-600 text-rose-900 rounded-lg text-xs font-semibold flex items-start space-x-2 animate-fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold">Validation Alert</p>
              <p className="mt-0.5">{errorMessage}</p>
            </div>
            <button onClick={() => setErrorMessage('')} className="text-rose-500 hover:text-rose-700">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {successMessage && (
          <div className="mx-5 mt-4 p-3 bg-emerald-50 border-l-4 border-emerald-600 text-emerald-900 rounded-lg text-xs font-semibold flex items-center space-x-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span className="font-bold">{successMessage}</span>
          </div>
        )}

        {/* FORM CONTENT */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
          
          {/* SECTION 1: SPECIAL ORDER CORE DETAILS */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <h3 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
              <FileText className="w-4 h-4 text-amber-600" />
              <span>Special Order Details</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Special Order Number <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={soNumber}
                  onChange={(e) => setSoNumber(e.target.value)}
                  placeholder="e.g. SO-2026-005"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Date of Issue <span className="text-rose-600">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={soDate}
                  onChange={(e) => setSoDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">
                  Title of Service Credit Activity <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Guimba West District Sports Meet Coaching & Officiating Services"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="sm:col-span-2">
                <SpecialOrderAttachmentUploader
                  documentUrl={soDocumentUrl}
                  onChange={setSoDocumentUrl}
                  soNumber={soNumber || 'Special Order'}
                  label="Official Special Order Document / Attachment"
                  helperText="Upload official scanned PDF or image copy of the approved Special Order, or select from Google Drive."
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: RECIPIENT TEACHERS & SERVICE CREDIT ALLOCATIONS */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-slate-200">
              <div>
                <h3 className="font-extrabold text-slate-900 flex items-center gap-1.5 text-xs">
                  <Users className="w-4 h-4 text-amber-600" />
                  <span>Beneficiary Teachers Roster ({allocations.length})</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Total Granted: <b className="text-emerald-700 font-extrabold">+{totalGranted.toFixed(1)} days</b> • 
                  Total Used: <b className="text-rose-700 font-extrabold">-{totalUsed.toFixed(1)} days</b> • 
                  Available: <b className="text-amber-800 font-extrabold">{(totalGranted - totalUsed).toFixed(1)} days</b>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddTeachersSection(prev => !prev)}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition flex items-center gap-1.5 ${
                  showAddTeachersSection
                    ? 'bg-slate-200 text-slate-800 hover:bg-slate-300'
                    : 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-xs'
                }`}
              >
                {showAddTeachersSection ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                <span>{showAddTeachersSection ? 'Close Teacher Selector' : 'Add More Teachers'}</span>
              </button>
            </div>

            {/* EXPANDABLE SECTION: SEARCH & ADD NEW TEACHERS */}
            {showAddTeachersSection && (
              <div className="bg-amber-50/50 p-3.5 rounded-xl border border-amber-200 space-y-3 animate-fade-in">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-amber-950 flex items-center gap-1 text-xs">
                    <Plus className="w-3.5 h-3.5 text-amber-700" />
                    <span>Select Teachers to Add to this Special Order</span>
                  </h4>
                  <span className="text-[10px] text-amber-800 font-medium">
                    {availableTeachersToAdd.length} available
                  </span>
                </div>

                {/* Search & School Filter */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      value={teacherSearch}
                      onChange={(e) => setTeacherSearch(e.target.value)}
                      placeholder="Search teacher by name, ID number, position..."
                      className="w-full pl-8 pr-14 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    {teacherSearch && (
                      <button
                        type="button"
                        onClick={() => setTeacherSearch('')}
                        className="absolute right-2 top-1.5 text-xs font-bold text-slate-400 hover:text-slate-700"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  <select
                    value={schoolFilter}
                    onChange={(e) => setSchoolFilter(e.target.value)}
                    className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="ALL">All Stations ({schools.length})</option>
                    {schools.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                {/* Quick Batch Assign Controls */}
                <div className="flex flex-wrap items-center justify-between text-[11px] pt-1 border-t border-amber-200/60 gap-1 text-slate-600">
                  <span className="font-semibold text-amber-900">
                    Showing <b>{availableTeachersToAdd.length}</b> non-assigned teachers
                  </span>

                  <div className="flex items-center space-x-1">
                    <span className="text-[10px] text-slate-500 font-semibold">Quick Set All:</span>
                    <button
                      type="button"
                      onClick={() => handleApplyBatchDays(1.0)}
                      className="px-2 py-0.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded text-[10px]"
                    >
                      +1 Day
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyBatchDays(2.0)}
                      className="px-2 py-0.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded text-[10px]"
                    >
                      +2 Days
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyBatchDays(3.0)}
                      className="px-2 py-0.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded text-[10px]"
                    >
                      +3 Days
                    </button>
                  </div>
                </div>

                {/* Teacher Selection List */}
                <div className="max-h-48 overflow-y-auto border border-amber-200 rounded-lg divide-y divide-slate-100 bg-white">
                  {availableTeachersToAdd.length === 0 ? (
                    <div className="py-6 text-center text-slate-400">
                      <Users className="w-5 h-5 mx-auto mb-1 opacity-50" />
                      <p className="font-bold text-xs">No matching teachers available</p>
                      <p className="text-[10px]">All matching teachers may already be added to this Special Order.</p>
                    </div>
                  ) : (
                    availableTeachersToAdd.map(emp => {
                      const currentVal = newSelectedTeachersMap[emp.id] || 0;
                      return (
                        <div key={emp.id} className="py-1.5 px-2.5 flex items-center justify-between text-xs hover:bg-amber-50/50 transition">
                          <div className="flex-1 pr-2">
                            <p className="font-bold text-slate-900">{emp.lastName}, {emp.firstName} {emp.middleName ? `${emp.middleName[0]}.` : ''}</p>
                            <p className="text-[10px] text-slate-500">
                              #{emp.employeeNumber} • {emp.currentPosition || (emp as any).position || 'Teacher'} • <span className="text-slate-600 font-medium">{emp.schoolName}</span>
                            </p>
                          </div>
                          <div className="flex items-center space-x-1 flex-shrink-0">
                            <input
                              type="number"
                              step="0.5"
                              min="0"
                              value={currentVal || ''}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setNewSelectedTeachersMap(prev => ({
                                  ...prev,
                                  [emp.id]: val
                                }));
                              }}
                              placeholder="0.0"
                              className="w-16 px-2 py-1 bg-white border border-slate-300 rounded text-center font-extrabold text-amber-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                            />
                            <span className="text-[11px] text-slate-500">days</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Add Selected Teachers Action */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-amber-900 font-semibold">
                    {Object.values(newSelectedTeachersMap).filter(v => v > 0).length} teacher(s) selected with credits
                  </span>
                  <button
                    type="button"
                    onClick={handleAddSelectedTeachers}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition shadow-xs flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add to Special Order Roster</span>
                  </button>
                </div>
              </div>
            )}

            {/* CURRENT ALLOCATIONS TABLE */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              {allocations.length === 0 ? (
                <div className="py-10 text-center text-slate-400 space-y-1">
                  <Users className="w-7 h-7 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-600">No teachers assigned to this Special Order</p>
                  <p className="text-[11px] text-slate-400">
                    Click "Add More Teachers" above to allocate service credits to district personnel.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100/90 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
                      <tr>
                        <th className="py-2.5 px-3">Teacher / Personnel</th>
                        <th className="py-2.5 px-3">Station</th>
                        <th className="py-2.5 px-3 text-center">Granted Days</th>
                        <th className="py-2.5 px-3 text-center">Deducted</th>
                        <th className="py-2.5 px-3">Remarks / Role</th>
                        <th className="py-2.5 px-3 text-right">Remove</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {allocations.map((item, index) => {
                        const hasDeductions = item.usedCredits > 0;
                        return (
                          <tr key={item.id || item.employeeId} className={`hover:bg-slate-50/80 transition ${item.isNew ? 'bg-emerald-50/30' : ''}`}>
                            {/* Teacher Info */}
                            <td className="py-2.5 px-3">
                              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                <span>{item.employeeName}</span>
                                {item.isNew && (
                                  <span className="text-[9px] font-extrabold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                                    NEW
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                                <span className="font-mono">ID: {item.employeeNumber}</span>
                                <span>•</span>
                                <span className="text-amber-800">{item.position}</span>
                              </div>
                            </td>

                            {/* School */}
                            <td className="py-2.5 px-3">
                              <span className="text-slate-700 flex items-center gap-1 font-medium">
                                <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                                {item.schoolName}
                              </span>
                            </td>

                            {/* Granted Credits Input */}
                            <td className="py-2.5 px-3 text-center">
                              <div className="inline-flex items-center gap-1">
                                <input
                                  type="number"
                                  step="0.5"
                                  min={item.usedCredits > 0 ? item.usedCredits : 0.5}
                                  required
                                  value={item.earnedCredits}
                                  onChange={(e) => handleCreditChange(index, parseFloat(e.target.value) || 0)}
                                  className={`w-18 px-2 py-1 bg-white border rounded text-center font-extrabold focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                                    item.earnedCredits < item.usedCredits
                                      ? 'border-rose-500 text-rose-700 bg-rose-50'
                                      : 'border-slate-300 text-emerald-700'
                                  }`}
                                />
                                <span className="text-[11px] text-slate-500 font-medium">d</span>
                              </div>
                            </td>

                            {/* Deducted Credits */}
                            <td className="py-2.5 px-3 text-center">
                              {hasDeductions ? (
                                <span className="font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded text-[11px]">
                                  -{item.usedCredits.toFixed(1)}d
                                </span>
                              ) : (
                                <span className="text-slate-400 font-mono text-[11px]">0.0</span>
                              )}
                            </td>

                            {/* Remarks Input */}
                            <td className="py-2.5 px-3">
                              <input
                                type="text"
                                value={item.remarks}
                                onChange={(e) => handleRemarksChange(index, e.target.value)}
                                placeholder="e.g. District Sports Meet Facilitator"
                                className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-slate-700 text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                              />
                            </td>

                            {/* Remove Action */}
                            <td className="py-2.5 px-3 text-right">
                              <button
                                type="button"
                                onClick={() => handleRemoveAllocation(index)}
                                disabled={hasDeductions}
                                className={`p-1.5 rounded transition ${
                                  hasDeductions
                                    ? 'text-slate-300 cursor-not-allowed'
                                    : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                                }`}
                                title={
                                  hasDeductions
                                    ? `Cannot remove: ${item.usedCredits}d used from this SO`
                                    : 'Remove teacher from this Special Order'
                                }
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

        </form>

        {/* MODAL FOOTER */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-3.5 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            <span>Changes will update the master service credits record and sync to Firestore.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSaving}
              className="px-5 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl transition shadow-xs flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving Changes...' : 'Save Special Order Changes'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
