import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Lock, ShieldCheck, UserPlus, Loader2, ArrowLeft, Check, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function SignupForm() {
  const navigate = useNavigate();
  const { register, checkAuth } = useAuth();
  const [step, setStep] = useState('details'); // 'details' or 'otp'
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordMatch, setPasswordMatch] = useState(null); // null, true, false
  const [otpCode, setOtpCode] = useState('');
  const [usernameAvailable, setUsernameAvailable] = useState(null); // null, true, false
  const [checkingUsername, setCheckingUsername] = useState(false);

  const handlePasswordChange = (value) => {
    setPassword(value);
    if (confirmPassword) {
      setPasswordMatch(value === confirmPassword);
    }
  };

  const handleConfirmPasswordChange = (value) => {
    setConfirmPassword(value);
    if (password) {
      setPasswordMatch(value === password);
    }
  };

  // Check username availability with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (username.length >= 3) {
        setCheckingUsername(true);
        try {
          const response = await fetch('http://localhost:8000/auth/check-username', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username }),
          });
          const data = await response.json();
          setUsernameAvailable(data.available);
        } catch (err) {
          console.error('Error checking username:', err);
        } finally {
          setCheckingUsername(false);
        }
      } else {
        setUsernameAvailable(null);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [username]);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (usernameAvailable === false) {
      setError('Username already taken');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!agreed) {
      setError('Please agree to the Terms of Service');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:8000/auth/send-otp?purpose=verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to send OTP');
      }

      setMessage('OTP sent to your email!');
      setStep('otp');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:8000/auth/signup-with-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          email,
          password,
          otp_code: otpCode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Signup failed');
      }

      // Store token and update auth state
      localStorage.setItem('token', data.access_token);
      await checkAuth(); // Update user state in AuthContext
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:8000/auth/send-otp?purpose=verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to resend OTP');
      }

      setMessage('New OTP sent to your email!');
    } catch (err) {
      setError(err.message);
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
          Begin Your Conquest
        </p>
      </div>

      <div className="bg-white/[0.03] border border-outline-variant/20 rounded-xl p-6 md:p-7 shadow-2xl backdrop-blur-[16px]">
        {step === 'details' ? (
          <form className="space-y-3" onSubmit={handleSendOtp}>
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant ml-1">
              Username
            </label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" size={18} />
              <input
                className={`w-full bg-surface-container-high/50 border-none rounded-xl py-3 pl-12 pr-12 text-on-surface focus:ring-2 focus:bg-surface-bright transition-all duration-200 outline-none placeholder:text-outline/50 ${
                  usernameAvailable === true ? 'ring-2 ring-green-500/50' :
                  usernameAvailable === false ? 'ring-2 ring-red-500/50' :
                  'focus:ring-primary/50'
                }`}
                placeholder="grandmaster_42"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                {checkingUsername ? (
                  <Loader2 size={18} className="animate-spin text-outline" />
                ) : usernameAvailable === true ? (
                  <Check size={18} className="text-green-400" />
                ) : usernameAvailable === false ? (
                  <X size={18} className="text-red-400" />
                ) : null}
              </div>
            </div>
            {usernameAvailable === false && (
              <p className="text-xs text-red-400 ml-1">Username already taken</p>
            )}
            {usernameAvailable === true && (
              <p className="text-xs text-green-400 ml-1">Username available</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant ml-1">
              Email Address
            </label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" size={18} />
              <input
                className="w-full bg-surface-container-high/50 border-none rounded-xl py-3 pl-12 pr-4 text-on-surface focus:ring-2 focus:ring-primary/50 focus:bg-surface-bright transition-all duration-200 outline-none placeholder:text-outline/50"
                placeholder="grandmaster@checkers.ai"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant ml-1">
              Password
            </label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" size={18} />
              <input
                className={`w-full bg-surface-container-high/50 border-none rounded-xl py-3 pl-12 pr-4 text-on-surface focus:ring-2 focus:ring-primary/50 focus:bg-surface-bright transition-all duration-200 outline-none placeholder:text-outline/50 ${passwordMatch === false ? 'ring-2 ring-red-500/50' : ''}`}
                placeholder="••••••••••••"
                type="password"
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant ml-1">
              Confirm Password
            </label>
            <div className="relative group">
              <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" size={18} />
              <input
                className={`w-full bg-surface-container-high/50 border-none rounded-xl py-3 pl-12 pr-4 text-on-surface focus:ring-2 focus:ring-primary/50 focus:bg-surface-bright transition-all duration-200 outline-none placeholder:text-outline/50 ${passwordMatch === true ? 'ring-2 ring-green-500/50' : passwordMatch === false ? 'ring-2 ring-red-500/50' : ''}`}
                placeholder="••••••••••••"
                type="password"
                value={confirmPassword}
                onChange={(e) => handleConfirmPasswordChange(e.target.value)}
              />
            </div>
            {passwordMatch !== null && (
              <p className={`text-xs ${passwordMatch ? 'text-green-400' : 'text-red-400'} ml-1`}>
                {passwordMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
              </p>
            )}
          </div>

          <div className="flex items-start gap-3 pt-1">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 accent-indigo-500"
            />
            <span className="text-xs text-on-surface-variant leading-relaxed">
              I agree to the{' '}
              <a className="text-primary font-bold hover:underline" href="#">Terms of Service</a>
              {' '}and{' '}
              <a className="text-primary font-bold hover:underline" href="#">Privacy Policy</a>
            </span>
          </div>

          <button
            className="w-full bg-primary-container text-on-primary-container font-bold py-3 rounded-xl border-2 border-primary hover:shadow-[0_0_15px_2px_rgba(128,131,255,0.4)] transition-all duration-300 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            type="submit"
            disabled={loading || passwordMatch === false || usernameAvailable === false}
          >
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Sending OTP...
              </>
            ) : (
              <>
                Verify & Create Account <ShieldCheck size={20} />
              </>
            )}
          </button>

          {error && (
            <p className="text-red-400 text-sm text-center mt-2">{error}</p>
          )}
          {message && (
            <p className="text-green-400 text-sm text-center mt-2">{message}</p>
          )}
        </form>
        ) : (
          <form className="space-y-4" onSubmit={handleVerifyOtp}>
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant ml-1">
                Enter OTP Code
              </label>
              <div className="relative">
                <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" size={18} />
                <input
                  className="w-full bg-surface-container-high/50 border-none rounded-xl py-3 pl-12 pr-4 text-on-surface focus:ring-2 focus:ring-primary/50 focus:bg-surface-bright transition-all outline-none text-center text-2xl tracking-widest font-mono"
                  type="text"
                  placeholder="000000"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  required
                />
              </div>
              <p className="text-xs text-on-surface-variant text-center">
                Enter the 6-digit code sent to {email}
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-container text-on-primary-container font-bold py-3 rounded-xl border-2 border-primary hover:shadow-[0_0_15px_2px_rgba(128,131,255,0.4)] transition-all duration-300 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  Verify & Create Account <UserPlus size={20} />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleResendOtp}
              disabled={loading}
              className="w-full text-sm text-primary hover:underline disabled:opacity-50"
            >
              Resend OTP
            </button>

            <button
              type="button"
              onClick={() => setStep('details')}
              className="w-full text-sm text-on-surface-variant hover:text-on-surface flex items-center justify-center gap-2"
            >
              <ArrowLeft size={16} />
              Back to details
            </button>

            {error && (
              <p className="text-red-400 text-sm text-center">{error}</p>
            )}
            {message && (
              <p className="text-green-400 text-sm text-center">{message}</p>
            )}
          </form>
        )}

        <div className="mt-5 text-center">
          <p className="text-sm text-on-surface-variant">
            Already a player?{' '}
            <a className="text-primary-fixed font-bold ml-1 hover:underline underline-offset-4 decoration-primary-container" href="/login">
              Log In
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}