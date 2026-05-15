import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function LoginForm() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md z-10">
      <div className="text-center mb-6">
        <h1 className="text-4xl font-black tracking-tight text-indigo-400 leading-none mb-3">
          Checkers AI
        </h1>
        <p className="text-on-surface-variant text-sm tracking-wide uppercase">
          Challenge the Digital Grandmaster
        </p>
      </div>

      <div className="bg-white/[0.03] border border-outline-variant/20 rounded-xl p-8 md:p-10 shadow-2xl backdrop-blur-[16px]">
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant ml-1">
              Email Address
            </label>
            <div className="relative group">
             <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" size={18} />
              <input
                className="w-full bg-surface-container-high/50 border-none rounded-xl py-3.5 pl-12 pr-4 text-on-surface focus:ring-2 focus:ring-primary/50 focus:bg-surface-bright transition-all duration-200 outline-none placeholder:text-outline/50"
                placeholder="grandmaster@checkers.ai"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center px-1">
              <label className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant">
                Password
              </label>
              <a className="text-[10px] uppercase font-bold text-primary hover:text-primary-fixed transition-colors" href="#">
                Forgot Password?
              </a>
            </div>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" size={18} />
              <input
                className="w-full bg-surface-container-high/50 border-none rounded-xl py-3.5 pl-12 pr-4 text-on-surface focus:ring-2 focus:ring-primary/50 focus:bg-surface-bright transition-all duration-200 outline-none placeholder:text-outline/50"
                placeholder="••••••••••••"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            className="w-full bg-primary-container text-on-primary-container font-bold py-4 rounded-xl border-2 border-primary hover:shadow-[0_0_15px_2px_rgba(128,131,255,0.4)] transition-all duration-300 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                Log In <LogIn size={20} />
              </>
            )}
          </button>

          {error && (
            <p className="text-red-400 text-sm text-center mt-2">{error}</p>
          )}
        </form>

        <div className="relative my-6 flex items-center">
          <div className="flex-grow border-t border-outline-variant/20"></div>
          <span className="mx-4 text-xs font-bold uppercase text-outline/60 tracking-widest">
            Connect via Network
          </span>
          <div className="flex-grow border-t border-outline-variant/20"></div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button className="flex items-center justify-center gap-3 bg-surface-container-low hover:bg-surface-container-high text-on-surface text-sm font-semibold py-3.5 rounded-xl transition-all duration-200 border border-outline-variant/10">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M12 11h9v2h-9z" fill="#EA4335"></path>
              <path d="M12 13h9v2h-9z" fill="#FBBC05"></path>
              <path d="M22.5 12c0-.8-.1-1.5-.3-2.2H12v4.2h5.9c-.3 1.4-1.1 2.5-2.3 3.3v2.8h3.7c2.2-2 3.5-5 3.5-8.1z" fill="#4285F4"></path>
              <path d="M12 23c3 0 5.5-1 7.3-2.7l-3.7-2.8c-1 .7-2.3 1.1-3.6 1.1-2.8 0-5.2-1.9-6.1-4.4H2.1v2.8C3.9 20.5 7.7 23 12 23z" fill="#34A853"></path>
              <path d="M5.9 14.2c-.2-.7-.3-1.4-.3-2.2s.1-1.5.3-2.2V7.1H2.1c-.8 1.5-1.2 3.2-1.2 4.9s.4 3.4 1.2 4.9l3.8-2.7z" fill="#FBBC05"></path>
              <path d="M12 5.4c1.6 0 3.1.6 4.2 1.6l3.1-3.1C17.5 2.2 15 1 12 1 7.7 1 3.9 3.5 2.1 7.1l3.8 2.7c.9-2.5 3.3-4.4 6.1-4.4z" fill="#EA4335"></path>
            </svg>
            Google
          </button>
          <button className="flex items-center justify-center gap-3 bg-surface-container-low hover:bg-surface-container-high text-on-surface text-sm font-semibold py-3.5 rounded-xl transition-all duration-200 border border-outline-variant/10">
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
            </svg>
            GitHub
          </button>
        </div>

        <button
          onClick={() => window.location.href = '/forgot-password'}
          className="w-full mt-4 bg-surface-container-low text-on-surface-variant font-semibold py-2.5 rounded-xl border border-outline-variant/20 hover:bg-surface-container-high hover:text-on-surface transition-all duration-300"
        >
          Forgot Password?
        </button>

        <div className="mt-8 text-center">
          <p className="text-sm text-on-surface-variant">
            New player?{' '}
            <a className="text-primary-fixed font-bold ml-1 hover:underline underline-offset-4 decoration-primary-container" href="/signup">
              Initialize Account
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}