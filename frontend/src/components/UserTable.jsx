import { Edit2, Trash2, Mail, Phone, UserCheck } from 'lucide-react';

export const UserTable = ({ users, loading, onEdit, onDelete, onView }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-blue-600 mb-4" />
        <p className="text-sm text-slate-500">Loading user records...</p>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
        <UserCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-slate-800">No users found</h3>
        <p className="text-sm text-slate-500 mt-1">Get started by creating a new user above.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-slate-600 uppercase text-xs tracking-wider">
            <tr>
              <th scope="col" className="px-6 py-3 font-semibold">User</th>
              <th scope="col" className="px-6 py-3 font-semibold">Email</th>
              <th scope="col" className="px-6 py-3 font-semibold">Phone Number</th>
              <th scope="col" className="px-6 py-3 font-semibold">Role</th>
              <th scope="col" className="px-6 py-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {users.map((u) => (
              <tr
                key={u.id}
                onClick={() => onView && onView(u)}
                className="hover:bg-slate-50/90 transition-colors cursor-pointer group"
                title="Click to view details"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-slate-900 group-hover:text-blue-600 transition-colors">
                    {u.firstName} {u.lastName}
                  </div>
                </td>
                  <td className="px-6 py-4 text-slate-600 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-slate-400" />
                      <span>{u.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-slate-400" />
                      <span>{u.phone}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        u.role === 'ADMIN'
                          ? 'bg-purple-100 text-purple-700 border border-purple-200'
                          : 'bg-blue-100 text-blue-700 border border-blue-200'
                      }`}
                    >
                      {u.role || 'USER'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(u);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition"
                        title="Edit User"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      {u.role !== 'ADMIN' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(u);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-md transition"
                          title="Delete User"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
