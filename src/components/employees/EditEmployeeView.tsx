import React, { useState } from 'react';
import { useHRIS } from '../../context/HRISContext';
import { ArrowLeft, Save, AlertCircle, Edit3, Image } from 'lucide-react';
import { ProfilePhotoUploader } from '../common/ProfilePhotoUploader';
import { AppointmentDocumentUploader } from '../common/AppointmentDocumentUploader';

interface EditEmployeeViewProps {
  employeeId: string;
  onBack: () => void;
  onSuccess: () => void;
}

export const EditEmployeeView: React.FC<EditEmployeeViewProps> = ({ 
  employeeId, 
  onBack, 
  onSuccess 
}) => {
  const { employees, schools, updateEmployee } = useHRIS();

  const emp = employees.find(e => e.id === employeeId);
  const activeSchools = schools.filter(s => s.status === 'Active' || s.id === emp?.schoolId);

  if (!emp) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
        <p className="text-slate-600 font-bold">Employee record not found.</p>
        <button onClick={onBack} className="mt-4 px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-semibold">
          Back
        </button>
      </div>
    );
  }

  // Form State
  const [firstName, setFirstName] = useState(emp.firstName || '');
  const [middleName, setMiddleName] = useState(emp.middleName || '');
  const [lastName, setLastName] = useState(emp.lastName || '');
  const [extensionName, setExtensionName] = useState(emp.extensionName || '');
  const [birthday, setBirthday] = useState(emp.birthday || '');
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(emp.profilePhotoUrl || '');

  const [employeeNumber, setEmployeeNumber] = useState(emp.employeeNumber || '');
  const [currentPosition, setCurrentPosition] = useState(emp.currentPosition || '');
  const [itemNumber, setItemNumber] = useState(emp.itemNumber || '');
  const [dateOfLatestAppointment, setDateOfLatestAppointment] = useState(emp.dateOfLatestAppointment || '');
  const [dateOfOriginalAppointment, setDateOfOriginalAppointment] = useState(emp.dateOfOriginalAppointment || '');
  const [appointmentDocumentUrl, setAppointmentDocumentUrl] = useState(emp.appointmentDocumentUrl || '');
  const [schoolId, setSchoolId] = useState(emp.schoolId || activeSchools[0]?.id || '');
  const [status, setStatus] = useState<'Active' | 'Inactive'>(emp.status || 'Active');

  const [tinNumber, setTinNumber] = useState(emp.tinNumber || '');
  const [lbpAccountNumber, setLbpAccountNumber] = useState(emp.lbpAccountNumber || '');
  const [gsisNumber, setGsisNumber] = useState(emp.gsisNumber || '');
  const [philhealthNumber, setPhilhealthNumber] = useState(emp.philhealthNumber || '');
  const [pagibigNumber, setPagibigNumber] = useState(emp.pagibigNumber || '');

  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!firstName.trim() || !lastName.trim()) {
      setErrorMessage('First Name and Last Name are required.');
      return;
    }

    if (!employeeNumber.trim()) {
      setErrorMessage('Employee Number is required.');
      return;
    }

    const selectedSchool = schools.find(s => s.id === schoolId);

    const result = updateEmployee(emp.id, {
      firstName: firstName.trim(),
      middleName: middleName.trim(),
      lastName: lastName.trim(),
      extensionName: extensionName.trim(),
      birthday,
      profilePhotoUrl: profilePhotoUrl.trim(),

      employeeNumber: employeeNumber.trim(),
      currentPosition: currentPosition.trim(),
      itemNumber: itemNumber.trim(),
      dateOfLatestAppointment,
      dateOfOriginalAppointment,
      appointmentDocumentUrl: appointmentDocumentUrl.trim(),
      schoolId,
      schoolName: selectedSchool ? selectedSchool.name : emp.schoolName,
      status,

      tinNumber: tinNumber.trim(),
      lbpAccountNumber: lbpAccountNumber.trim(),
      gsisNumber: gsisNumber.trim(),
      philhealthNumber: philhealthNumber.trim(),
      pagibigNumber: pagibigNumber.trim(),
    });

    if (!result.success) {
      setErrorMessage(result.message);
    } else {
      onSuccess();
    }
  };

  return (
    <div id="edit-employee-view" className="max-w-4xl mx-auto space-y-6 pb-16">
      
      {/* Top Header */}
      <div className="flex items-center justify-between bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <button
            onClick={onBack}
            className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-amber-600" />
            <span>Cancel and Return to Profile</span>
          </button>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-amber-600" />
            Edit Employee Record
          </h1>
          <p className="text-xs text-slate-500">
            Editing record for: <b>{emp.lastName}, {emp.firstName}</b> (#{emp.employeeNumber})
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 bg-rose-50 border-l-4 border-rose-600 text-rose-800 rounded-lg text-xs font-semibold flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Cannot Save Changes</p>
            <p className="mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* 1. Personal Info */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
            1. Personal Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">First Name *</label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Middle Name</label>
              <input
                type="text"
                value={middleName}
                onChange={(e) => setMiddleName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Last Name *</label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Name Extension</label>
              <input
                type="text"
                value={extensionName}
                onChange={(e) => setExtensionName(e.target.value)}
                placeholder="e.g. Jr., III"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Date of Birth</label>
              <input
                type="date"
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
              />
            </div>

              <div className="md:col-span-3 pt-2">
                <ProfilePhotoUploader
                  photoUrl={profilePhotoUrl}
                  onChange={setProfilePhotoUrl}
                  employeeName={`${firstName} ${lastName}`}
                />
              </div>
          </div>
        </div>

        {/* 2. Employment Info */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
            2. Employment Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Employee Number *</label>
              <input
                type="text"
                required
                value={employeeNumber}
                onChange={(e) => setEmployeeNumber(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Guimba West District School *</label>
              <select
                required
                value={schoolId}
                onChange={(e) => setSchoolId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {activeSchools.map(sch => (
                  <option key={sch.id} value={sch.id}>{sch.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive (Retired / Resigned / Transferred)</option>
              </select>
            </div>
          </div>
        </div>

        {/* 3. Government Info */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
            3. Government & Banking Numbers
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">TIN Number</label>
              <input
                type="text"
                value={tinNumber}
                onChange={(e) => setTinNumber(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">LBP Account Number</label>
              <input
                type="text"
                value={lbpAccountNumber}
                onChange={(e) => setLbpAccountNumber(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">GSIS Number</label>
              <input
                type="text"
                value={gsisNumber}
                onChange={(e) => setGsisNumber(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">PhilHealth Number</label>
              <input
                type="text"
                value={philhealthNumber}
                onChange={(e) => setPhilhealthNumber(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">PAG-IBIG Number</label>
              <input
                type="text"
                value={pagibigNumber}
                onChange={(e) => setPagibigNumber(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={onBack}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            id="btn-submit-edit-employee"
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl transition shadow-md flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>Update Employee Record</span>
          </button>
        </div>

      </form>
    </div>
  );
};
