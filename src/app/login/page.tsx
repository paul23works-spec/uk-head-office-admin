'use client';

import { useAuth, toClientUser } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { User as UserIcon, Lock, Eye, EyeOff, Loader2, ShieldCheck, KeyRound, CheckCircle2, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function LoginPage() {
  const { user, setAuthenticatedUser, isLoading } = useAuth();
  const router = useRouter();

  // Login form state
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mandatory password change state
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [pwdError, setPwdError] = useState<string | null>(null);
  const [pwdSuccess, setPwdSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (user && !isLoading) {
      if (user.needsPasswordChange) {
        setIsChangingPassword(true);
      } else {
        router.push('/');
      }
    }
  }, [user, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanIdentifier = identifier.trim();
    if (!cleanIdentifier || !password) {
      setError('Please provide both Employee ID/Email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier: cleanIdentifier,
          password,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        let msg = data.error || 'Authentication failed. Please check your credentials.';
        if (res.status === 401) msg = 'Invalid Employee ID, Email, or Password.';
        if (res.status === 500) msg = 'System authentication service is currently unavailable.';
        setError(msg);
        return;
      }

      if (data.user) {
        const clientUser = toClientUser(data.user);
        setAuthenticatedUser(clientUser);

        if (data.needsPasswordChange || clientUser.needsPasswordChange) {
          setCurrentPassword(password);
          setIsChangingPassword(true);
        } else {
          router.push('/');
        }
      }
    } catch (err: any) {
      setError('Network connection error. Unable to reach authentication server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError(null);
    setPwdSuccess(null);

    if (newPassword !== confirmPassword) {
      setPwdError('New password and confirmation do not match.');
      return;
    }

    if (newPassword.length < 10) {
      setPwdError('Password must be at least 10 characters long.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        setPwdError(data.error || 'Failed to update password. Please check requirements.');
        return;
      }

      setPwdSuccess('Password successfully updated! Redirecting to Control Center...');
      if (data.user) {
        setAuthenticatedUser(toClientUser(data.user));
      }
      setTimeout(() => {
        router.push('/');
      }, 1200);
    } catch (err: any) {
      setPwdError('Network error updating password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Password requirements calculation
  const hasMinLength = newPassword.length >= 10;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword);
  const notDefault = newPassword.toLowerCase() !== 'password';

  if (isLoading) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Authoritative UK GROUP Brand Header */}
        <div className="bg-slate-900 px-6 py-8 text-center relative overflow-hidden">
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-48 h-48 bg-blue-600/15 rounded-full blur-2xl pointer-events-none" />

          <div className="relative mx-auto w-28 h-28 sm:w-32 sm:h-32 mb-4 bg-white rounded-2xl shadow-lg border border-slate-100/80 p-2.5 flex items-center justify-center">
            <img
              src="/images/uk-group-logo.png"
              alt="UK GROUP"
              className="w-full h-full object-contain pointer-events-none select-none"
            />
          </div>
          <h1 className="text-xl font-bold font-editorial tracking-tight text-white">UK Enterprise Admin</h1>
          <p className="text-slate-400 text-sm mt-1.5">Project Control Center</p>
        </div>

        {isChangingPassword ? (
          /* Mandatory First-Login Password Change Form */
          <div className="p-6">
            <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-amber-700">
              <KeyRound className="w-4 h-4 text-amber-600" />
              <span>Mandatory Password Establishment</span>
            </div>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              Your account authenticated with temporary seed credentials. To protect corporate operations, you must establish a unique personal password before proceeding.
            </p>

            {pwdError && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-100 flex items-start gap-2">
                <span className="font-semibold shrink-0">Error:</span>
                <span className="flex-1">{pwdError}</span>
              </div>
            )}

            {pwdSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 text-emerald-700 text-sm rounded-md border border-emerald-100 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                <span className="flex-1 font-medium">{pwdSuccess}</span>
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Current Temporary Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  New Secure Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    autoFocus
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 10 characters"
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Security Policy Checklist */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 space-y-1.5 text-xs">
                <div className="font-semibold text-slate-700 mb-1">Corporate Password Policy:</div>
                <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-700' : 'text-slate-500'}`}>
                  {hasMinLength ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <XCircle className="w-3.5 h-3.5" />}
                  <span>At least 10 characters</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasUpper && hasLower ? 'text-emerald-700' : 'text-slate-500'}`}>
                  {hasUpper && hasLower ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <XCircle className="w-3.5 h-3.5" />}
                  <span>Uppercase and lowercase letters</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasNumber && hasSpecial ? 'text-emerald-700' : 'text-slate-500'}`}>
                  {hasNumber && hasSpecial ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <XCircle className="w-3.5 h-3.5" />}
                  <span>Numbers and special symbols</span>
                </div>
                <div className={`flex items-center gap-1.5 ${notDefault ? 'text-emerald-700' : 'text-slate-500'}`}>
                  {notDefault ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <XCircle className="w-3.5 h-3.5" />}
                  <span>Cannot be default &quot;password&quot;</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !hasMinLength || !hasUpper || !hasLower || !hasNumber || !hasSpecial || !notDefault}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 text-sm"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Securing Account...</span>
                  </>
                ) : (
                  <span>Update Password & Enter Control Center</span>
                )}
              </button>
            </form>
          </div>
        ) : (
          /* Standard Enterprise Login Form */
          <div className="p-6">
            <div className="flex items-center gap-2 mb-6 text-sm font-semibold text-slate-700">
              <Lock className="w-4 h-4 text-blue-600" />
              <span>Secure Personnel Sign In</span>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-100 flex items-start gap-2">
                <span className="font-semibold shrink-0">Error:</span>
                <span className="flex-1">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Employee ID or Work Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    autoFocus
                    autoComplete="username"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g. EMP-001 or rajiv@ukenterprise.in"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 text-sm"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <span>Sign In to Control Center</span>
                )}
              </button>
            </form>

            <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-center gap-1.5 text-xs text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Authorized Personnel Only &bull; Monitored Under UK Enterprise Security</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
