import React, { useState } from 'react';
import { useHRIS } from '../../context/HRISContext';
import { useAuth } from '../../context/AuthContext';
import { 
  FileSpreadsheet, 
  Upload, 
  Link, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  FileCheck,
  Building2,
  RefreshCw
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Employee, ImportPreviewRow, DuplicateResolution } from '../../types';

export const ImportDataView: React.FC = () => {
  const { employees, schools, importEmployeesBatch } = useHRIS();
  const { role } = useAuth();

  const [activeImportMode, setActiveImportMode] = useState<'EXCEL' | 'SHEETS'>('EXCEL');

  const [parsedRows, setParsedRows] = useState<ImportPreviewRow[]>([]);
  const [globalResolution, setGlobalResolution] = useState<DuplicateResolution>('SKIP');
  const [rowResolutions, setRowResolutions] = useState<Record<string, DuplicateResolution>>({});

  const [googleSheetsUrl, setGoogleSheetsUrl] = useState('');
  const [pastedData, setPastedData] = useState('');
  const [importSummary, setImportSummary] = useState<{ added: number; updated: number; skipped: number } | null>(null);
  const [parseError, setParseError] = useState('');

  if (role !== 'ADMIN') {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
        <p className="text-slate-800 font-bold">Administrator Access Required</p>
        <p className="text-xs text-slate-500 mt-1">Importing employee data is restricted to Administrator personnel.</p>
      </div>
    );
  }

  // Parse raw row objects into Employee structure
  const processRawDataRows = (data: any[]) => {
    setParseError('');
    setImportSummary(null);

    if (!Array.isArray(data) || data.length === 0) {
      setParseError('No rows found in the uploaded file or data.');
      return;
    }

    const defaultSchool = schools.find(s => s.status === 'Active')?.name || 'Guimba West Central School';
    const defaultSchoolId = schools.find(s => s.status === 'Active')?.id || 'sch-001';

    const previews: ImportPreviewRow[] = [];
    const initialRowRes: Record<string, DuplicateResolution> = {};

    data.forEach((row, idx) => {
      // Flexible field mapping
      const empNum = String(
        row['Employee Number'] || row['Employee No'] || row['Employee #'] || row['EmpNo'] || row['EMP_NUM'] || `IMP-${idx + 100}`
      ).trim();

      const lastName = String(
        row['Last Name'] || row['LastName'] || row['LAST_NAME'] || row['Surname'] || 'Unknown'
      ).trim();

      const firstName = String(
        row['First Name'] || row['FirstName'] || row['FIRST_NAME'] || row['Given Name'] || 'Teacher'
      ).trim();

      const middleName = String(
        row['Middle Name'] || row['MiddleName'] || row['MIDDLE_NAME'] || ''
      ).trim();

      const currentPosition = String(
        row['Current Position'] || row['Position'] || row['POSITION'] || 'Teacher I'
      ).trim();

      const schoolNameInput = String(
        row['School'] || row['School Name'] || row['SCHOOL'] || defaultSchool
      ).trim();

      const matchedSchool = schools.find(s => s.name.toLowerCase() === schoolNameInput.toLowerCase());

      const parsedEmp: Partial<Employee> = {
        employeeNumber: empNum,
        lastName,
        firstName,
        middleName,
        currentPosition,
        itemNumber: String(row['Item Number'] || row['Item #'] || '').trim(),
        schoolId: matchedSchool ? matchedSchool.id : defaultSchoolId,
        schoolName: matchedSchool ? matchedSchool.name : schoolNameInput,
        status: (row['Status'] || 'Active').toLowerCase() === 'inactive' ? 'Inactive' : 'Active',
        birthday: String(row['Birthday'] || row['Date of Birth'] || '').trim(),
        tinNumber: String(row['TIN'] || row['TIN Number'] || '').trim(),
        gsisNumber: String(row['GSIS'] || row['GSIS Number'] || '').trim(),
        philhealthNumber: String(row['PhilHealth'] || '').trim(),
        pagibigNumber: String(row['PAGIBIG'] || row['Pag-IBIG'] || '').trim(),
        lbpAccountNumber: String(row['LBP'] || row['LBP Account'] || '').trim(),
      };

      // Check duplicate
      const existing = employees.find(e => e.employeeNumber.trim().toLowerCase() === empNum.toLowerCase());

      if (existing) {
        previews.push({
          rowIndex: idx + 1,
          data: parsedEmp,
          isDuplicate: true,
          existingEmployee: existing,
          resolution: globalResolution,
          statusText: `Duplicate Employee #${empNum}`
        });
        initialRowRes[empNum] = globalResolution;
      } else {
        previews.push({
          rowIndex: idx + 1,
          data: parsedEmp,
          isDuplicate: false,
          statusText: 'New Record'
        });
      }
    });

    setParsedRows(previews);
    setRowResolutions(initialRowRes);
  };

  // Excel File Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const firstSheet = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheet];
        const json = XLSX.utils.sheet_to_json(worksheet);
        processRawDataRows(json);
      } catch (err) {
        setParseError('Failed to parse Excel file. Please ensure it is a valid .xlsx, .xls, or .csv file.');
      }
    };
    reader.readAsBinaryString(file);
  };

  // Google Sheets Paste / TSV Parser
  const handleProcessPastedData = () => {
    if (!pastedData.trim()) {
      setParseError('Please paste spreadsheet data or Google Sheets TSV rows.');
      return;
    }

    try {
      const lines = pastedData.trim().split('\n');
      if (lines.length < 2) {
        setParseError('Data must include at least 1 header row and 1 data row.');
        return;
      }

      const headers = lines[0].split('\t').map(h => h.trim());
      const dataRows = lines.slice(1).map(line => {
        const values = line.split('\t');
        const rowObj: any = {};
        headers.forEach((h, i) => {
          rowObj[h] = values[i] ? values[i].trim() : '';
        });
        return rowObj;
      });

      processRawDataRows(dataRows);
    } catch (err) {
      setParseError('Failed to parse pasted table. Copy rows directly from Google Sheets and paste here.');
    }
  };

  // Apply Global Resolution change
  const handleGlobalResolutionChange = (res: DuplicateResolution) => {
    setGlobalResolution(res);
    setRowResolutions(prev => {
      const updated: Record<string, DuplicateResolution> = {};
      Object.keys(prev).forEach(k => {
        updated[k] = res;
      });
      return updated;
    });
  };

  // Commit Import
  const handleCommitImport = async () => {
    if (parsedRows.length === 0) return;

    const newEmps = parsedRows.map(r => r.data as Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>);
    const summary = await importEmployeesBatch(newEmps, rowResolutions);

    setImportSummary(summary);
    setParsedRows([]);
  };

  return (
    <div id="import-module-view" className="space-y-6 pb-16">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">
            <FileSpreadsheet className="w-4 h-4" />
            <span>Guimba West District • Batch Data Import</span>
          </div>
          <h1 className="text-xl font-extrabold text-slate-900">
            Import Employees from Excel or Google Sheets
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Designed for 1,000 to 10,000 personnel records with duplicate detection & preview before committing.
          </p>
        </div>
      </div>

      {/* Summary Banner after import */}
      {importSummary && (
        <div className="p-5 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-xs space-y-2">
          <div className="flex items-center space-x-2 font-bold text-sm text-emerald-800">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>Import Completed Successfully!</span>
          </div>
          <div className="flex flex-wrap gap-4 font-semibold text-slate-800 pt-1">
            <span className="bg-white px-3 py-1 rounded border border-emerald-200">
              New Records Added: <b>{importSummary.added}</b>
            </span>
            <span className="bg-white px-3 py-1 rounded border border-emerald-200">
              Existing Records Updated: <b>{importSummary.updated}</b>
            </span>
            <span className="bg-white px-3 py-1 rounded border border-emerald-200">
              Duplicates Skipped: <b>{importSummary.skipped}</b>
            </span>
          </div>
        </div>
      )}

      {/* Import Mode Switcher */}
      <div className="flex border-b border-slate-200 bg-white rounded-xl p-1 shadow-2xs space-x-1">
        <button
          onClick={() => { setActiveImportMode('EXCEL'); setParseError(''); setParsedRows([]); }}
          className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition flex items-center justify-center space-x-2 ${
            activeImportMode === 'EXCEL' ? 'bg-slate-900 text-amber-400' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Upload className="w-4 h-4" />
          <span>Import Excel File (.xlsx / .csv)</span>
        </button>

        <button
          onClick={() => { setActiveImportMode('SHEETS'); setParseError(''); setParsedRows([]); }}
          className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition flex items-center justify-center space-x-2 ${
            activeImportMode === 'SHEETS' ? 'bg-slate-900 text-amber-400' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Link className="w-4 h-4" />
          <span>Import from Google Sheets / Table</span>
        </button>
      </div>

      {parseError && (
        <div className="p-4 bg-rose-50 border-l-4 border-rose-600 text-rose-800 rounded-lg text-xs font-bold flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-rose-600" />
          <span>{parseError}</span>
        </div>
      )}

      {/* MODE 1: EXCEL UPLOAD */}
      {activeImportMode === 'EXCEL' && parsedRows.length === 0 && (
        <div className="bg-white p-8 rounded-xl border-2 border-dashed border-slate-300 text-center space-y-4">
          <FileSpreadsheet className="w-12 h-12 text-amber-500 mx-auto" />
          <div>
            <h3 className="text-base font-bold text-slate-900">Upload Excel Spreadsheet</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Select a <b>.xlsx</b>, <b>.xls</b>, or <b>.csv</b> file containing employee columns (e.g., <i>Employee Number, Last Name, First Name, Position, School</i>).
            </p>
          </div>

          <label className="inline-flex items-center space-x-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl cursor-pointer shadow-md transition">
            <Upload className="w-4 h-4" />
            <span>Choose Excel File</span>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      )}

      {/* MODE 2: GOOGLE SHEETS / TSV PASTE */}
      {activeImportMode === 'SHEETS' && parsedRows.length === 0 && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 text-xs">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Google Sheets Data Copy & Paste</h3>
            <p className="text-slate-500 mt-0.5">
              Open your Google Sheet, select the employee rows including the header row, press <b>Ctrl+C</b>, and paste below.
            </p>
          </div>

          <textarea
            rows={6}
            value={pastedData}
            onChange={(e) => setPastedData(e.target.value)}
            placeholder={`Employee Number\tLast Name\tFirst Name\tCurrent Position\tSchool\n4820190\tDela Cruz\tJuan\tTeacher I\tGuimba West Central School`}
            className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg font-mono text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
          />

          <button
            onClick={handleProcessPastedData}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl transition shadow-sm flex items-center space-x-2"
          >
            <FileCheck className="w-4 h-4" />
            <span>Parse & Preview Google Sheets Data</span>
          </button>
        </div>
      )}

      {/* PREVIEW TABLE AND DUPLICATE MANAGEMENT */}
      {parsedRows.length > 0 && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-amber-600" />
                Import Preview ({parsedRows.length} Rows)
              </h3>
              <p className="text-xs text-slate-500">
                Review row mappings and select resolution for duplicate Employee Numbers before saving.
              </p>
            </div>

            {/* Global Resolution Selection */}
            <div className="flex items-center space-x-2 bg-slate-100 p-2 rounded-lg border border-slate-200 text-xs font-semibold">
              <span className="text-slate-700">Action for Duplicates:</span>
              <select
                value={globalResolution}
                onChange={(e) => handleGlobalResolutionChange(e.target.value as DuplicateResolution)}
                className="bg-white border border-slate-300 rounded px-2 py-1 font-bold text-slate-800"
              >
                <option value="SKIP">Skip Duplicate Records</option>
                <option value="UPDATE">Update Existing Records</option>
                <option value="KEEP_BOTH">Keep Both (Append -DUP)</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 sticky top-0 border-b border-slate-200 text-slate-700 font-bold uppercase">
                <tr>
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Emp #</th>
                  <th className="py-2.5 px-3">Full Name</th>
                  <th className="py-2.5 px-3">Position</th>
                  <th className="py-2.5 px-3">School</th>
                  <th className="py-2.5 px-3">Status / Duplicate Check</th>
                  <th className="py-2.5 px-3">Duplicate Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {parsedRows.map((row) => {
                  const empNum = row.data.employeeNumber || '';
                  const currentRes = rowResolutions[empNum] || globalResolution;

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
                            <span>Duplicate Exists</span>
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
                            <option value="SKIP">Skip</option>
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
              onClick={() => setParsedRows([])}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs"
            >
              Cancel Preview
            </button>

            <button
              onClick={handleCommitImport}
              id="btn-confirm-import"
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center space-x-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Commit Data Import ({parsedRows.length} Rows)</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
