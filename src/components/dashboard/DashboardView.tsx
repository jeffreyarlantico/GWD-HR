import React, { useState } from 'react';
import { useHRIS } from '../../context/HRISContext';
import { DistrictLogo } from '../common/DistrictLogo';
import { 
  Users, 
  UserX, 
  Building2, 
  Search, 
  Cake, 
  Clock, 
  Sparkles, 
  ArrowRight,
  ExternalLink,
  ChevronRight,
  UserCheck,
  Trash2,
  Eye
} from 'lucide-react';
import { SchoolPersonnelModal } from '../schools/SchoolPersonnelModal';

interface DashboardViewProps {
  setActiveTab?: (tab: string) => void;
  onSelectEmployee: (employeeId: string) => void;
  onNavigateToAddEmployee?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ 
  setActiveTab, 
  onSelectEmployee,
  onNavigateToAddEmployee 
}) => {
  const { 
    totalActiveEmployees, 
    totalInactiveEmployees, 
    totalSchoolsCount, 
    employeesPerSchool, 
    recentlyAddedEmployees, 
    recentlyUpdatedEmployees, 
    upcomingBirthdays,
    employees,
    deletedEmployees,
    deletedSchools
  } = useHRIS();

  const totalDeleted = (deletedEmployees?.length || 0) + (deletedSchools?.length || 0);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSchoolForPersonnel, setSelectedSchoolForPersonnel] = useState<string | null>(null);

  // Filtered search results for dashboard inline search
  const filteredSearch = searchTerm.trim() 
    ? employees.filter(e => {
        const term = searchTerm.toLowerCase();
        const fullName = `${e.firstName} ${e.middleName || ''} ${e.lastName}`.toLowerCase();
        return (
          fullName.includes(term) ||
          e.employeeNumber.toLowerCase().includes(term) ||
          e.schoolName.toLowerCase().includes(term) ||
          e.currentPosition.toLowerCase().includes(term)
        );
      }).slice(0, 8)
    : [];

  return (
    <div id="dashboard-view" className="space-y-6 pb-12">
      
      {/* Header Greeting */}
      <div className="bg-gradient-to-r from-[#0F2942] to-[#1E3A8A] text-white p-6 rounded-2xl shadow-lg border border-slate-700/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center space-x-4">
          <DistrictLogo size="xl" className="hidden sm:block shadow-xl border-2 border-amber-400" />
          <div>
            <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
              <Building2 className="w-4 h-4" />
              <span>Guimba West District • DepEd Schools Division of Nueva Ecija</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              District HR Dashboard
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Official HR Information System for managing personnel, promotions, school assignments, service credits, and special orders across Guimba West District schools.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab?.('employees')}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-lg transition shadow-md flex items-center space-x-2"
          >
            <Users className="w-4 h-4" />
            <span>View All Records</span>
          </button>
        </div>
      </div>

      {/* Prominent Employee Search Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-5 h-5 text-amber-600" />
          </div>
          <input
            type="text"
            id="dashboard-search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Prominent Search: Type Employee Name, Employee Number, School, or Position (e.g., 'Santos', '4820101', 'Triala', 'Teacher III')..."
            className="w-full pl-11 pr-4 py-3 bg-slate-50 text-slate-900 placeholder-slate-400 text-sm font-medium rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-xs text-slate-400 hover:text-slate-600"
            >
              Clear
            </button>
          )}
        </div>

        {/* Inline Search Results Popup */}
        {searchTerm.trim().length > 0 && (
          <div className="mt-3 border-t border-slate-100 pt-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
              <span>Matching Employees ({filteredSearch.length})</span>
              <span className="text-[11px] text-amber-600">Click row to open profile</span>
            </div>

            {filteredSearch.length === 0 ? (
              <p className="text-xs text-slate-500 py-3 text-center">
                No employees found matching "{searchTerm}" in Guimba West District.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {filteredSearch.map(emp => (
                  <div
                    key={emp.id}
                    onClick={() => onSelectEmployee(emp.id)}
                    className="p-3 rounded-lg border border-slate-200 hover:border-amber-500 hover:bg-amber-50/50 cursor-pointer transition flex items-center justify-between group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden flex-shrink-0 border border-slate-300 flex items-center justify-center font-bold text-slate-600 text-xs">
                        {emp.profilePhotoUrl ? (
                          <img src={emp.profilePhotoUrl} alt={emp.lastName} className="w-full h-full object-cover" />
                        ) : (
                          `${emp.firstName[0]}${emp.lastName[0]}`
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 group-hover:text-amber-800">
                          {emp.lastName}, {emp.firstName} {emp.middleName ? `${emp.middleName[0]}.` : ''}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          #{emp.employeeNumber} • {emp.currentPosition}
                        </div>
                        <div className="text-[11px] text-slate-600 font-medium">
                          {emp.schoolName}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                        emp.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {emp.status}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Top 4 Key Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Active Employees */}
        <div 
          onClick={() => setActiveTab?.('employees')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition flex items-center justify-between cursor-pointer group"
        >
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Employees</p>
            <h3 className="text-3xl font-extrabold text-emerald-700 mt-1">{totalActiveEmployees}</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Teaching & non-teaching staff</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200 group-hover:bg-emerald-100 transition">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Total Inactive Employees */}
        <div 
          onClick={() => setActiveTab?.('employees')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition flex items-center justify-between cursor-pointer group"
        >
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Inactive Employees</p>
            <h3 className="text-3xl font-extrabold text-slate-700 mt-1">{totalInactiveEmployees}</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Retired, resigned, transferred</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center border border-slate-200 group-hover:bg-slate-200 transition">
            <UserX className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Total District Schools */}
        <div 
          onClick={() => setActiveTab?.('schools')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition flex items-center justify-between cursor-pointer group"
        >
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">District Schools</p>
            <h3 className="text-3xl font-extrabold text-amber-700 mt-1">{totalSchoolsCount}</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Guimba West District</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200 group-hover:bg-amber-100 transition">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Deleted Records */}
        <div 
          onClick={() => setActiveTab?.('deleted-records')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition flex items-center justify-between cursor-pointer group"
        >
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Deleted Archive</p>
            <h3 className="text-3xl font-extrabold text-rose-700 mt-1">{totalDeleted}</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">{deletedEmployees.length} personnel, {deletedSchools.length} schools</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200 group-hover:bg-rose-100 transition">
            <Trash2 className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Main Grid: Employees Per School + Upcoming Birthdays */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Employees Per School */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-600" />
                Active Employees Per School
              </h2>
              <p className="text-xs text-slate-500">Breakdown of active teachers & staff per Guimba West District school</p>
            </div>
            <button
              onClick={() => setActiveTab?.('schools')}
              className="text-xs font-bold text-amber-700 hover:text-amber-900 flex items-center gap-1 hover:underline"
            >
              <span>Manage Schools</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
            {employeesPerSchool.map((item, idx) => (
              <div 
                key={idx}
                onClick={() => setSelectedSchoolForPersonnel(item.schoolName)}
                className="p-3 bg-slate-50 hover:bg-amber-50/70 rounded-lg border border-slate-200 hover:border-amber-400 hover:ring-1 hover:ring-amber-400/40 flex items-center justify-between cursor-pointer transition group"
                title={`Click to view personnel at ${item.schoolName}`}
              >
                <div className="flex items-center space-x-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500 group-hover:scale-125 flex-shrink-0 transition" />
                  <span className="text-xs font-semibold text-slate-800 group-hover:text-amber-900 line-clamp-1 transition">
                    {item.schoolName}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-extrabold bg-white text-slate-900 group-hover:bg-amber-100 group-hover:text-amber-950 px-2.5 py-1 rounded-md border border-slate-200 group-hover:border-amber-300 shadow-2xs transition">
                    {item.count} {item.count === 1 ? 'person' : 'personnel'}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-700 transition" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Col: Upcoming Birthdays (30 Days) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Cake className="w-5 h-5 text-pink-600" />
              Upcoming Birthdays
            </h2>
            <span className="text-xs bg-pink-50 text-pink-700 px-2 py-0.5 rounded font-semibold border border-pink-200">
              Next 30 Days
            </span>
          </div>

          {upcomingBirthdays.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              <Cake className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p>No employee birthdays coming up in the next 30 days.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {upcomingBirthdays.map((item, idx) => (
                <div 
                  key={idx}
                  onClick={() => onSelectEmployee(item.employee.id)}
                  className="p-3 rounded-lg border border-slate-200 bg-pink-50/30 hover:bg-pink-50 cursor-pointer transition flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-pink-100 text-pink-700 flex items-center justify-center font-bold text-xs flex-shrink-0 border border-pink-200">
                      {item.daysRemaining === 0 ? '🎉' : `${item.daysRemaining}d`}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        {item.employee.lastName}, {item.employee.firstName}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {item.employee.currentPosition} • {item.employee.schoolName}
                      </div>
                      <div className="text-[11px] text-pink-700 font-medium">
                        {new Date(item.employee.birthday).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • Turning {item.ageTurning} yrs old
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Bottom Section: Recently Added & Recently Updated */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Recently Added Employees */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              Recently Added Employees
            </h2>
            <button 
              onClick={() => setActiveTab?.('employees')}
              className="text-xs text-slate-500 hover:text-slate-800 font-semibold"
            >
              View All
            </button>
          </div>

          <div className="space-y-2.5">
            {recentlyAddedEmployees.map(emp => (
              <div 
                key={emp.id}
                onClick={() => onSelectEmployee(emp.id)}
                className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-100 cursor-pointer transition flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold">
                    {emp.firstName[0]}{emp.lastName[0]}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">
                      {emp.lastName}, {emp.firstName}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      #{emp.employeeNumber} • {emp.schoolName}
                    </div>
                  </div>
                </div>
                <div className="text-[11px] text-slate-400">
                  {new Date(emp.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recently Updated Employees */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-500" />
              Recently Updated Records
            </h2>
            <button 
              onClick={() => setActiveTab?.('employees')}
              className="text-xs text-slate-500 hover:text-slate-800 font-semibold"
            >
              View All
            </button>
          </div>

          <div className="space-y-2.5">
            {recentlyUpdatedEmployees.map(emp => (
              <div 
                key={emp.id}
                onClick={() => onSelectEmployee(emp.id)}
                className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-100 cursor-pointer transition flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold">
                    {emp.firstName[0]}{emp.lastName[0]}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">
                      {emp.lastName}, {emp.firstName}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {emp.currentPosition} • {emp.schoolName}
                    </div>
                  </div>
                </div>
                <div className="text-[11px] text-slate-400">
                  {new Date(emp.updatedAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* School Personnel Modal */}
      {selectedSchoolForPersonnel && (
        <SchoolPersonnelModal
          schoolName={selectedSchoolForPersonnel}
          isOpen={Boolean(selectedSchoolForPersonnel)}
          onClose={() => setSelectedSchoolForPersonnel(null)}
          onSelectEmployee={onSelectEmployee}
          onNavigateAddEmployee={onNavigateToAddEmployee}
        />
      )}

    </div>
  );
};
