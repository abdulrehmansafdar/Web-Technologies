/**
 * ===========================================
 * NotFound (404) Page Component
 * ===========================================
 * 
 * Displayed when user navigates to a non-existent route.
 * Provides helpful navigation back to home.
 * 
 * @module pages/NotFound
 */

import { Link } from 'react-router-dom';
import { Home, ArrowLeft, Search } from 'lucide-react';

/**
 * NotFound Component
 * 
 * Features:
 * - Friendly 404 message
 * - Navigation options
 * - Professional appearance
 */
const NotFound = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center animate-fade-in">
        {/* 404 Illustration */}
        <div className="mb-8">
          <div className="relative inline-block">
            <span className="text-9xl font-bold text-primary-100">404</span>
            <div className="absolute inset-0 flex items-center justify-center">
              <Search className="w-24 h-24 text-primary-500 opacity-50" />
            </div>
          </div>
        </div>

        {/* Message */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Page Not Found
        </h1>
        <p className="text-gray-600 mb-8">
          Oops! The page you're looking for doesn't exist or has been moved.
          Let's get you back on track.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => window.history.back()}
            className="btn-secondary"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </button>
          <Link to="/" className="btn-primary">
            <Home className="w-5 h-5" />
            Back to Home
          </Link>
        </div>

        {/* Helpful Links */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-4">
            Or try one of these pages:
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/dashboard"
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              Dashboard
            </Link>
            <Link
              to="/projects"
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              Projects
            </Link>
            <Link
              to="/tasks"
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              Tasks
            </Link>
            <Link
              to="/team"
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              Team
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
