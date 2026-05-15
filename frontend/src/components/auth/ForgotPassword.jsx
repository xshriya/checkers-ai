import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';

export default function ForgotPassword() {
  const [step, setStep] = useState('email'); // 'email', 'otp', 'reset', 'success'
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [passwordMatch, setPasswordMatch] = useState(null);
  const navigate = useNavigate();

  const handlePasswordChange = (value) => {
    setNewPassword(value);
    if (confirmPassword) {
      setPasswordMatch(value === confirmPassword);
    }
  };

  const handleConfirmPasswordChange = (value) => {
    setConfirmPassword(value);
    if (newPassword) {
      setPasswordMatch(value === newPassword);
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('http://localhost:8000/auth/forgot-password', {
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
      const response = await fetch('http://localhost:8000/auth/verify-otp?purpose=reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp_code: otpCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Invalid OTP code');
      }

      setMessage('OTP verified! Set your new password.');
      setStep('reset');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:8000/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          otp_code: otpCode,
          new_password: newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Password reset failed');
      }

      setMessage('Password reset successfully!');
      setStep('success');
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
      const response = await fetch('http://localhost:8000/auth/forgot-password', {
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
    <div className="min-h-screen flex items-center justify-center px-4 pt-23 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none"></div>
      
      <div className="w-full max-w-md z-10">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-black tracking-tight text-indigo-400 leading-none mb-3">
            Checkers AI
          </h1>
          <p className="text-on-surface-variant text-sm tracking-wide uppercase">
            Password Reset
          </p>
        </div>

        <div className="bg-white/[0.03] border border-outline-variant/20 rounded-xl p-6 md:p-7 shadow-2xl backdrop-blur-[16px]">
          {step === 'email' && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant ml-1">
                  Email Address
                </label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" size={18} />
                  <input
                    className="w-full bg-surface-container-high/50 border-none rounded-xl py-3 pl-12 pr-4 text-on-surface focus:ring-2 focus:ring-primary/50 focus:bg-surface-bright transition-all duration-200 outline-none placeholder:text-outline/50"
                    placeholder="you@example.com"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary-container text-on-primary-container font-bold py-3 rounded-xl border-2 border-primary hover:shadow-[0_0_15px_2px_rgba(128,131,255,0.4)] transition-all duration-300 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Sending OTP...
                  </>
                ) : (
                  <>
                    Send OTP <Mail size={20} />
                  </>
                )}
              </button>

              {message && (
                <p className="text-green-400 text-sm text-center">{message}</p>
              )}
              {error && (
                <p className="text-red-400 text-sm text-center">{error}</p>
              )}

              <button
                type="button"
                onClick={() => navigate('/login')}
                className="w-full text-sm text-on-surface-variant hover:text-on-surface flex items-center justify-center gap-2"
              >
                <ArrowLeft size={16} />
                Back to Login
              </button>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant ml-1">
                  Enter OTP Code
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" size={18} />
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
                    Verify OTP <Lock size={20} />
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
                onClick={() => setStep('email')}
                className="w-full text-sm text-on-surface-variant hover:text-on-surface"
              >
                ← Back to email
              </button>

              {message && (
                <p className="text-green-400 text-sm text-center">{message}</p>
              )}
              {error && (
                <p className="text-red-400 text-sm text-center">{error}</p>
              )}
            </form>
          )}

          {step === 'reset' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant ml-1">
                  New Password
                </label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" size={18} />
                  <input
                    className={`w-full bg-surface-container-high/50 border-none rounded-xl py-3 pl-12 pr-4 text-on-surface focus:ring-2 focus:ring-primary/50 focus:bg-surface-bright transition-all duration-200 outline-none placeholder:text-outline/50 ${passwordMatch === false ? 'ring-2 ring-red-500/50' : ''}`}
                    placeholder="••••••••••••"
                    type="password"
                    value={newPassword}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant ml-1">
                  Confirm Password
                </label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" size={18} />
                  <input
                    className={`w-full bg-surface-container-high/50 border-none rounded-xl py-3 pl-12 pr-4 text-on-surface focus:ring-2 focus:ring-primary/50 focus:bg-surface-bright transition-all duration-200 outline-none placeholder:text-outline/50 ${passwordMatch === true ? 'ring-2 ring-green-500/50' : passwordMatch === false ? 'ring-2 ring-red-500/50' : ''}`}
                    placeholder="••••••••••••"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                    required
                  />
                </div>
                {passwordMatch !== null && (
                  <p className={`text-xs ${passwordMatch ? 'text-green-400' : 'text-red-400'} ml-1`}>
                    {passwordMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || passwordMatch === false}
                className="w-full bg-primary-container text-on-primary-container font-bold py-3 rounded-xl border-2 border-primary hover:shadow-[0_0_15px_2px_rgba(128,131,255,0.4)] transition-all duration-300 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Resetting Password...
                  </>
                ) : (
                  <>
                    Reset Password <Lock size={20} />
                  </>
                )}
              </button>

              {error && (
                <p className="text-red-400 text-sm text-center">{error}</p>
              )}
            </form>
          )}

          {step === 'success' && (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center">
                  <CheckCircle size={40} className="text-green-400" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-on-surface">
                Password Reset Successful!
              </h2>
              <p className="text-on-surface-variant">
                Your password has been reset. You can now log in with your new password.
              </p>
              <button
                onClick={() => navigate('/login')}
                className="w-full bg-primary-container text-on-primary-container font-bold py-3 rounded-xl border-2 border-primary hover:shadow-[0_0_15px_2px_rgba(128,131,255,0.4)] transition-all duration-300 active:scale-95"
              >
                Go to Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
