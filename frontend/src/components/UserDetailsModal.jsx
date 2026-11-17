import { useState, useEffect } from 'react';
import { X, Mail, Phone, Calendar, Clock, Fingerprint, Shield, Check, Copy, Edit2, User } from 'lucide-react';

export const UserDetailsModal = ({ isOpen, onClose, user, onEdit }) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !user) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'Not available';
    try {
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(dateString));
    } catch {
      return dateString;
    }
  };

  const handleCopyId = () => {
    if (user.id) {
      navigator.clipboard.writeText(user.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isAdmin = user.role === 'ADMIN';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between bg-slate-50/60">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                  isAdmin
                    ? 'bg-purple-100 text-purple-700 border border-purple-200'
                    : 'bg-blue-100 text-blue-700 border border-blue-200'
                }`}
              >
                {isAdmin ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
                {isAdmin ? 'ADMIN' : 'USER'}
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              {user.firstName} {user.lastName}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {isAdmin ? 'Administrator Account' : 'User Account'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                onClick={() => {
                  onClose();
                  onEdit(user);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-sm transition"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Details Grid */}
        <div className="p-6 space-y-3">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg border border-slate-200 text-slate-500">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Email Address</div>
                <div className="text-sm font-medium text-slate-800">{user.email}</div>
              </div>
            </div>
            <a
              href={`mailto:${user.email}`}
              className="text-xs font-medium text-blue-600 hover:underline px-2 py-1"
            >
              Send Mail
            </a>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg border border-slate-200 text-slate-500">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Phone Number</div>
              <div className="text-sm font-medium text-slate-800">{user.phone}</div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 bg-white rounded-lg border border-slate-200 text-slate-500 shrink-0">
                <Fingerprint className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">User UUID</div>
                <div className="text-xs font-mono text-slate-700 truncate">{user.id}</div>
              </div>
            </div>
            <button
              onClick={handleCopyId}
              className="shrink-0 inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-2 py-1 rounded-md transition hover:bg-slate-100 ml-2"
              title="Copy User UUID"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-600">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2.5">
              <div className="p-1.5 bg-white rounded-lg border border-slate-200 text-slate-500">
                <Calendar className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Member Since</div>
                <div className="text-xs font-medium text-slate-800">{formatDate(user.createdAt)}</div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2.5">
              <div className="p-1.5 bg-white rounded-lg border border-slate-200 text-slate-500">
                <Clock className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Last Updated</div>
                <div className="text-xs font-medium text-slate-800">{formatDate(user.updatedAt)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50/60 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-sm transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
