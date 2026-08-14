import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Shield, Lock, FileSpreadsheet, Building2, CheckCircle2, Cloud, FileText, Info } from 'lucide-react';

export const SystemInfoView: React.FC = () => {
  const { role } = useAuth();

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
          DepEd Schools Division of Nueva Ecija • Strictly scoped for Guimba West District
        </p>
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
