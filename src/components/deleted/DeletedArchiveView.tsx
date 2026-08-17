import React, { useState, useMemo } from 'react';
import { useHRIS } from '../../context/HRISContext';
import { useAuth } from '../../context/AuthContext';
import { 
  Trash2, 
  RotateCcw, 
  AlertTriangle, 
  Users, 
  Building2, 
  Search, 
  CheckCircle, 
  X, 
  UserPlus, 
  Plus, 
  Calendar,
  Clock,
  ShieldAlert,
  CalendarOff,
  FileText,
  ExternalLink,
  Award
} from 'lucide-react';
import { DeletedLeaveRecord } from '../../types';

interface DeletedArchiveViewProps {
  onNavigateAddEmployee?: () => void;
  onNavigateAddSchool?: () => void;
}

export const DeletedArchiveView: React.FC<DeletedArchiveViewProps> = ({
  onNavigateAddEmployee,
  onNavigateAddSchool
}) => {
  const { 
    deletedEmployees, 
    deletedSchools, 
    deletedLeaveRecords,
    deletedSpecialOrders,
    restoreEmployee, 
    permanentlyDeleteEmployee,
    restoreSchool, 
    permanentlyDeleteSchool,
    restoreLeaveRecord,
    permanentlyDeleteLeaveRecord,
    restoreSpecialOrder,
    permanentlyDeleteSpecialOrder,
    addSchool
  } = useHRIS();
  const { role } = useAuth();

  const [activeTab, setActiveTab] = useState<'PERSONNEL' | 'SCHOOLS' | 'LEAVE_RECORDS' | 'SPECIAL_ORDERS'>('PERSONNEL');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Feedback notification
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modals for confirmation
  const [confirmDeleteEmp, setConfirmDeleteEmp] = useState<{ id: string; name: string } | null>(null);
  const [confirmDeleteSch, setConfirmDeleteSch] = useState<{ id: string; name: string } | null>(null);
  const [confirmDeleteLeave, setConfirmDeleteLeave] = useState<{ id: string; title: string } | null>(null);
  const [confirmDeleteSO, setConfirmDeleteSO] = useState<{ id: string; title: string } | null>(null);

  // Quick Add School Modal
  const [showAddSchoolModal, setShowAddSchoolModal] = useState(false);
  const [newSchoolName, setNewSchoolName] = useState('');
  const [addSchoolError, setAddSchoolError] = useState('');

  const showToast = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
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

  // Filter deleted employees
  const filteredEmployees = useMemo(() => {
    return deletedEmployees.filter(emp => {
      const term = searchTerm.toLowerCase();
      const fullName = `${emp.lastName}, ${emp.firstName} ${emp.middleName || ''}`.toLowerCase();
      return (
        fullName.includes(term) ||
        emp.employeeNumber.toLowerCase().includes(term) ||
        emp.currentPosition.toLowerCase().includes(term) ||
        emp.schoolName.toLowerCase().includes(term)
      );
    });
  }, [deletedEmployees, searchTerm]);

  // Filter deleted schools
  const filteredSchools = useMemo(() => {
    return deletedSchools.filter(sch => {
      const term = searchTerm.toLowerCase();
      return sch.name.toLowerCase().includes(term);
    });
  }, [deletedSchools, searchTerm]);

  // Filter deleted leave records
  const filteredLeaveRecords = useMemo(() => {
    return (deletedLeaveRecords || []).filter(lvr => {
      const term = searchTerm.toLowerCase();
      const empName = (lvr.employeeName || '').toLowerCase();
      const empNum = (lvr.employeeNumber || '').toLowerCase();
      const schName = (lvr.schoolName || '').toLowerCase();
      const lvrType = (lvr.leaveType || '').toLowerCase();
      const remarks = (lvr.remarks || '').toLowerCase();
      const reason = (lvr.deleteReason || '').toLowerCase();
      return (
        empName.includes(term) ||
        empNum.includes(term) ||
        schName.includes(term) ||
        lvrType.includes(term) ||
        remarks.includes(term) ||
        reason.includes(term)
      );
    });
  }, [deletedLeaveRecords, searchTerm]);

  // Filter deleted special orders
  const filteredSpecialOrders = useMemo(() => {
    return (deletedSpecialOrders || []).filter(so => {
      const term = searchTerm.toLowerCase();
      const num = (so.soNumber || '').toLowerCase();
      const title = (so.title || '').toLowerCase();
      const date = (so.soDate || '').toLowerCase();
      const reason = (so.deleteReason || '').toLowerCase();
      return (
        num.includes(term) ||
        title.includes(term) ||
        date.includes(term) ||
        reason.includes(term)
      );
    });
  }, [deletedSpecialOrders, searchTerm]);

  // Actions
  const handleRestoreEmp = (id: string) => {
    const res = restoreEmployee(id);
    if (res.success) {
      showToast('success', res.message);
    } else {
      showToast('error', res.message);
    }
  };

  const handlePermanentDeleteEmp = () => {
    if (!confirmDeleteEmp) return;
    const res = permanentlyDeleteEmployee(confirmDeleteEmp.id);
    setConfirmDeleteEmp(null);
    showToast('success', res.message);
  };

  const handleRestoreSch = (id: string) => {
    const res = restoreSchool(id);
    if (res.success) {
      showToast('success', res.message);
    } else {
      showToast('error', res.message);
    }
  };

  const handlePermanentDeleteSch = () => {
    if (!confirmDeleteSch) return;
    const res = permanentlyDeleteSchool(confirmDeleteSch.id);
    setConfirmDeleteSch(null);
    showToast('success', res.message);
  };

  const handleRestoreLeave = (id: string) => {
    const res = restoreLeaveRecord(id);
    if (res.success) {
      showToast('success', res.message);
    } else {
      showToast('error', res.message);
    }
  };

  const handlePermanentDeleteLeave = () => {
    if (!confirmDeleteLeave) return;
    const res = permanentlyDeleteLeaveRecord(confirmDeleteLeave.id);
    setConfirmDeleteLeave(null);
    showToast('success', res.message);
  };

  const handleRestoreSO = (id: string) => {
    const res = restoreSpecialOrder(id);
    if (res.success) {
      showToast('success', res.message);
    } else {
      showToast('error', res.message);
    }
  };

  const handlePermanentDeleteSO = () => {
    if (!confirmDeleteSO) return;
    const res = permanentlyDeleteSpecialOrder(confirmDeleteSO.id);
    setConfirmDeleteSO(null);
    showToast('success', res.message);
  };

  const handleAddSchoolSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAddSchoolError('');
    const res = addSchool(newSchoolName);
    if (!res.success) {
      setAddSchoolError(res.message);
    } else {
      setNewSchoolName('');
      setShowAddSchoolModal(false);
      showToast('success', `"${newSchoolName}" added successfully.`);
    }
  };

  const totalDeletedCount = deletedEmployees.length + deletedSchools.length + (deletedLeaveRecords?.length || 0) + (deletedSpecialOrders?.length || 0);

  return (
    <div id="deleted-records-archive-page" className="space-y-6 pb-16">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-rose-600 uppercase tracking-wider mb-1">
            <Trash2 className="w-4 h-4" />
            <span>Guimba West District • Deleted Records Archive</span>
          </div>
          <h1 className="text-xl font-extrabold text-slate-900">
            District Deleted Records ({totalDeletedCount})
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Safely review, restore, or permanently purge previously deleted personnel, schools, and leave entries.
          </p>
        </div>

        {/* Quick Add Buttons */}
        {role === 'ADMIN' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (onNavigateAddEmployee) onNavigateAddEmployee();
              }}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition shadow-xs flex items-center space-x-1.5"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Personnel</span>
            </button>
            <button
              onClick={() => {
                setNewSchoolName('');
                setAddSchoolError('');
                setShowAddSchoolModal(true);
              }}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl transition shadow-xs flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add School</span>
            </button>
          </div>
        )}
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-semibold shadow-sm transition ${
          notification.type === 'success' 
            ? 'bg-emerald-50 text-emerald-900 border-emerald-200' 
            : 'bg-rose-50 text-rose-900 border-rose-200'
        }`}>
          <div className="flex items-center space-x-2">
            {notification.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Subtabs & Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* Tabs */}
          <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => { setActiveTab('PERSONNEL'); setSearchTerm(''); }}
              className={`flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                activeTab === 'PERSONNEL'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Deleted Personnel</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                activeTab === 'PERSONNEL' ? 'bg-amber-400 text-slate-950' : 'bg-slate-300 text-slate-700'
              }`}>
                {deletedEmployees.length}
              </span>
            </button>

            <button
              onClick={() => { setActiveTab('SCHOOLS'); setSearchTerm(''); }}
              className={`flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                activeTab === 'SCHOOLS'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Deleted Schools</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                activeTab === 'SCHOOLS' ? 'bg-amber-400 text-slate-950' : 'bg-slate-300 text-slate-700'
              }`}>
                {deletedSchools.length}
              </span>
            </button>

            <button
              onClick={() => { setActiveTab('LEAVE_RECORDS'); setSearchTerm(''); }}
              className={`flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                activeTab === 'LEAVE_RECORDS'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <CalendarOff className="w-4 h-4" />
              <span>Deleted Leave Records</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                activeTab === 'LEAVE_RECORDS' ? 'bg-amber-400 text-slate-950' : 'bg-slate-300 text-slate-700'
              }`}>
                {deletedLeaveRecords?.length || 0}
              </span>
            </button>

            <button
              onClick={() => { setActiveTab('SPECIAL_ORDERS'); setSearchTerm(''); }}
              className={`flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                activeTab === 'SPECIAL_ORDERS'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>Deleted Special Orders</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                activeTab === 'SPECIAL_ORDERS' ? 'bg-amber-400 text-slate-950' : 'bg-slate-300 text-slate-700'
              }`}>
                {deletedSpecialOrders?.length || 0}
              </span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={
                activeTab === 'PERSONNEL'
                  ? 'Search deleted personnel...'
                  : activeTab === 'SCHOOLS'
                  ? 'Search deleted schools...'
                  : activeTab === 'LEAVE_RECORDS'
                  ? 'Search deleted leave records...'
                  : 'Search deleted special orders...'
              }
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

        </div>
      </div>

      {/* Tab 1: Deleted Personnel */}
      {activeTab === 'PERSONNEL' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {filteredEmployees.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No deleted personnel records found.</p>
              <p className="text-xs text-slate-400 mt-1">
                {searchTerm ? "No deleted personnel match your search term." : "All personnel records are currently active or inactive in the directory."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Deleted Employee</th>
                    <th className="py-3 px-4">Employee #</th>
                    <th className="py-3 px-4">Former Position</th>
                    <th className="py-3 px-4">Assigned School</th>
                    <th className="py-3 px-4">Deletion Details</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {filteredEmployees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 text-xs sm:text-sm">
                          {emp.lastName}, {emp.firstName} {emp.middleName || ''} {emp.extensionName || ''}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          ID: {emp.id}
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-slate-700">
                        #{emp.employeeNumber}
                      </td>

                      <td className="py-3 px-4 font-medium text-slate-900">
                        {emp.currentPosition}
                      </td>

                      <td className="py-3 px-4 text-slate-700">
                        {emp.schoolName}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-1 text-rose-700 font-semibold text-[11px]">
                          <Clock className="w-3 h-3 text-rose-500" />
                          <span>{new Date(emp.deletedAt).toLocaleDateString()} {new Date(emp.deletedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 truncate max-w-xs mt-0.5">
                          {emp.deleteReason || 'Administrator action'}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right space-x-2">
                        {role === 'ADMIN' ? (
                          <>
                            <button
                              onClick={() => handleRestoreEmp(emp.id)}
                              className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold inline-flex items-center space-x-1 transition"
                              title="Restore Employee Record"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Restore</span>
                            </button>

                            <button
                              onClick={() => setConfirmDeleteEmp({ id: emp.id, name: `${emp.firstName} ${emp.lastName}` })}
                              className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold inline-flex items-center space-x-1 transition"
                              title="Permanently Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete Forever</span>
                            </button>
                          </>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Admin only</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Deleted Schools */}
      {activeTab === 'SCHOOLS' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {filteredSchools.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No deleted schools found.</p>
              <p className="text-xs text-slate-400 mt-1">
                {searchTerm ? "No deleted schools match your search term." : "All district schools are currently active or inactive."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">School Name</th>
                    <th className="py-3 px-4">Former Status</th>
                    <th className="py-3 px-4">Deletion Details</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {filteredSchools.map((sch) => (
                    <tr key={sch.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4">
                        <div className="font-extrabold text-slate-900 text-xs sm:text-sm flex items-center space-x-2">
                          <Building2 className="w-4 h-4 text-amber-600" />
                          <span>{sch.name}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 ml-6">
                          District: Guimba West District
                        </div>
                      </td>

                      <td className="py-3 px-4 font-semibold text-slate-600">
                        {sch.status}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-1 text-rose-700 font-semibold text-[11px]">
                          <Clock className="w-3 h-3 text-rose-500" />
                          <span>{new Date(sch.deletedAt).toLocaleDateString()} {new Date(sch.deletedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 truncate max-w-xs mt-0.5">
                          {sch.deleteReason || 'Administrator action'}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right space-x-2">
                        {role === 'ADMIN' ? (
                          <>
                            <button
                              onClick={() => handleRestoreSch(sch.id)}
                              className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold inline-flex items-center space-x-1 transition"
                              title="Restore School"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Restore</span>
                            </button>

                            <button
                              onClick={() => setConfirmDeleteSch({ id: sch.id, name: sch.name })}
                              className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold inline-flex items-center space-x-1 transition"
                              title="Permanently Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete Forever</span>
                            </button>
                          </>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Admin only</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Deleted Leave Records */}
      {activeTab === 'LEAVE_RECORDS' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {filteredLeaveRecords.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <CalendarOff className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No deleted leave records found.</p>
              <p className="text-xs text-slate-400 mt-1">
                {searchTerm
                  ? "No deleted leave records match your search query."
                  : "All recorded leave entries are currently active in the district leave log."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Employee / School</th>
                    <th className="py-3 px-4">Leave Type</th>
                    <th className="py-3 px-4">Inclusive Dates</th>
                    <th className="py-3 px-4"># Days</th>
                    <th className="py-3 px-4">Supporting Document</th>
                    <th className="py-3 px-4">Deletion Details</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {filteredLeaveRecords.map((lvr) => (
                    <tr key={lvr.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 text-xs sm:text-sm">
                          {lvr.employeeName || lvr.employeeId}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center space-x-1.5 mt-0.5">
                          {lvr.employeeNumber && (
                            <span className="font-mono text-slate-600">#{lvr.employeeNumber}</span>
                          )}
                          {lvr.schoolName && (
                            <span>• {lvr.schoolName}</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 font-semibold text-slate-800">
                        <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded text-[11px] font-bold inline-block">
                          {lvr.leaveType}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-medium text-slate-700">
                        {lvr.dateFrom} to {lvr.dateTo}
                      </td>

                      <td className="py-3 px-4 font-extrabold text-amber-900">
                        {lvr.numberOfDays} {lvr.numberOfDays === 1 ? 'day' : 'days'}
                      </td>

                      <td className="py-3 px-4">
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

                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-1 text-rose-700 font-semibold text-[11px]">
                          <Clock className="w-3 h-3 text-rose-500" />
                          <span>
                            {new Date(lvr.deletedAt).toLocaleDateString()}{' '}
                            {new Date(lvr.deletedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 truncate max-w-xs mt-0.5">
                          {lvr.deleteReason || 'Administrator action'}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                        {role === 'ADMIN' ? (
                          <>
                            <button
                              onClick={() => handleRestoreLeave(lvr.id)}
                              className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold inline-flex items-center space-x-1 transition"
                              title="Restore Leave Record"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Restore</span>
                            </button>

                            <button
                              onClick={() =>
                                setConfirmDeleteLeave({
                                  id: lvr.id,
                                  title: `${lvr.employeeName || 'Employee'} - ${lvr.leaveType} (${lvr.numberOfDays} days)`
                                })
                              }
                              className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold inline-flex items-center space-x-1 transition"
                              title="Permanently Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete Forever</span>
                            </button>
                          </>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Admin only</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Deleted Special Orders */}
      {activeTab === 'SPECIAL_ORDERS' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {filteredSpecialOrders.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <Award className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No deleted Special Orders found.</p>
              <p className="text-xs text-slate-400 mt-1">
                {searchTerm
                  ? "No deleted Special Orders match your search query."
                  : "All Special Orders are currently active in the service credits registry."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">SO Number & Title</th>
                    <th className="py-3 px-4">Date Issued</th>
                    <th className="py-3 px-4">Recipients / Credits</th>
                    <th className="py-3 px-4">Attached Document</th>
                    <th className="py-3 px-4">Deletion Details</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {filteredSpecialOrders.map((so) => (
                    <tr key={so.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-extrabold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded text-xs">
                            {so.soNumber}
                          </span>
                        </div>
                        <div className="font-bold text-slate-900 text-xs sm:text-sm mt-1">
                          {so.title}
                        </div>
                      </td>

                      <td className="py-3 px-4 font-medium text-slate-700">
                        {so.soDate}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 text-xs">
                          {so.totalRecipients || 0} recipient{(so.totalRecipients || 0) === 1 ? '' : 's'}
                        </div>
                        <div className="text-[11px] text-emerald-700 font-extrabold mt-0.5">
                          {(so.totalGrantedCredits || 0).toFixed(1)} days granted
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {so.soDocumentUrl ? (
                          <button
                            type="button"
                            onClick={() => handleOpenDoc(so.soDocumentUrl!)}
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

                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-1 text-rose-700 font-semibold text-[11px]">
                          <Clock className="w-3 h-3 text-rose-500" />
                          <span>
                            {new Date(so.deletedAt).toLocaleDateString()}{' '}
                            {new Date(so.deletedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 truncate max-w-xs mt-0.5">
                          {so.deleteReason || 'Administrator action'}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                        {role === 'ADMIN' ? (
                          <>
                            <button
                              onClick={() => handleRestoreSO(so.id)}
                              className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold inline-flex items-center space-x-1 transition"
                              title="Restore Special Order"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Restore</span>
                            </button>

                            <button
                              onClick={() =>
                                setConfirmDeleteSO({
                                  id: so.id,
                                  title: `${so.soNumber} - ${so.title}`
                                })
                              }
                              className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold inline-flex items-center space-x-1 transition"
                              title="Permanently Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete Forever</span>
                            </button>
                          </>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Admin only</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal: Permanent Delete Personnel Confirmation */}
      {confirmDeleteEmp && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white text-slate-900 rounded-xl max-w-md w-full p-6 shadow-2xl border border-rose-200">
            <div className="flex items-center space-x-3 text-rose-600 mb-3">
              <div className="p-2.5 bg-rose-100 rounded-xl">
                <ShieldAlert className="w-6 h-6 text-rose-600" />
              </div>
              <h3 className="font-extrabold text-base text-slate-900">
                Permanently Delete Personnel?
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Are you sure you want to permanently erase <b>{confirmDeleteEmp.name}</b> from the system? This action is <b>irreversible</b> and will permanently remove all associated service credits, promotions, and leave records.
            </p>

            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteEmp(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePermanentDeleteEmp}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs shadow-xs"
              >
                Yes, Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Permanent Delete School Confirmation */}
      {confirmDeleteSch && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white text-slate-900 rounded-xl max-w-md w-full p-6 shadow-2xl border border-rose-200">
            <div className="flex items-center space-x-3 text-rose-600 mb-3">
              <div className="p-2.5 bg-rose-100 rounded-xl">
                <ShieldAlert className="w-6 h-6 text-rose-600" />
              </div>
              <h3 className="font-extrabold text-base text-slate-900">
                Permanently Delete School?
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Are you sure you want to permanently erase <b>{confirmDeleteSch.name}</b> from the system? This action cannot be undone.
            </p>

            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteSch(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePermanentDeleteSch}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs shadow-xs"
              >
                Yes, Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Permanent Delete Leave Record Confirmation */}
      {confirmDeleteLeave && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white text-slate-900 rounded-xl max-w-md w-full p-6 shadow-2xl border border-rose-200">
            <div className="flex items-center space-x-3 text-rose-600 mb-3">
              <div className="p-2.5 bg-rose-100 rounded-xl">
                <ShieldAlert className="w-6 h-6 text-rose-600" />
              </div>
              <h3 className="font-extrabold text-base text-slate-900">
                Permanently Delete Leave Record?
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Are you sure you want to permanently erase <b>{confirmDeleteLeave.title}</b> from the system archive? This action cannot be undone.
            </p>

            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteLeave(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePermanentDeleteLeave}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs shadow-xs"
              >
                Yes, Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Permanent Delete Special Order Confirmation */}
      {confirmDeleteSO && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white text-slate-900 rounded-xl max-w-md w-full p-6 shadow-2xl border border-rose-200">
            <div className="flex items-center space-x-3 text-rose-600 mb-3">
              <div className="p-2.5 bg-rose-100 rounded-xl">
                <ShieldAlert className="w-6 h-6 text-rose-600" />
              </div>
              <h3 className="font-extrabold text-base text-slate-900">
                Permanently Delete Special Order?
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Are you sure you want to permanently erase <b>{confirmDeleteSO.title}</b> from the system archive? This action cannot be undone.
            </p>

            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteSO(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePermanentDeleteSO}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs shadow-xs"
              >
                Yes, Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add School */}
      {showAddSchoolModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white text-slate-900 rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-600" />
                Add Guimba West District School
              </h3>
              <button onClick={() => setShowAddSchoolModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {addSchoolError && (
              <p className="text-xs text-rose-600 font-bold mt-2">{addSchoolError}</p>
            )}

            <form onSubmit={handleAddSchoolSubmit} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">School Name *</label>
                <input
                  type="text"
                  required
                  value={newSchoolName}
                  onChange={(e) => setNewSchoolName(e.target.value)}
                  placeholder="e.g. Nagpapanikian Elementary School"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddSchoolModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg"
                >
                  Save School
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
