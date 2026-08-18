import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useHRIS } from '../../context/HRISContext';
import { 
  Folder, 
  FileText, 
  Upload, 
  FolderPlus, 
  Search, 
  RefreshCw, 
  ChevronRight, 
  ExternalLink, 
  Download, 
  Trash2, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  HardDrive, 
  FileCheck,
  FolderOpen,
  LogOut,
  Sparkles,
  Database
} from 'lucide-react';
import { 
  listDriveFiles, 
  createDriveFolder, 
  deleteDriveFile, 
  DriveFileItem, 
  FOLDER_MIME_TYPE, 
  ensureDistrictFoldersStructure,
  exportDistrictDataToDrive
} from '../../services/googleDriveService';
import { 
  signInWithGoogleDrive, 
  getDriveAccessToken, 
  disconnectGoogleDrive, 
  isGoogleDriveConnected,
  subscribeToDriveAuth
} from '../../services/googleDriveAuth';
import { auth } from '../../services/firebase';
import { ConfirmDeleteDriveFileModal } from './ConfirmDeleteDriveFileModal';
import { UploadToDriveModal } from './UploadToDriveModal';

export const GoogleDriveView: React.FC = () => {
  const { role } = useAuth();
  const { employees, schools, specialOrders, earnedCredits, usedCredits, leaveRecords } = useHRIS();

  const [isConnected, setIsConnected] = useState<boolean>(isGoogleDriveConnected());
  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  const [isConnecting, setIsConnecting] = useState(false);
  const [currentFolderId, setCurrentFolderId] = useState<string>('root');
  const [folderHistory, setFolderHistory] = useState<Array<{ id: string; name: string }>>([
    { id: 'root', name: 'My Drive' }
  ]);
  const [files, setFiles] = useState<DriveFileItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mimeFilter, setMimeFilter] = useState<'all' | 'folders' | 'pdfs' | 'documents' | 'spreadsheets' | 'images'>('all');

  // Modal States
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  // Delete State
  const [fileToDelete, setFileToDelete] = useState<DriveFileItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Status & Notification
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Subscribe to drive auth changes
  useEffect(() => {
    const unsubscribe = subscribeToDriveAuth((user, token) => {
      setIsConnected(Boolean(token));
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const loadFiles = async (folderId: string = currentFolderId, query: string = searchQuery, filter = mimeFilter) => {
    if (!getDriveAccessToken()) {
      setIsConnected(false);
      return;
    }

    try {
      setIsLoading(true);
      const res = await listDriveFiles({
        folderId: query ? undefined : folderId,
        searchQuery: query,
        mimeTypeFilter: filter,
      });
      setFiles(res.files || []);
    } catch (err: any) {
      console.error('Failed to load drive files:', err);
      setNotification({
        type: 'error',
        message: err.message || 'Failed to load files from Google Drive.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected) {
      loadFiles(currentFolderId, searchQuery, mimeFilter);
    }
  }, [isConnected, currentFolderId, mimeFilter]);

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      setNotification(null);
      const result = await signInWithGoogleDrive();
      if (result?.accessToken) {
        setIsConnected(true);
        setCurrentUser(result.user);
        setNotification({
          type: 'success',
          message: `Connected to Google Drive as ${result.user.email || 'Authorized User'}`
        });

        // Automatically setup or navigate to District repository folder
        try {
          const { rootFolder } = await ensureDistrictFoldersStructure();
          if (rootFolder) {
            setCurrentFolderId(rootFolder.id);
            setFolderHistory([
              { id: 'root', name: 'My Drive' },
              { id: rootFolder.id, name: rootFolder.name }
            ]);
            await loadFiles(rootFolder.id);
            return;
          }
        } catch (e) {
          console.warn('Could not auto-create district folder:', e);
        }

        await loadFiles('root');
      }
    } catch (err: any) {
      console.error('Google Drive sign in failed:', err);
      setNotification({
        type: 'error',
        message: err.message || 'Failed to sign in and connect Google Drive.'
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    await disconnectGoogleDrive();
    setIsConnected(false);
    setFiles([]);
    setFolderHistory([{ id: 'root', name: 'My Drive' }]);
    setCurrentFolderId('root');
    setNotification({
      type: 'success',
      message: 'Google Drive disconnected.'
    });
  };

  const handleFolderClick = (folder: DriveFileItem) => {
    setCurrentFolderId(folder.id);
    setFolderHistory(prev => [...prev, { id: folder.id, name: folder.name }]);
    setSearchQuery('');
  };

  const handleBreadcrumbClick = (index: number) => {
    const target = folderHistory[index];
    setFolderHistory(prev => prev.slice(0, index + 1));
    setCurrentFolderId(target.id);
    setSearchQuery('');
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    try {
      setIsCreatingFolder(true);
      await createDriveFolder(newFolderName.trim(), currentFolderId);
      setNewFolderName('');
      setShowNewFolderModal(false);
      setNotification({
        type: 'success',
        message: `Folder "${newFolderName}" created successfully in Google Drive.`
      });
      await loadFiles(currentFolderId);
    } catch (err: any) {
      console.error('Failed to create folder:', err);
      setNotification({
        type: 'error',
        message: err.message || 'Failed to create folder.'
      });
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!fileToDelete) return;
    try {
      setIsDeleting(true);
      await deleteDriveFile(fileToDelete.id);
      setNotification({
        type: 'success',
        message: `"${fileToDelete.name}" was successfully deleted from Google Drive.`
      });
      setFileToDelete(null);
      await loadFiles(currentFolderId);
    } catch (err: any) {
      console.error('Failed to delete file:', err);
      setNotification({
        type: 'error',
        message: err.message || 'Failed to delete file from Google Drive.'
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAutoInitDistrictStructure = async () => {
    try {
      setIsLoading(true);
      const { rootFolder } = await ensureDistrictFoldersStructure();
      setCurrentFolderId(rootFolder.id);
      setFolderHistory([
        { id: 'root', name: 'My Drive' },
        { id: rootFolder.id, name: rootFolder.name }
      ]);
      setNotification({
        type: 'success',
        message: 'Guimba West District folder structure initialized in your Google Drive!'
      });
      await loadFiles(rootFolder.id);
    } catch (err: any) {
      console.error('Failed to setup district folders:', err);
      setNotification({
        type: 'error',
        message: err.message || 'Failed to initialize District folder structure.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Export Roster to Drive
  const handleExportRosterToDrive = async () => {
    try {
      setIsExporting(true);
      const timestamp = new Date().toISOString().split('T')[0];
      const fileName = `Guimba_West_Personnel_Masterlist_${timestamp}.csv`;

      const headers = ['Employee Number', 'Last Name', 'First Name', 'Middle Name', 'School', 'Position', 'Status', 'Birthday', 'Item Number', 'TIN', 'GSIS', 'PhilHealth', 'Pag-IBIG'];
      const rows = employees.map(e => [
        `"${e.employeeNumber}"`,
        `"${e.lastName}"`,
        `"${e.firstName}"`,
        `"${e.middleName || ''}"`,
        `"${e.schoolName}"`,
        `"${e.currentPosition}"`,
        `"${e.status}"`,
        `"${e.birthday}"`,
        `"${e.itemNumber}"`,
        `"${e.tinNumber}"`,
        `"${e.gsisNumber}"`,
        `"${e.philhealthNumber}"`,
        `"${e.pagibigNumber}"`
      ]);

      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

      const uploaded = await exportDistrictDataToDrive(csvContent, fileName, 'text/csv');
      setNotification({
        type: 'success',
        message: `Personnel Masterlist exported to Google Drive: "${uploaded.name}"`
      });
      await loadFiles(currentFolderId);
    } catch (err: any) {
      console.error('Export failed:', err);
      setNotification({
        type: 'error',
        message: err.message || 'Failed to export masterlist to Google Drive.'
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Export Full District Backup (JSON) to Drive
  const handleExportDistrictBackup = async () => {
    try {
      setIsExporting(true);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `Guimba_West_District_HRIS_Full_Backup_${timestamp}.json`;

      const backupData = {
        exportedAt: new Date().toISOString(),
        district: 'Guimba West District',
        division: 'Division of Nueva Ecija',
        employeesCount: employees.length,
        schoolsCount: schools.length,
        specialOrdersCount: specialOrders.length,
        data: {
          employees,
          schools,
          specialOrders,
          earnedCredits,
          usedCredits,
          leaveRecords,
        }
      };

      const jsonContent = JSON.stringify(backupData, null, 2);
      const uploaded = await exportDistrictDataToDrive(jsonContent, fileName, 'application/json');
      setNotification({
        type: 'success',
        message: `Complete HRIS Database backup uploaded to Google Drive: "${uploaded.name}"`
      });
      await loadFiles(currentFolderId);
    } catch (err: any) {
      console.error('Backup export failed:', err);
      setNotification({
        type: 'error',
        message: err.message || 'Failed to save database backup to Google Drive.'
      });
    } finally {
      setIsExporting(false);
    }
  };

  const currentFolderDisplayName = folderHistory[folderHistory.length - 1]?.name || 'Drive Folder';

  return (
    <div id="google-drive-view" className="space-y-4 animate-fade-in pb-12">
      {/* Top Banner & Title */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-xs shrink-0">
            <HardDrive className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-black text-slate-900">
                Google Drive District Cloud Repository
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold border border-emerald-300">
                Cloud Synced
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Securely store, organize, and access 201 appointment documents, Special Orders, leave forms, and district backups on Google Drive.
            </p>
          </div>
        </div>

        {/* Account Info / Sign-in Actions */}
        <div className="flex items-center space-x-2 shrink-0">
          {isConnected ? (
            <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 p-1.5 pl-3 rounded-xl">
              <div className="text-right">
                <div className="text-[11px] font-bold text-slate-900 truncate max-w-[160px]">
                  {currentUser?.displayName || currentUser?.email || 'Google Account'}
                </div>
                <div className="text-[10px] text-emerald-600 font-semibold flex items-center justify-end space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Drive Active</span>
                </div>
              </div>
              <button
                onClick={handleDisconnect}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition"
                title="Disconnect Google Drive"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl shadow-xs font-bold text-xs transition flex items-center space-x-2 active:scale-95 disabled:opacity-60"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  </svg>
                  <span>Connect Google Drive</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {notification && (
        <div className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-semibold animate-fade-in ${
          notification.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
            : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          <div className="flex items-center space-x-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            &times;
          </button>
        </div>
      )}

      {!isConnected ? (
        /* Unconnected Hero Card */
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center max-w-2xl mx-auto space-y-5 shadow-xs">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-500/10 text-amber-600 flex items-center justify-center border border-amber-500/20 shadow-xs">
            <svg className="w-8 h-8" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
              <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
              <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/>
              <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
              <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
              <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
              <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
            </svg>
          </div>

          <div>
            <h2 className="text-base font-extrabold text-slate-900">
              Connect Guimba West District to Google Drive
            </h2>
            <p className="text-xs text-slate-600 max-w-md mx-auto mt-1.5 leading-relaxed">
              Connect your Google Workspace or personal Google account to browse, upload, and organize DepEd district records directly within your Google Drive storage.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
              <FileCheck className="w-5 h-5 text-emerald-600 mb-1.5" />
              <div className="font-bold text-slate-900 text-xs">201 File Attachments</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Directly attach appointment papers and Oath documents.</div>
            </div>
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
              <Folder className="w-5 h-5 text-amber-500 mb-1.5" />
              <div className="font-bold text-slate-900 text-xs">Special Orders & Leaves</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Organize scanned Service Credit SOs and leave approvals.</div>
            </div>
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
              <Database className="w-5 h-5 text-blue-600 mb-1.5" />
              <div className="font-bold text-slate-900 text-xs">Automated Cloud Backups</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Export live district roster spreadsheets and JSON archives.</div>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl font-black text-xs shadow-md transition-all active:scale-95 inline-flex items-center space-x-2 disabled:opacity-60"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Connecting to Google Drive...</span>
                </>
              ) : (
                <>
                  <FolderOpen className="w-4 h-4" />
                  <span>Sign in & Authorize Google Drive</span>
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* Connected Google Drive Explorer */
        <div className="space-y-4">
          {/* Action Quickbar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            {/* Folder Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowUploadModal(true)}
                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold shadow-xs transition flex items-center space-x-1.5"
              >
                <Upload className="w-4 h-4" />
                <span>Upload File to Drive</span>
              </button>

              <button
                onClick={() => setShowNewFolderModal(true)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center space-x-1.5"
              >
                <FolderPlus className="w-4 h-4 text-slate-600" />
                <span>New Folder</span>
              </button>

              <button
                onClick={handleAutoInitDistrictStructure}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center space-x-1.5"
                title="Initialize Guimba West District folder tree"
              >
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>Setup District Folders</span>
              </button>
            </div>

            {/* Export Actions */}
            {role === 'ADMIN' && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleExportRosterToDrive}
                  disabled={isExporting}
                  className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition flex items-center space-x-1.5"
                  title="Export Masterlist as CSV to Google Drive"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Export Masterlist to Drive</span>
                </button>

                <button
                  onClick={handleExportDistrictBackup}
                  disabled={isExporting}
                  className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-xl text-xs font-bold transition flex items-center space-x-1.5"
                  title="Save Complete System JSON Backup to Google Drive"
                >
                  <Database className="w-4 h-4 text-blue-600" />
                  <span>Cloud Backup to Drive</span>
                </button>
              </div>
            )}
          </div>

          {/* Browser Container */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
            {/* Explorer Toolbar */}
            <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Breadcrumbs */}
              <div className="flex items-center space-x-1 text-xs font-semibold text-slate-600 overflow-x-auto py-1">
                {folderHistory.map((item, idx) => (
                  <React.Fragment key={item.id}>
                    {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                    <button
                      onClick={() => handleBreadcrumbClick(idx)}
                      className={`hover:text-amber-600 px-2 py-1 rounded-lg truncate max-w-[160px] transition ${
                        idx === folderHistory.length - 1
                          ? 'font-bold text-slate-900 bg-white border border-slate-200 shadow-2xs'
                          : 'text-slate-600 hover:bg-slate-200/60'
                      }`}
                    >
                      {item.name}
                    </button>
                  </React.Fragment>
                ))}
              </div>

              {/* Filters & Search */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search in Drive..."
                    className="pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs w-44 sm:w-56 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                </div>

                <select
                  value={mimeFilter}
                  onChange={(e: any) => setMimeFilter(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="all">All File Types</option>
                  <option value="folders">Folders Only</option>
                  <option value="pdfs">PDF Documents</option>
                  <option value="documents">Docs & Word</option>
                  <option value="spreadsheets">Sheets & CSV</option>
                  <option value="images">Scans & Photos</option>
                </select>

                <button
                  onClick={() => loadFiles(currentFolderId, searchQuery, mimeFilter)}
                  className="p-2 bg-white hover:bg-slate-100 text-slate-600 border border-slate-300 rounded-lg transition"
                  title="Refresh Files"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Files Grid / List */}
            <div className="p-4 min-h-[360px]">
              {isLoading ? (
                <div className="h-64 flex flex-col items-center justify-center space-y-3 text-slate-500 text-xs">
                  <Loader2 className="w-7 h-7 animate-spin text-amber-500" />
                  <span className="font-semibold">Loading Google Drive contents...</span>
                </div>
              ) : files.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center space-y-2 text-slate-400 text-xs">
                  <FolderOpen className="w-10 h-10 text-slate-300" />
                  <p className="font-bold text-slate-600">This Google Drive folder is empty</p>
                  <p className="text-[11px] text-slate-400">
                    Use "Upload File to Drive" or "New Folder" to add documents.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {files.map((file) => {
                    const isFolder = file.mimeType === FOLDER_MIME_TYPE;
                    const isPdf = file.mimeType.includes('pdf');
                    const isSheet = file.mimeType.includes('spreadsheet') || file.mimeType.includes('sheet') || file.mimeType.includes('csv');

                    return (
                      <div
                        key={file.id}
                        onClick={() => {
                          if (isFolder) {
                            handleFolderClick(file);
                          }
                        }}
                        className={`p-3.5 rounded-2xl border transition group flex flex-col justify-between ${
                          isFolder
                            ? 'bg-amber-50/40 hover:bg-amber-50 border-amber-200/80 cursor-pointer shadow-2xs hover:shadow-xs'
                            : 'bg-white hover:bg-slate-50/80 border-slate-200 shadow-2xs hover:shadow-xs'
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className={`p-2.5 rounded-xl shrink-0 ${
                            isFolder 
                              ? 'bg-amber-100 text-amber-700' 
                              : isPdf 
                              ? 'bg-rose-100 text-rose-700' 
                              : isSheet 
                              ? 'bg-emerald-100 text-emerald-700' 
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {isFolder ? (
                              <Folder className="w-5 h-5 fill-amber-300" />
                            ) : isSheet ? (
                              <FileSpreadsheet className="w-5 h-5" />
                            ) : (
                              <FileText className="w-5 h-5" />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <h3 className="text-xs font-bold text-slate-900 truncate" title={file.name}>
                              {file.name}
                            </h3>
                            <div className="text-[10px] text-slate-500 mt-0.5 flex items-center space-x-2">
                              <span>
                                {isFolder ? 'Folder' : file.size ? `${(parseInt(file.size) / 1024).toFixed(1)} KB` : 'Cloud File'}
                              </span>
                              {file.modifiedTime && (
                                <>
                                  <span>•</span>
                                  <span>{new Date(file.modifiedTime).toLocaleDateString()}</span>
                                </>
                              )}
                            </div>
                            {file.description && (
                              <p className="text-[10px] text-slate-400 truncate mt-1">
                                {file.description}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* File Action Toolbar */}
                        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                          <div className="text-[10px] text-slate-400 font-medium">
                            {isFolder ? 'Click to open' : 'Google Drive Doc'}
                          </div>

                          <div className="flex items-center space-x-1">
                            {file.webViewLink && (
                              <a
                                href={file.webViewLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                                title="Open in Google Drive"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}

                            {file.webContentLink && !isFolder && (
                              <a
                                href={file.webContentLink}
                                download
                                onClick={(e) => e.stopPropagation()}
                                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                                title="Download File"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </a>
                            )}

                            {role === 'ADMIN' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setFileToDelete(file);
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                title={`Delete ${isFolder ? 'folder' : 'file'} from Drive`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Folder Footer Summary */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 text-slate-500 text-xs flex items-center justify-between">
              <span>Showing {files.length} items in "{currentFolderDisplayName}"</span>
              <span className="font-semibold text-slate-700">Guimba West District Repository</span>
            </div>
          </div>
        </div>
      )}

      {/* New Folder Modal */}
      {showNewFolderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <FolderPlus className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-sm text-slate-900">Create New Folder in Drive</h3>
              </div>
              <button onClick={() => setShowNewFolderModal(false)} className="text-slate-400 hover:text-slate-600">
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateFolder} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Folder Name *</label>
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="e.g., SY 2025-2026 Special Orders"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                  required
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewFolderModal(false)}
                  disabled={isCreatingFolder}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingFolder || !newFolderName.trim()}
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-xs font-bold shadow-xs"
                >
                  {isCreatingFolder ? 'Creating...' : 'Create Folder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload File Modal */}
      <UploadToDriveModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        currentFolderId={currentFolderId}
        currentFolderName={currentFolderDisplayName}
        onUploadSuccess={() => {
          setNotification({
            type: 'success',
            message: 'File uploaded successfully to Google Drive.'
          });
          loadFiles(currentFolderId);
        }}
      />

      {/* Mandatory User Confirmation Modal for Destructive Delete Operations */}
      <ConfirmDeleteDriveFileModal
        isOpen={Boolean(fileToDelete)}
        file={fileToDelete}
        onClose={() => setFileToDelete(null)}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />
    </div>
  );
};
