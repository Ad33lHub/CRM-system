import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Mail, ArrowLeft, MailCheck, AlertCircle, AlertTriangle } from 'lucide-react';
import { useForgotPasswordMutation } from '../../services/authApi.js';
import { Button } from '../../components/ui/button.jsx';
import { AuthHeading, AuthBanner, TextField } from '../../features/auth/components/auth-ui.jsx';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESEND_SECONDS = 60;

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [touched, setTouched] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [banner, setBanner] = useState(null);
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef(null);

  const [forgotPasswordApi, { isLoading }] = useForgotPasswordMutation();

  const emailValid = EMAIL_RE.test(email);
  const emailError = touched ? (!email ? 'Email is required' : !emailValid ? 'Enter a valid email address' : '') : '';

  // Countdown for the "Resend" link on the success screen.
  useEffect(() => {
    if (cooldown <= 0) return undefined;
    timerRef.current = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timerRef.current);
  }, [cooldown]);

  const sendLink = async () => {
    setBanner(null);
    try {
      await forgotPasswordApi(email).unwrap();
      setSubmitted(true);
      setCooldown(RESEND_SECONDS);
    } catch (err) {
      // Never reveal whether the email exists — only surface transport/rate errors.
      if (!err.status || err.status === 'FETCH_ERROR') {
        setBanner({
          variant: 'error',
          text: 'Unable to connect. Check your internet connection and try again.',
        });
      } else if (err.status === 429) {
        setBanner({ variant: 'warning', text: 'Too many attempts. Please wait a moment.' });
      } else {
        // Any other response is treated as success to avoid email enumeration.
        setSubmitted(true);
        setCooldown(RESEND_SECONDS);
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setTouched(true);
    if (!emailValid) return;
    sendLink();
  };

  if (submitted) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
          <MailCheck className="h-7 w-7" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          Check your inbox
        </h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
          If an account exists with that email, a reset link has been sent. Check your inbox — the
          link expires in 15 minutes.
        </p>

        <div className="mt-7 space-y-3">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Didn&apos;t get it?{' '}
            {cooldown > 0 ? (
              <span className="font-medium text-slate-400">Resend in {cooldown}s</span>
            ) : (
              <button
                type="button"
                onClick={sendLink}
                disabled={isLoading}
                className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                Resend link
              </button>
            )}
          </p>
          <Link
            to="/login"
            className="inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <AuthHeading
        title="Forgot your password?"
        subtitle="Enter your email and we'll send you a reset link"
      />

      <form className="space-y-5" onSubmit={handleSubmit} noValidate>
        {banner ? (
          <AuthBanner
            variant={banner.variant}
            icon={banner.variant === 'warning' ? AlertTriangle : AlertCircle}
          >
            {banner.text}
          </AuthBanner>
        ) : null}

        <TextField
          id="reset-email"
          label="Email"
          icon={Mail}
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setTouched(true)}
          disabled={isLoading}
          error={emailError}
        />

        <Button
          type="submit"
          disabled={!emailValid || isLoading}
          className="h-11 w-full rounded-lg bg-blue-600 font-bold text-white transition-all hover:bg-blue-700"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Sending...
            </span>
          ) : (
            'Send Reset Link'
          )}
        </Button>

        <Link
          to="/login"
          className="flex items-center justify-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to login
        </Link>
      </form>
    </>
  );
}
