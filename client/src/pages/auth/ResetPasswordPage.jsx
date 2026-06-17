import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Loader2, Lock, Eye, EyeOff, Check, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useResetPasswordMutation } from '../../services/authApi.js';
import { Button } from '../../components/ui/button.jsx';
import { cn } from '../../lib/utils.js';
import { AuthHeading, TextField } from '../../features/auth/components/auth-ui.jsx';

// Mirror the server's reset password rules (validators/auth.validator.js).
const REQUIREMENTS = [
  { id: 'len', label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { id: 'upper', label: 'One uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { id: 'lower', label: 'One lowercase letter', test: (p) => /[a-z]/.test(p) },
  { id: 'number', label: 'One number', test: (p) => /\d/.test(p) },
  { id: 'special', label: 'One special character (@$!%*?&)', test: (p) => /[@$!%*?&]/.test(p) },
];

const STRENGTH = [
  { label: 'Weak', bar: 'bg-rose-500', text: 'text-rose-500' },
  { label: 'Medium', bar: 'bg-amber-500', text: 'text-amber-500' },
  { label: 'Strong', bar: 'bg-emerald-500', text: 'text-emerald-500' },
];

const EyeToggle = ({ shown, onToggle }) => (
  <button
    type="button"
    onClick={onToggle}
    tabIndex={-1}
    aria-label={shown ? 'Hide password' : 'Show password'}
    className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
  >
    {shown ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
  </button>
);

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmTouched, setConfirmTouched] = useState(false);
  const [success, setSuccess] = useState(false);
  const [invalidToken, setInvalidToken] = useState(false);

  const [resetPasswordApi, { isLoading }] = useResetPasswordMutation();

  const metCount = useMemo(
    () => REQUIREMENTS.filter((r) => r.test(password)).length,
    [password]
  );
  const allMet = metCount === REQUIREMENTS.length;
  const matches = password.length > 0 && password === confirm;
  const canSubmit = allMet && matches && !isLoading;

  const strengthLevel = metCount <= 2 ? 0 : metCount <= 4 ? 1 : 2;
  const strength = STRENGTH[strengthLevel];

  // Auto-redirect to login after a successful reset.
  useEffect(() => {
    if (!success) return undefined;
    const t = setTimeout(() => navigate('/login'), 3000);
    return () => clearTimeout(t);
  }, [success, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setConfirmTouched(true);
    if (!token) {
      setInvalidToken(true);
      return;
    }
    if (!canSubmit) return;

    try {
      await resetPasswordApi({ token, password }).unwrap();
      setSuccess(true);
      toast.success('Password updated successfully');
    } catch (err) {
      if (err.status === 400 || err.status === 401 || err.status === 410) {
        setInvalidToken(true);
      } else if (!err.status || err.status === 'FETCH_ERROR') {
        toast.error('Unable to connect. Check your internet connection and try again.');
      } else {
        toast.error(err.data?.message || 'Failed to reset password. Please try again.');
      }
    }
  };

  if (invalidToken) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400">
          <XCircle className="h-7 w-7" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          Link expired or invalid
        </h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
          This reset link has expired or is invalid. Request a new one to continue.
        </p>
        <Button
          onClick={() => navigate('/forgot-password')}
          className="mt-7 h-11 w-full rounded-lg bg-blue-600 font-bold text-white hover:bg-blue-700"
        >
          Request a new link
        </Button>
      </div>
    );
  }

  if (success) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
          <CheckCircle2 className="h-7 w-7 animate-in zoom-in-50" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          Password updated successfully
        </h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
          Redirecting you to login…
        </p>
        <Button
          onClick={() => navigate('/login')}
          className="mt-7 h-11 w-full rounded-lg bg-blue-600 font-bold text-white hover:bg-blue-700"
        >
          Go to login now
        </Button>
      </div>
    );
  }

  return (
    <>
      <AuthHeading title="Set a new password" subtitle="Choose a strong password for your account" />

      <form className="space-y-5" onSubmit={handleSubmit} noValidate>
        <TextField
          id="new-password"
          label="New password"
          icon={Lock}
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
          rightSlot={<EyeToggle shown={showPassword} onToggle={() => setShowPassword((s) => !s)} />}
        />

        {/* strength + checklist */}
        {password ? (
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                <div
                  className={cn('h-full rounded-full transition-all', strength.bar)}
                  style={{ width: `${(metCount / REQUIREMENTS.length) * 100}%` }}
                />
              </div>
              <span className={cn('text-xs font-bold', strength.text)}>{strength.label}</span>
            </div>
            <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {REQUIREMENTS.map((r) => {
                const ok = r.test(password);
                return (
                  <li
                    key={r.id}
                    className={cn(
                      'flex items-center gap-1.5 text-xs',
                      ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                    )}
                  >
                    <Check className={cn('h-3.5 w-3.5 shrink-0', !ok && 'opacity-30')} />
                    {r.label}
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}

        <TextField
          id="confirm-password"
          label="Confirm new password"
          icon={Lock}
          type={showConfirm ? 'text' : 'password'}
          autoComplete="new-password"
          placeholder="••••••••"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          onBlur={() => setConfirmTouched(true)}
          disabled={isLoading}
          error={confirmTouched && confirm && !matches ? "Passwords don't match" : ''}
          rightSlot={<EyeToggle shown={showConfirm} onToggle={() => setShowConfirm((s) => !s)} />}
        />

        <Button
          type="submit"
          disabled={!canSubmit}
          className="h-11 w-full rounded-lg bg-blue-600 font-bold text-white transition-all hover:bg-blue-700"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Resetting...
            </span>
          ) : (
            'Reset Password'
          )}
        </Button>

        <Link
          to="/login"
          className="block text-center text-sm font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
        >
          Back to login
        </Link>
      </form>
    </>
  );
}
