import React, { useState, useMemo } from 'react';
import { useHRIS } from '../../context/HRISContext';
import { useAuth } from '../../context/AuthContext';
import { 
  Building2, 
  Users, 
  Search, 
  Eye, 
  UserPlus, 
  Printer, 
  X, 
  UserCheck, 
  UserX, 
  ChevronRight,
  Award
} from 'lucide-react';
import { Employee } from '../../types';

interface SchoolPersonnelModalProps {
  schoolName: string;
  isOpen: boolean;
  onClose: () => void;
  onSelectEmployee?: (id: string) => void;
  onNavigateAddEmployee?: () => void;
}

export const SchoolPersonnelModal: React.FC<SchoolPersonnelModalProps> = ({
  schoolName,
  isOpen,
  onClose,
  onSelectEmployee,
  onNavigateAddEmployee
}) => {
  const { employees, schools } = useHRIS();
  const { role } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Active' | 'Inactive'>('ALL');
  const [positionFilter, setPositionFilter] = useState<string>('ALL');

  const schoolObj = schools.find(s => s.name.toLowerCase() === schoolName.toLowerCase());

  // All employees in this school
  const schoolEmployees = useMemo(() => {
    return employees.filter(emp => emp.schoolName.toLowerCase() === schoolName.toLowerCase());
  }, [employees, schoolName]);

  // Unique positions for filter dropdown
  const uniquePositions = useMemo(() => {
    const posSet = new Set<string>();
    schoolEmployees.forEach(e => {
      if (e.currentPosition) posSet.add(e.currentPosition);
    });
    return Array.from(posSet).sort();
  }, [schoolEmployees]);

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    return schoolEmployees.filter(emp => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch = !q || (
        emp.firstName.toLowerCase().includes(q) ||
        emp.lastName.toLowerCase().includes(q) ||
        (emp.middleName && emp.middleName.toLowerCase().includes(q)) ||
        emp.employeeNumber.toLowerCase().includes(q) ||
        emp.currentPosition.toLowerCase().includes(q) ||
        emp.itemNumber.toLowerCase().includes(q)
      );

      const matchesStatus = statusFilter === 'ALL' || emp.status === statusFilter;
      const matchesPosition = positionFilter === 'ALL' || emp.currentPosition === positionFilter;

      return matchesSearch && matchesStatus && matchesPosition;
    });
  }, [schoolEmployees, searchTerm, statusFilter, positionFilter]);

  // Stats for this school
  const totalCount = schoolEmployees.length;
  const activeCount = schoolEmployees.filter(e => e.status === 'Active').length;
  const inactiveCount = schoolEmployees.filter(e => e.status === 'Inactive').length;
  
  const teachingPositions = ['Teacher I', 'Teacher II', 'Teacher III', 'Master Teacher I', 'Master Teacher II', 'Master Teacher III', 'Special Education Teacher'];
  const teachingCount = schoolEmployees.filter(e => teachingPositions.some(p => e.currentPosition.toLowerCase().includes(p.toLowerCase()))).length;
  const nonTeachingCount = totalCount - teachingCount;

  // Print Roster Handler
  const handlePrintRoster = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const rowsHtml = filteredEmployees.map((emp, index) => `
      <tr style="border-bottom: 1px solid #cbd5e1; font-size: 11px;">
        <td style="padding: 7px 10px; text-align: center;">${index + 1}</td>
        <td style="padding: 7px 10px; font-family: monospace; font-weight: bold;">${emp.employeeNumber}</td>
        <td style="padding: 7px 10px; font-weight: bold;">${emp.lastName}, ${emp.firstName} ${emp.middleName ? emp.middleName.charAt(0) + '.' : ''} ${emp.extensionName || ''}</td>
        <td style="padding: 7px 10px;">${emp.currentPosition}</td>
        <td style="padding: 7px 10px; text-align: center; font-weight: bold; color: ${emp.status === 'Active' ? '#047857' : '#b91c1c'};">${emp.status}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>School Personnel Roster - ${schoolName}</title>
          <style>
            @page { size: portrait; margin: 15mm; }
            body { font-family: 'Times New Roman', serif, system-ui; color: #0f172a; margin: 0; padding: 20px; }
            .header-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
            .header-text { text-align: center; font-size: 12px; line-height: 1.3; }
            .school-title { font-size: 16px; font-weight: bold; text-align: center; margin: 10px 0 5px 0; text-transform: uppercase; }
            .sub-title { font-size: 12px; text-align: center; margin-bottom: 15px; color: #475569; }
            table.roster { width: 100%; border-collapse: collapse; margin-top: 10px; }
            table.roster th { background-color: #f1f5f9; border: 1px solid #94a3b8; padding: 8px 10px; font-size: 11px; text-transform: uppercase; text-align: left; }
            table.roster td { border: 1px solid #cbd5e1; }
            .footer { margin-top: 25px; display: flex; justify-content: space-between; font-size: 11px; }
            .sign-box { text-align: center; min-width: 200px; }
            .sign-line { border-top: 1px solid #000; margin-top: 40px; font-weight: bold; padding-top: 4px; }
          </style>
        </head>
        <body>
          <div class="header-text">
            <div>Republic of the Philippines</div>
            <div style="font-weight: bold;">DEPARTMENT OF EDUCATION</div>
            <div>Region III – Central Luzon</div>
            <div>Schools Division of Nueva Ecija</div>
            <div style="font-weight: bold; color: #0284c7;">GUIMBA WEST DISTRICT</div>
          </div>

          <div class="school-title">${schoolName}</div>
          <div class="sub-title">OFFICIAL PERSONNEL ROSTER & PROFILE SUMMARY (As of ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })})</div>

          <div style="font-size: 11px; margin-bottom: 8px; display: flex; justify-content: space-between;">
            <span><b>Total Listed Personnel:</b> ${filteredEmployees.length} (Active: ${filteredEmployees.filter(e => e.status === 'Active').length})</span>
            <span><b>District:</b> Guimba West District</span>
          </div>

          <table class="roster">
            <thead>
              <tr>
                <th style="width: 40px; text-align: center;">#</th>
                <th style="width: 140px;">Employee Number</th>
                <th>Name</th>
                <th>Current Position</th>
                <th style="width: 90px; text-align: center;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml || '<tr><td colspan="5" style="text-align: center; padding: 20px; color: #64748b;">No personnel records found for this school.</td></tr>'}
            </tbody>
          </table>

          <div class="footer" style="margin-top: 35px; display: flex; justify-content: space-between;">
            <div class="sign-box">
              <div>Prepared by:</div>
              <div class="sign-line">School HR / Liaison Officer</div>
            </div>
            <div class="sign-box">
              <div>Certified Correct:</div>
              <div class="sign-line">School Head / Principal</div>
            </div>
            <div class="sign-box">
              <div>Noted by:</div>
              <div class="sign-line">Public Schools District Supervisor</div>
            </div>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 400);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
      <div 
        className="bg-white text-slate-900 rounded-2xl max-w-5xl w-full shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="w-12 h-12 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-extrabold shrink-0 shadow-sm">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">
                  Guimba West District School
                </span>
                {schoolObj && (
                  <span className={`px-2 py-0.2 rounded text-[10px] font-bold border ${
                    schoolObj.status === 'Active' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-slate-200 text-slate-700 border-slate-300'
                  }`}>
                    {schoolObj.status}
                  </span>
                )}
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 leading-tight">
                {schoolName}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                DepEd Division of Nueva Ecija • Assigned Teachers and Non-Teaching Staff Roster
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 self-end sm:self-auto">
            <button
              onClick={handlePrintRoster}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl border border-slate-300 flex items-center space-x-1.5 transition shadow-2xs"
              title="Print official school personnel roster"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>Print Roster</span>
            </button>

            {role === 'ADMIN' && onNavigateAddEmployee && (
              <button
                onClick={() => {
                  onClose();
                  onNavigateAddEmployee();
                }}
                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-xl flex items-center space-x-1.5 transition shadow-2xs"
                title="Add new employee"
              >
                <UserPlus className="w-4 h-4" />
                <span>Add Personnel</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Key Metrics / KPI Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 p-4 bg-slate-50 border-b border-slate-200 text-xs">
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Total Personnel</span>
              <p className="text-xl font-extrabold text-slate-900">{totalCount}</p>
            </div>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-700">
              <Users className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Active Staff</span>
              <p className="text-xl font-extrabold text-emerald-700">{activeCount}</p>
            </div>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Teaching Staff</span>
              <p className="text-xl font-extrabold text-amber-700">{teachingCount}</p>
            </div>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-700">
              <Award className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Inactive / Transferred</span>
              <p className="text-xl font-extrabold text-slate-600">{inactiveCount}</p>
            </div>
            <div className="p-2 rounded-lg bg-slate-100 text-slate-600">
              <UserX className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 bg-white border-b border-slate-200 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by name, employee #, position..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Position Filter */}
            <div className="relative">
              <select
                value={positionFilter}
                onChange={(e) => setPositionFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="ALL">All Current Positions ({uniquePositions.length})</option>
                {uniquePositions.map((pos) => (
                  <option key={pos} value={pos}>{pos}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="ALL">All Status ({totalCount})</option>
                <option value="Active">Active Only ({activeCount})</option>
                <option value="Inactive">Inactive Only ({inactiveCount})</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
            <span>
              Showing <b>{filteredEmployees.length}</b> of <b>{totalCount}</b> personnel in {schoolName}
            </span>
            {(searchTerm || statusFilter !== 'ALL' || positionFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('ALL');
                  setPositionFilter('ALL');
                }}
                className="text-amber-700 font-bold hover:underline"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* Personnel Table List */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredEmployees.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">No personnel found</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                {searchTerm || statusFilter !== 'ALL' || positionFilter !== 'ALL'
                  ? 'Try adjusting your search criteria or reset filters.'
                  : `There are currently no personnel assigned to ${schoolName}.`}
              </p>
              {role === 'ADMIN' && onNavigateAddEmployee && (
                <button
                  onClick={() => {
                    onClose();
                    onNavigateAddEmployee();
                  }}
                  className="mt-4 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl inline-flex items-center space-x-1.5 shadow-xs"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Add First Personnel to this School</span>
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100/90 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4 w-36">Employee Number</th>
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Current Position</th>
                    <th className="py-3 px-4 text-center w-28">Status</th>
                    <th className="py-3 px-4 text-right w-28">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {filteredEmployees.map((emp) => {
                    const fullName = `${emp.lastName}, ${emp.firstName} ${emp.middleName ? emp.middleName.charAt(0) + '.' : ''} ${emp.extensionName || ''}`.trim();
                    const initials = `${emp.firstName.charAt(0)}${emp.lastName.charAt(0)}`.toUpperCase();

                    return (
                      <tr 
                        key={emp.id} 
                        className="hover:bg-amber-50/40 transition cursor-pointer group"
                        onClick={() => {
                          if (onSelectEmployee) {
                            onClose();
                            onSelectEmployee(emp.id);
                          }
                        }}
                      >
                        {/* Employee Number */}
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900 text-xs">
                          #{emp.employeeNumber}
                        </td>

                        {/* Name */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center space-x-2.5">
                            <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-extrabold flex items-center justify-center text-xs shrink-0">
                              {initials}
                            </div>
                            <div className="font-extrabold text-slate-900 group-hover:text-amber-800 transition">
                              {fullName}
                            </div>
                          </div>
                        </td>

                        {/* Current Position */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-800">{emp.currentPosition}</div>
                          {emp.itemNumber && (
                            <div className="text-[11px] text-slate-500 font-medium font-mono">
                              Item: {emp.itemNumber}
                            </div>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            emp.status === 'Active'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-rose-50 text-rose-800 border-rose-200'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${emp.status === 'Active' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                            <span>{emp.status}</span>
                          </span>
                        </td>

                        {/* Action */}
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onSelectEmployee) {
                                onClose();
                                onSelectEmployee(emp.id);
                              }
                            }}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 transition inline-flex items-center space-x-1 font-bold text-[11px]"
                            title="View Full Profile"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Profile</span>
                            <ChevronRight className="w-3.5 h-3.5" />
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

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <div className="text-slate-500 flex items-center space-x-1">
            <Building2 className="w-4 h-4 text-amber-600" />
            <span>Guimba West District HR Information System</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
