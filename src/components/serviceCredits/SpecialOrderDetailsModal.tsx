import React, { useState, useMemo } from 'react';
import { 
  Award, 
  X, 
  Calendar, 
  FileText, 
  ExternalLink, 
  Users, 
  CheckCircle2, 
  Clock, 
  Search, 
  Building2, 
  Copy, 
  Check, 
  MinusCircle, 
  Filter, 
  Trash2,
  TrendingDown,
  Info
} from 'lucide-react';
import { SpecialOrder, Employee, ServiceCreditEarned, ServiceCreditUsed, School } from '../../types';

interface SpecialOrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  specialOrder: SpecialOrder | null;
  employees: Employee[];
  schools: School[];
  earnedCredits: ServiceCreditEarned[];
  usedCredits: ServiceCreditUsed[];
  role: 'ADMIN' | 'VIEW_ONLY';
  onRecordDeductionForEmployee?: (employeeId: string, soId: string) => void;
  onDeleteEarnedCredit?: (creditId: string) => void;
  onDeleteUsedCredit?: (creditId: string) => void;
}

export const SpecialOrderDetailsModal: React.FC<SpecialOrderDetailsModalProps> = ({
  isOpen,
  onClose,
  specialOrder,
  employees,
  schools,
  earnedCredits,
  usedCredits,
  role,
  onRecordDeductionForEmployee,
  onDeleteEarnedCredit,
  onDeleteUsedCredit
}) => {
  const [activeTab, setActiveTab] = useState<'ROSTER' | 'DEDUCTIONS' | 'INFO'>('ROSTER');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSchoolFilter, setSelectedSchoolFilter] = useState('ALL');
  const [copiedSO, setCopiedSO] = useState(false);

  // If not open or no SO selected
  if (!isOpen || !specialOrder) return null;

  // Filter earned credits specifically for this SO
  const soEarnedCredits = earnedCredits.filter(ec => ec.soId === specialOrder.id);
  
  // Filter used credits specifically for this SO
  const soUsedCredits = usedCredits.filter(uc => uc.soId === specialOrder.id);

  // Total calculations
  const totalGrantedCredits = soEarnedCredits.reduce((sum, item) => sum + (item.earnedCredits || 0), 0);
  const totalUsedCreditsForSO = soUsedCredits.reduce((sum, item) => sum + (item.usedCredits || 0), 0);
  const remainingAvailableForSO = Math.max(0, totalGrantedCredits - totalUsedCreditsForSO);
  const utilizationPercentage = totalGrantedCredits > 0 
    ? Math.min(100, Math.round((totalUsedCreditsForSO / totalGrantedCredits) * 100)) 
    : 0;

  // Map employee info with credits for this SO
  const recipientRoster = useMemo(() => {
    return soEarnedCredits.map(ec => {
      const employee = employees.find(e => e.id === ec.employeeId);
      
      // Calculate used credits for this specific employee under this specific SO
      const empUsedUnderSO = soUsedCredits
        .filter(uc => uc.employeeId === ec.employeeId)
        .reduce((sum, u) => sum + (u.usedCredits || 0), 0);

      const availableForEmp = Math.max(0, (ec.earnedCredits || 0) - empUsedUnderSO);

      return {
        earnedRecordId: ec.id,
        employeeId: ec.employeeId,
        employee,
        employeeName: employee ? `${employee.lastName}, ${employee.firstName} ${employee.middleName || ''}`.trim() : 'Unknown Personnel',
        employeeNumber: employee?.employeeNumber || '—',
        schoolName: employee?.schoolName || 'Unassigned',
        schoolId: employee?.schoolId || '',
        position: employee?.currentPosition || 'N/A',
        status: employee?.status || 'Active',
        grantedCredits: ec.earnedCredits || 0,
        usedCredits: empUsedUnderSO,
        remainingCredits: availableForEmp,
        remarks: ec.remarks || '',
        createdAt: ec.createdAt
      };
    });
  }, [soEarnedCredits, soUsedCredits, employees]);

  // Filter recipient roster based on search and school
  const filteredRoster = useMemo(() => {
    return recipientRoster.filter(item => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        item.employeeName.toLowerCase().includes(q) ||
        item.employeeNumber.toLowerCase().includes(q) ||
        item.position.toLowerCase().includes(q) ||
        item.remarks.toLowerCase().includes(q) ||
        item.schoolName.toLowerCase().includes(q);

      const matchesSchool = selectedSchoolFilter === 'ALL' || item.schoolId === selectedSchoolFilter;

      return matchesSearch && matchesSchool;
    });
  }, [recipientRoster, searchQuery, selectedSchoolFilter]);

  // Copy SO Number to clipboard
  const handleCopySO = () => {
    navigator.clipboard.writeText(specialOrder.soNumber);
    setCopiedSO(true);
    setTimeout(() => setCopiedSO(false), 2000);
  };

  const handleOpenDoc = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      id="special-order-details-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-sm overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div
        id="special-order-details-modal"
        className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-[#0F2942] text-white p-5 sm:p-6 relative border-b border-slate-700">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5 flex-1 pr-6">
              {/* Badges row */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-1.5 bg-amber-400/20 text-amber-300 border border-amber-400/40 px-2.5 py-0.5 rounded-md font-mono text-xs font-bold">
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  <span>{specialOrder.soNumber}</span>
                  <button
                    type="button"
                    onClick={handleCopySO}
                    className="ml-1 p-0.5 hover:text-white rounded transition"
                    title="Copy SO Number"
                  >
                    {copiedSO ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-amber-300/80" />}
                  </button>
                </div>

                <div className="inline-flex items-center gap-1 text-slate-300 text-xs bg-white/10 px-2.5 py-0.5 rounded-md">
                  <Calendar className="w-3 h-3 text-amber-400" />
                  <span>Issued: <b>{specialOrder.soDate}</b></span>
                </div>

                <span className="text-[11px] text-slate-400">
                  {recipientRoster.length} Beneficiary Teacher{recipientRoster.length === 1 ? '' : 's'}
                </span>
              </div>

              {/* SO Title */}
              <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-white pt-1 leading-snug">
                {specialOrder.title}
              </h2>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-xl bg-white/5 hover:bg-white/15 transition flex-shrink-0"
              title="Close modal (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Attached Document Quick Bar */}
          {specialOrder.soDocumentUrl && (
            <div className="mt-3 pt-3 border-t border-slate-700/60 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-blue-200">
                <FileText className="w-4 h-4 text-blue-400" />
                <span className="font-medium truncate max-w-md">Official Document / Special Order Paper Attached</span>
              </div>
              <button
                type="button"
                onClick={() => handleOpenDoc(specialOrder.soDocumentUrl!)}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              >
                <span>View Official Document</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* SUMMARY STATS BAR */}
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {/* Stat 1 */}
          <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
              <Users className="w-3 h-3 text-slate-500" /> Total Recipients
            </span>
            <div className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
              {recipientRoster.length} <span className="text-xs font-medium text-slate-500">teachers</span>
            </div>
          </div>

          {/* Stat 2 */}
          <div className="bg-white p-3 rounded-xl border border-emerald-200 bg-emerald-50/30 shadow-2xs">
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block flex items-center gap-1">
              <Award className="w-3 h-3 text-emerald-600" /> Total Granted
            </span>
            <div className="text-base sm:text-lg font-black text-emerald-700 mt-0.5">
              +{totalGrantedCredits.toFixed(1)} <span className="text-xs font-medium text-emerald-600">days</span>
            </div>
          </div>

          {/* Stat 3 */}
          <div className="bg-white p-3 rounded-xl border border-rose-200 bg-rose-50/30 shadow-2xs">
            <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider block flex items-center gap-1">
              <TrendingDown className="w-3 h-3 text-rose-600" /> Total Deducted
            </span>
            <div className="text-base sm:text-lg font-black text-rose-700 mt-0.5">
              -{totalUsedCreditsForSO.toFixed(1)} <span className="text-xs font-medium text-rose-600">days</span>
            </div>
          </div>

          {/* Stat 4 */}
          <div className="bg-white p-3 rounded-xl border border-amber-200 bg-amber-50/30 shadow-2xs">
            <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider block flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-amber-600" /> Available Balance
            </span>
            <div className="text-base sm:text-lg font-black text-amber-900 mt-0.5 flex items-baseline gap-1">
              {remainingAvailableForSO.toFixed(1)} <span className="text-xs font-medium text-amber-700">days</span>
              <span className="text-[10px] font-bold text-slate-500 ml-auto">
                ({100 - utilizationPercentage}% free)
              </span>
            </div>
          </div>
        </div>

        {/* MODAL TABS NAVIGATION */}
        <div className="px-5 pt-3 bg-white border-b border-slate-200 flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('ROSTER')}
            className={`pb-2.5 px-3 text-xs font-extrabold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'ROSTER'
                ? 'border-amber-500 text-amber-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Recipient Teachers & Credit Balance ({recipientRoster.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('DEDUCTIONS')}
            className={`pb-2.5 px-3 text-xs font-extrabold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'DEDUCTIONS'
                ? 'border-amber-500 text-amber-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <MinusCircle className="w-3.5 h-3.5" />
            <span>Deductions Log ({soUsedCredits.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('INFO')}
            className={`pb-2.5 px-3 text-xs font-extrabold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'INFO'
                ? 'border-amber-500 text-amber-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>SO Metadata</span>
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          
          {/* TAB 1: RECIPIENT ROSTER */}
          {activeTab === 'ROSTER' && (
            <div className="space-y-3">
              {/* Search & Filter bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search teacher by name, ID number, position, remarks..."
                    className="w-full pl-8.5 pr-8 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-700"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={selectedSchoolFilter}
                    onChange={(e) => setSelectedSchoolFilter(e.target.value)}
                    className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="ALL">All Stations ({schools.length})</option>
                    {schools.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Roster Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                {filteredRoster.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 space-y-1">
                    <Users className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-xs font-bold text-slate-600">No recipient teachers found</p>
                    <p className="text-[11px] text-slate-400">
                      {searchQuery || selectedSchoolFilter !== 'ALL'
                        ? 'Try clearing the search or school filter to view all teachers.'
                        : 'No employees were assigned service credits under this Special Order.'}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100/90 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
                        <tr>
                          <th className="py-2.5 px-3">Teacher / Personnel</th>
                          <th className="py-2.5 px-3">School / Station</th>
                          <th className="py-2.5 px-3 text-center">Granted</th>
                          <th className="py-2.5 px-3 text-center">Used</th>
                          <th className="py-2.5 px-3 text-center">Remaining Balance</th>
                          <th className="py-2.5 px-3">Remarks / Role</th>
                          {role === 'ADMIN' && (
                            <th className="py-2.5 px-3 text-right">Actions</th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredRoster.map((item) => (
                          <tr key={item.earnedRecordId} className="hover:bg-slate-50/80 transition">
                            {/* Teacher Info */}
                            <td className="py-2.5 px-3">
                              <div className="font-bold text-slate-900">{item.employeeName}</div>
                              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                                <span className="font-mono">ID: {item.employeeNumber}</span>
                                <span>•</span>
                                <span className="text-amber-800 font-medium">{item.position}</span>
                              </div>
                            </td>

                            {/* School */}
                            <td className="py-2.5 px-3">
                              <span className="font-medium text-slate-700 flex items-center gap-1">
                                <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                                {item.schoolName}
                              </span>
                            </td>

                            {/* Granted Credits */}
                            <td className="py-2.5 px-3 text-center">
                              <span className="font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-xs">
                                +{item.grantedCredits.toFixed(1)}
                              </span>
                            </td>

                            {/* Used Credits */}
                            <td className="py-2.5 px-3 text-center">
                              {item.usedCredits > 0 ? (
                                <span className="font-extrabold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded text-xs">
                                  -{item.usedCredits.toFixed(1)}
                                </span>
                              ) : (
                                <span className="text-slate-400 font-mono text-[11px]">0.0</span>
                              )}
                            </td>

                            {/* Remaining Balance */}
                            <td className="py-2.5 px-3 text-center">
                              <span className={`font-black px-2 py-0.5 rounded text-xs border ${
                                item.remainingCredits > 0 
                                  ? 'bg-amber-100 text-amber-950 border-amber-300' 
                                  : 'bg-slate-100 text-slate-500 border-slate-200'
                              }`}>
                                {item.remainingCredits.toFixed(1)} days
                              </span>
                            </td>

                            {/* Remarks */}
                            <td className="py-2.5 px-3">
                              <span className="text-slate-600 text-[11px]">
                                {item.remarks || '—'}
                              </span>
                            </td>

                            {/* Admin Actions */}
                            {role === 'ADMIN' && (
                              <td className="py-2.5 px-3 text-right whitespace-nowrap">
                                <div className="inline-flex items-center gap-1.5">
                                  {item.remainingCredits > 0 && onRecordDeductionForEmployee && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        onClose();
                                        onRecordDeductionForEmployee(item.employeeId, specialOrder.id);
                                      }}
                                      className="p-1 px-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded text-[10px] font-bold border border-rose-200 transition flex items-center gap-1"
                                      title="Record Deduction for this teacher"
                                    >
                                      <MinusCircle className="w-3 h-3" />
                                      <span>Deduct</span>
                                    </button>
                                  )}

                                  {onDeleteEarnedCredit && (
                                    <button
                                      type="button"
                                      onClick={() => onDeleteEarnedCredit(item.earnedRecordId)}
                                      className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition"
                                      title="Delete earned credit allocation"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: DEDUCTIONS LOG */}
          {activeTab === 'DEDUCTIONS' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-900">Service Credits Deductions Log</h3>
                  <p className="text-[11px] text-slate-500">History of leave credits used and deducted from this specific Special Order</p>
                </div>
                <span className="text-xs font-extrabold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                  Total Deducted: -{totalUsedCreditsForSO.toFixed(1)} days
                </span>
              </div>

              {soUsedCredits.length === 0 ? (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                  <p className="text-xs font-bold text-slate-800">No deductions recorded against this Special Order</p>
                  <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                    All granted service credits ({totalGrantedCredits.toFixed(1)} days) remain 100% available for all recipient teachers.
                  </p>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100/90 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
                      <tr>
                        <th className="py-2.5 px-3">Date Used</th>
                        <th className="py-2.5 px-3">Teacher / Employee</th>
                        <th className="py-2.5 px-3 text-center">Days Deducted</th>
                        <th className="py-2.5 px-3">Leave Purpose / Remarks</th>
                        {role === 'ADMIN' && (
                          <th className="py-2.5 px-3 text-right">Action</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {soUsedCredits.map((uc) => {
                        const emp = employees.find(e => e.id === uc.employeeId);
                        return (
                          <tr key={uc.id} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 font-semibold text-slate-800 flex items-center gap-1.5">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              {uc.dateUsed}
                            </td>

                            <td className="py-2.5 px-3">
                              <div className="font-bold text-slate-900">
                                {emp ? `${emp.lastName}, ${emp.firstName}` : uc.employeeId}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {emp?.schoolName || 'Unassigned'}
                              </div>
                            </td>

                            <td className="py-2.5 px-3 text-center">
                              <span className="font-extrabold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded text-xs">
                                -{uc.usedCredits.toFixed(1)} days
                              </span>
                            </td>

                            <td className="py-2.5 px-3 text-slate-600 text-[11px]">
                              {uc.remarks || 'Standard Leave Deduction'}
                            </td>

                            {role === 'ADMIN' && (
                              <td className="py-2.5 px-3 text-right">
                                {onDeleteUsedCredit && (
                                  <button
                                    type="button"
                                    onClick={() => onDeleteUsedCredit(uc.id)}
                                    className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition"
                                    title="Cancel & delete deduction record"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
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
          )}

          {/* TAB 3: SO METADATA */}
          {activeTab === 'INFO' && (
            <div className="space-y-4 text-xs">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-amber-600" />
                  Special Order Information & Audit Trail
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-700">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Special Order Number</span>
                    <span className="font-mono font-bold text-slate-900 text-sm">{specialOrder.soNumber}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px]">Date Issued</span>
                    <span className="font-bold text-slate-900 text-sm">{specialOrder.soDate}</span>
                  </div>

                  <div className="sm:col-span-2">
                    <span className="text-slate-400 block text-[10px]">Full Activity Title</span>
                    <span className="font-bold text-slate-900 text-sm">{specialOrder.title}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px]">System Creation Timestamp</span>
                    <span className="font-mono text-slate-600 text-xs">
                      {specialOrder.createdAt ? new Date(specialOrder.createdAt).toLocaleString() : '—'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px]">Last Updated Timestamp</span>
                    <span className="font-mono text-slate-600 text-xs">
                      {specialOrder.updatedAt ? new Date(specialOrder.updatedAt).toLocaleString() : '—'}
                    </span>
                  </div>

                  {specialOrder.soDocumentUrl && (
                    <div className="sm:col-span-2">
                      <span className="text-slate-400 block text-[10px]">Official OneDrive Document URL</span>
                      <a
                        href={specialOrder.soDocumentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-700 hover:underline break-all font-mono text-[11px] flex items-center gap-1 mt-0.5"
                      >
                        <ExternalLink className="w-3 h-3 shrink-0" />
                        <span>{specialOrder.soDocumentUrl}</span>
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* MODAL FOOTER */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 flex items-center justify-between">
          <div className="text-[11px] text-slate-500">
            Guimba West District • Service Credits & Special Orders
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition shadow-xs"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
