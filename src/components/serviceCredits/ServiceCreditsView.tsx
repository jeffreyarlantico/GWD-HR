import React, { useState, useMemo } from 'react';
import { useHRIS } from '../../context/HRISContext';
import { useAuth } from '../../context/AuthContext';
import { 
  Award, 
  FileText, 
  Plus, 
  ExternalLink, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  Save, 
  Trash2,
  Users,
  Search,
  MinusCircle,
  Filter
} from 'lucide-react';
import { SpecialOrder } from '../../types';

export const ServiceCreditsView: React.FC = () => {
  const { 
    specialOrders, 
    earnedCredits, 
    usedCredits, 
    employees, 
    schools,
    addSpecialOrder, 
    addEarnedCreditsBatch, 
    addUsedCredit, 
    deleteEarnedCredit,
    deleteUsedCredit,
    getAvailableSpecialOrdersForEmployee
  } = useHRIS();
  
  const { role } = useAuth();

  const [activeSubTab, setActiveSubTab] = useState<'SPECIAL_ORDERS' | 'EARNED' | 'USED'>('SPECIAL_ORDERS');

  // Modal states
  const [showAddSOModal, setShowAddSOModal] = useState(false);
  const [showDeductModal, setShowDeductModal] = useState(false);

  // New SO state
  const [soNumber, setSoNumber] = useState('');
  const [soDate, setSoDate] = useState(new Date().toISOString().split('T')[0]);
  const [soTitle, setSoTitle] = useState('');
  const [soDocumentUrl, setSoDocumentUrl] = useState('');
  
  // Teachers credit allocation state under new SO
  const [selectedEmployeesMap, setSelectedEmployeesMap] = useState<Record<string, number>>({});
  const [soModalError, setSoModalError] = useState('');

  // Search & Filter state for Assigning Credits in Special Order modal
  const [soTeacherSearch, setSoTeacherSearch] = useState('');
  const [soSchoolFilter, setSoSchoolFilter] = useState('ALL');

  // Search & Filter state for Recording Deductions
  const [deductTeacherSearch, setDeductTeacherSearch] = useState('');
  const [deductSchoolFilter, setDeductSchoolFilter] = useState('ALL');

  // Deduct Credit state
  const [deductEmpId, setDeductEmpId] = useState('');
  const [deductSoId, setDeductSoId] = useState('');
  const [deductDate, setDeductDate] = useState(new Date().toISOString().split('T')[0]);
  const [deductAmount, setDeductAmount] = useState(1.0);
  const [deductRemarks, setDeductRemarks] = useState('');
  const [deductError, setDeductError] = useState('');
  const [deductSuccess, setDeductSuccess] = useState('');

  // Search filter for logs
  const [filterSearch, setFilterSearch] = useState('');

  // Filtered teachers for Create Special Order Modal
  const filteredSoTeachers = useMemo(() => {
    return employees.filter(emp => {
      // School filter
      if (soSchoolFilter !== 'ALL') {
        const targetSchool = schools.find(s => s.id === soSchoolFilter || s.name === soSchoolFilter);
        const targetSchoolId = targetSchool ? targetSchool.id : soSchoolFilter;
        const targetSchoolName = targetSchool ? targetSchool.name.trim().toLowerCase() : soSchoolFilter.trim().toLowerCase();

        const empSchoolId = (emp.schoolId || '').trim();
        const empSchoolName = (emp.schoolName || '').trim().toLowerCase();

        const matchesId = Boolean(empSchoolId && empSchoolId === targetSchoolId);
        const matchesName = Boolean(empSchoolName && (empSchoolName === targetSchoolName || empSchoolName === targetSchoolId.toLowerCase()));
        const matchesDirect = empSchoolId === soSchoolFilter || empSchoolName === soSchoolFilter.trim().toLowerCase();

        if (!matchesId && !matchesName && !matchesDirect) {
          return false;
        }
      }
      // Search term
      if (soTeacherSearch.trim()) {
        const q = soTeacherSearch.toLowerCase().trim();
        const fullName = `${emp.lastName}, ${emp.firstName} ${emp.middleName || ''}`.toLowerCase();
        const empNum = (emp.employeeNumber || '').toLowerCase();
        const pos = (emp.currentPosition || (emp as any).position || '').toLowerCase();
        const sch = (emp.schoolName || '').toLowerCase();
        return fullName.includes(q) || empNum.includes(q) || pos.includes(q) || sch.includes(q);
      }
      return true;
    });
  }, [employees, schools, soSchoolFilter, soTeacherSearch]);

  // Quick apply batch days to all visible searched teachers
  const handleApplyBatchDays = (days: number) => {
    if (days <= 0) return;
    setSelectedEmployeesMap(prev => {
      const next = { ...prev };
      filteredSoTeachers.forEach(emp => {
        next[emp.id] = days;
      });
      return next;
    });
  };

  const handleClearAllAllocations = () => {
    setSelectedEmployeesMap({});
  };

  // Filtered teachers for Deduction Modal
  const filteredDeductTeachers = useMemo(() => {
    return employees.filter(emp => {
      // School filter
      if (deductSchoolFilter !== 'ALL') {
        const targetSchool = schools.find(s => s.id === deductSchoolFilter || s.name === deductSchoolFilter);
        const targetSchoolId = targetSchool ? targetSchool.id : deductSchoolFilter;
        const targetSchoolName = targetSchool ? targetSchool.name.trim().toLowerCase() : deductSchoolFilter.trim().toLowerCase();

        const empSchoolId = (emp.schoolId || '').trim();
        const empSchoolName = (emp.schoolName || '').trim().toLowerCase();

        const matchesId = Boolean(empSchoolId && empSchoolId === targetSchoolId);
        const matchesName = Boolean(empSchoolName && (empSchoolName === targetSchoolName || empSchoolName === targetSchoolId.toLowerCase()));
        const matchesDirect = empSchoolId === deductSchoolFilter || empSchoolName === deductSchoolFilter.trim().toLowerCase();

        if (!matchesId && !matchesName && !matchesDirect) {
          return false;
        }
      }

      // Search term
      if (deductTeacherSearch.trim()) {
        const q = deductTeacherSearch.toLowerCase().trim();
        const fullName = `${emp.lastName}, ${emp.firstName} ${emp.middleName || ''}`.toLowerCase();
        const empNum = (emp.employeeNumber || '').toLowerCase();
        const pos = (emp.currentPosition || (emp as any).position || '').toLowerCase();
        const sch = (emp.schoolName || '').toLowerCase();
        return fullName.includes(q) || empNum.includes(q) || pos.includes(q) || sch.includes(q);
      }
      return true;
    });
  }, [employees, schools, deductSchoolFilter, deductTeacherSearch]);

  // Filtered Earned and Used credits logs
  const filteredEarnedCredits = useMemo(() => {
    if (!filterSearch.trim()) return earnedCredits;
    const q = filterSearch.toLowerCase().trim();
    return earnedCredits.filter(ec => {
      const emp = employees.find(e => e.id === ec.employeeId);
      const empName = emp ? `${emp.lastName}, ${emp.firstName} ${emp.employeeNumber}`.toLowerCase() : '';
      const soNum = (ec.soNumber || '').toLowerCase();
      const remarks = (ec.remarks || '').toLowerCase();
      return empName.includes(q) || soNum.includes(q) || remarks.includes(q);
    });
  }, [earnedCredits, employees, filterSearch]);

  const filteredUsedCredits = useMemo(() => {
    if (!filterSearch.trim()) return usedCredits;
    const q = filterSearch.toLowerCase().trim();
    return usedCredits.filter(uc => {
      const emp = employees.find(e => e.id === uc.employeeId);
      const empName = emp ? `${emp.lastName}, ${emp.firstName} ${emp.employeeNumber}`.toLowerCase() : '';
      const soNum = (uc.soNumber || '').toLowerCase();
      const remarks = (uc.remarks || '').toLowerCase();
      return empName.includes(q) || soNum.includes(q) || remarks.includes(q);
    });
  }, [usedCredits, employees, filterSearch]);

  // Handle Add SO + Assign Credits
  const handleSaveSO = (e: React.FormEvent) => {
    e.preventDefault();
    setSoModalError('');

    if (!soNumber.trim() || !soTitle.trim()) {
      setSoModalError('Special Order Number and Title are required.');
      return;
    }

    const createdSO = addSpecialOrder({
      soNumber: soNumber.trim(),
      soDate,
      title: soTitle.trim(),
      soDocumentUrl: soDocumentUrl.trim()
    });

    // Add assigned service credits
    const assignments = Object.entries(selectedEmployeesMap)
      .filter(([_, credits]) => Number(credits) > 0)
      .map(([empId, credits]) => ({
        employeeId: empId,
        earnedCredits: Number(credits),
        remarks: `Granted via ${soNumber}`
      }));

    if (assignments.length > 0) {
      addEarnedCreditsBatch(createdSO.id, createdSO.soNumber, assignments);
    }

    // Reset & Close
    setSoNumber('');
    setSoTitle('');
    setSoDocumentUrl('');
    setSelectedEmployeesMap({});
    setShowAddSOModal(false);
  };

  // Handle Deduct Used Credit
  const handleDeductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDeductError('');
    setDeductSuccess('');

    if (!deductEmpId || !deductSoId || deductAmount <= 0) {
      setDeductError('Please select an employee, an eligible Special Order, and enter a positive deduction amount.');
      return;
    }

    const selectedSO = specialOrders.find(s => s.id === deductSoId);

    const result = addUsedCredit({
      employeeId: deductEmpId,
      soId: deductSoId,
      soNumber: selectedSO ? selectedSO.soNumber : 'SO-Unknown',
      dateUsed: deductDate,
      usedCredits: Number(deductAmount),
      remarks: deductRemarks.trim()
    });

    if (!result.success) {
      setDeductError(result.message);
    } else {
      setDeductSuccess(result.message);
      setTimeout(() => {
        setDeductSuccess('');
        setShowDeductModal(false);
        setDeductEmpId('');
        setDeductSoId('');
      }, 1500);
    }
  };

  // Available SOs for selected employee in Deduction Modal
  const availableSOsForDeductEmp = deductEmpId ? getAvailableSpecialOrdersForEmployee(deductEmpId) : [];

  return (
    <div id="service-credits-module" className="space-y-6 pb-16">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">
            <Award className="w-4 h-4" />
            <span>Guimba West District • Service Credits Engine</span>
          </div>
          <h1 className="text-xl font-extrabold text-slate-900">
            Service Credits & Special Orders
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Traceable Special Orders, employee credit grants, and strict balance deductions without over-deduction.
          </p>
        </div>

        {role === 'ADMIN' && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => { setDeductError(''); setDeductSuccess(''); setDeductEmpId(''); setShowDeductModal(true); }}
              className="px-3.5 py-2 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs rounded-xl transition shadow-sm flex items-center space-x-1.5"
            >
              <MinusCircle className="w-4 h-4" />
              <span>Record Used Credits</span>
            </button>

            <button
              onClick={() => { setSoModalError(''); setShowAddSOModal(true); }}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl transition shadow-sm flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Create Special Order</span>
            </button>
          </div>
        )}
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-xl p-1 shadow-2xs space-x-1">
        <button
          onClick={() => setActiveSubTab('SPECIAL_ORDERS')}
          className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition ${
            activeSubTab === 'SPECIAL_ORDERS' ? 'bg-slate-900 text-amber-400 shadow-xs' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          Special Orders ({specialOrders.length})
        </button>
        <button
          onClick={() => setActiveSubTab('EARNED')}
          className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition ${
            activeSubTab === 'EARNED' ? 'bg-slate-900 text-amber-400 shadow-xs' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          Earned Credits Records ({earnedCredits.length})
        </button>
        <button
          onClick={() => setActiveSubTab('USED')}
          className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition ${
            activeSubTab === 'USED' ? 'bg-slate-900 text-amber-400 shadow-xs' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          Used Credits Deductions ({usedCredits.length})
        </button>
      </div>

      {/* SUB-TAB 1: SPECIAL ORDERS LIST */}
      {activeSubTab === 'SPECIAL_ORDERS' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {specialOrders.map(so => {
              const totalGranted = earnedCredits
                .filter(ec => ec.soId === so.id)
                .reduce((sum, item) => sum + (item.earnedCredits || 0), 0);

              const recipientCount = earnedCredits.filter(ec => ec.soId === so.id).length;

              return (
                <div key={so.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono font-extrabold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200 text-xs">
                        {so.soNumber}
                      </span>
                      <h3 className="font-bold text-slate-900 text-sm mt-2">{so.title}</h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">Date Issued: {so.soDate}</p>
                    </div>

                    {so.soDocumentUrl && (
                      <a
                        href={so.soDocumentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition text-xs font-bold flex items-center space-x-1"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>SO Doc</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Recipients: <b className="text-slate-900 font-bold">{recipientCount} teachers</b></span>
                    <span className="text-emerald-700 font-extrabold">Total Granted: {totalGranted.toFixed(1)} days</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: EARNED CREDITS LIST */}
      {activeSubTab === 'EARNED' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <h2 className="text-sm font-bold text-slate-900">Earned Service Credits Log</h2>
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
                placeholder="Search employee, SO #, or remarks..."
                className="w-full pl-8 pr-8 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              {filterSearch && (
                <button
                  onClick={() => setFilterSearch('')}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase">
                <tr>
                  <th className="py-2.5 px-3">Employee</th>
                  <th className="py-2.5 px-3">Special Order #</th>
                  <th className="py-2.5 px-3">Earned Credits</th>
                  <th className="py-2.5 px-3">Remarks</th>
                  {role === 'ADMIN' && <th className="py-2.5 px-3 text-right">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEarnedCredits.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 font-semibold">
                      No earned service credit records match search query.
                    </td>
                  </tr>
                ) : (
                  filteredEarnedCredits.map(ec => {
                    const emp = employees.find(e => e.id === ec.employeeId);
                    return (
                      <tr key={ec.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-bold text-slate-900">
                          {emp ? `${emp.lastName}, ${emp.firstName}` : ec.employeeId}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-semibold text-amber-800">{ec.soNumber}</td>
                        <td className="py-2.5 px-3 font-extrabold text-emerald-700">+{ec.earnedCredits.toFixed(1)} days</td>
                        <td className="py-2.5 px-3 text-slate-600">{ec.remarks || '—'}</td>
                        {role === 'ADMIN' && (
                          <td className="py-2.5 px-3 text-right">
                            <button
                              onClick={() => deleteEarnedCredit(ec.id)}
                              className="text-rose-600 hover:text-rose-800 p-1 rounded hover:bg-rose-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: USED CREDITS LIST */}
      {activeSubTab === 'USED' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <h2 className="text-sm font-bold text-slate-900">Recorded Used Service Credit Deductions</h2>
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
                placeholder="Search employee, SO #, or remarks..."
                className="w-full pl-8 pr-8 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              {filterSearch && (
                <button
                  onClick={() => setFilterSearch('')}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase">
                <tr>
                  <th className="py-2.5 px-3">Employee</th>
                  <th className="py-2.5 px-3">Deducted From SO #</th>
                  <th className="py-2.5 px-3">Date Used</th>
                  <th className="py-2.5 px-3">Used Credits</th>
                  <th className="py-2.5 px-3">Remarks</th>
                  {role === 'ADMIN' && <th className="py-2.5 px-3 text-right">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsedCredits.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 font-semibold">
                      No used credit deduction records match search query.
                    </td>
                  </tr>
                ) : (
                  filteredUsedCredits.map(uc => {
                    const emp = employees.find(e => e.id === uc.employeeId);
                    return (
                      <tr key={uc.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-bold text-slate-900">
                          {emp ? `${emp.lastName}, ${emp.firstName}` : uc.employeeId}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-semibold text-rose-800">{uc.soNumber}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800">{uc.dateUsed}</td>
                        <td className="py-2.5 px-3 font-extrabold text-rose-700">-{uc.usedCredits.toFixed(1)} days</td>
                        <td className="py-2.5 px-3 text-slate-600">{uc.remarks || '—'}</td>
                        {role === 'ADMIN' && (
                          <td className="py-2.5 px-3 text-right">
                            <button
                              onClick={() => deleteUsedCredit(uc.id)}
                              className="text-rose-600 hover:text-rose-800 p-1 rounded hover:bg-rose-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE SPECIAL ORDER MODAL */}
      {showAddSOModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white text-slate-900 rounded-xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-600" />
                Create Special Order & Grant Service Credits
              </h3>
              <button onClick={() => setShowAddSOModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {soModalError && (
              <p className="text-xs text-rose-600 font-bold mt-2">{soModalError}</p>
            )}

            <form onSubmit={handleSaveSO} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">SO Number *</label>
                  <input
                    type="text"
                    required
                    value={soNumber}
                    onChange={(e) => setSoNumber(e.target.value)}
                    placeholder="e.g. SO-2026-005"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">SO Date *</label>
                  <input
                    type="date"
                    required
                    value={soDate}
                    onChange={(e) => setSoDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Title of Service Credit Activity *</label>
                <input
                  type="text"
                  required
                  value={soTitle}
                  onChange={(e) => setSoTitle(e.target.value)}
                  placeholder="e.g. Guimba West District Sports Meet Coaching Services"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">SO Document Reference (OneDrive Link)</label>
                <input
                  type="url"
                  value={soDocumentUrl}
                  onChange={(e) => setSoDocumentUrl(e.target.value)}
                  placeholder="https://onedrive.live.com/view.aspx?resid=..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Assign Individual Teacher Credits */}
              <div className="pt-3 border-t border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div>
                    <span className="font-extrabold text-slate-900 block text-xs">
                      Assign Service Credits per Employee
                    </span>
                    <span className="text-[10px] text-amber-700">
                      Search teachers below and enter credit days earned under this Special Order
                    </span>
                  </div>
                  
                  {Object.keys(selectedEmployeesMap).filter(k => selectedEmployeesMap[k] > 0).length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-900 font-extrabold text-[10px] rounded-full border border-amber-300">
                        {Object.keys(selectedEmployeesMap).filter(k => selectedEmployeesMap[k] > 0).length} Teachers Allocated
                      </span>
                      <button
                        type="button"
                        onClick={handleClearAllAllocations}
                        className="text-[10px] font-bold text-rose-600 hover:text-rose-800 underline"
                      >
                        Reset All
                      </button>
                    </div>
                  )}
                </div>

                {/* Search Bar & School Filter */}
                <div className="bg-slate-100 p-2.5 rounded-lg border border-slate-200 space-y-2 mb-2">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    {/* Search Input with explicit Search Icon & Clear Button */}
                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                      <input
                        type="text"
                        value={soTeacherSearch}
                        onChange={(e) => setSoTeacherSearch(e.target.value)}
                        placeholder="Search teacher name, employee ID, position..."
                        className="w-full pl-8 pr-16 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                      {soTeacherSearch ? (
                        <button
                          type="button"
                          onClick={() => setSoTeacherSearch('')}
                          className="absolute right-2 top-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 px-1.5 py-0.5"
                        >
                          Clear
                        </button>
                      ) : (
                        <span className="absolute right-2.5 top-2 text-[10px] text-slate-400 font-mono">
                          Filter
                        </span>
                      )}
                    </div>

                    {/* School Dropdown Filter */}
                    <select
                      value={soSchoolFilter}
                      onChange={(e) => setSoSchoolFilter(e.target.value)}
                      className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="ALL">All Schools ({schools.length})</option>
                      {schools.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Quick Batch Assign Controls */}
                  <div className="flex flex-wrap items-center justify-between text-[11px] pt-1 border-t border-slate-200/60 gap-1 text-slate-600">
                    <span className="font-semibold text-slate-700">
                      Showing <b>{filteredSoTeachers.length}</b> of <b>{employees.length}</b> teachers
                    </span>

                    <div className="flex items-center space-x-1">
                      <span className="text-[10px] text-slate-500 font-semibold">Quick Set All Visible:</span>
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
                </div>

                {/* Teacher List */}
                <div className="max-h-52 overflow-y-auto border border-slate-200 rounded-lg p-1 divide-y divide-slate-100 bg-white">
                  {filteredSoTeachers.length === 0 ? (
                    <div className="py-6 text-center text-slate-400">
                      <Users className="w-6 h-6 mx-auto mb-1 opacity-50" />
                      <p className="font-bold text-xs">No teachers found matching search</p>
                      <p className="text-[10px]">Try clearing search or changing school filter</p>
                    </div>
                  ) : (
                    filteredSoTeachers.map(emp => {
                      const currentVal = selectedEmployeesMap[emp.id] || 0;
                      const isAllocated = currentVal > 0;
                      return (
                        <div key={emp.id} className={`py-1.5 px-2.5 flex items-center justify-between text-xs transition ${isAllocated ? 'bg-amber-50/70 font-semibold' : 'hover:bg-slate-50'}`}>
                          <div className="flex-1 pr-2">
                            <div className="flex items-center gap-1.5">
                              <p className="font-bold text-slate-900">{emp.lastName}, {emp.firstName} {emp.middleName ? `${emp.middleName[0]}.` : ''}</p>
                              {isAllocated && (
                                <span className="px-1.5 py-0.2 bg-amber-500 text-slate-950 text-[9px] font-extrabold rounded">
                                  {currentVal}d
                                </span>
                              )}
                            </div>
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
                                setSelectedEmployeesMap(prev => ({
                                  ...prev,
                                  [emp.id]: val
                                }));
                              }}
                              placeholder="0.0"
                              className="w-20 px-2 py-1 bg-white border border-slate-300 rounded text-center font-extrabold text-amber-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                            />
                            <span className="text-[11px] text-slate-500">days</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddSOModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg flex items-center space-x-1"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Special Order</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECORD USED SERVICE CREDITS MODAL WITH STRICT VALIDATION */}
      {showDeductModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white text-slate-900 rounded-xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <MinusCircle className="w-5 h-5 text-rose-600" />
                Record Used Service Credits Deduction
              </h3>
              <button onClick={() => setShowDeductModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {deductError && (
              <div className="mt-3 p-3 bg-rose-50 border-l-4 border-rose-600 text-rose-900 rounded text-xs font-semibold flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Over-Deduction Prevented</p>
                  <p className="mt-0.5">{deductError}</p>
                </div>
              </div>
            )}

            {deductSuccess && (
              <div className="mt-3 p-3 bg-emerald-50 border-l-4 border-emerald-600 text-emerald-900 rounded text-xs font-semibold flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{deductSuccess}</span>
              </div>
            )}

            <form onSubmit={handleDeductSubmit} className="mt-4 space-y-3 text-xs">
              
              {/* Select Employee */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Teacher / Employee *</label>
                
                {/* Search Bar & School Filter for Teacher */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      value={deductTeacherSearch}
                      onChange={(e) => setDeductTeacherSearch(e.target.value)}
                      placeholder="Search name, ID..."
                      className="w-full pl-8 pr-14 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    {deductTeacherSearch && (
                      <button
                        type="button"
                        onClick={() => setDeductTeacherSearch('')}
                        className="absolute right-2 top-1 text-xs font-bold text-slate-500 hover:text-slate-800 px-1 py-0.5"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  <select
                    value={deductSchoolFilter}
                    onChange={(e) => setDeductSchoolFilter(e.target.value)}
                    className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="ALL">All Schools ({schools.length})</option>
                    {schools.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <select
                  required
                  value={deductEmpId}
                  onChange={(e) => {
                    setDeductEmpId(e.target.value);
                    setDeductSoId('');
                    setDeductError('');
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold text-xs"
                >
                  <option value="">-- Choose Employee ({filteredDeductTeachers.length} available) --</option>
                  {filteredDeductTeachers.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.lastName}, {emp.firstName} (#{emp.employeeNumber}) • {emp.schoolName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Special Order with Available Credits */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Deduct From Special Order *</label>
                {!deductEmpId ? (
                  <p className="text-[11px] text-slate-400 italic py-1">Please select an employee first above.</p>
                ) : availableSOsForDeductEmp.length === 0 ? (
                  <p className="text-[11px] text-rose-600 font-semibold py-1">
                    This employee has no Special Orders with available positive service credit balance.
                  </p>
                ) : (
                  <select
                    required
                    value={deductSoId}
                    onChange={(e) => { setDeductSoId(e.target.value); setDeductError(''); }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold"
                  >
                    <option value="">-- Choose Special Order --</option>
                    {availableSOsForDeductEmp.map(item => (
                      <option key={item.so.id} value={item.so.id}>
                        {item.so.soNumber} - {item.so.title} (Available: {item.available.toFixed(1)} days)
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Date Used *</label>
                  <input
                    type="date"
                    required
                    value={deductDate}
                    onChange={(e) => setDeductDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Amount to Deduct (Days) *</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    required
                    value={deductAmount}
                    onChange={(e) => setDeductAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-rose-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Remarks / Reason for Absence Offset</label>
                <input
                  type="text"
                  value={deductRemarks}
                  onChange={(e) => setDeductRemarks(e.target.value)}
                  placeholder="e.g. Personal matter absence offset"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowDeductModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!deductSoId || availableSOsForDeductEmp.length === 0}
                  className="px-5 py-2 bg-rose-700 hover:bg-rose-800 disabled:opacity-50 text-white font-bold rounded-lg flex items-center space-x-1"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Confirm Deduction</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
