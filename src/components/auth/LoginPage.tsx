import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Role } from '../../types';
import { DistrictLogo } from '../common/DistrictLogo';
import { 
  Shield, 
  UserCheck, 
  Lock, 
  LogIn, 
  CheckCircle2, 
  AlertCircle,
  KeyRound,
  Eye,
  EyeOff,
  Sparkles
} from 'lucide-react';

const ADMIN_PASSWORD = 'GWD@dm1nenc0de';
const VIEWER_PASSWORD = 'GWDviewHR';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  
  const [selectedRole, setSelectedRole] = useState<Role>('ADMIN');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
    setError('');
    setPassword('');
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const expectedPassword = selectedRole === 'ADMIN' ? ADMIN_PASSWORD : VIEWER_PASSWORD;

    if (password !== expectedPassword) {
      setError(`Invalid password for ${selectedRole === 'ADMIN' ? 'Administrator' : 'Viewer'} account.`);
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      login(selectedRole);
      setIsLoading(false);
    }, 300);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans antialiased relative overflow-hidden selection:bg-amber-500 selection:text-slate-950">
      
      {/* Background Decorative Gradient Blobs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top District Header */}
      <header className="pt-8 px-6 text-center z-10">
        <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs px-3.5 py-1.5 rounded-full mb-3 backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-semibold tracking-wide">DepEd Region III • Division of Nueva Ecija</span>
        </div>
        <div className="flex items-center justify-center space-x-3 mt-1">
          <DistrictLogo size="lg" className="shadow-lg shadow-amber-500/10" />
          <div className="text-left">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Guimba West District HRIS
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 font-medium">
              Human Resource Information System
            </p>
          </div>
        </div>
      </header>

      {/* Main Login Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 z-10 my-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl backdrop-blur-xl max-w-lg w-full p-6 sm:p-8 space-y-6">
          
          <div className="text-center space-y-1">
            <h2 className="text-xl font-bold text-white flex items-center justify-center gap-2">
              <Lock className="w-5 h-5 text-amber-400" />
              <span>Select Account Portal</span>
            </h2>
            <p className="text-xs text-slate-400">
              Choose your role to access Guimba West District personnel records
            </p>
          </div>

          {/* Role Cards Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            
            {/* Administrator Option */}
            <button
              type="button"
              onClick={() => handleRoleSelect('ADMIN')}
              className={`p-4 rounded-xl border-2 text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                selectedRole === 'ADMIN'
                  ? 'bg-emerald-950/40 border-emerald-500 text-emerald-200 shadow-md shadow-emerald-950/50'
                  : 'bg-slate-800/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:bg-slate-800/80'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-lg ${selectedRole === 'ADMIN' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                    <Shield className="w-5 h-5" />
                  </div>
                  {selectedRole === 'ADMIN' && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  )}
                </div>
                <h3 className="font-bold text-sm text-white">Administrator</h3>
                <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                  Full District Access: Add/Edit Personnel, Special Orders, Service Credits & Schools
                </p>
              </div>
              <div className="mt-3 text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                Protected Admin Portal
              </div>
            </button>

            {/* Viewer / View-Only Option */}
            <button
              type="button"
              onClick={() => handleRoleSelect('VIEW_ONLY')}
              className={`p-4 rounded-xl border-2 text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                selectedRole === 'VIEW_ONLY'
                  ? 'bg-blue-950/40 border-blue-500 text-blue-200 shadow-md shadow-blue-950/50'
                  : 'bg-slate-800/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:bg-slate-800/80'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-lg ${selectedRole === 'VIEW_ONLY' ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-400'}`}>
                    <UserCheck className="w-5 h-5" />
                  </div>
                  {selectedRole === 'VIEW_ONLY' && (
                    <CheckCircle2 className="w-4 h-4 text-blue-400" />
                  )}
                </div>
                <h3 className="font-bold text-sm text-white">Viewer Account</h3>
                <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                  Read-Only Access: Directory search, Employee Profiles, Special Orders & Leave History
                </p>
              </div>
              <div className="mt-3 text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                Protected Viewer Portal
              </div>
            </button>

          </div>

          {/* Form Credentials */}
          <form onSubmit={handleLogin} className="space-y-4 pt-1">
            
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Account Password</span>
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={`Enter password for ${selectedRole === 'ADMIN' ? 'Administrator' : 'Viewer'}...`}
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 p-0.5"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-rose-950/60 border border-rose-800/80 rounded-xl text-rose-300 text-xs font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Primary Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition shadow-lg ${
                selectedRole === 'ADMIN'
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                  : 'bg-blue-500 hover:bg-blue-400 text-slate-950 shadow-blue-500/20'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isLoading ? (
                <span>Logging into {selectedRole === 'ADMIN' ? 'Administrator' : 'Viewer'}...</span>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Log In as {selectedRole === 'ADMIN' ? 'Administrator' : 'Viewer Account'}</span>
                </>
              )}
            </button>
          </form>

        </div>
      </main>

      {/* Footer */}
      <footer className="pb-6 text-center text-[11px] text-slate-400 z-10 px-4 space-y-2">
        <div className="inline-flex items-center justify-center flex-wrap gap-1.5 bg-slate-900/90 border border-slate-800/90 px-3.5 py-1.5 rounded-full text-xs shadow-md backdrop-blur-md">
          <span className="text-slate-500 font-normal">System Creator:</span>
          <span className="font-bold text-amber-400">Jeffrey P. Arlantico</span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-300 font-medium">Administrative Officer II</span>
        </div>
        <p className="text-slate-500 text-[11px]">
          Guimba West District HR Information System (HRIS) • Department of Education, Division of Nueva Ecija
        </p>
        <p className="text-slate-600 text-[10px]">
          Restricted System for Authorized District Personnel and School Heads
        </p>
      </footer>

    </div>
  );
};
