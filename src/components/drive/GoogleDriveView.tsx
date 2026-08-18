import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  initDriveAuth, 
  signInWithGoogleDrive, 
  logoutGoogleDrive, 
  listGoogleDriveFiles, 
  createDriveFolder, 
  uploadFileToDrive, 
  deleteDriveFile, 
  exportHRISToDriveBackup,
  downloadDriveFileContent,
  DriveFileItem,
  getDriveAccessToken,
  initializeHRISFolderStructure,
  HRIS_ROOT_FOLDER_NAME
} from '../../services/googleDriveService';
import { useHRIS } from '../../context/HRISContext';
import { useAuth } from '../../context/AuthContext';
import { 
  Folder, 
  FolderPlus, 
  Upload, 
  Download, 
  ExternalLink, 
  Trash2, 
  Search, 
  RefreshCw, 
  Cloud, 
  CloudCheck, 
  CloudUpload, 
  FileText, 
  FileSpreadsheet, 
  Image, 
  File, 
  ChevronRight, 
  Home, 
  AlertCircle, 
  CheckCircle2, 
  ShieldAlert, 
  Database, 
  Copy, 
  Check, 
  Lock, 
  Users, 
  Sparkles,
  ArrowUpDown
} from 'lucide-react';
import { User } from 'firebase/auth';

