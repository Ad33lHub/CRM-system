import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle, ArrowLeft } from 'lucide-react';
import { useForgotPasswordMutation } from '../../services/authApi.js';
import { Button } from '../../components/ui/button.jsx';
import { Input } from '../../components/ui/input.jsx';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [forgotPasswordApi, { isLoading }] = useForgotPasswordMutation();

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email) {
      setErrorMessage('Please enter your email address');
      return;
    }

    try {
      await forgotPasswordApi(email).unwrap();
      setIsSubmitted(true);
    } catch (err) {
      setErrorMessage(err.data?.message || 'Failed to submit request. Please try again.');
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
            Reset Password
          </h2>
          <p className="mt-2 text-center text-sm text-slate-400">
            Receive password recovery instructions
          </p>
        </div>

        {isSubmitted ? (
          <div className="space-y-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400">
              <CheckCircle className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Request Received</h3>
              <p className="text-sm text-slate-400">
                If a matching profile exists for <strong>{email}</strong>, a password reset link has been sent. Please check your inbox.
              </p>
            </div>
            <Button
              onClick={() => navigate('/login')}
              className="w-full h-11 text-white bg-blue-600 hover:bg-blue-700 font-bold transition-all rounded-lg"
            >
              Return to Login
            </Button>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleResetSubmit}>
            {errorMessage && (
              <div className="p-3.5 rounded-lg border border-rose-100 dark:border-rose-950 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-xs font-medium">
                {errorMessage}
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="reset-email" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Email address
              </label>
              <Input
                id="reset-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                disabled={isLoading}
                className="w-full h-11"
              />
            </div>

            <div className="space-y-3">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 text-white bg-blue-600 hover:bg-blue-700 font-bold transition-all rounded-lg"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending Link...
                  </span>
                ) : (
                  'Send Reset Link'
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                onClick={() => navigate('/login')}
                className="w-full h-11 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-semibold gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Login
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
