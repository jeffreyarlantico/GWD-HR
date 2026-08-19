import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useHRIS } from '../../context/HRISContext';
import { Shield, ShieldAlert, UserCheck, LogOut, Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { DistrictLogo } from './DistrictLogo';

interface HeaderProps {
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
  onSearch?: (query: string) => void;
  onOpenGlobalSearch?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, onSearch }) => {
  const { role, setRole, userTitle, logout } = useAuth();
  const { cloudStatus, lastCloudSync, refreshCloudData } = useHRIS();
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleManualSync = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await refreshCloudData();
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <header id="main-app-header" className="bg-slate-900/95 backdrop-blur-md text-white border-b border-slate-800 shadow-sm sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Left: District Branding */}
        <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => setActiveTab?.('dashboard')}>
          <DistrictLogo size="md" className="group-hover:scale-105 transition-transform duration-200" />
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-base md:text-lg tracking-tight text-slate-100 group-hover:text-amber-300 transition-colors">Guimba West District</span>
              <span className="bg-amber-500/15 text-amber-300 text-[11px] px-2 py-0.5 rounded-full border border-amber-500/30 font-medium hidden sm:inline-block">DepEd Nueva Ecija</span>
            </div>
            <p className="text-xs text-slate-400 font-normal">Human Resource Information System (HRIS)</p>
          </div>
        </div>

        {/* Right: Role Status & System Controls */}
        <div className="flex items-center space-x-2.5 sm:space-x-3">
          
          {/* Cloud Firestore Sync Status Indicator */}
          <button
            onClick={handleManualSync}
            disabled={isRefreshing}
            className={`hidden md:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              cloudStatus === 'connected'
                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/50 hover:bg-emerald-900/60'
                : cloudStatus === 'syncing'
                ? 'bg-amber-950/40 text-amber-300 border-amber-800/50 hover:bg-amber-900/60'
                : 'bg-rose-950/40 text-rose-300 border-rose-800/50 hover:bg-rose-900/60'
            }`}
            title={`Firestore Database: ${cloudStatus.toUpperCase()}${lastCloudSync ? ` • Last synced: ${lastCloudSync.toLocaleTimeString()}` : ''}. Click to refresh.`}
          >
            {cloudStatus === 'connected' ? (
              <Cloud className="w-3.5 h-3.5 text-emerald-400" />
            ) : cloudStatus === 'syncing' || isRefreshing ? (
              <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />
            ) : (
              <CloudOff className="w-3.5 h-3.5 text-rose-400" />
            )}
            <span className="text-[11px]">
              {isRefreshing ? 'Syncing...' : cloudStatus === 'connected' ? 'Firestore Live' : cloudStatus === 'syncing' ? 'Syncing...' : 'Offline / Error'}
            </span>
          </button>

          {/* Role Status Badge / Switch Account Button */}
          <button 
            id="user-role-badge"
            onClick={logout}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border transition-all shadow-xs ${
              role === 'ADMIN' 
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/80 hover:border-emerald-500/60' 
                : 'bg-blue-950/60 text-blue-300 border-blue-500/40 hover:bg-blue-900/80 hover:border-blue-500/60'
            }`}
            title="Click to switch account (Automatically logs out to Login Page)"
          >
            {role === 'ADMIN' ? (
              <>
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span className="tracking-wide">ADMINISTRATOR</span>
              </>
            ) : (
              <>
                <UserCheck className="w-3.5 h-3.5 text-blue-400" />
                <span className="tracking-wide">VIEW ONLY</span>
              </>
            )}
            <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-slate-300 ml-1 font-normal">Switch</span>
          </button>

          {/* Log Out Button */}
          <button
            id="btn-header-logout"
            onClick={logout}
            className="flex items-center space-x-1.5 text-xs text-rose-300 hover:text-white bg-rose-950/40 hover:bg-rose-900/80 px-2.5 py-1.5 rounded-lg border border-rose-800/50 hover:border-rose-600 transition-all shadow-xs"
            title="Log out of HRIS session"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline font-semibold">Log Out</span>
          </button>

        </div>
      </div>

      {/* Role Switcher Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white text-slate-900 rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <ShieldAlert className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-lg text-slate-900">Switch Shared HR Account</h3>
              </div>
              <button 
                onClick={() => setShowRoleModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <p className="text-sm text-slate-600 mt-3">
              Guimba West District HRIS supports two shared accounts for district HR personnel:
            </p>

            <div className="mt-4 space-y-3">
              {/* Option 1: Admin */}
              <div 
                onClick={() => { setRole('ADMIN'); logout(); setShowRoleModal(false); }}
                className={`p-4 rounded-xl border-2 cursor-pointer transition flex items-start space-x-3 ${
                  role === 'ADMIN' ? 'border-emerald-600 bg-emerald-50/50' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700 mt-0.5">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900 text-sm">Administrator Account</span>
                    {role === 'ADMIN' && <span className="bg-emerald-600 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">Active</span>}
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    Full District Access: Add/edit employees, mark status, manage schools, promotion history, school assignments, service credit Special Orders, leave, and Excel imports.
                  </p>
                </div>
              </div>

              {/* Option 2: View Only */}
              <div 
                onClick={() => { setRole('VIEW_ONLY'); logout(); setShowRoleModal(false); }}
                className={`p-4 rounded-xl border-2 cursor-pointer transition flex items-start space-x-3 ${
                  role === 'VIEW_ONLY' ? 'border-blue-600 bg-blue-50/50' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="p-2 rounded-lg bg-blue-100 text-blue-700 mt-0.5">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900 text-sm">View Only Account</span>
                    {role === 'VIEW_ONLY' && <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">Active</span>}
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    Read-Only Access: Search employees, view full profiles, appointment papers, Special Orders, leave history, and service credit histories. Cannot add/edit/delete.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowRoleModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
