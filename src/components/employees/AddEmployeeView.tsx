import React, { useState, useRef } from 'react';
import { useHRIS } from '../../context/HRISContext';
import { 
  ArrowLeft, 
  Save, 
  AlertCircle, 
  Building2, 
  UserPlus, 
  Image, 
  FileSpreadsheet, 
  Download, 
  Upload, 
  CheckCircle2, 
  FileCheck,
  AlertTriangle
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Employee, DuplicateResolution } from '../../types';
import { ProfilePhotoUploader } from '../common/ProfilePhotoUploader';
import { AppointmentDocumentUploader } from '../common/AppointmentDocumentUploader';

interface AddEmployeeViewProps {
  onBack: () => void;
  onSuccess: (newEmployeeId: string) => void;
}

export const AddEmployeeView: React.FC<AddEmployeeViewProps> = ({ onBack, onSuccess }) => {
  const { schools, addEmployee, employees, importEmployeesBatch } = useHRIS();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeSchools = schools.filter(s => s.status === 'Active');

  // Mode: MANUAL form entry vs EXCEL BATCH preview
  const [entryMode, setEntryMode] = useState<'MANUAL' | 'EXCEL_BATCH'>('MANUAL');

  // Form State
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [extensionName, setExtensionName] = useState('');
  const [birthday, setBirthday] = useState('');
  const [profilePhotoUrl, setProfilePhotoUrl] = useState('');

  const [employeeNumber, setEmployeeNumber] = useState('');
  const [currentPosition, setCurrentPosition] = useState('Teacher I');
  const [itemNumber, setItemNumber] = useState('');
  const [dateOfLatestAppointment, setDateOfLatestAppointment] = useState('');
  const [dateOfOriginalAppointment, setDateOfOriginalAppointment] = useState('');
  const [appointmentDocumentUrl, setAppointmentDocumentUrl] = useState('');
  const [schoolId, setSchoolId] = useState(activeSchools[0]?.id || '');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');

  const [tinNumber, setTinNumber] = useState('');
  const [lbpAccountNumber, setLbpAccountNumber] = useState('');
  const [gsisNumber, setGsisNumber] = useState('');
  const [philhealthNumber, setPhilhealthNumber] = useState('');
  const [pagibigNumber, setPagibigNumber] = useState('');

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Batch import state
  const [parsedRows, setParsedRows] = useState<{
    rowIndex: number;
    data: Partial<Employee>;
    isDuplicate: boolean;
  }[]>([]);
  const [rowResolutions, setRowResolutions] = useState<Record<string, DuplicateResolution>>({});

  // Helper date formatter
  const formatExcelDate = (val: any): string => {
    if (!val) return '';
    if (typeof val === 'number') {
      const date = new Date((val - (25567 + 2)) * 86400 * 1000);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    }
    const str = String(val).trim();
    if (str.match(/^\d{4}-\d{2}-\d{2}$/)) return str;
    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0];
    }
    return str;
  };

  // Download Sample Excel Template
  const handleDownloadTemplate = () => {
    const defaultSchoolName = activeSchools[0]?.name || 'Guimba West Central School';
    const sampleData = [
      {
        'Employee Number': '4820199',
        'First Name': 'Maria Elena',
        'Middle Name': 'Santos',
        'Last Name': 'Dela Cruz',
        'Name Extension': '',
        'Date of Birth': '1988-05-12',
        'Current Position': 'Teacher III',
        'Plantilla Item Number': 'OSEC-DECSB-TCH3-150001',
        'School Name': defaultSchoolName,
        'Date of Latest Appointment': '2021-06-15',
        'Date of Original Appointment': '2012-08-01',
        'Status': 'Active',
        'TIN Number': '123-456-789-000',
        'LBP Account Number': '1234-5678-90',
        'GSIS BP Number': '2001234567',
        'PhilHealth Number': '12-345678901-2',
        'PAG-IBIG Number': '1210-3456-7890',
        'Profile Photo URL': ''
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Employee Template');
    XLSX.writeFile(workbook, 'Guimba_West_District_Employee_Template.xlsx');
  };

  // Handle Excel File Upload
  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage('');
    setSuccessMessage('');
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json: any[] = XLSX.utils.sheet_to_json(worksheet);

        if (!Array.isArray(json) || json.length === 0) {
          setErrorMessage('Uploaded Excel file contains no data rows.');
          return;
        }

        const defaultSchool = activeSchools[0]?.name || 'Guimba West Central School';
        const defaultSchoolId = activeSchools[0]?.id || '';

        if (json.length === 1) {
          // SINGLE ROW: Pre-fill manual form directly
          const row = json[0];
          const empNum = String(
            row['Employee Number'] || row['Employee No'] || row['Employee #'] || row['EmpNo'] || row['EMP_NUM'] || ''
          ).trim();

          const fName = String(row['First Name'] || row['FirstName'] || row['FIRST_NAME'] || '').trim();
          const mName = String(row['Middle Name'] || row['MiddleName'] || row['MIDDLE_NAME'] || '').trim();
          const lName = String(row['Last Name'] || row['LastName'] || row['LAST_NAME'] || row['Surname'] || '').trim();
          const extName = String(row['Name Extension'] || row['Extension'] || row['Suffix'] || '').trim();
          
          const pos = String(row['Current Position'] || row['Position'] || row['POSITION'] || 'Teacher I').trim();
          const item = String(row['Plantilla Item Number'] || row['Item Number'] || row['Item #'] || '').trim();
          
          const schoolInput = String(row['School Name'] || row['School'] || row['SCHOOL'] || defaultSchool).trim();
          const matchedSch = schools.find(s => s.name.toLowerCase() === schoolInput.toLowerCase());

          setEmployeeNumber(empNum);
          setFirstName(fName);
          setMiddleName(mName);
          setLastName(lName);
          setExtensionName(extName);
          setBirthday(formatExcelDate(row['Date of Birth'] || row['Birthday'] || row['BIRTHDAY']));
          setCurrentPosition(pos);
          setItemNumber(item);
          setSchoolId(matchedSch ? matchedSch.id : defaultSchoolId);
          setDateOfLatestAppointment(formatExcelDate(row['Date of Latest Appointment'] || row['Latest Appointment']));
          setDateOfOriginalAppointment(formatExcelDate(row['Date of Original Appointment'] || row['Original Appointment']));
          setStatus((String(row['Status'] || 'Active').toLowerCase() === 'inactive') ? 'Inactive' : 'Active');

          setTinNumber(String(row['TIN Number'] || row['TIN'] || '').trim());
          setLbpAccountNumber(String(row['LBP Account Number'] || row['LBP'] || '').trim());
          setGsisNumber(String(row['GSIS BP Number'] || row['GSIS'] || '').trim());
          setPhilhealthNumber(String(row['PhilHealth Number'] || row['PhilHealth'] || '').trim());
          setPagibigNumber(String(row['PAG-IBIG Number'] || row['PAGIBIG'] || row['Pag-IBIG'] || '').trim());
          setProfilePhotoUrl(String(row['Profile Photo URL'] || row['Photo URL'] || '').trim());

          setEntryMode('MANUAL');
          setSuccessMessage(`Form successfully pre-filled from Excel file! (${fName} ${lName}). Review the fields below and click "Save Employee Record".`);
        } else {
          // MULTI ROWS: Prepare batch preview
          const previews: {
            rowIndex: number;
            data: Partial<Employee>;
            isDuplicate: boolean;
          }[] = [];
          const initialResolutions: Record<string, DuplicateResolution> = {};

          json.forEach((row, idx) => {
            const empNum = String(
              row['Employee Number'] || row['Employee No'] || row['Employee #'] || row['EmpNo'] || row['EMP_NUM'] || `IMP-${idx + 100}`
            ).trim();

            const fName = String(row['First Name'] || row['FirstName'] || row['FIRST_NAME'] || 'Teacher').trim();
            const mName = String(row['Middle Name'] || row['MiddleName'] || row['MIDDLE_NAME'] || '').trim();
            const lName = String(row['Last Name'] || row['LastName'] || row['LAST_NAME'] || row['Surname'] || 'Unknown').trim();
            const extName = String(row['Name Extension'] || row['Extension'] || row['Suffix'] || '').trim();
            const pos = String(row['Current Position'] || row['Position'] || row['POSITION'] || 'Teacher I').trim();
            
            const schoolInput = String(row['School Name'] || row['School'] || row['SCHOOL'] || defaultSchool).trim();
            const matchedSch = schools.find(s => s.name.toLowerCase() === schoolInput.toLowerCase());

            const parsedEmp: Partial<Employee> = {
              employeeNumber: empNum,
              firstName: fName,
              middleName: mName,
              lastName: lName,
              extensionName: extName,
              birthday: formatExcelDate(row['Date of Birth'] || row['Birthday']),
              currentPosition: pos,
              itemNumber: String(row['Plantilla Item Number'] || row['Item Number'] || row['Item #'] || '').trim(),
              schoolId: matchedSch ? matchedSch.id : defaultSchoolId,
              schoolName: matchedSch ? matchedSch.name : schoolInput,
              dateOfLatestAppointment: formatExcelDate(row['Date of Latest Appointment'] || row['Latest Appointment']),
              dateOfOriginalAppointment: formatExcelDate(row['Date of Original Appointment'] || row['Original Appointment']),
              status: (String(row['Status'] || 'Active').toLowerCase() === 'inactive') ? 'Inactive' : 'Active',
              tinNumber: String(row['TIN Number'] || row['TIN'] || '').trim(),
              lbpAccountNumber: String(row['LBP Account Number'] || row['LBP'] || '').trim(),
              gsisNumber: String(row['GSIS BP Number'] || row['GSIS'] || '').trim(),
              philhealthNumber: String(row['PhilHealth Number'] || row['PhilHealth'] || '').trim(),
              pagibigNumber: String(row['PAG-IBIG Number'] || row['PAGIBIG'] || '').trim(),
              profilePhotoUrl: String(row['Profile Photo URL'] || '').trim()
            };

            const existing = employees.find(emp => emp.employeeNumber.trim().toLowerCase() === empNum.toLowerCase());

            previews.push({
              rowIndex: idx + 1,
              data: parsedEmp,
              isDuplicate: !!existing
            });

            if (existing) {
              initialResolutions[empNum] = 'SKIP';
            }
          });

          setParsedRows(previews);
          setRowResolutions(initialResolutions);
          setEntryMode('EXCEL_BATCH');
          setSuccessMessage(`Parsed ${json.length} employee records from Excel file. Review below and confirm batch import.`);
        }
      } catch (err) {
        setErrorMessage('Failed to parse Excel file. Please ensure it is a valid .xlsx or .csv file.');
      }
    };
    reader.readAsBinaryString(file);

    // Reset file input value
    if (e.target) {
      e.target.value = '';
    }
  };

  // Commit Batch Import from Excel
  const handleCommitBatchImport = () => {
    if (parsedRows.length === 0) return;

    const newEmps = parsedRows.map(r => r.data as Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>);
    const summary = importEmployeesBatch(newEmps, rowResolutions);

    setSuccessMessage(`Batch Import Completed! Added: ${summary.added}, Updated: ${summary.updated}, Skipped: ${summary.skipped}`);
    setParsedRows([]);
    setEntryMode('MANUAL');
  };

  // Submit Manual Form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!firstName.trim() || !lastName.trim()) {
      setErrorMessage('First Name and Last Name are required.');
      return;
    }

    if (!employeeNumber.trim()) {
      setErrorMessage('Employee Number is required.');
      return;
    }

    if (!schoolId) {
      setErrorMessage('Please select an active school in Guimba West District.');
      return;
    }

    const selectedSchool = schools.find(s => s.id === schoolId);

    const result = addEmployee({
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
      schoolName: selectedSchool ? selectedSchool.name : 'Guimba West Central School',
      status,

      tinNumber: tinNumber.trim(),
      lbpAccountNumber: lbpAccountNumber.trim(),
      gsisNumber: gsisNumber.trim(),
      philhealthNumber: philhealthNumber.trim(),
      pagibigNumber: pagibigNumber.trim(),
    });

    if (!result.success) {
      setErrorMessage(result.message);
    } else if (result.employee) {
      onSuccess(result.employee.id);
    }
  };

  return (
    <div id="add-employee-view" className="max-w-4xl mx-auto space-y-6 pb-16">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <button
            onClick={onBack}
            className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-amber-600" />
            <span>Cancel and Return</span>
          </button>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-emerald-600" />
            Add New Employee Record
          </h1>
          <p className="text-xs text-slate-500">Guimba West District HR Personnel Management</p>
        </div>

        {/* Quick Excel Template Button */}
        <button
          type="button"
          onClick={handleDownloadTemplate}
          className="inline-flex items-center space-x-2 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold transition shadow-xs"
          title="Download pre-formatted Excel template for employee entry"
        >
          <Download className="w-4 h-4 text-emerald-600" />
          <span>Download Excel Template</span>
        </button>
      </div>

      {/* Mode Switcher Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-4 rounded-xl text-white shadow-md space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <span>Upload Filled Excel Spreadsheet</span>
                <span className="bg-amber-400/20 text-amber-300 text-[10px] px-2 py-0.5 rounded-full border border-amber-400/30">
                  Recommended
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                Upload a filled <b>.xlsx</b> or <b>.csv</b> file to auto-fill the form or batch import multiple employees.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <label className="inline-flex items-center space-x-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-lg cursor-pointer shadow transition">
              <Upload className="w-4 h-4" />
              <span>Upload Excel File</span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleExcelUpload}
                className="hidden"
              />
            </label>

            {entryMode === 'EXCEL_BATCH' && (
              <button
                onClick={() => setEntryMode('MANUAL')}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition"
              >
                Switch to Form
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border-l-4 border-rose-600 text-rose-800 rounded-lg text-xs font-semibold flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Error Processing Employee Record</p>
            <p className="mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-50 border-l-4 border-emerald-600 text-emerald-900 rounded-lg text-xs font-semibold flex items-start space-x-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Excel Processing Complete</p>
            <p className="mt-0.5">{successMessage}</p>
          </div>
        </div>
      )}

      {/* MODE 1: EXCEL BATCH IMPORT PREVIEW */}
      {entryMode === 'EXCEL_BATCH' && parsedRows.length > 0 && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-amber-600" />
                Excel Batch Preview ({parsedRows.length} Rows Parsed)
              </h2>
              <p className="text-xs text-slate-500">
                Review the employee rows parsed from your uploaded Excel sheet before adding them to Guimba West District HRIS.
              </p>
            </div>

            <button
              onClick={handleCommitBatchImport}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow transition flex items-center space-x-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Import All ({parsedRows.length}) Employees</span>
            </button>
          </div>

          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 sticky top-0 border-b border-slate-200 text-slate-700 font-bold uppercase">
                <tr>
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Emp #</th>
                  <th className="py-2.5 px-3">Full Name</th>
                  <th className="py-2.5 px-3">Position</th>
                  <th className="py-2.5 px-3">School</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Action for Duplicates</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {parsedRows.map((row) => {
                  const empNum = row.data.employeeNumber || '';
                  const currentRes = rowResolutions[empNum] || 'SKIP';

                  return (
                    <tr key={row.rowIndex} className={row.isDuplicate ? 'bg-amber-50/50' : 'hover:bg-slate-50'}>
                      <td className="py-2 px-3 text-slate-400 font-mono">{row.rowIndex}</td>
                      <td className="py-2 px-3 font-mono font-bold text-slate-900">#{row.data.employeeNumber}</td>
                      <td className="py-2 px-3 font-bold text-slate-900">{row.data.lastName}, {row.data.firstName}</td>
                      <td className="py-2 px-3 text-slate-800">{row.data.currentPosition}</td>
                      <td className="py-2 px-3 text-slate-700">{row.data.schoolName}</td>
                      <td className="py-2 px-3">
                        {row.isDuplicate ? (
                          <span className="inline-flex items-center space-x-1 text-amber-800 bg-amber-100 px-2 py-0.5 rounded font-bold text-[10px]">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            <span>Duplicate ID</span>
                          </span>
                        ) : (
                          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold text-[10px]">
                            New Employee
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3">
                        {row.isDuplicate ? (
                          <select
                            value={currentRes}
                            onChange={(e) => setRowResolutions(prev => ({
                              ...prev,
                              [empNum]: e.target.value as DuplicateResolution
                            }))}
                            className="bg-white border border-slate-300 rounded px-2 py-1 text-[11px] font-bold"
                          >
                            <option value="SKIP">Skip Duplicate</option>
                            <option value="UPDATE">Update Existing</option>
                            <option value="KEEP_BOTH">Keep Both</option>
                          </select>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Will Add</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-slate-100">
            <button
              onClick={() => setEntryMode('MANUAL')}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs"
            >
              Cancel Preview
            </button>

            <button
              onClick={handleCommitBatchImport}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center space-x-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm & Add Employees ({parsedRows.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* MODE 2: MANUAL FORM ENTRY (or Single-Row Excel Pre-filled Form) */}
      {entryMode === 'MANUAL' && (
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* 1. Personal Information */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center justify-between">
              <span>1. Personal Information</span>
              {firstName && lastName && (
                <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Ready
                </span>
              )}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">First Name *</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="e.g. Maria Elena"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Middle Name</label>
                <input
                  type="text"
                  value={middleName}
                  onChange={(e) => setMiddleName(e.target.value)}
                  placeholder="e.g. Santos"
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
                  placeholder="e.g. Dela Cruz"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Name Extension</label>
                <input
                  type="text"
                  value={extensionName}
                  onChange={(e) => setExtensionName(e.target.value)}
                  placeholder="e.g. Jr., III, Sr."
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

          {/* 2. Employment Information */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center justify-between">
              <span>2. Employment Information</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Employee Number * (Must be Unique)</label>
                <input
                  type="text"
                  required
                  value={employeeNumber}
                  onChange={(e) => setEmployeeNumber(e.target.value)}
                  placeholder="e.g. 4820199"
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
                <label className="block font-bold text-slate-700 mb-1">Employee Status</label>
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

          {/* 3. Government Information */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center justify-between">
              <span>3. Government & Banking Numbers</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">TIN Number</label>
                <input
                  type="text"
                  value={tinNumber}
                  onChange={(e) => setTinNumber(e.target.value)}
                  placeholder="000-000-000-000"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">LBP Account Number</label>
                <input
                  type="text"
                  value={lbpAccountNumber}
                  onChange={(e) => setLbpAccountNumber(e.target.value)}
                  placeholder="0000-0000-00"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">GSIS BP Number</label>
                <input
                  type="text"
                  value={gsisNumber}
                  onChange={(e) => setGsisNumber(e.target.value)}
                  placeholder="2000000000"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">PhilHealth Number</label>
                <input
                  type="text"
                  value={philhealthNumber}
                  onChange={(e) => setPhilhealthNumber(e.target.value)}
                  placeholder="12-000000000-0"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">PAG-IBIG MID Number</label>
                <input
                  type="text"
                  value={pagibigNumber}
                  onChange={(e) => setPagibigNumber(e.target.value)}
                  placeholder="1210-0000-0000"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
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
              id="btn-submit-add-employee"
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition shadow-md flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Save Employee Record</span>
            </button>
          </div>

        </form>
      )}
    </div>
  );
};
