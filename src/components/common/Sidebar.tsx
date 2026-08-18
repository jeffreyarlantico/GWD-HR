import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useHRIS } from '../../context/HRISContext';
import { DistrictLogo } from './DistrictLogo';
import { 
  LayoutDashboard, 
  Users, 
  UserPlus, 
  Building, 
  Award, 
  CalendarOff, 
  FileSpreadsheet, 
  Info,
  Shield,
  Eye,
  LogOut,
  Trash2
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab?: (tab: string) => void;
  onTabChange?: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onTabChange }) => {
  const { role, logout } = useAuth();
  const { deletedEmployees, deletedSchools } = useHRIS();

  const totalDeleted = (deletedEmployees?.length || 0) + (deletedSchools?.length || 0);

  const navItems = [
    {
      id: 'dashboard',
      label: 'HR Dashboard',
      icon: LayoutDashboard,
      adminOnly: false,
    },
    {
      id: 'employees',
      label: 'Employee Records',
      icon: Users,
      adminOnly: false,
    },
    {
      id: 'add-employee',
      label: 'Add New Employee',
      icon: UserPlus,
      adminOnly: true,
    },
    {
      id: 'schools',
      label: 'Schools',
      icon: Building,
      adminOnly: false,
    },
    {
      id: 'service-credits',
      label: 'Service Credits & SOs',
      icon: Award,
      adminOnly: false,
    },
    {
      id: 'leave-history',
      label: 'Leave Records',
      icon: CalendarOff,
      adminOnly: false,
    },
    {
      id: 'deleted-records',
      label: 'Deleted Records',
      icon: Trash2,
      badge: totalDeleted,
      adminOnly: false,
    },
    {
      id: 'import',
      label: 'Import Excel / Sheets',
      icon: FileSpreadsheet,
      adminOnly: true,
    },
    {
      id: 'system-info',
      label: 'District Info & Security',
      icon: Info,
      adminOnly: false,
    },
  ];

  return (
    <aside id="app-sidebar" className="w-full md:w-64 bg-slate-900 text-slate-300 flex-shrink-0 border-r border-slate-800 flex flex-col justify-between">
      <div className="p-4">
        {/* District Header Badge in Sidebar */}
        <div className="mb-6 pb-4 border-b border-slate-800 flex items-center space-x-3">
          <DistrictLogo size="sm" />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-amber-400 tracking-wider uppercase truncate">District HRIS</div>
            <div className="text-sm font-semibold text-white truncate">Guimba West District</div>
            <div className="text-[11px] text-slate-400 mt-0.5 truncate">DepEd Schools Division</div>
          </div>
          <div className="p-1.5 rounded-md bg-slate-800 border border-slate-700 shrink-0">
            {role === 'ADMIN' ? (
              <span title="Admin Account">
                <Shield className="w-4 h-4 text-emerald-400" />
              </span>
            ) : (
              <span title="View Only Account">
                <Eye className="w-4 h-4 text-blue-400" />
              </span>
            )}
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const isRestricted = item.adminOnly && role !== 'ADMIN';

            return (
              <button
                key={item.id}
                id={`nav-item-${item.id}`}
                onClick={() => {
                  if (!isRestricted) {
                    setActiveTab?.(item.id);
                    onTabChange?.(item.id);
                  }
                }}
                disabled={isRestricted}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-amber-500/15 text-amber-300 font-semibold border-l-2 border-amber-400 shadow-xs'
                    : isRestricted
                    ? 'text-slate-600 cursor-not-allowed opacity-50 hover:bg-transparent'
                    : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>

                <div className="flex items-center space-x-1.5">
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
                      {item.badge}
                    </span>
                  )}

                  {item.adminOnly && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                      role === 'ADMIN' 
                        ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/50' 
                        : 'bg-slate-800 text-slate-500 border border-slate-700'
                    }`}>
                      Admin
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info & Switch Account */}
      <div className="p-4 border-t border-slate-800/80 text-[11px] text-slate-500 space-y-2">
        <div className="flex justify-between items-center text-slate-400">
          <span>Current Account:</span>
          <span className={`font-medium ${role === 'ADMIN' ? 'text-emerald-400' : 'text-blue-400'}`}>
            {role === 'ADMIN' ? 'Administrator' : 'View Only'}
          </span>
        </div>

        <button
          onClick={logout}
          className="w-full mt-1 flex items-center justify-center space-x-2 py-2 px-3 bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg border border-slate-700/60 transition-all font-semibold text-xs"
        >
          <LogOut className="w-3.5 h-3.5 text-rose-400" />
          <span>Switch Account / Log Out</span>
        </button>

        <div className="text-[10px] text-slate-500 pt-1 text-center">
          Guimba West District, DepEd Nueva Ecija
        </div>
      </div>
    </aside>
  );
};
