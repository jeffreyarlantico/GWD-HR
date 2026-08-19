import React, { useRef, useState } from 'react';
import { Image, Upload, Trash2, CheckCircle2 } from 'lucide-react';

interface ProfilePhotoUploaderProps {
  photoUrl: string;
  onChange: (url: string) => void;
  employeeName?: string;
}

export const ProfilePhotoUploader: React.FC<ProfilePhotoUploaderProps> = ({
  photoUrl,
  onChange,
  employeeName = 'Employee'
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadNotice, setUploadNotice] = useState('');

  // Handle Local File Selection (Converts to Data URL for instant HRIS preview)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (JPG, PNG, WEBP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image file size should be less than 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      const result = evt.target?.result as string;
      if (result) {
        onChange(result);
        setUploadNotice('Photo uploaded and preview generated successfully!');
        setTimeout(() => setUploadNotice(''), 4000);
      }
    };
    reader.readAsDataURL(file);

    if (e.target) {
      e.target.value = '';
    }
  };

  return (
    <div id="profile-photo-uploader-component" className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-slate-700">
          Profile Photo
        </label>
      </div>

      {/* Main Container */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
        
        {/* Preview & Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          
          {/* Avatar Preview */}
          <div className="relative group">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-slate-200 border-2 border-amber-400 shadow-sm flex items-center justify-center flex-shrink-0">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt={employeeName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback on broken image link
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <Image className="w-8 h-8 text-slate-400" />
              )}
            </div>

            {photoUrl && (
              <button
                type="button"
                onClick={() => onChange('')}
                className="absolute -top-1 -right-1 p-1 bg-rose-600 text-white rounded-full hover:bg-rose-700 transition shadow"
                title="Remove photo"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex-1 space-y-2 text-center sm:text-left w-full">
            <div className="flex flex-wrap items-center gap-2">
              {/* Upload Local File */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-xs font-bold transition shadow-xs flex items-center gap-1.5"
              >
                <Upload className="w-4 h-4" />
                <span>Select Photo File</span>
              </button>

              {photoUrl && (
                <button
                  type="button"
                  onClick={() => onChange('')}
                  className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold transition flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove Photo</span>
                </button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            <p className="text-[11px] text-slate-500">
              Select a photo file from your computer (JPG, PNG, WEBP, up to 5MB) or enter an image URL below.
            </p>
          </div>
        </div>

        {/* Success Notice */}
        {uploadNotice && (
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-semibold text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{uploadNotice}</span>
          </div>
        )}

        {/* Photo URL Input */}
        <div>
          <label className="block text-[11px] font-bold text-slate-600 mb-1">
            Or Direct Photo Image URL
          </label>
          <div className="relative">
            <input
              type="text"
              value={photoUrl}
              onChange={(e) => onChange(e.target.value)}
              placeholder="https://example.com/photo.jpg"
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <Image className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>
        </div>

      </div>
    </div>
  );
};