export const GoogleDriveView: React.FC = () => {
  const { role } = useAuth();
  const { 
    employees, 
    schools, 
    specialOrders, 
    earnedCredits, 
    usedCredits, 
    leaveRecords, 
    deletedEmployees, 
    deletedSchools,
    importFullDataset 
  } = useHRIS();

  // Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [hasToken, setHasToken] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState('');

  // File Explorer State
  const [files, setFiles] = useState<DriveFileItem[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [fileError, setFileError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'FOLDERS' | 'BACKUPS' | 'PDFS' | 'DOCS'>('ALL');
  
  // Scoped HRIS Root Navigation State
  const [hrisRootFolderId, setHrisRootFolderId] = useState<string | null>(null);
  const [currentFolderId, setCurrentFolderId] = useState<string | undefined>(undefined);
  const [folderHistory, setFolderHistory] = useState<Array<{ id?: string; name: string }>>([
    { id: undefined, name: 'DepEd HRIS Documents' }
  ]);

  // Upload & Folder Modal States
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Backup & Restore State
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupSuccess, setBackupSuccess] = useState('');
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreConfirmFile, setRestoreConfirmFile] = useState<DriveFileItem | null>(null);
  const [restoreSuccess, setRestoreSuccess] = useState('');

  // Deletion Modal State
  const [fileToDelete, setFileToDelete] = useState<DriveFileItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Copy feedback state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Fetch files in a specific folder (defaults to current folder or HRIS root)
  const fetchFiles = async (folderId?: string) => {
    if (!hasToken) return;
    const targetFolderId = folderId || currentFolderId || hrisRootFolderId;
    if (!targetFolderId) return;

    setIsLoadingFiles(true);
    setFileError('');
    try {
      const result = await listGoogleDriveFiles({
        folderId: targetFolderId,
        pageSize: 100
      });
      setFiles(result.files);
    } catch (err: any) {
      const msg = err.message || '';
      if (
        msg.includes('insufficient') || 
        msg.includes('permission') || 
        msg.includes('expired') || 
        msg.includes('re-authorize') || 
        msg.includes('authenticated')
      ) {
        setHasToken(false);
        setFileError('Google Drive session expired or requires permission approval. Click below to authorize.');
      } else {
        setFileError(msg || 'Failed to load HRIS folder from Google Drive');
      }
    } finally {
      setIsLoadingFiles(false);
    }
  };

  // Initialize and isolate workspace strictly to DepEd Guimba West HRIS Documents
  const initHRISDrive = async () => {
    setIsLoadingFiles(true);
    setFileError('');
    try {
      const rootId = await initializeHRISFolderStructure();
      setHrisRootFolderId(rootId);
      setCurrentFolderId(rootId);
      setFolderHistory([{ id: rootId, name: 'DepEd HRIS Documents' }]);
      
      const result = await listGoogleDriveFiles({
        folderId: rootId,
        pageSize: 100
      });
      setFiles(result.files);
    } catch (err: any) {
      console.warn('Error initializing HRIS Drive workspace:', err);
      const msg = err.message || '';
      if (
        msg.includes('insufficient') || 
        msg.includes('permission') || 
        msg.includes('expired') || 
        msg.includes('re-authorize') || 
        msg.includes('authenticated')
      ) {
        setHasToken(false);
        setFileError('Google Drive session expired or requires permission approval. Click below to authorize.');
      } else {
        setFileError(msg || 'Failed to load HRIS documents folder from Google Drive');
      }
    } finally {
      setIsLoadingFiles(false);
    }
  };

  // Initialize Drive Auth listener
  useEffect(() => {
    const unsubscribe = initDriveAuth(
      (user, token) => {
        setCurrentUser(user);
        setHasToken(Boolean(token));
        setAuthError('');
      },
      () => {
        setHasToken(false);
      }
    );

    // Initial token check
    getDriveAccessToken().then(token => {
      setHasToken(Boolean(token));
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (hasToken) {
      if (!hrisRootFolderId) {
        initHRISDrive();
      } else if (currentFolderId) {
        fetchFiles(currentFolderId);
      }
    }
  }, [hasToken]);

  // Handle Google Drive Sign-In
  const handleSignIn = async () => {
    setIsAuthenticating(true);
    setAuthError('');
    try {
      const result = await signInWithGoogleDrive();
      if (result) {
        setCurrentUser(result.user);
        setHasToken(true);
        setAuthError('');
        setFileError('');
        await initHRISDrive();
      }
    } catch (err: any) {
      const msg = err.message || '';
      if (!msg.includes('popup') && !msg.includes('closed') && !msg.includes('cancelled')) {
        console.warn('Google Sign-In issue:', err);
        setAuthError(msg || 'Failed to sign in with Google Drive. Please verify popup permissions.');
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Handle Google Drive Sign-Out
  const handleSignOut = async () => {
    await logoutGoogleDrive();
    setCurrentUser(null);
    setHasToken(false);
    setFiles([]);
    setHrisRootFolderId(null);
    setFolderHistory([{ id: undefined, name: 'DepEd HRIS Documents' }]);
    setCurrentFolderId(undefined);
  };

  // Folder navigation
  const handleNavigateToFolder = (folderId: string, folderName: string) => {
    setCurrentFolderId(folderId);
    setFolderHistory(prev => [...prev, { id: folderId, name: folderName }]);
    fetchFiles(folderId);
  };

  const handleNavigateToBreadcrumb = (index: number) => {
    const target = folderHistory[index];
    if (!target) return;
    setFolderHistory(prev => prev.slice(0, index + 1));
    setCurrentFolderId(target.id);
    fetchFiles(target.id);
  };

  // Create Folder
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    const parentId = currentFolderId || hrisRootFolderId || undefined;
    setIsCreatingFolder(true);
    try {
      await createDriveFolder(newFolderName.trim(), parentId);
      setShowNewFolderModal(false);
      setNewFolderName('');
      await fetchFiles(parentId);
    } catch (err: any) {
      alert(err.message || 'Error creating folder');
    } finally {
      setIsCreatingFolder(false);
    }
  };

  // File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    const targetFolderId = currentFolderId || hrisRootFolderId || undefined;

    setIsUploading(true);
    setUploadSuccess('');
    setUploadError('');

    try {
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        await uploadFileToDrive(file, file.name, targetFolderId, file.type);
      }
      setUploadSuccess(`Successfully uploaded ${fileList.length} file(s) to Google Drive.`);
      setTimeout(() => setUploadSuccess(''), 4000);
      await fetchFiles(targetFolderId);
    } catch (err: any) {
      setUploadError(err.message || 'Error uploading file(s)');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Backup Full HRIS Dataset to Google Drive
  const handleBackupToDrive = async () => {
    setIsBackingUp(true);
    setBackupSuccess('');
    try {
      const fullDataset = {
        meta: {
          system: 'Guimba West District HRIS',
          version: '2.0',
          exportedAt: new Date().toISOString(),
          exportedBy: currentUser?.email || 'Administrator',
          counts: {
            employees: employees.length,
            schools: schools.length,
            specialOrders: specialOrders.length,
            earnedCredits: earnedCredits.length,
            usedCredits: usedCredits.length,
            leaveRecords: leaveRecords.length
          }
        },
        employees,
        schools,
        specialOrders,
        earnedCredits,
        usedCredits,
        leaveRecords,
        deletedEmployees,
        deletedSchools
      };

      const result = await exportHRISToDriveBackup(fullDataset);
      setBackupSuccess(`Backup saved to Drive: "${result.name}" in "DepEd Guimba West HRIS Cloud Backups" folder.`);
      setTimeout(() => setBackupSuccess(''), 6000);
      await fetchFiles();
    } catch (err: any) {
      alert(err.message || 'Failed to create backup in Google Drive');
    } finally {
      setIsBackingUp(false);
    }
  };

  // Restore HRIS dataset from selected backup file in Drive
  const handleRestoreFromDrive = async () => {
    if (!restoreConfirmFile) return;
    setIsRestoring(true);
    try {
      const jsonContent = await downloadDriveFileContent(restoreConfirmFile.id);
      const parsedData = JSON.parse(jsonContent);

      if (!parsedData.employees || !Array.isArray(parsedData.employees)) {
        throw new Error('Invalid backup file structure: Missing employee dataset');
      }

      importFullDataset(parsedData);
      setRestoreSuccess(`HRIS dataset successfully restored from "${restoreConfirmFile.name}"!`);
      setTimeout(() => setRestoreSuccess(''), 5000);
      setRestoreConfirmFile(null);
    } catch (err: any) {
      alert(err.message || 'Failed to restore dataset from Google Drive backup');
    } finally {
      setIsRestoring(false);
    }
  };

  // Delete File with mandatory confirmation
  const handleConfirmDelete = async () => {
    if (!fileToDelete) return;
    setIsDeleting(true);
    try {
      await deleteDriveFile(fileToDelete.id);
      setFileToDelete(null);
      await fetchFiles();
    } catch (err: any) {
      alert(err.message || 'Failed to delete file from Google Drive');
    } finally {
      setIsDeleting(false);
    }
  };

  // Copy Link helper
  const handleCopyLink = (item: DriveFileItem) => {
    const url = item.webViewLink || `https://drive.google.com/file/d/${item.id}/view`;
    navigator.clipboard.writeText(url);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filtered files list
  const filteredFiles = useMemo(() => {
    return files.filter(item => {
      const matchesSearch = !searchQuery.trim() || 
        item.name.toLowerCase().includes(searchQuery.toLowerCase());

      const isFolder = item.mimeType === 'application/vnd.google-apps.folder';
      const isBackup = item.name.toLowerCase().includes('backup') || item.name.toLowerCase().includes('hris');
      const isPdf = item.mimeType === 'application/pdf' || item.name.toLowerCase().endsWith('.pdf');
      const isDoc = item.mimeType.includes('document') || item.mimeType.includes('spreadsheet') || item.name.endsWith('.xlsx') || item.name.endsWith('.docx');

      if (filterType === 'FOLDERS') return matchesSearch && isFolder;
      if (filterType === 'BACKUPS') return matchesSearch && isBackup;
      if (filterType === 'PDFS') return matchesSearch && isPdf;
      if (filterType === 'DOCS') return matchesSearch && isDoc;

      return matchesSearch;
    });
  }, [files, searchQuery, filterType]);

  // Helper for File Icon
  const getFileIcon = (item: DriveFileItem) => {
    if (item.mimeType === 'application/vnd.google-apps.folder') {
      return <Folder className="w-5 h-5 text-amber-500 fill-amber-500/20 shrink-0" />;
    }
    if (item.mimeType === 'application/pdf' || item.name.endsWith('.pdf')) {
      return <FileText className="w-5 h-5 text-rose-500 shrink-0" />;
    }
    if (item.mimeType.includes('spreadsheet') || item.name.endsWith('.xlsx') || item.name.endsWith('.csv')) {
      return <FileSpreadsheet className="w-5 h-5 text-emerald-600 shrink-0" />;
    }
    if (item.mimeType.startsWith('image/')) {
      return <Image className="w-5 h-5 text-purple-500 shrink-0" />;
    }
    if (item.name.includes('Backup') || item.name.endsWith('.json')) {
      return <Database className="w-5 h-5 text-blue-500 shrink-0" />;
    }
    return <File className="w-5 h-5 text-slate-400 shrink-0" />;
  };

  // Helper for human-readable file size
  const formatFileSize = (bytesStr?: string) => {
    if (!bytesStr) return '—';
    const bytes = parseInt(bytesStr, 10);
    if (isNaN(bytes)) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div id="google-drive-hub" className="space-y-6">
      
      {/* Page Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 via-emerald-500 to-blue-500 p-0.5 shadow-sm">
            <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center">
              {/* Google Drive Tri-color Icon SVG */}
              <svg className="w-6 h-6" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
                <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/>
                <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
                <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
                <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
                <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
              </svg>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">Google Drive Cloud Storage</h1>
              <span className="bg-blue-50 text-blue-700 text-xs px-2.5 py-0.5 rounded-full border border-blue-200 font-bold">
                DepEd Workspace
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Securely store and link Special Order attachments, Service Credits memos, and automate live HRIS cloud backups.
            </p>
          </div>
        </div>

        {/* Right Header Status / Sign-in */}
        <div className="flex items-center gap-2">
          {hasToken && currentUser ? (
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-1.5 rounded-xl">
              {currentUser.photoURL ? (
                <img 
                  src={currentUser.photoURL} 
                  alt={currentUser.displayName || 'User'} 
                  className="w-8 h-8 rounded-lg object-cover border border-slate-200"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
                  {currentUser.displayName?.charAt(0) || currentUser.email?.charAt(0) || 'U'}
                </div>
              )}
              <div className="text-left pr-2 hidden sm:block">
                <div className="text-xs font-bold text-slate-900 truncate max-w-[150px]">
                  {currentUser.displayName || 'DepEd User'}
                </div>
                <div className="text-[10px] text-slate-500 truncate max-w-[150px]">
                  {currentUser.email}
                </div>
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                className="px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                title="Disconnect Google Drive"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              type="button"
              id="btn-google-drive-signin"
              onClick={handleSignIn}
              disabled={isAuthenticating}
              className="inline-flex items-center gap-2.5 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs rounded-xl border border-slate-300 shadow-sm transition hover:shadow-md cursor-pointer disabled:opacity-60"
            >
              {/* Google G Logo */}
              <svg className="w-4 h-4" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              <span>{isAuthenticating ? 'Connecting to Google Drive...' : 'Sign in with Google'}</span>
            </button>
          )}
        </div>
      </div>

      {authError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{authError}</span>
        </div>
      )}

      {/* Main Drive Workspace or Unauthenticated Hero Banner */}
      {!hasToken ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center max-w-2xl mx-auto shadow-sm space-y-6">
          <div className="w-20 h-20 bg-blue-50 border border-blue-100 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
            <Cloud className="w-10 h-10 text-blue-600 animate-pulse" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              Connect your Google Drive Account
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
              Connect to your official DepEd Google Workspace or personal Google Drive to store Service Credits attachments, Special Orders PDFs, and automated HRIS cloud backups.
            </p>
          </div>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left pt-2">
            <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
              <div className="flex items-center gap-2 text-blue-700 font-bold text-xs">
                <FileText className="w-4 h-4" />
                <span>Special Orders PDF</span>
              </div>
              <p className="text-[11px] text-slate-500">Attach and open verified DepEd Special Orders stored in Drive.</p>
            </div>
            
            <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs">
                <Database className="w-4 h-4" />
                <span>One-Click Backups</span>
              </div>
              <p className="text-[11px] text-slate-500">Save full snapshots of district records with instant restore capability.</p>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
              <div className="flex items-center gap-2 text-amber-700 font-bold text-xs">
                <Folder className="w-4 h-4" />
                <span>Cloud File Manager</span>
              </div>
              <p className="text-[11px] text-slate-500">Browse folders, upload new documents, and generate direct share links.</p>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="button"
              onClick={handleSignIn}
              disabled={isAuthenticating}
              className="inline-flex items-center gap-3 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-blue-600/20 transition cursor-pointer disabled:opacity-60"
            >
              <CloudUpload className="w-5 h-5" />
              <span>{isAuthenticating ? 'Authorizing Google Drive...' : 'Connect to Google Drive'}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Action Toolbar & Backup Hub */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            
            {/* Quick HRIS Cloud Backup Widget */}
            <div className="lg:col-span-1 bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 rounded-2xl shadow-sm border border-slate-800 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
                    District Cloud Sync
                  </span>
                  <Database className="w-4 h-4 text-slate-400" />
                </div>
                <h3 className="font-bold text-base mt-2">Live HRIS Backup</h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Export an encrypted snapshot of all {employees.length} employees, {specialOrders.length} SOs, and leave records to your Google Drive.
                </p>
              </div>

              <div className="space-y-2">
                {backupSuccess && (
                  <div className="p-2.5 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-emerald-300 text-xs flex items-center gap-1.5 animate-fade-in">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span className="truncate">{backupSuccess}</span>
                  </div>
                )}

                <button
                  type="button"
                  id="btn-backup-to-drive"
                  onClick={handleBackupToDrive}
                  disabled={isBackingUp}
                  className="w-full py-2.5 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <CloudUpload className="w-4 h-4" />
                  <span>{isBackingUp ? 'Creating Backup in Drive...' : 'Backup Full HRIS to Google Drive'}</span>
                </button>
              </div>
            </div>

            {/* Cloud Drive Stats & Quick Actions */}
            <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-sm">HRIS Documents Drive</h3>
                    <span className="bg-emerald-50 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full border border-emerald-200 font-bold flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" />
                      HRIS Storage Isolated
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Scoped strictly to DepEd Guimba West HRIS Documents. Personal Drive folders are hidden.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowNewFolderModal(true)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <FolderPlus className="w-3.5 h-3.5 text-slate-600" />
                    <span>New Folder</span>
                  </button>

                  <label
                    htmlFor="drive-file-upload-input"
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload File</span>
                  </label>
                  <input
                    ref={fileInputRef}
                    id="drive-file-upload-input"
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => fetchFiles(currentFolderId)}
                    disabled={isLoadingFiles}
                    className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                    title="Refresh Files"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoadingFiles ? 'animate-spin text-blue-600' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Status Messages */}
              {uploadSuccess && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{uploadSuccess}</span>
                </div>
              )}

              {uploadError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {restoreSuccess && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{restoreSuccess}</span>
                </div>
              )}

              {/* Breadcrumb Navigation */}
              <div className="flex items-center flex-wrap gap-1.5 text-xs bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 overflow-x-auto">
                <span className="text-slate-400 font-medium">Repository:</span>
                {folderHistory.map((item, idx) => (
                  <React.Fragment key={idx}>
                    {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                    <button
                      type="button"
                      onClick={() => handleNavigateToBreadcrumb(idx)}
                      className={`font-semibold hover:text-blue-600 transition cursor-pointer flex items-center gap-1 ${
                        idx === folderHistory.length - 1 ? 'text-blue-700 font-bold' : 'text-slate-600'
                      }`}
                    >
                      {idx === 0 ? <Cloud className="w-3.5 h-3.5 text-blue-600" /> : <Folder className="w-3.5 h-3.5 text-amber-500" />}
                      <span>{item.name}</span>
                    </button>
                  </React.Fragment>
                ))}
              </div>
            </div>

          </div>

          {/* Search and Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search files and folders in Drive..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
              {(['ALL', 'FOLDERS', 'BACKUPS', 'PDFS', 'DOCS'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFilterType(type)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    filterType === type 
                      ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {type === 'ALL' && 'All Items'}
                  {type === 'FOLDERS' && 'Folders'}
                  {type === 'BACKUPS' && 'HRIS Backups'}
                  {type === 'PDFS' && 'PDFs / SOs'}
                  {type === 'DOCS' && 'Docs & Sheets'}
                </button>
              ))}
            </div>
          </div>

          {/* Files List Table / Grid */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {isLoadingFiles ? (
              <div className="p-12 text-center space-y-3">
                <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
                <p className="text-xs text-slate-500 font-medium">Fetching Google Drive items...</p>
              </div>
            ) : fileError ? (
              <div className="p-8 text-center space-y-3">
                <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
                <p className="text-xs text-rose-700 font-medium max-w-md mx-auto">{fileError}</p>
                <div className="flex items-center justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleSignIn}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white rounded-xl shadow-sm transition cursor-pointer"
                  >
                    Authorize Google Drive
                  </button>
                  <button
                    type="button"
                    onClick={() => fetchFiles()}
                    className="px-3.5 py-2 bg-slate-100 text-xs font-bold text-slate-700 rounded-xl hover:bg-slate-200 transition cursor-pointer"
                  >
                    Retry
                  </button>
                </div>
              </div>
            ) : filteredFiles.length === 0 ? (
              <div className="p-12 text-center space-y-2">
                <Folder className="w-10 h-10 text-slate-300 mx-auto" />
                <h4 className="text-sm font-bold text-slate-700">No items found in this directory</h4>
                <p className="text-xs text-slate-400">
                  {searchQuery ? 'Try changing your search query or filter.' : 'Upload a document or create a folder to get started.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Name</th>
                      <th className="py-3 px-4">Size</th>
                      <th className="py-3 px-4">Last Modified</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredFiles.map((file) => {
                      const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
                      const isBackup = file.name.includes('Backup') || file.name.endsWith('.json');

                      return (
                        <tr key={file.id} className="hover:bg-slate-50/80 transition group">
                          {/* Name & Folder Navigation */}
                          <td className="py-3 px-4 font-semibold text-slate-900">
                            <div className="flex items-center space-x-2.5">
                              {getFileIcon(file)}
                              {isFolder ? (
                                <button
                                  type="button"
                                  onClick={() => handleNavigateToFolder(file.id, file.name)}
                                  className="font-bold text-slate-900 hover:text-blue-600 hover:underline transition text-left cursor-pointer truncate max-w-[280px] sm:max-w-md"
                                >
                                  {file.name}
                                </button>
                              ) : (
                                <span className="truncate max-w-[280px] sm:max-w-md" title={file.name}>
                                  {file.name}
                                </span>
                              )}
                              
                              {isBackup && (
                                <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-1.5 py-0.5 rounded border border-emerald-200">
                                  HRIS Backup
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Size */}
                          <td className="py-3 px-4 text-slate-500 font-mono">
                            {isFolder ? '—' : formatFileSize(file.size)}
                          </td>

                          {/* Modified Time */}
                          <td className="py-3 px-4 text-slate-500">
                            {file.modifiedTime ? new Date(file.modifiedTime).toLocaleDateString() : '—'}
                          </td>

                          {/* Type */}
                          <td className="py-3 px-4 text-slate-500">
                            {isFolder ? 'Folder' : file.mimeType.split('.').pop()?.split('/').pop() || 'File'}
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end space-x-1">
                              
                              {/* If Backup JSON, offer Restore Option */}
                              {isBackup && role === 'ADMIN' && (
                                <button
                                  type="button"
                                  onClick={() => setRestoreConfirmFile(file)}
                                  className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                                  title="Restore HRIS database from this backup"
                                >
                                  <Database className="w-3 h-3 text-amber-600" />
                                  <span>Restore</span>
                                </button>
                              )}

                              {/* Copy Link */}
                              <button
                                type="button"
                                onClick={() => handleCopyLink(file)}
                                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                                title="Copy Google Drive Link"
                              >
                                {copiedId === file.id ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>

                              {/* Open in Drive (if not folder) */}
                              {file.webViewLink && (
                                <a
                                  href={file.webViewLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition"
                                  title="Open in Google Drive"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}

                              {/* Delete File (Adheres to user confirmation guidelines) */}
                              {role === 'ADMIN' && (
                                <button
                                  type="button"
                                  onClick={() => setFileToDelete(file)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                  title="Delete from Google Drive"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}

                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* CREATE FOLDER MODAL */}
      {showNewFolderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <FolderPlus className="w-5 h-5 text-blue-600" />
              <span>Create New Google Drive Folder</span>
            </h3>
            
            <form onSubmit={handleCreateFolder} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Folder Name
                </label>
                <input
                  type="text"
                  required
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="e.g. Special Orders 2026, Service Credit Memos..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewFolderModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingFolder}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow transition disabled:opacity-50"
                >
                  {isCreatingFolder ? 'Creating...' : 'Create Folder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESTORE DATABASE CONFIRMATION MODAL */}
      {restoreConfirmFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-5">
            <div className="flex items-center space-x-3 text-amber-600">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Restore HRIS Database from Drive</h3>
                <p className="text-xs text-slate-500">Review selected backup before restoring</p>
              </div>
            </div>

            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-1.5 text-xs text-amber-900">
              <div className="font-bold flex items-center gap-1">
                <AlertCircle className="w-4 h-4 text-amber-700" />
                <span>Selected Backup File:</span>
              </div>
              <div className="font-mono bg-white p-2 rounded border border-amber-200 text-slate-800">
                {restoreConfirmFile.name}
              </div>
              <p className="text-[11px] text-amber-800 mt-1">
                Restoring this backup will synchronize and populate your local HRIS records with the personnel, schools, and service credit transactions contained in this snapshot.
              </p>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setRestoreConfirmFile(null)}
                disabled={isRestoring}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRestoreFromDrive}
                disabled={isRestoring}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow transition disabled:opacity-50 flex items-center gap-1.5"
              >
                <Database className="w-3.5 h-3.5" />
                <span>{isRestoring ? 'Restoring Dataset...' : 'Confirm and Restore'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MANDATORY USER CONFIRMATION DIALOG FOR DELETE OPERATIONS */}
      {fileToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Delete from Google Drive</h3>
                <p className="text-xs text-rose-600 font-medium">Permanent cloud removal</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to delete <b className="text-slate-900 font-bold">"{fileToDelete.name}"</b> from your Google Drive storage? This action cannot be undone.
            </p>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setFileToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow transition disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
