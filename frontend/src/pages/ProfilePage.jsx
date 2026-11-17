import { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { EditProfileModal } from '../components/EditProfileModal';
import { getProfile, updateProfile } from '../api/users';
import { useAuth } from '../context/AuthContext';
import { Mail, Phone, Calendar, Shield, User, Edit3, CheckCircle } from 'lucide-react';

export const ProfilePage = () => {
  const { user: authUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditOpen, setIsEditOpen] = useState(false);

  const fetchProfileData = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getProfile();
      setProfile(data);
    } catch (err) {
      setError('Unable to load your profile details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  const handleSaveProfile = async (formData) => {
    const updated = await updateProfile(formData);
    setProfile(updated);
    setSuccess('Profile updated successfully!');
    setTimeout(() => setSuccess(''), 3000);
  };

  const isAdmin = profile?.role === 'ADMIN' || authUser?.role === 'ADMIN';

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Profile</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your personal profile details and contact information.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            <span>{success}</span>
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-zinc-900 mb-4" />
            <p className="text-sm text-slate-500">Loading your profile...</p>
          </div>
        ) : profile ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Header banner */}
            <div className="bg-gradient-to-r from-slate-900 to-zinc-800 p-8 text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">
                  {profile.firstName} {profile.lastName}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                      isAdmin
                        ? 'bg-purple-500/20 text-purple-200 border border-purple-400/30'
                        : 'bg-blue-500/20 text-blue-200 border border-blue-400/30'
                    }`}
                  >
                    {isAdmin ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
                    {profile.role || 'USER'}
                  </span>
                  <span className="text-xs text-slate-400">Account verified</span>
                </div>
              </div>

              <button
                onClick={() => setIsEditOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-900 bg-white hover:bg-slate-100 rounded-lg shadow-sm transition self-start sm:self-auto"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit Profile</span>
              </button>
            </div>

            {/* Profile fields */}
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                  <User className="w-4 h-4 text-slate-400" />
                  <span>Full Name</span>
                </div>
                <p className="text-base font-medium text-slate-900">
                  {profile.firstName} {profile.lastName}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span>Email Address</span>
                </div>
                <p className="text-base font-medium text-slate-900">{profile.email}</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span>Phone Number</span>
                </div>
                <p className="text-base font-medium text-slate-900">{profile.phone}</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>Member Since</span>
                </div>
                <p className="text-base font-medium text-slate-900">
                  {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  }) : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </main>

      <EditProfileModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSave={handleSaveProfile}
        currentUser={profile}
      />
    </div>
  );
};
