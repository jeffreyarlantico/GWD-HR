import React, { useState } from 'react';
import { useHRIS } from '../../context/HRISContext';
import { useAuth } from '../../context/AuthContext';
import { Building2, Plus, Edit2, AlertCircle, Save, X, CheckCircle, XCircle } from 'lucide-react';

export const SchoolsView: React.FC = () => {
  const { schools, employeesPerSchool, addSchool, updateSchool } = useHRIS();
  const { role } = useAuth();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSchool, setEditingSchool] = useState<{ id: string; name: string; status: 'Active' | 'Inactive' } | null>(null);

  const [newSchoolName, setNewSchoolName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const res = addSchool(newSchoolName);
    if (!res.success) {
      setErrorMessage(res.message);
    } else {
      setNewSchoolName('');
      setShowAddModal(false);
    }
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSchool) return;
    setErrorMessage('');
    const res = updateSchool(editingSchool.id, editingSchool.name, editingSchool.status);
    if (!res.success) {
      setErrorMessage(res.message);
    } else {
      setEditingSchool(null);
    }
  };

  const getPersonnelCount = (schoolName: string) => {
    const found = employeesPerSchool.find(item => item.schoolName.toLowerCase() === schoolName.toLowerCase());
    return found ? found.count : 0;
  };

  return (
    <div id="schools-module-view" className="space-y-6 pb-16">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">
            <Building2 className="w-4 h-4" />
            <span>Guimba West District Schools</span>
          </div>
          <h1 className="text-xl font-extrabold text-slate-900">
            Schools ({schools.length})
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Strict DepEd District scope. Only School Name and Active/Inactive Status are stored.
          </p>
        </div>

        {role === 'ADMIN' && (
          <button
            id="btn-add-school-trigger"
            onClick={() => { setNewSchoolName(''); setErrorMessage(''); setShowAddModal(true); }}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl transition shadow-sm flex items-center space-x-2 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add District School</span>
          </button>
        )}
      </div>

      {/* Schools Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {schools.map(sch => {
          const count = getPersonnelCount(sch.name);
          return (
            <div 
              key={sch.id}
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm leading-tight">{sch.name}</h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">Guimba West District</p>
                    </div>
                  </div>

                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                    sch.status === 'Active' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-slate-200 text-slate-700 border-slate-300'
                  }`}>
                    {sch.status}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">
                  Active Personnel: <b className="text-slate-900 font-extrabold text-sm">{count}</b>
                </span>

                {role === 'ADMIN' && (
                  <button
                    onClick={() => { setEditingSchool({ id: sch.id, name: sch.name, status: sch.status }); setErrorMessage(''); }}
                    className="p-1.5 text-slate-500 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition text-xs font-bold flex items-center space-x-1"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add School Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white text-slate-900 rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-600" />
                Add Guimba West District School
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMessage && (
              <p className="text-xs text-rose-600 font-bold mt-2">{errorMessage}</p>
            )}

            <form onSubmit={handleAddSubmit} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">School Name *</label>
                <input
                  type="text"
                  required
                  value={newSchoolName}
                  onChange={(e) => setNewSchoolName(e.target.value)}
                  placeholder="e.g. Nagpapanikian Elementary School"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg"
                >
                  Save School
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit School Modal */}
      {editingSchool && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white text-slate-900 rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-amber-600" />
                Edit School Record
              </h3>
              <button onClick={() => setEditingSchool(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMessage && (
              <p className="text-xs text-rose-600 font-bold mt-2">{errorMessage}</p>
            )}

            <form onSubmit={handleEditSubmit} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">School Name *</label>
                <input
                  type="text"
                  required
                  value={editingSchool.name}
                  onChange={(e) => setEditingSchool({ ...editingSchool, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Status</label>
                <select
                  value={editingSchool.status}
                  onChange={(e) => setEditingSchool({ ...editingSchool, status: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
                <p className="text-[10px] text-slate-500 mt-1">
                  Note: Inactive schools cannot be assigned to new employees.
                </p>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingSchool(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg"
                >
                  Update School
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
