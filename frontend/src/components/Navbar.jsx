import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, UserCircle, Shield, User } from 'lucide-react';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
              Y
            </div>
            <span className="font-semibold text-base text-zinc-900 tracking-tight">Yaloric Assignment</span>
          </Link>

          {isAdmin && (
            <div className="hidden sm:flex items-center gap-2 pl-4 border-l border-slate-200">
              <Link
                to="/admin"
                className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-zinc-900 hover:bg-slate-100 rounded-md transition"
              >
                Admin Directory
              </Link>
              <Link
                to="/profile"
                className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-zinc-900 hover:bg-slate-100 rounded-md transition"
              >
                My Profile
              </Link>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          {user && (
            <div className="flex items-center gap-2.5 text-sm text-slate-600">
              <UserCircle className="w-5 h-5 text-slate-500" />
              <span className="font-medium text-slate-800">{user.firstName} {user.lastName}</span>
              <span className="text-slate-400 hidden md:inline">({user.email})</span>
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  isAdmin
                    ? 'bg-purple-100 text-purple-700 border border-purple-200'
                    : 'bg-blue-100 text-blue-700 border border-blue-200'
                }`}
              >
                {isAdmin ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
                {user.role || 'USER'}
              </span>
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
