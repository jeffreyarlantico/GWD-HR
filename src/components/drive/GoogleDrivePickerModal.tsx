import React, { useState, useEffect } from 'react';
import { 
  X, 
  Search, 
  Folder, 
  FileText, 
  ChevronRight, 
  Loader2, 
  ExternalLink, 
  Check, 
  AlertCircle, 
  RefreshCw,
  FolderOpen
} from 'lucide-react';
import { 
  listDriveFiles, 
  DriveFileItem, 
  FOLDER_MIME_TYPE, 
  ensureDistrictFoldersStructure 
} from '../../services/googleDriveService';
import { 
  getDriveAccessToken, 
  signInWithGoogleDrive, 
  isGoogleDriveConnected 
} from '../../services/googleDriveAuth';

interface GoogleDrivePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFile: (fileUrl: string, fileName: string, fileItem: DriveFileItem) => void;
  title?: string;
  allowedType?: 'all' | 'documents' | 'pdfs' | 'images';
}

export const GoogleDrivePickerModal: React.FC<GoogleDrivePickerModalProps> = ({
  isOpen,
  onClose,
  onSelectFile,
  title = 'Select Document from Google Drive',
  allowedType = 'all'
}) => {
  const [isConnected, setIsConnected] = useState(isGoogleDriveConnected());
  const [isConnecting, setIsConnecting] = useState(false);
  const [currentFolderId, setCurrentFolderId] = useState<string>('root');
  const [folderHistory, setFolderHistory] = useState<Array<{ id: string; name: string }>>([
    { id: 'root', name: 'My Drive' }
  ]);
  const [files, setFiles] = useState<DriveFileItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFile, setSelectedFile] = useState<DriveFileItem | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Load files when folder or search changes
  const loadFiles = async (folderId: string, search: string = '') => {
    if (!getDriveAccessToken()) {
      setIsConnected(false);
      return;
    }

    try {
      setIsLoading(true);
      setErrorMsg('');
      const res = await listDriveFiles({
        folderId: search ? undefined : folderId,
        searchQuery: search,
        mimeTypeFilter: allowedType,
      });
      setFiles(res.files || []);
    } catch (err: any) {
      console.error('Failed to list files:', err);
      setErrorMsg(err.message || 'Could not load files from Google Drive.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      const connected = isGoogleDriveConnected();
      setIsConnected(connected);
      if (connected) {
        loadFiles(currentFolderId, searchQuery);
      }
    }
  }, [isOpen, currentFolderId, isConnected]);

  if (!isOpen) return null;

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      setErrorMsg('');
      const result = await signInWithGoogleDrive();
      if (result?.accessToken) {
        setIsConnected(true);
        // Try locating district folder
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
        } catch {
          // fallback to root
        }
        await loadFiles('root');
      }
    } catch (err: any) {
      console.error('Connection failed:', err);
      setErrorMsg(err.message || 'Failed to authenticate with Google Drive.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleFolderClick = (folder: DriveFileItem) => {
    setCurrentFolderId(folder.id);
    setFolderHistory(prev => [...prev, { id: folder.id, name: folder.name }]);
    setSelectedFile(null);
    setSearchQuery('');
  };

  const handleNavigateBreadcrumb = (index: number) => {
    const target = folderHistory[index];
    setFolderHistory(prev => prev.slice(0, index + 1));
    setCurrentFolderId(target.id);
    setSelectedFile(null);
    setSearchQuery('');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadFiles(currentFolderId, searchQuery);
  };

  const handleConfirmSelect = () => {
    if (!selectedFile) return;
    const url = selectedFile.webViewLink || `https://drive.google.com/file/d/${selectedFile.id}/view`;
    onSelectFile(url, selectedFile.name, selectedFile);
    onClose();
  };

  return (
    <div
      id="google-drive-picker-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-sm animate-fade-in"
    >
      <div
        id="google-drive-picker-modal"
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
              <svg className="w-5 h-5" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
                <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/>
                <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
                <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
                <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
                <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-black tracking-wide text-white">
                {title}
              </h2>
              <p className="text-[11px] text-slate-400">
                Browse & attach files directly from Google Drive
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {!isConnected ? (
          /* Not Connected State */
          <div className="p-8 text-center space-y-4 my-auto">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-xs">
              <FolderOpen className="w-8 h-8" />
            </div>
            <div className="max-w-md mx-auto">
              <h3 className="text-base font-extrabold text-slate-900">
                Connect Google Drive
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Authorize your Google account to access your Drive documents, Special Orders, 201 appointment records, and attachments.
              </p>
            </div>

            {errorMsg && (
              <div className="max-w-md mx-auto p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <button
                type="button"
                onClick={handleConnect}
                disabled={isConnecting}
                className="inline-flex items-center space-x-3 px-6 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl shadow-xs font-bold text-xs transition active:scale-95 disabled:opacity-60"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                    <span>Connecting to Google...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" viewBox="0 0 48 48">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                    </svg>
                    <span>Sign in & Connect Google Drive</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* File Explorer State */
          <div className="flex-1 flex flex-col min-h-0">
            {/* Search & Breadcrumb Bar */}
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between">
              {/* Breadcrumb Navigation */}
              <div className="flex items-center space-x-1 text-xs font-semibold text-slate-600 overflow-x-auto py-1">
                {folderHistory.map((item, idx) => (
                  <React.Fragment key={item.id}>
                    {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                    <button
                      onClick={() => handleNavigateBreadcrumb(idx)}
                      className={`hover:text-amber-600 px-1.5 py-0.5 rounded truncate max-w-[140px] transition ${
                        idx === folderHistory.length - 1 ? 'font-bold text-slate-900 bg-white border border-slate-200 shadow-2xs' : ''
                      }`}
                    >
                      {item.name}
                    </button>
                  </React.Fragment>
                ))}
              </div>

              {/* Search Bar */}
              <form onSubmit={handleSearchSubmit} className="flex items-center space-x-1">
                <div className="relative flex-1 sm:w-56">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search in Drive..."
                    className="w-full pl-7 pr-2 py-1 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2" />
                </div>
                <button
                  type="button"
                  onClick={() => loadFiles(currentFolderId, searchQuery)}
                  className="p-1.5 bg-white hover:bg-slate-100 text-slate-600 border border-slate-300 rounded-lg transition"
                  title="Refresh"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
              </form>
            </div>

            {/* Error banner */}
            {errorMsg && (
              <div className="m-3 p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* File List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1 min-h-[260px]">
              {isLoading ? (
                <div className="h-48 flex items-center justify-center space-x-2 text-slate-500 text-xs">
                  <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
                  <span>Loading Google Drive files...</span>
                </div>
              ) : files.length === 0 ? (
                <div className="h-48 flex flex-col items-center justify-center text-slate-400 text-xs space-y-2">
                  <FolderOpen className="w-8 h-8 text-slate-300" />
                  <p>No matching files found in this folder.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {files.map((file) => {
                    const isFolder = file.mimeType === FOLDER_MIME_TYPE;
                    const isSelected = selectedFile?.id === file.id;

                    return (
                      <div
                        key={file.id}
                        onClick={() => {
                          if (isFolder) {
                            handleFolderClick(file);
                          } else {
                            setSelectedFile(file);
                          }
                        }}
                        className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                          isSelected
                            ? 'bg-amber-50 border-amber-400 ring-1 ring-amber-400'
                            : 'bg-white hover:bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                          <div className="p-2 rounded-lg bg-slate-100 shrink-0">
                            {isFolder ? (
                              <Folder className="w-4 h-4 text-amber-500 fill-amber-100" />
                            ) : (
                              <FileText className="w-4 h-4 text-blue-600" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-slate-800 truncate">
                              {file.name}
                            </p>
                            <p className="text-[10px] text-slate-500 truncate">
                              {isFolder ? 'Folder' : file.size ? `${(parseInt(file.size) / 1024).toFixed(1)} KB` : 'File'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1 shrink-0 ml-2">
                          {file.webViewLink && !isFolder && (
                            <a
                              href={file.webViewLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-200/60 transition"
                              title="Open in Google Drive"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}

                          {isSelected && (
                            <div className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer actions */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <div className="text-xs text-slate-500 truncate max-w-xs">
                {selectedFile ? (
                  <span>Selected: <b className="text-slate-900">{selectedFile.name}</b></span>
                ) : (
                  <span>Select a document to attach</span>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSelect}
                  disabled={!selectedFile}
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-xs font-black transition disabled:opacity-40 flex items-center space-x-1.5 shadow-xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Attach File</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
