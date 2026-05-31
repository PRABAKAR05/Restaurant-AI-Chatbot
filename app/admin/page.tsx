'use client';

import { useState } from 'react';
import AdminUpload from '@/components/AdminUpload';
import MenuItemsTable from '@/components/MenuItemsTable';
import Link from 'next/link';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Client-side check for simplicity
    if (password === 'restaurant_admin_2024') {
      setIsAuthenticated(true);
      setLoginError('');
    } else {
      setLoginError('Invalid password. Please try again.');
    }
  };

  const handleUploadSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  // Login Gate
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">🔐</div>
            <h1 className="text-3xl font-bold text-white mb-2">Admin Panel</h1>
            <p className="text-gray-400 text-sm">
              Spice Garden Menu Management
            </p>
          </div>

          {/* Login Form */}
          <form
            onSubmit={handleLogin}
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/10"
          >
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Admin Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setLoginError('');
              }}
              placeholder="Enter admin password"
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-300"
              autoFocus
            />

            {loginError && (
              <p className="text-red-400 text-sm mt-2 flex items-center gap-1">
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                {loginError}
              </p>
            )}

            <button
              type="submit"
              className="mt-4 w-full py-3 px-4 rounded-xl font-semibold text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-lg hover:shadow-xl transition-all duration-300 active:scale-[0.98]"
            >
              Sign In
            </button>

            <div className="mt-4 text-center">
              <Link
                href="/"
                className="text-amber-400 text-sm hover:text-amber-300 transition-colors"
              >
                ← Back to Chat
              </Link>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Admin Dashboard
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-amber-50 to-orange-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-gray-800 via-gray-900 to-gray-800 text-white px-4 py-4 shadow-xl">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-0">
          <div className="text-center sm:text-left">
            <h1 className="text-xl md:text-2xl font-bold flex items-center justify-center sm:justify-start gap-2">
              <span className="text-2xl">⚙️</span>
              <span className="bg-gradient-to-r from-amber-200 to-yellow-200 bg-clip-text text-transparent">
                Spice Garden Admin
              </span>
            </h1>
            <p className="text-gray-400 text-xs mt-0.5 sm:ml-10">
              Menu Management Dashboard
            </p>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-3">
            <span className="text-xs text-green-400 flex items-center gap-1">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="hidden sm:inline">Authenticated</span>
              <span className="sm:hidden">Auth'd</span>
            </span>
            <Link
              href="/"
              className="text-xs px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-300 border border-white/20 text-center"
            >
              View Chat →
            </Link>
            <button
              onClick={() => {
                setIsAuthenticated(false);
                setPassword('');
              }}
              className="text-xs px-3 py-1.5 rounded-full bg-red-500/20 hover:bg-red-500/30 text-red-300 transition-all duration-300 border border-red-500/30"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Upload Section */}
        <AdminUpload password={password} onUploadSuccess={handleUploadSuccess} />

        {/* Indexed Items Section */}
        <MenuItemsTable refreshTrigger={refreshTrigger} password={password} />
      </main>

      {/* Footer */}
      <footer className="text-center py-4 text-xs text-gray-400">
        Spice Garden Restaurant • Admin Panel • Powered by AI
      </footer>
    </div>
  );
}
