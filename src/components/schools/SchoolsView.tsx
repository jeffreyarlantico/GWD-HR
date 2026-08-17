import React, { useState } from 'react';
import { useHRIS } from '../../context/HRISContext';
import { useAuth } from '../../context/AuthContext';
import { 
  Building2, 
  Plus, 
  Edit2, 
  Trash2, 
  RotateCcw, 
  AlertCircle, 
  AlertTriangle,
  X, 
  CheckCircle,
  Clock,
  ShieldAlert,
  Users
} from 'lucide-react';

export const SchoolsView: React.FC = () => {
  const { 
    schools, 
    deletedSchools, 
    employeesPerSchool, 
    addSchool, 
    updateSchool, 
    deleteSchool,
    restoreSchool,
    permanentlyDeleteSchool 
  } = useHRIS();
  const { role } = useAuth();

  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'DELETED'>('ACTIVE');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSchool, setEditingSchool] = useState<{ id: string; name: string; status: 'Active' | 'Inactive' } | null>(null);
  
  // Deletion modals
  const [confirmDeleteSchool, setConfirmDeleteSchool] = useState<{ id: string; name: string; personnelCount: number } | null>(null);
  const [confirmPermDeleteSchool, setConfirmPermDeleteSchool] = useState<{ id: string; name: string } | null>(null);

  const [newSchoolName, setNewSchoolName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const res = addSchool(newSchoolName);
    if (!res.success) {
      setErrorMessage(res.message);
    } else {
      setNewSchoolName('');
      setShowAddModal(false);
      showToast('success', `"${newSchoolName}" added successfully.`);
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
      showToast('success', `"${editingSchool.name}" updated successfully.`);
    }
  };

  const handleDeleteSchoolConfirm = () => {
    if (!confirmDeleteSchool) return;
    const res = deleteSchool(confirmDeleteSchool.id);
    setConfirmDeleteSchool(null);
    if (res.success) {
      showToast('success', res.message);
    } else {
      showToast('error', res.message);
    }
  };

  const handleRestoreSchool = (id: string) => {
    const res = restoreSchool(id);
    if (res.success) {
      showToast('success', res.message);
    } else {
      showToast('error', res.message);
    }
  };

  const handlePermanentDeleteSchool = () => {
    if (!confirmPermDeleteSchool) return;
    const res = permanentlyDeleteSchool(confirmPermDeleteSchool.id);
    setConfirmPermDeleteSchool(null);
    showToast('success', res.message);
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
            District Schools ({schools.length})
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Strict DepEd District scope. Manage active schools, add new schools, or view deleted schools archive.
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

      {/* Toast Notification */}
      {toastMessage && (
        <div className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-semibold shadow-sm transition ${
          toastMessage.type === 'success' ? 'bg-emerald-50 text-emerald-900 border-emerald-200' : 'bg-rose-50 text-rose-900 border-rose-200'
        }`}>
          <div className="flex items-center space-x-2">
            {toastMessage.type === 'success' ? <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />}
            <span>{toastMessage.text}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('ACTIVE')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
            activeTab === 'ACTIVE'
              ? 'bg-amber-500 text-slate-950 shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Active Schools</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
            activeTab === 'ACTIVE' ? 'bg-slate-950 text-amber-300' : 'bg-slate-200 text-slate-700'
          }`}>
            {schools.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('DELETED')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
            activeTab === 'DELETED'
              ? 'bg-rose-700 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Trash2 className="w-4 h-4" />
          <span>Deleted Schools Archive</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
            activeTab === 'DELETED' ? 'bg-rose-950 text-rose-200' : 'bg-slate-200 text-slate-700'
          }`}>
            {deletedSchools.length}
          </span>
        </button>
      </div>

      {/* View 1: Active Schools */}
      {activeTab === 'ACTIVE' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {schools.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200 p-8">
              <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No active district schools.</p>
              <p className="text-xs text-slate-400 mt-1">Click "Add District School" to create one.</p>
            </div>
          ) : (
            schools.map(sch => {
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
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => { setEditingSchool({ id: sch.id, name: sch.name, status: sch.status }); setErrorMessage(''); }}
                          className="p-1.5 text-slate-500 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition text-xs font-bold flex items-center space-x-1"
                          title="Edit School"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>

                        <button
                          onClick={() => setConfirmDeleteSchool({ id: sch.id, name: sch.name, personnelCount: count })}
                          className="p-1.5 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition text-xs font-bold flex items-center space-x-1"
                          title="Delete School"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* View 2: Deleted Schools Archive */}
      {activeTab === 'DELETED' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {deletedSchools.length === 0 ? (
            <div className="py-12 text-center text-slate-500 p-8">
              <Trash2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No deleted schools in archive.</p>
              <p className="text-xs text-slate-400 mt-1">All deleted schools will appear here with one-click restore.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">School Name</th>
                    <th className="py-3 px-4">Previous Status</th>
                    <th className="py-3 px-4">Deleted On</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {deletedSchools.map((sch) => (
                    <tr key={sch.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-bold text-slate-900 flex items-center space-x-2">
                        <Building2 className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>{sch.name}</span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          {sch.status}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-1 text-rose-700 font-semibold text-[11px]">
                          <Clock className="w-3 h-3 text-rose-500" />
                          <span>{new Date(sch.deletedAt).toLocaleDateString()} {new Date(sch.deletedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right space-x-2">
                        {role === 'ADMIN' ? (
                          <>
                            <button
                              onClick={() => handleRestoreSchool(sch.id)}
                              className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold inline-flex items-center space-x-1 transition"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Restore</span>
                            </button>

                            <button
                              onClick={() => setConfirmPermDeleteSchool({ id: sch.id, name: sch.name })}
                              className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold inline-flex items-center space-x-1 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete Forever</span>
                            </button>
                          </>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Admin only</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Delete School Modal Confirmation */}
      {confirmDeleteSchool && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white text-slate-900 rounded-xl max-w-md w-full p-6 shadow-2xl border border-rose-200">
            <div className="flex items-center space-x-3 text-rose-600 mb-3">
              <div className="p-2.5 bg-rose-100 rounded-xl">
                <Trash2 className="w-6 h-6 text-rose-600" />
              </div>
              <h3 className="font-extrabold text-base text-slate-900">
                Move School to Deleted Archive?
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-3">
              Are you sure you want to remove <b>{confirmDeleteSchool.name}</b>? It will be moved to the Deleted Schools Archive where it can be restored anytime.
            </p>

            {confirmDeleteSchool.personnelCount > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 mb-4 flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <b>Notice:</b> This school currently has <b>{confirmDeleteSchool.personnelCount}</b> personnel record(s) referencing it. Their profiles will retain this school name unless reassigned.
                </span>
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteSchool(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteSchoolConfirm}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs shadow-xs"
              >
                Move to Trash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Permanent Delete School Modal Confirmation */}
      {confirmPermDeleteSchool && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white text-slate-900 rounded-xl max-w-md w-full p-6 shadow-2xl border border-rose-200">
            <div className="flex items-center space-x-3 text-rose-600 mb-3">
              <div className="p-2.5 bg-rose-100 rounded-xl">
                <ShieldAlert className="w-6 h-6 text-rose-600" />
              </div>
              <h3 className="font-extrabold text-base text-slate-900">
                Permanently Delete School?
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Are you sure you want to permanently erase <b>{confirmPermDeleteSchool.name}</b> from the database? This action is <b>irreversible</b>.
            </p>

            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setConfirmPermDeleteSchool(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePermanentDeleteSchool}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs shadow-xs"
              >
                Yes, Delete Forever
              </button>
            </div>
          </div>
        </div>
      )}

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
