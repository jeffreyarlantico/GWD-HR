import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useHRIS } from '../../context/HRISContext';
import { Shield, Lock, Building2, CheckCircle2, Cloud, FileText, Info, Database, RefreshCw, UploadCloud, DownloadCloud, AlertCircle } from 'lucide-react';
import firebaseConfig from '../../../firebase-applet-config.json';

export const SystemInfoView: React.FC = () => {
  const { role } = useAuth();
  const { isFirestoreConnected, syncAllToFirestore, fetchFromFirestore, employees, schools, specialOrders, leaveRecords } = useHRIS();
  
  const [syncing, setSyncing] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleSyncToFirestore = async () => {
    setSyncing(true);
    setMessage(null);
    try {
      const res = await syncAllToFirestore();
      setMessage({ text: res.message, type: res.success ? 'success' : 'error' });
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to sync', type: 'error' });
    } finally {
      setSyncing(false);
    }
  };

  const handleFetchFromFirestore = async () => {
    setFetching(true);
    setMessage(null);
    try {
      const res = await fetchFromFirestore();
      setMessage({ text: res.message, type: res.success ? 'success' : 'error' });
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to fetch', type: 'error' });
    } finally {
      setFetching(false);
    }
  };

  return (
    <div id="system-info-view" className="space-y-6 pb-16">
      
      {/* Top Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-2 text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">
          <Info className="w-4 h-4" />
          <span>District HR Architecture & Compliance</span>
        </div>
        <h1 className="text-xl font-extrabold text-slate-900">
          Guimba West District HRIS Documentation & Security
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          DepEd Schools Division of Nueva Ecija • Powered by Firebase Cloud Firestore & Google Drive
        </p>
      </div>

      {/* Firebase Cloud Firestore Card */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-6 rounded-xl border border-amber-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-amber-600 text-white rounded-lg shadow-sm">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-slate-900">Firebase Cloud Firestore</h2>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
                  Active & Connected
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Real-time enterprise cloud persistence with zero-trust Attribute-Based Access Control (ABAC) rules.
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              id="sync-to-firestore-btn"
              onClick={handleSyncToFirestore}
              disabled={syncing}
              className="inline-flex items-center space-x-1.5 px-3 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer"
            >
              <UploadCloud className={`w-4 h-4 ${syncing ? 'animate-bounce' : ''}`} />
              <span>{syncing ? 'Syncing...' : 'Sync Dataset to Cloud'}</span>
            </button>
            <button
              id="fetch-from-firestore-btn"
              onClick={handleFetchFromFirestore}
              disabled={fetching}
              className="inline-flex items-center space-x-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer"
            >
              <DownloadCloud className={`w-4 h-4 ${fetching ? 'animate-bounce' : ''}`} />
              <span>{fetching ? 'Loading...' : 'Pull from Cloud'}</span>
            </button>
          </div>
        </div>

        {message && (
          <div className={`p-3 rounded-lg text-xs font-medium flex items-center space-x-2 ${
            message.type === 'success' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-rose-100 text-rose-800 border border-rose-300'
          }`}>
            {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
            <span>{message.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-white/80 p-3 rounded-lg border border-amber-200/60">
          <div>
            <span className="text-slate-500 block">Project ID:</span>
            <span className="font-mono font-bold text-slate-800">{firebaseConfig.projectId}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Database Instance:</span>
            <span className="font-mono font-bold text-slate-800 truncate block" title={firebaseConfig.firestoreDatabaseId}>{firebaseConfig.firestoreDatabaseId}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Security Rules:</span>
            <span className="font-semibold text-emerald-700">Rules Version 2 (Hardened ABAC)</span>
          </div>
        </div>
      </div>

      {/* Grid: Key Policies */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Card 1: Strict Scope & Business Rules */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-amber-600" />
            District Scope & Business Mandates
          </h2>
          <ul className="space-y-2 text-xs text-slate-700">
            <li className="flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span><b>Strict District Boundary:</b> Exclusively for Guimba West District elementary and secondary public schools and personnel.</span>
            </li>
            <li className="flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span><b>Unique Employee Numbers:</b> Employee Numbers are validated for uniqueness across all records.</span>
            </li>
            <li className="flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span><b>Non-Destructive HR Workflow:</b> Employees who retire, resign, transfer out, or pass away are marked <i>Inactive</i>. Records remain permanently searchable.</span>
            </li>
            <li className="flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span><b>Service Credit Traceability:</b> Every earned and used credit is linked to its originating Special Order with zero over-deduction enforcement.</span>
            </li>
          </ul>
        </div>

        {/* Card 2: Security & Sensitive Data */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-600" />
            Sensitive Data Security & Document Storage
          </h2>
          <ul className="space-y-2 text-xs text-slate-700">
            <li className="flex items-start space-x-2">
              <Shield className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <span><b>Protected Government IDs:</b> Secure handling of TIN, GSIS, PhilHealth, PAG-IBIG, and LBP account numbers.</span>
            </li>
            <li className="flex items-start space-x-2">
              <Cloud className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <span><b>Microsoft OneDrive Storage:</b> Appointment papers, profile photos, and Special Order files are referenced via secure OneDrive links rather than clogging database payloads.</span>
            </li>
            <li className="flex items-start space-x-2">
              <FileText className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <span><b>Role Isolation:</b> Administrator accounts hold full write/import permissions, while View-Only personnel are strictly restricted to read-only views.</span>
            </li>
          </ul>
        </div>

      </div>

      {/* Role Capabilities Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
        <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
          MVP Account Capabilities Comparison
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase">
              <tr>
                <th className="py-2.5 px-3">HR Function / Module</th>
                <th className="py-2.5 px-3 text-emerald-800 bg-emerald-50">Administrator Account</th>
                <th className="py-2.5 px-3 text-blue-800 bg-blue-50">View-Only Personnel</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              <tr>
                <td className="py-2 px-3 font-semibold">Search & View Employee Profiles</td>
                <td className="py-2 px-3 font-bold text-emerald-700">Allowed</td>
                <td className="py-2 px-3 font-bold text-emerald-700">Allowed</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-semibold">Add / Edit Employee Records</td>
                <td className="py-2 px-3 font-bold text-emerald-700">Allowed</td>
                <td className="py-2 px-3 font-bold text-rose-600">Forbidden</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-semibold">Mark Employee Active / Inactive</td>
                <td className="py-2 px-3 font-bold text-emerald-700">Allowed</td>
                <td className="py-2 px-3 font-bold text-rose-600">Forbidden</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-semibold">Manage Schools (Add/Edit)</td>
                <td className="py-2 px-3 font-bold text-emerald-700">Allowed</td>
                <td className="py-2 px-3 font-bold text-rose-600">Forbidden</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-semibold">Manage Promotions & Assignments</td>
                <td className="py-2 px-3 font-bold text-emerald-700">Allowed</td>
                <td className="py-2 px-3 font-bold text-rose-600">Forbidden</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-semibold">Special Orders & Credit Deductions</td>
                <td className="py-2 px-3 font-bold text-emerald-700">Allowed</td>
                <td className="py-2 px-3 font-bold text-rose-600">Forbidden</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-semibold">Excel & Google Sheets Batch Import</td>
                <td className="py-2 px-3 font-bold text-emerald-700">Allowed</td>
                <td className="py-2 px-3 font-bold text-rose-600">Forbidden</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
