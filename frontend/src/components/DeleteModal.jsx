import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';

export const DeleteModal = ({ isOpen, onClose, onConfirm, userToDelete }) => {
  const [deleting, setDeleting] = useState(false);

  if (!isOpen || !userToDelete) return null;

  const handleConfirm = async () => {
    setDeleting(true);
    try {
      await onConfirm(userToDelete.id);
      onClose();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white w-full max-w-sm rounded-xl shadow-xl border border-slate-200 overflow-hidden p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-1">Delete User</h3>
        <p className="text-sm text-slate-500 mb-6">
          Are you sure you want to delete <span className="font-semibold text-slate-700">{userToDelete.firstName} {userToDelete.lastName}</span> ({userToDelete.email})? This action cannot be undone.
        </p>

        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={deleting}
            onClick={handleConfirm}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition disabled:opacity-50"
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};
