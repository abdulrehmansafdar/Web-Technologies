/**
 * ===========================================
 * Auth Layout Component
 * ===========================================
 * 
 * Layout for authentication pages (Login, Register).
 * Centers the auth form with branding.
 * 
 * @module components/layout/AuthLayout
 */

import { Outlet } from 'react-router-dom';
import { CheckSquare } from 'lucide-react';

/**
 * AuthLayout Component
 * 
 * Provides a centered layout for authentication pages with:
 * - TaskFlow branding
 * - Decorative background
 * - Centered content area
 */
const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient Orbs */}
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-600/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary-700/20 rounded-full blur-3xl"></div>
        
        {/* Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}
        ></div>
      </div>

      {/* Content Container */}
      <div className="relative w-full max-w-md z-10">
        {/* Logo & Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-2xl shadow-xl shadow-primary-600/30 mb-4">
            <CheckSquare className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">TaskFlow</h1>
          <p className="text-slate-400 mt-2">Professional Project Management</p>
        </div>

        {/* Auth Form Container */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 animate-fade-in border border-slate-200">
          <Outlet />
        </div>

        {/* Footer */}
        <p className="text-center text-slate-500 text-sm mt-6">
          © {new Date().getFullYear()} TaskFlow. Built for University Assignment.
        </p>
      </div>
    </div>
  );
};

export default AuthLayout;
