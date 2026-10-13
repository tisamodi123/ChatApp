import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { MessageSquare, Lock, User, Sparkles } from 'lucide-react';

export const AuthModal = () => {
  const { authUser, login, signup, isLoggingIn, isSigningUp } = useAuthStore();
  const [isLoginTab, setIsLoginTab] = useState(true);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [error, setError] = useState('');

  if (authUser) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (isLoginTab) {
      const res = await login(username, password);
      if (!res.success) setError(res.error || 'Failed to login');
    } else {
      const res = await signup({ username, fullName, password, bio });
      if (!res.success) setError(res.error || 'Failed to signup');
    }
  };

  const handleQuickLogin = async (demoUsername) => {
    setError('');
    const res = await login(demoUsername, 'password123');
    if (!res.success) setError(res.error || 'Failed to login');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-base-100 border border-base-300 rounded-xl w-full max-w-sm overflow-hidden shadow-2xl p-6">
        {/* Header */}
        <div className="text-center mb-5">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2.5">
            <MessageSquare className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold text-base-content">
            {isLoginTab ? 'Login to ChatApp' : 'Create an Account'}
          </h2>
          <p className="text-xs text-base-content/50 mt-0.5">
            Sign in to start messaging with your team
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="alert alert-error py-2 text-xs rounded-lg mb-4">
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="form-control">
            <label className="label py-1">
              <span className="label-text text-xs font-medium">Username</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. riddhi or chetan"
                className="input input-sm input-bordered w-full pl-9 text-xs rounded-lg"
                required
              />
            </div>
          </div>

          {!isLoginTab && (
            <div className="form-control">
              <label className="label py-1">
                <span className="label-text text-xs font-medium">Full Name</span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Riddhi Patel"
                className="input input-sm input-bordered w-full text-xs rounded-lg"
                required
              />
            </div>
          )}

          <div className="form-control">
            <label className="label py-1">
              <span className="label-text text-xs font-medium">Password</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input input-sm input-bordered w-full pl-9 text-xs rounded-lg"
                required
              />
            </div>
          </div>

          {!isLoginTab && (
            <div className="form-control">
              <label className="label py-1">
                <span className="label-text text-xs font-medium">Bio</span>
              </label>
              <input
                type="text"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="e.g. Software Engineer"
                className="input input-sm input-bordered w-full text-xs rounded-lg"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isLoggingIn || isSigningUp}
            className="btn btn-primary btn-sm w-full font-semibold normal-case mt-2 rounded-lg"
          >
            {isLoggingIn || isSigningUp ? (
              <span className="loading loading-spinner loading-xs"></span>
            ) : isLoginTab ? (
              'Login'
            ) : (
              'Sign Up'
            )}
          </button>
        </form>

        {/* Toggle between Login and Signup */}
        <div className="mt-3 text-center">
          <button
            type="button"
            onClick={() => {
              setIsLoginTab(!isLoginTab);
              setError('');
            }}
            className="text-xs text-primary hover:underline font-medium"
          >
            {isLoginTab ? "Don't have an account? Sign up" : 'Already have an account? Login'}
          </button>
        </div>

        {/* Quick Demo Accounts */}
        <div className="mt-4 pt-3 border-t border-base-300 text-center">
          <div className="flex items-center justify-center gap-1 text-[11px] font-semibold text-base-content/60 mb-2">
            <Sparkles className="w-3 h-3 text-primary" />
            <span>Test Accounts</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => handleQuickLogin('tisa')}
              className="btn btn-xs btn-outline rounded-md text-[11px] font-medium"
            >
              Tisa Modi
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('riddhi')}
              className="btn btn-xs btn-outline rounded-md text-[11px] font-medium"
            >
              Riddhi Patel
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('keyuri')}
              className="btn btn-xs btn-outline rounded-md text-[11px] font-medium"
            >
              Keyuri Shah
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('chetan')}
              className="btn btn-xs btn-outline rounded-md text-[11px] font-medium"
            >
              Chetan Sharma
            </button>
          </div>
          <p className="text-[10px] text-base-content/40 mt-1.5">
            Tip: Log in with different accounts across separate browser tabs to test real-time chat!
          </p>
        </div>
      </div>
    </div>
  );
};
