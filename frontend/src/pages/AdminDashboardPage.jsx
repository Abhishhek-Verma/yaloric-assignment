import { useState, useEffect, useCallback } from 'react';
import { Navbar } from '../components/Navbar';
import { UserTable } from '../components/UserTable';
import { UserModal } from '../components/UserModal';
import { DeleteModal } from '../components/DeleteModal';
import { UserDetailsModal } from '../components/UserDetailsModal';
import { getUsers, updateUser, deleteUser } from '../api/users';
import { RefreshCw, Shield } from 'lucide-react';

export const AdminDashboardPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [userToView, setUserToView] = useState(null);

  const fetchUsers = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const data = await getUsers();
      setUsers(data);
    } catch (err) {
      setError('Failed to fetch user list. Please make sure you are logged in as an administrator.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleOpenEditModal = (user) => {
    setUserToEdit(user);
    setModalOpen(true);
  };

  const handleOpenDeleteModal = (user) => {
    setUserToDelete(user);
    setDeleteModalOpen(true);
  };

  const handleOpenViewModal = (user) => {
    setUserToView(user);
    setDetailsModalOpen(true);
  };

  const handleSaveUser = async (formData, id) => {
    if (id) {
      const updated = await updateUser(id, formData);
      setUsers((prev) =>
        prev
          .map((u) => (u.id === id ? updated : u))
          .sort((a, b) => {
            if (a.role === 'ADMIN' && b.role !== 'ADMIN') return -1;
            if (a.role !== 'ADMIN' && b.role === 'ADMIN') return 1;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          })
      );
    }
  };

  const handleDeleteUser = async (id) => {
    await deleteUser(id);
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Admin Directory</h1>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200">
                <Shield className="w-3 h-3" />
                Admin Console
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Centralized view of all registered user accounts. Edit details or remove users directly.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchUsers(true)}
              disabled={refreshing || loading}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
            {error}
          </div>
        )}

        <UserTable
          users={users}
          loading={loading}
          onEdit={handleOpenEditModal}
          onDelete={handleOpenDeleteModal}
          onView={handleOpenViewModal}
        />
      </main>

      <UserDetailsModal
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        user={userToView}
        onEdit={handleOpenEditModal}
      />

      <UserModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveUser}
        userToEdit={userToEdit}
      />

      <DeleteModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteUser}
        userToDelete={userToDelete}
      />
    </div>
  );
};
