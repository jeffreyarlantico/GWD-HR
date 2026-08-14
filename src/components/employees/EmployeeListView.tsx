import React, { useState, useMemo } from 'react';
import { useHRIS } from '../../context/HRISContext';
import { useAuth } from '../../context/AuthContext';
import { 
  Users, 
  Search, 
  Filter, 
  UserPlus, 
  Eye, 
  Building2, 
  ChevronRight,
  UserCheck,
  UserX
} from 'lucide-react';

interface EmployeeListViewProps {
  onSelectEmployee: (id: string) => void;
  onNavigateAddEmployee?: () => void;
  onNavigateToAddEmployee?: () => void;
  initialSearchQuery?: string;
}

export const EmployeeListView: React.FC<EmployeeListViewProps> = ({ 
  onSelectEmployee, 
  onNavigateAddEmployee,
  onNavigateToAddEmployee,
  initialSearchQuery = ''
}) => {
  const { employees, schools } = useHRIS();
  const { role } = useAuth();

  const [searchTerm, setSearchTerm] = useState(initialSearchQuery);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Active' | 'Inactive'>('ALL');
  const [schoolFilter, setSchoolFilter] = useState<string>('ALL');

  const handleAddEmployee = () => {
    if (onNavigateAddEmployee) {
      onNavigateAddEmployee();
    } else if (onNavigateToAddEmployee) {
      onNavigateToAddEmployee();
    }
  };

  // Filter & sort list alphabetically by Last Name
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      // Search
      const fullName = `${emp.lastName}, ${emp.firstName} ${emp.middleName || ''} ${emp.extensionName || ''}`.toLowerCase();
      const term = searchTerm.toLowerCase();
      const matchesSearch = 
        fullName.includes(term) ||
        emp.employeeNumber.toLowerCase().includes(term) ||
        emp.currentPosition.toLowerCase().includes(term) ||
        emp.schoolName.toLowerCase().includes(term);

      // Status
      const matchesStatus = statusFilter === 'ALL' || emp.status === statusFilter;

      // School
      let matchesSchool = schoolFilter === 'ALL';
      if (!matchesSchool) {
        const targetSchool = schools.find(s => s.id === schoolFilter || s.name === schoolFilter);
        const targetSchoolId = targetSchool ? targetSchool.id : schoolFilter;
        const targetSchoolName = targetSchool ? targetSchool.name.trim().toLowerCase() : schoolFilter.trim().toLowerCase();

        const empSchoolId = (emp.schoolId || '').trim();
        const empSchoolName = (emp.schoolName || '').trim().toLowerCase();

        matchesSchool = Boolean(
          (empSchoolId && empSchoolId === targetSchoolId) ||
          (empSchoolName && (empSchoolName === targetSchoolName || empSchoolName === targetSchoolId.toLowerCase())) ||
          empSchoolId === schoolFilter ||
          empSchoolName === schoolFilter.trim().toLowerCase()
        );
      }

      return matchesSearch && matchesStatus && matchesSchool;
    }).sort((a, b) => a.lastName.localeCompare(b.lastName)); // A-Z Last Name
  }, [employees, schools, searchTerm, statusFilter, schoolFilter]);

  return (
    <div id="employee-list-module" className="space-y-6 pb-12">
      
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">
            <Users className="w-4 h-4" />
            <span>Guimba West District • Employee Directory</span>
          </div>
          <h1 className="text-xl font-extrabold text-slate-900">
            Employee Records ({filteredEmployees.length})
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Sorted alphabetically by Last Name (A–Z). Click any row to view complete profile and history.
          </p>
        </div>

        {role === 'ADMIN' && (
          <button
            id="btn-add-employee-list-page"
            onClick={handleAddEmployee}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition shadow-sm flex items-center space-x-2 self-start sm:self-auto"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add New Employee</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          
          {/* Search Box */}
          <div className="md:col-span-2 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              id="emp-list-search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Last Name, First Name, Employee #, Position..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              id="emp-list-status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="ALL">All Statuses (Active & Inactive)</option>
              <option value="Active">Active Only</option>
              <option value="Inactive">Inactive Only (Retired/Resigned)</option>
            </select>
          </div>

          {/* School Filter */}
          <div className="relative">
            <select
              id="emp-list-school-filter"
              value={schoolFilter}
              onChange={(e) => setSchoolFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="ALL">All District Schools</option>
              {schools.map(sch => (
                <option key={sch.id} value={sch.id}>{sch.name}</option>
              ))}
            </select>
          </div>

        </div>

        {/* Filter Badges Summary */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2">
          <div className="flex items-center space-x-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Showing <b>{filteredEmployees.length}</b> of <b>{employees.length}</b> records</span>
          </div>
          {(searchTerm || statusFilter !== 'ALL' || schoolFilter !== 'ALL') && (
            <button
              onClick={() => { setSearchTerm(''); setStatusFilter('ALL'); setSchoolFilter('ALL'); }}
              className="text-amber-700 font-bold hover:underline"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Employee Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredEmployees.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No employee records match your search criteria.</p>
            <p className="text-xs text-slate-400 mt-1">Try resetting the filters or searching for another term.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Employee #</th>
                  <th className="py-3 px-4">Current Position</th>
                  <th className="py-3 px-4">Guimba West School</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredEmployees.map((emp) => (
                  <tr 
                    key={emp.id}
                    onClick={() => onSelectEmployee(emp.id)}
                    className="hover:bg-amber-50/40 cursor-pointer transition group"
                  >
                    {/* Profile Photo & Full Name */}
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-full bg-slate-200 border border-slate-300 flex-shrink-0 overflow-hidden flex items-center justify-center font-bold text-slate-700 text-xs">
                          {emp.profilePhotoUrl ? (
                            <img src={emp.profilePhotoUrl} alt={emp.lastName} className="w-full h-full object-cover" />
                          ) : (
                            `${emp.firstName[0]}${emp.lastName[0]}`
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 group-hover:text-amber-800 text-xs sm:text-sm">
                            {emp.lastName}, {emp.firstName} {emp.middleName ? `${emp.middleName} ` : ''}{emp.extensionName || ''}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Appointed: {emp.dateOfLatestAppointment || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Employee Number */}
                    <td className="py-3 px-4 font-mono font-bold text-slate-700">
                      #{emp.employeeNumber}
                    </td>

                    {/* Current Position */}
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {emp.currentPosition}
                    </td>

                    {/* Current School */}
                    <td className="py-3 px-4 text-slate-700 font-medium">
                      <div className="flex items-center space-x-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>{emp.schoolName}</span>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4">
                      {emp.status === 'Active' ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <UserCheck className="w-3 h-3 text-emerald-600" />
                          <span>Active</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-200 text-slate-700 border border-slate-300">
                          <UserX className="w-3 h-3 text-slate-500" />
                          <span>Inactive</span>
                        </span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 text-right">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectEmployee(emp.id);
                        }}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-amber-100 text-slate-600 hover:text-amber-800 transition inline-flex items-center space-x-1 font-semibold text-[11px]"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Profile</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
