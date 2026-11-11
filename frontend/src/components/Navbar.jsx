import { useAuth } from '../context/AuthContext';
import { LogOut, UserCircle } from 'lucide-react';

export const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
            Y
          </div>
          <span className="font-semibold text-base text-zinc-900 tracking-tight">Yaloric Assignment</span>
        </div>

        <div className="flex items-center gap-4">
          {user && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <UserCircle className="w-5 h-5 text-slate-500" />
              <span className="font-medium text-slate-800">{user.firstName} {user.lastName}</span>
              <span className="text-slate-400 hidden sm:inline">({user.email})</span>
            </div>
          )}
          <button
            onClick={logout}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-700 hover:text-red-600 hover:bg-red-50 rounded-md transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
};
