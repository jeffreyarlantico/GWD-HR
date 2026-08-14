import React, { useState } from 'react';
import { useHRIS } from '../../context/HRISContext';
import { Building2, Save, X, AlertCircle } from 'lucide-react';

interface SchoolAssignmentModalProps {
  employeeId: string;
  onClose: () => void;
}

export const SchoolAssignmentModal: React.FC<SchoolAssignmentModalProps> = ({ employeeId, onClose }) => {
  const { schools, addSchoolAssignment } = useHRIS();

  const [schoolId, setSchoolId] = useState(schools[0]?.id || '');
  const [effectiveDateFrom, setEffectiveDateFrom] = useState(new Date().toISOString().split('T')[0]);
  const [effectiveDateTo, setEffectiveDateTo] = useState('Present');
  const [remarks, setRemarks] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const selectedSchool = schools.find(s => s.id === schoolId);
    if (!selectedSchool || !effectiveDateFrom) return;

    addSchoolAssignment({
      employeeId,
      schoolId: selectedSchool.id,
      schoolName: selectedSchool.name,
      effectiveDateFrom,
      effectiveDateTo: effectiveDateTo.trim() || 'Present',
      remarks: remarks.trim(),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white text-slate-900 rounded-xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
        
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-base text-slate-900">Add School Assignment Entry</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-[11px] text-blue-900 flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <p>
            When an employee transfers between schools in Guimba West District, add a historical entry here. Previous school assignments are preserved permanently.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Guimba West School *</label>
            <select
              value={schoolId}
              onChange={(e) => setSchoolId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
            >
              {schools.map(sch => (
                <option key={sch.id} value={sch.id}>{sch.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Effective Date (From) *</label>
              <input
                type="date"
                required
                value={effectiveDateFrom}
                onChange={(e) => setEffectiveDateFrom(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">End Date (To)</label>
              <input
                type="text"
                value={effectiveDateTo}
                onChange={(e) => setEffectiveDateTo(e.target.value)}
                placeholder="e.g. Present or YYYY-MM-DD"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Remarks / Re-assignment Order #</label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Transferred per District Re-assignment Order #12..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg flex items-center space-x-1"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save School Assignment</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
