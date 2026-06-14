import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { useResetPasswordMutation } from '../../services/authApi.js';
import { Button } from '../../components/ui/button.jsx';
import { Input } from '../../components/ui/input.jsx';
import { toast } from 'sonner';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  // States
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [resetPasswordApi, { isLoading }] = useResetPasswordMutation();

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!token) {
      setErrorMessage('Missing or invalid reset token. Please request another reset link.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    try {
      await resetPasswordApi({ token, password }).unwrap();
      setIsSuccess(true);
      toast.success('Password reset successfully!');
    } catch (err) {
      setErrorMessage(err.data?.message || 'Failed to reset password. The link may have expired.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl">
        <div className="flex flex-col items-center">
          <img
            className="mx-auto h-16 w-auto select-none rounded-xl"
            src="https://verixsoft.com/icon.png"
            alt="Verixsoft Logo"
            onError={(e) => {
              e.target.src = 'https://placehold.co/100x100/3b82f6/ffffff?text=V';
            }}
          />
          <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
            Create New Password
          </h2>
          <p className="mt-2 text-center text-sm text-slate-400">
            Set your new secure password
          </p>
        </div>

        {isSuccess ? (
          <div className="space-y-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400">
              <CheckCircle className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Success</h3>
              <p className="text-sm text-slate-400">
                Your password has been reset successfully. You can now log in with your new credentials.
              </p>
            </div>
            <Button
              onClick={() => navigate('/login')}
              className="w-full h-11 text-white bg-blue-600 hover:bg-blue-700 font-bold transition-all rounded-lg"
            >
              Sign In
            </Button>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handlePasswordReset}>
            {errorMessage && (
              <div className="p-3.5 rounded-lg border border-rose-100 dark:border-rose-950 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-xs font-medium">
                {errorMessage}
              </div>
            )}

            <div className="space-y-4">
              {/* New Password */}
              <div className="space-y-1.5">
                <label htmlFor="new-password" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  New Password
                </label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    disabled={isLoading}
                    className="w-full h-11 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-200"
                    tabIndex="-1"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label htmlFor="confirm-password" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Confirm Password
                </label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                  className="w-full h-11"
                />
              </div>
            </div>

            <div>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 text-white bg-blue-600 hover:bg-blue-700 font-bold transition-all rounded-lg"
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
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
