import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Eye, EyeOff, Loader2, Lock } from 'lucide-react';
import { useLoginMutation } from '../../services/authApi.js';
import { setCredentials, selectIsAuthenticated, selectCurrentUser } from '../../features/auth/authSlice.js';
import { Button } from '../../components/ui/button.jsx';
import { Input } from '../../components/ui/input.jsx';
import { Checkbox } from '../../components/ui/checkbox.jsx';
import { toast } from 'sonner';

export default function LoginPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const currentUser = useSelector(selectCurrentUser);

  // States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // RTK Query Mutation
  const [loginApi, { isLoading }] = useLoginMutation();

  const redirectByRole = useCallback((role) => {
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
  }, [navigate]);

  // If already logged in, redirect based on role
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      redirectByRole(currentUser.role);
    }
  }, [isAuthenticated, currentUser, redirectByRole]);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email || !password) {
      setErrorMessage('Email and password are required');
      return;
    }

    try {
      const result = await loginApi({ email, password }).unwrap();
      const { user, accessToken } = result.data;

      // Dispatch to Redux store
      dispatch(setCredentials({ user, accessToken }));

      // Save rememberMe session choice if desired
      if (rememberMe) {
        localStorage.setItem('remember_me_user', email);
      } else {
        localStorage.removeItem('remember_me_user');
      }

      toast.success(`Welcome back, ${user.firstName || 'User'}!`);
      redirectByRole(user.role);
    } catch (err) {
      if (!err.status) {
        setErrorMessage('Connection failed. Try again.');
      } else if (err.status === 423) {
        const lockMsg = err.data?.message || 'Account locked. Too many failed attempts.';
        setErrorMessage(lockMsg);
      } else if (err.status === 401) {
        setErrorMessage('Invalid email or password');
      } else {
        setErrorMessage(err.data?.message || 'Login failed. Try again.');
      }
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
              // Fallback if the logo URL is unreachable
              e.target.src = 'https://placehold.co/100x100/3b82f6/ffffff?text=V';
            }}
          />
          <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
            Verixsoft CRM
          </h2>
          <p className="mt-2 text-center text-sm text-slate-400">
            Sign in to access your dashboard
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleLoginSubmit}>
          {errorMessage && (
            <div className="p-3.5 rounded-lg border border-rose-100 dark:border-rose-950 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-xs font-medium flex items-start gap-2">
              <Lock className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="space-y-4">
            {/* Email Address */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Email address
              </label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                disabled={isLoading}
                className="w-full h-11"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label htmlFor="password" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
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
          </div>

          {/* Remember me */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox
                id="remember-me"
                checked={rememberMe}
                onCheckedChange={setRememberMe}
                disabled={isLoading}
              />
              <label
                htmlFor="remember-me"
                className="text-xs font-medium text-slate-500 dark:text-slate-400 select-none cursor-pointer"
              >
                Remember me
              </label>
            </div>
          </div>

          {/* Submit */}
          <div>
            <Button
              id="btn-login"
              type="submit"
              disabled={isLoading}
              className="w-full h-11 text-white bg-blue-600 hover:bg-blue-700 font-bold transition-all rounded-lg"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
