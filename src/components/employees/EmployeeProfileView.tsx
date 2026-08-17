import React, { useState } from 'react';
import { useHRIS } from '../../context/HRISContext';
import { useAuth } from '../../context/AuthContext';
import { 
  ArrowLeft, 
  Edit3, 
  Building2, 
  Calendar, 
  Award, 
  FileText, 
  ExternalLink, 
  Plus, 
  UserCheck, 
  UserX,
  CreditCard,
  Briefcase,
  History,
  Clock,
  ShieldAlert,
  Trash2,
  Upload,
  Eye,
  Info
} from 'lucide-react';
import { PromotionModal } from '../promotions/PromotionModal';
import { SchoolAssignmentModal } from '../assignments/SchoolAssignmentModal';
import { LeaveRecordModal } from '../leave/LeaveRecordModal';
import { ConfirmDeleteLeaveModal } from '../leave/ConfirmDeleteLeaveModal';
import { LeaveRecord, SpecialOrder } from '../../types';
import { SpecialOrderDetailsModal } from '../serviceCredits/SpecialOrderDetailsModal';

interface EmployeeProfileViewProps {
  employeeId: string;
  onBack: () => void;
  onNavigateEdit?: (id: string) => void;
  onEditEmployee?: (id: string) => void;
}

export const EmployeeProfileView: React.FC<EmployeeProfileViewProps> = ({ 
  employeeId, 
  onBack, 
  onNavigateEdit,
  onEditEmployee
}) => {
  const { 
    getEmployeeFull, 
    updateEmployee,
    deleteEmployee,
    updatePromotion,
    deletePromotion, 
    deleteSchoolAssignment, 
    deleteLeaveRecord,
    specialOrders,
    earnedCredits,
    usedCredits,
    employees,
    schools
  } = useHRIS();
  const { role } = useAuth();

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [leaveToDelete, setLeaveToDelete] = useState<LeaveRecord | null>(null);
  const [selectedSOForDetails, setSelectedSOForDetails] = useState<SpecialOrder | null>(null);

  const empFull = getEmployeeFull(employeeId);

  // Helper to open document window safely
  const handleOpenDoc = (url: string) => {
    if (!url) return;
    if (url.startsWith('data:')) {
      const win = window.open();
      if (win) {
        if (url.startsWith('data:application/pdf')) {
          win.document.write(
            `<iframe src="${url}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`
          );
        } else if (url.startsWith('data:image')) {
          win.document.write(
            `<div style="display:flex;justify-content:center;align-items:center;min-height:100vh;background:#0f172a;"><img src="${url}" style="max-width:100%;max-height:100vh;object-fit:contain;"/></div>`
          );
        } else {
          win.document.write(
            `<div style="font-family:sans-serif;padding:2rem;text-align:center;"><h2>Appointment Document</h2><a href="${url}" download="appointment_document">Click here to download file</a></div>`
          );
        }
      }
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  // Helper to upload document for specific promotion entry
  const handleUploadPromotionDoc = (promoId: string, positionName: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.jpg,.jpeg,.png,.webp,.doc,.docx';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.size > 10 * 1024 * 1024) {
        alert('File size exceeds 10MB limit.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (evt) => {
        const result = evt.target?.result as string;
        if (result && empFull) {
          updatePromotion(promoId, { appointmentPaperUrl: result });
          if (positionName === empFull.currentPosition || !empFull.appointmentDocumentUrl) {
            updateEmployee(empFull.id, { appointmentDocumentUrl: result });
          }
        }
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  // Helper to upload document for current position
  const handleUploadCurrentPositionDoc = () => {
    if (!empFull) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.jpg,.jpeg,.png,.webp,.doc,.docx';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.size > 10 * 1024 * 1024) {
        alert('File size exceeds 10MB limit.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (evt) => {
        const result = evt.target?.result as string;
        if (result && empFull) {
          updateEmployee(empFull.id, { appointmentDocumentUrl: result });
        }
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  // Modal states for Admin history updates
  const [showAddPromotion, setShowAddPromotion] = useState(false);
  const [showAddAssignment, setShowAddAssignment] = useState(false);
  const [showAddLeave, setShowAddLeave] = useState(false);

  if (!empFull) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
        <p className="text-slate-600 font-bold">Employee record not found.</p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-semibold"
        >
          Back to Employee List
        </button>
      </div>
    );
  }

  // Calculate age
  const calculateAge = (bday: string) => {
    if (!bday) return 'N/A';
    const birthDate = new Date(bday);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const fullName = `${empFull.lastName}, ${empFull.firstName} ${empFull.middleName || ''} ${empFull.extensionName || ''}`.trim();

  return (
    <div id="employee-profile-page" className="space-y-6 pb-16">
      
      {/* Top Bar Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          id="btn-profile-back"
          onClick={onBack}
          className="inline-flex items-center space-x-2 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs hover:bg-slate-50 transition self-start"
        >
          <ArrowLeft className="w-4 h-4 text-amber-600" />
          <span>Back to Employee List</span>
        </button>

        {role === 'ADMIN' && (
          <div className="flex items-center space-x-2">
            <button
              id="btn-profile-delete-employee"
              onClick={() => {
                setDeleteReason('');
                setConfirmDelete(true);
              }}
              className="inline-flex items-center space-x-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3.5 py-2 rounded-xl font-bold text-xs shadow-2xs transition"
              title="Move this employee record to the Deleted Personnel archive"
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>Delete Personnel</span>
            </button>

            <button
              id="btn-profile-edit-employee"
              onClick={() => (onNavigateEdit ? onNavigateEdit(empFull.id) : onEditEmployee?.(empFull.id))}
              className="inline-flex items-center space-x-2 bg-amber-500 hover:bg-amber-600 text-slate-950 px-4 py-2 rounded-xl font-bold text-xs shadow-sm transition"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit Employee Record</span>
            </button>
          </div>
        )}
      </div>

      {/* 1. PROFILE HEADER CARD */}
      <div className="bg-gradient-to-r from-[#0F2942] to-[#1E3A8A] text-white p-6 rounded-2xl shadow-md border border-slate-700 flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
        
        {/* Photo */}
        <div className="w-24 h-24 rounded-full bg-slate-200 border-4 border-white/20 shadow-lg overflow-hidden flex-shrink-0 flex items-center justify-center font-extrabold text-slate-700 text-xl">
          {empFull.profilePhotoUrl ? (
            <img src={empFull.profilePhotoUrl} alt={fullName} className="w-full h-full object-cover" />
          ) : (
            `${empFull.firstName[0]}${empFull.lastName[0]}`
          )}
        </div>

        {/* Basic Info Header */}
        <div className="flex-1 text-center md:text-left">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight">{fullName}</h1>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold shadow-2xs ${
              empFull.status === 'Active' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-400 text-slate-950'
            }`}>
              {empFull.status}
            </span>
          </div>

          <p className="text-amber-400 font-bold text-sm mt-1">{empFull.currentPosition}</p>
          
          <div className="mt-3 flex flex-wrap justify-center md:justify-start items-center gap-x-4 gap-y-2 text-xs text-slate-300">
            <div className="flex items-center space-x-1.5">
              <span className="text-slate-400">Employee #:</span>
              <span className="font-mono font-bold text-white">#{empFull.employeeNumber}</span>
            </div>
            <span>•</span>
            <div className="flex items-center space-x-1.5">
              <Building2 className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-medium text-white">{empFull.schoolName}</span>
            </div>
            <span>•</span>
            <div className="flex items-center space-x-1.5">
              <Briefcase className="w-3.5 h-3.5 text-amber-400" />
              <span>Item: {empFull.itemNumber || 'N/A'}</span>
            </div>
          </div>
        </div>

      </div>

      {/* 2. THREE CORE DATA SECTIONS: Personal, Employment, Government */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Personal Info */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-600" />
            Personal Information
          </h2>
          <div className="space-y-2 text-xs">
            <div>
              <p className="text-slate-400 font-medium">Full Name</p>
              <p className="font-bold text-slate-900">{fullName}</p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <p className="text-slate-400 font-medium">Date of Birth</p>
                <p className="font-semibold text-slate-800">{empFull.birthday || 'N/A'}</p>
              </div>
              <div>
                <p className="text-slate-400 font-medium">Age</p>
                <p className="font-semibold text-slate-800">{calculateAge(empFull.birthday)} years old</p>
              </div>
            </div>
          </div>
        </div>

        {/* Employment Info */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-amber-600" />
            Employment Information
          </h2>
          <div className="space-y-3 text-xs">
            <div>
              <p className="text-slate-400 font-medium">Employee Number</p>
              <p className="font-mono font-bold text-slate-900">#{empFull.employeeNumber}</p>
            </div>
            <div>
              <p className="text-slate-400 font-medium">Assigned School / Station</p>
              <p className="font-bold text-slate-900">{empFull.schoolName}</p>
            </div>
            <div>
              <p className="text-slate-400 font-medium">Employment Status</p>
              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                empFull.status === 'Active' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-100 text-slate-700 border border-slate-300'
              }`}>
                {empFull.status}
              </span>
            </div>
          </div>
        </div>

        {/* Government Information */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-amber-600" />
            Government & Banking Info
          </h2>
          <div className="space-y-2 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-slate-400 font-medium">TIN Number</p>
                <p className="font-mono text-slate-800 font-semibold">{empFull.tinNumber || 'N/A'}</p>
              </div>
              <div>
                <p className="text-slate-400 font-medium">LBP Account #</p>
                <p className="font-mono text-slate-800 font-semibold">{empFull.lbpAccountNumber || 'N/A'}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100">
              <div>
                <p className="text-slate-400 font-medium">GSIS #</p>
                <p className="font-mono text-slate-800 font-semibold">{empFull.gsisNumber || 'N/A'}</p>
              </div>
              <div>
                <p className="text-slate-400 font-medium">PhilHealth #</p>
                <p className="font-mono text-slate-800 font-semibold">{empFull.philhealthNumber || 'N/A'}</p>
              </div>
              <div>
                <p className="text-slate-400 font-medium">PAG-IBIG #</p>
                <p className="font-mono text-slate-800 font-semibold">{empFull.pagibigNumber || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* 3. SERVICE CREDIT SUMMARY CARD */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-600" />
              Service Credit Balance Summary
            </h2>
            <p className="text-xs text-slate-500">Calculated automatically from Special Orders & Service Credit Transactions</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
            <p className="text-xs font-semibold text-emerald-800 uppercase">Total Earned Service Credits</p>
            <p className="text-2xl font-extrabold text-emerald-700 mt-1">{empFull.totalEarnedCredits.toFixed(1)} days</p>
            <p className="text-[11px] text-emerald-600 mt-0.5">Sum of credits granted via Special Orders</p>
          </div>

          <div className="p-4 bg-rose-50 rounded-xl border border-rose-200">
            <p className="text-xs font-semibold text-rose-800 uppercase">Total Used Service Credits</p>
            <p className="text-2xl font-extrabold text-rose-700 mt-1">{empFull.totalUsedCredits.toFixed(1)} days</p>
            <p className="text-[11px] text-rose-600 mt-0.5">Deducted against Special Orders</p>
          </div>

          <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
            <p className="text-xs font-semibold text-amber-800 uppercase">Available Service Credits</p>
            <p className="text-2xl font-extrabold text-amber-800 mt-1">{empFull.availableCredits.toFixed(1)} days</p>
            <p className="text-[11px] text-amber-700 mt-0.5">Total Earned − Total Used</p>
          </div>
        </div>

        {/* Special Orders Credited to this Teacher */}
        {empFull.earnedCreditsList && empFull.earnedCreditsList.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-amber-600" />
              <span>Assigned Special Orders Breakdown (Click title to view full details)</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3">SO Number</th>
                    <th className="py-2 px-3">Special Order Title</th>
                    <th className="py-2 px-3 text-right">Earned</th>
                    <th className="py-2 px-3 text-right">Used</th>
                    <th className="py-2 px-3 text-right">Available</th>
                    <th className="py-2 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {empFull.earnedCreditsList.map(ec => {
                    const so = specialOrders.find(s => s.id === ec.soId || s.soNumber === ec.soNumber);
                    const empUsedForSO = (empFull.usedCreditsList || [])
                      .filter(uc => uc.soId === ec.soId || (so && uc.soId === so.id) || uc.soNumber === ec.soNumber)
                      .reduce((sum, u) => sum + (u.usedCredits || 0), 0);
                    const availableForSO = Math.max(0, (ec.earnedCredits || 0) - empUsedForSO);

                    return (
                      <tr key={ec.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-mono font-bold text-amber-800">
                          {so ? (
                            <button
                              type="button"
                              onClick={() => setSelectedSOForDetails(so)}
                              className="hover:underline cursor-pointer bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200"
                            >
                              {ec.soNumber}
                            </button>
                          ) : (
                            ec.soNumber
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          {so ? (
                            <button
                              type="button"
                              onClick={() => setSelectedSOForDetails(so)}
                              className="font-bold text-slate-900 hover:text-amber-700 hover:underline transition text-left cursor-pointer inline-flex items-center gap-1 group"
                              title="Click to view Special Order details"
                            >
                              <span>{so.title}</span>
                              <Eye className="w-3 h-3 text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                          ) : (
                            <span className="text-slate-600">{ec.remarks || 'Special Order'}</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-extrabold text-emerald-700">+{ec.earnedCredits.toFixed(1)}d</td>
                        <td className="py-2.5 px-3 text-right font-bold text-rose-700">-{empUsedForSO.toFixed(1)}d</td>
                        <td className="py-2.5 px-3 text-right font-extrabold text-amber-800">
                          <span className={`px-2 py-0.5 rounded text-[11px] ${availableForSO > 0 ? 'bg-amber-50 text-amber-800 font-bold border border-amber-200' : 'text-slate-400'}`}>
                            {availableForSO.toFixed(1)}d
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {so && (
                            <button
                              type="button"
                              onClick={() => setSelectedSOForDetails(so)}
                              className="px-2 py-1 bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 rounded font-semibold text-[11px] inline-flex items-center gap-1 transition"
                            >
                              <Eye className="w-3 h-3 text-amber-600" />
                              <span>View SO</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* 4. PROMOTION HISTORY TABLE */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <History className="w-5 h-5 text-amber-600" />
              Promotion & Appointment History
            </h2>
            <p className="text-xs text-slate-500">Complete appointment history with OneDrive paper links</p>
          </div>

          {role === 'ADMIN' && (
            <button
              onClick={() => setShowAddPromotion(true)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-lg transition flex items-center space-x-1.5"
            >
              <Plus className="w-3.5 h-3.5 text-amber-400" />
              <span>Add Promotion Entry</span>
            </button>
          )}
        </div>

        {empFull.promotions.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">No promotion history recorded yet for this employee.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase">
                <tr>
                  <th className="py-2.5 px-3">Position</th>
                  <th className="py-2.5 px-3">Item Number</th>
                  <th className="py-2.5 px-3">Appointment Date</th>
                  <th className="py-2.5 px-3">Appointment Paper (OneDrive)</th>
                  <th className="py-2.5 px-3">Remarks</th>
                  {role === 'ADMIN' && <th className="py-2.5 px-3 text-right">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {empFull.promotions.map((promo) => (
                  <tr key={promo.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-bold text-slate-900">{promo.position}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-700">{promo.itemNumber || 'N/A'}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{promo.appointmentDate}</td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        {promo.appointmentPaperUrl ? (
                          <button
                            type="button"
                            onClick={() => handleOpenDoc(promo.appointmentPaperUrl!)}
                            className="inline-flex items-center space-x-1 text-blue-700 hover:text-blue-900 font-bold hover:underline"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>View Document ({promo.position})</span>
                            <ExternalLink className="w-3 h-3 ml-0.5" />
                          </button>
                        ) : (
                          <span className="text-slate-400 italic">No document</span>
                        )}

                        {role === 'ADMIN' && (
                          <button
                            type="button"
                            onClick={() => handleUploadPromotionDoc(promo.id, promo.position)}
                            className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded text-[10px] font-bold transition flex items-center gap-1 shrink-0"
                            title={`Upload/Change appointment document for ${promo.position}`}
                          >
                            <Upload className="w-3 h-3 text-amber-600" />
                            <span>{promo.appointmentPaperUrl ? 'Change' : 'Upload'}</span>
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{promo.remarks || '—'}</td>
                    {role === 'ADMIN' && (
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => deletePromotion(promo.id)}
                          className="text-rose-600 hover:text-rose-800 p-1 rounded hover:bg-rose-50"
                          title="Delete entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. SCHOOL ASSIGNMENT HISTORY TABLE */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-amber-600" />
              School Assignment History
            </h2>
            <p className="text-xs text-slate-500">Historical trail of schools where the employee was assigned</p>
          </div>

          {role === 'ADMIN' && (
            <button
              onClick={() => setShowAddAssignment(true)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-lg transition flex items-center space-x-1.5"
            >
              <Plus className="w-3.5 h-3.5 text-amber-400" />
              <span>Add Assignment Entry</span>
            </button>
          )}
        </div>

        {empFull.schoolAssignments.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">No school transfer history recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase">
                <tr>
                  <th className="py-2.5 px-3">School Name</th>
                  <th className="py-2.5 px-3">Effective Date (From)</th>
                  <th className="py-2.5 px-3">End Date (To)</th>
                  <th className="py-2.5 px-3">Remarks</th>
                  {role === 'ADMIN' && <th className="py-2.5 px-3 text-right">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {empFull.schoolAssignments.map((sa) => (
                  <tr key={sa.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-bold text-slate-900">{sa.schoolName}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{sa.effectiveDateFrom}</td>
                    <td className="py-2.5 px-3 text-slate-700">{sa.effectiveDateTo || 'Present'}</td>
                    <td className="py-2.5 px-3 text-slate-600">{sa.remarks || '—'}</td>
                    {role === 'ADMIN' && (
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => deleteSchoolAssignment(sa.id)}
                          className="text-rose-600 hover:text-rose-800 p-1 rounded hover:bg-rose-50"
                          title="Delete entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 6. LEAVE HISTORY TABLE */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-600" />
              Leave History Records
            </h2>
            <p className="text-xs text-slate-500">Record of leaves (Maternity Leave, LWOP, etc.)</p>
          </div>

          {role === 'ADMIN' && (
            <button
              onClick={() => setShowAddLeave(true)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-lg transition flex items-center space-x-1.5"
            >
              <Plus className="w-3.5 h-3.5 text-amber-400" />
              <span>Record Leave Entry</span>
            </button>
          )}
        </div>

        {empFull.leaveRecords.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">No leave transactions recorded for this employee.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase">
                <tr>
                  <th className="py-2.5 px-3">Leave Type</th>
                  <th className="py-2.5 px-3">Date From</th>
                  <th className="py-2.5 px-3">Date To</th>
                  <th className="py-2.5 px-3"># Days</th>
                  <th className="py-2.5 px-3">Supporting Doc (OneDrive)</th>
                  <th className="py-2.5 px-3">Remarks</th>
                  {role === 'ADMIN' && <th className="py-2.5 px-3 text-right">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {empFull.leaveRecords.map((lvr) => (
                  <tr key={lvr.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-bold text-slate-900">{lvr.leaveType}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{lvr.dateFrom}</td>
                    <td className="py-2.5 px-3 text-slate-800">{lvr.dateTo}</td>
                    <td className="py-2.5 px-3 font-extrabold text-amber-800">{lvr.numberOfDays} days</td>
                    <td className="py-2.5 px-3">
                      {lvr.documentUrl ? (
                        <a
                          href={lvr.documentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-1 text-blue-700 hover:text-blue-900 font-bold hover:underline"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>View Document</span>
                          <ExternalLink className="w-3 h-3 ml-0.5" />
                        </a>
                      ) : (
                        <span className="text-slate-400 italic">No document</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{lvr.remarks || '—'}</td>
                    {role === 'ADMIN' && (
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => setLeaveToDelete(lvr)}
                          className="text-rose-600 hover:text-rose-800 p-1 rounded hover:bg-rose-50"
                          title="Delete leave entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Admin Modals */}
      {showAddPromotion && (
        <PromotionModal
          employeeId={empFull.id}
          onClose={() => setShowAddPromotion(false)}
        />
      )}

      {showAddAssignment && (
        <SchoolAssignmentModal
          employeeId={empFull.id}
          onClose={() => setShowAddAssignment(false)}
        />
      )}

      {showAddLeave && (
        <LeaveRecordModal
          employeeId={empFull.id}
          onClose={() => setShowAddLeave(false)}
        />
      )}

      {/* Confirm Delete Leave Modal */}
      <ConfirmDeleteLeaveModal
        isOpen={Boolean(leaveToDelete)}
        onClose={() => setLeaveToDelete(null)}
        onConfirm={(reason) => {
          if (leaveToDelete) {
            deleteLeaveRecord(leaveToDelete.id, reason);
            setLeaveToDelete(null);
          }
        }}
        leaveRecord={
          leaveToDelete
            ? {
                id: leaveToDelete.id,
                leaveType: leaveToDelete.leaveType,
                dateFrom: leaveToDelete.dateFrom,
                dateTo: leaveToDelete.dateTo,
                numberOfDays: leaveToDelete.numberOfDays,
                remarks: leaveToDelete.remarks,
                employeeName: `${empFull.lastName}, ${empFull.firstName}`,
                schoolName: empFull.schoolName,
              }
            : null
        }
      />

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white text-slate-900 rounded-xl max-w-md w-full p-6 shadow-2xl border border-rose-200">
            <div className="flex items-center space-x-3 text-rose-600 mb-3">
              <div className="p-2.5 bg-rose-100 rounded-xl">
                <Trash2 className="w-6 h-6 text-rose-600" />
              </div>
              <h3 className="font-extrabold text-base text-slate-900">
                Move Personnel to Deleted Archive?
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-3">
              Are you sure you want to remove <b>{fullName}</b> (Employee #{empFull.employeeNumber}) from the active directory? This record will be safely moved to the <b>Deleted Personnel Archive</b>, where you can review or restore it at any time.
            </p>

            <div className="mb-4">
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Reason for Deletion (Optional)
              </label>
              <input
                type="text"
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="e.g. Transferred outside district, duplicate entry, resigned..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteEmployee(empFull.id, deleteReason);
                  setConfirmDelete(false);
                  onBack();
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs shadow-xs"
              >
                Yes, Move to Deleted Archive
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Special Order Details Modal */}
      <SpecialOrderDetailsModal
        isOpen={Boolean(selectedSOForDetails)}
        onClose={() => setSelectedSOForDetails(null)}
        specialOrder={selectedSOForDetails}
        employees={employees}
        schools={schools}
        earnedCredits={earnedCredits}
        usedCredits={usedCredits}
        role={role}
      />

    </div>
  );
};
