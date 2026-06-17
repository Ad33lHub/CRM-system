import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Eye, EyeOff, Loader2, Mail, Lock, Check, AlertCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useLoginMutation } from '../../services/authApi.js';
import {
  setCredentials,
  selectIsAuthenticated,
  selectCurrentUser,
} from '../../features/auth/authSlice.js';
import { Button } from '../../components/ui/button.jsx';
import { Checkbox } from '../../components/ui/checkbox.jsx';
import { AuthHeading, AuthBanner, TextField } from '../../features/auth/components/auth-ui.jsx';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const currentUser = useSelector(selectCurrentUser);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false });
  const [banner, setBanner] = useState(null); // { variant, text }
  const [success, setSuccess] = useState(false);

  const [loginApi, { isLoading }] = useLoginMutation();

  const redirectByRole = useCallback(
    (role) => {
      switch (role) {
        case 'super_admin':
        case 'admin':
        case 'manager':
          navigate('/dashboard');
          break;
        case 'developer':
        case 'designer':
        case 'qa_engineer':
          navigate('/tasks');
          break;
        case 'client':
          navigate('/portal');
          break;
        default:
          navigate('/dashboard');
          break;
      }
    },
    [navigate]
  );

  // Already logged in → leave the login page.
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      redirectByRole(currentUser.role);
    }
  }, [isAuthenticated, currentUser, redirectByRole]);

  // Prefill remembered email.
  useEffect(() => {
    const remembered = localStorage.getItem('remember_me_user');
    if (remembered) {
      setEmail(remembered);
      setRememberMe(true);
    }
  }, []);

  const emailValid = EMAIL_RE.test(email);
  const emailError = touched.email
    ? !email
      ? 'Email is required'
      : !emailValid
        ? 'Enter a valid email address'
        : ''
    : '';
  const passwordError = touched.password && !password ? 'Password is required' : '';
  const formValid = emailValid && password.length > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    setBanner(null);
    if (!formValid) return;

    try {
      const result = await loginApi({ email, password }).unwrap();
      const { user, accessToken } = result.data;
      dispatch(setCredentials({ user, accessToken }));

      if (rememberMe) {
        localStorage.setItem('remember_me_user', email);
      } else {
        localStorage.removeItem('remember_me_user');
      }

      // Brief success animation, then redirect + welcome toast.
      setSuccess(true);
      setTimeout(() => {
        redirectByRole(user.role);
        toast.success(`Welcome back, ${user.firstName || 'there'}`);
      }, 200);
    } catch (err) {
      if (!err.status || err.status === 'FETCH_ERROR') {
        setBanner({
          variant: 'error',
          text: 'Unable to connect. Check your internet connection and try again.',
        });
      } else if (err.status === 423) {
        setBanner({
          variant: 'error',
          text:
            err.data?.message ||
            'Account temporarily locked due to multiple failed attempts. Please try again later.',
        });
      } else if (err.status === 401) {
        setBanner({ variant: 'error', text: 'Invalid email or password' });
      } else if (err.status === 429) {
        setBanner({ variant: 'warning', text: 'Too many attempts. Please wait a moment.' });
      } else {
        setBanner({
          variant: 'error',
          text: err.data?.message || 'Something went wrong. Please try again.',
        });
      }
    }
  };

  return (
    <>
      <AuthHeading title="Welcome back" subtitle="Sign in to your account" />

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
          id="email"
          label="Email"
          icon={Mail}
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, email: true }))}
          disabled={isLoading || success}
          error={emailError}
        />

        <TextField
          id="password"
          label="Password"
          icon={Lock}
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, password: true }))}
          disabled={isLoading || success}
          error={passwordError}
          rightSlot={
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              tabIndex={-1}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          }
        />

        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400">
            <Checkbox
              checked={rememberMe}
              onCheckedChange={setRememberMe}
              disabled={isLoading || success}
              aria-label="Remember me"
            />
            Remember me
          </span>
          <Link
            to="/forgot-password"
            className="text-sm font-semibold text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400"
          >
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          disabled={!formValid || isLoading || success}
          className="h-11 w-full rounded-lg bg-blue-600 font-bold text-white transition-all hover:bg-blue-700"
        >
          {success ? (
            <Check className="h-5 w-5 animate-in zoom-in-50" />
          ) : isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Signing in...
            </span>
          ) : (
            'Sign In'
          )}
        </Button>
      </form>
    </>
  );
}
