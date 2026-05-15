import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading, logout } = useAuth();
  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-[#131313]/80 backdrop-blur-xl bg-gradient-to-b from-white/5 to-transparent">
      <div className="flex justify-between items-center px-8 py-4 max-w-7xl mx-auto font-['Inter'] tracking-tight">
        <Link to="/" className="text-2xl font-black text-indigo-400 dark:text-indigo-300">
          Checkers AI
        </Link>
        <div className="hidden md:flex items-center gap-8">
          {user && (
            <Link
              className={`${isActive('/play') ? 'text-indigo-400 border-b-2 border-indigo-500 pb-1' : 'text-slate-400 hover:text-indigo-200'} transition-colors duration-300}`}
              to="/play"
            >
              Play
            </Link>
          )}
          {user && (
            <Link
              className={`${isActive('/dashboard') ? 'text-indigo-400 border-b-2 border-indigo-500 pb-1' : 'text-slate-400 hover:text-indigo-200'} transition-colors duration-300}`}
              to="/dashboard"
            >
              Dashboard
            </Link>
          )}
          <Link
            className={`${isActive('/leaderboard') ? 'text-indigo-400 border-b-2 border-indigo-500 pb-1' : 'text-slate-400 hover:text-indigo-200'} transition-colors duration-300`}
            to="/leaderboard"
          >
            Leaderboard
          </Link>
        </div>
        <div className="flex items-center gap-4">
          {loading ? (
            <div className="w-20 h-8 bg-surface-container-high animate-pulse rounded-lg"></div>
          ) : user ? (
            <>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                  {user.username?.charAt(0).toUpperCase()}
                </div>
                <span className="text-slate-300 font-medium hidden sm:block">{user.username}</span>
              </div>
              <button
                onClick={handleLogout}
                className="text-slate-400 hover:text-red-400 transition-colors text-sm font-medium"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link 
                to="/login" 
                className={`${isActive('/login') ? 'text-indigo-400 border-b-2 border-indigo-500 pb-1 font-bold' : 'text-slate-400 font-medium hover:text-white'} px-4 py-2 transition-colors duration-300`}
              >
                Log In
              </Link>
              <Link 
                to="/signup" 
                className="bg-primary-container text-on-primary-container px-6 py-2.5 rounded-xl border-2 border-primary font-bold active:scale-95 duration-100 primary-button-glow"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}