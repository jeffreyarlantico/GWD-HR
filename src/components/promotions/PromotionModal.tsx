import React, { useState } from 'react';
import { useHRIS } from '../../context/HRISContext';
import { History, FileText, AlertCircle, Save, X } from 'lucide-react';
import { AppointmentDocumentUploader } from '../common/AppointmentDocumentUploader';

interface PromotionModalProps {
  employeeId: string;
  onClose: () => void;
}

export const PromotionModal: React.FC<PromotionModalProps> = ({ employeeId, onClose }) => {
  const { addPromotion } = useHRIS();

  const [position, setPosition] = useState('Teacher II');
  const [itemNumber, setItemNumber] = useState('');
  const [appointmentDate, setAppointmentDate] = useState(new Date().toISOString().split('T')[0]);
  const [appointmentPaperUrl, setAppointmentPaperUrl] = useState('');
  const [remarks, setRemarks] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!position.trim() || !appointmentDate) {
      return;
    }

    addPromotion({
      employeeId,
      position: position.trim(),
      itemNumber: itemNumber.trim(),
      appointmentDate,
      appointmentPaperUrl: appointmentPaperUrl.trim(),
      remarks: remarks.trim(),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white text-slate-900 rounded-xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
        
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <History className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-base text-slate-900">Add Promotion / Appointment History</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Business Rule Reminder */}
        <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-900 flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p>
            <b>DepEd Rule:</b> Adding a promotion automatically updates the teacher's current position, item number, appointment date, and appointment document to the latest promoted position.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Promoted Position *</label>
            <input
              type="text"
              required
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder="e.g. Teacher II, Teacher III, Master Teacher I"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Plantilla Item Number</label>
            <input
              type="text"
              value={itemNumber}
              onChange={(e) => setItemNumber(e.target.value)}
              placeholder="e.g. OSEC-DECSB-TCH2-150221-2022"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Appointment Date *</label>
            <input
              type="date"
              required
              value={appointmentDate}
              onChange={(e) => setAppointmentDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <AppointmentDocumentUploader
            documentUrl={appointmentPaperUrl}
            onChange={setAppointmentPaperUrl}
            positionName={position || 'Promoted Position'}
            label={`Appointment Document for ${position || 'Position'}`}
          />

          <div>
            <label className="block font-bold text-slate-700 mb-1">Remarks / Reclassification Details</label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Promoted via ERF reclassification or District Ranking..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg flex items-center space-x-1"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Promotion Entry</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
