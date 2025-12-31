/**
 * ===========================================
 * Authentication Context
 * ===========================================
 * 
 * Provides authentication state management across the application.
 * Handles user login, logout, and session persistence.
 * 
 * Uses React Context API for state management.
 * 
 * @module context/AuthContext
 */

import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

// Create the authentication context
const AuthContext = createContext(null);

/**
 * Custom hook to access auth context
 * 
 * @returns {Object} Auth context value
 * @throws {Error} If used outside of AuthProvider
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * Authentication Provider Component
 * 
 * Wraps the application and provides authentication state and methods.
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 */
export const AuthProvider = ({ children }) => {
  // Authentication state
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  /**
   * Effect: Load user data on mount if token exists
   * 
   * Validates the stored token and fetches user profile.
   * Clears invalid tokens.
   */
  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        try {
          // Set token in API headers
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Fetch current user profile
          const response = await api.get('/auth/me');
          setUser(response.data.data.user);
        } catch (error) {
          // Token is invalid or expired
          console.error('Token validation failed:', error);
          localStorage.removeItem('token');
          setToken(null);
          delete api.defaults.headers.common['Authorization'];
        }
      }
      setLoading(false);
    };

    loadUser();
  }, [token]);

  /**
   * Login user with email and password
   * 
   * @param {string} email - User's email
   * @param {string} password - User's password
   * @returns {Promise<Object>} Login result with user data
   */
  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { user: userData, token: authToken } = response.data.data;

      // Store token in localStorage
      localStorage.setItem('token', authToken);
      
      // Set token in API headers
      api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
      
      // Update state
      setToken(authToken);
      setUser(userData);

      toast.success(`Welcome back, ${userData.name}!`);
      
      return { success: true, user: userData };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  /**
   * Register a new user
   * 
   * @param {Object} userData - User registration data
   * @param {string} userData.name - User's name
   * @param {string} userData.email - User's email
   * @param {string} userData.password - User's password
   * @param {string} [userData.department] - User's department
   * @returns {Promise<Object>} Registration result
   */
  const register = async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      const { user: newUser, token: authToken } = response.data.data;

      // Store token
      localStorage.setItem('token', authToken);
      api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
      
      // Update state
      setToken(authToken);
      setUser(newUser);

      toast.success('Registration successful! Welcome to TaskFlow!');
      
      return { success: true, user: newUser };
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  /**
   * Logout user
   * 
   * Clears authentication state and stored token.
   */
  const logout = () => {
    // Clear localStorage
    localStorage.removeItem('token');
    
    // Clear API headers
    delete api.defaults.headers.common['Authorization'];
    
    // Clear state
    setToken(null);
    setUser(null);

    toast.success('Logged out successfully');
  };

  /**
   * Update user profile
   * 
   * @param {Object} profileData - Updated profile data
   * @returns {Promise<Object>} Update result
   */
  const updateProfile = async (profileData) => {
    try {
      const response = await api.put('/auth/profile', profileData);
      setUser(response.data.data.user);
      toast.success('Profile updated successfully');
      return { success: true, user: response.data.data.user };
    } catch (error) {
      const message = error.response?.data?.message || 'Profile update failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  /**
   * Change user password
   * 
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<Object>} Change result
   */
  const changePassword = async (currentPassword, newPassword) => {
    try {
      const response = await api.put('/auth/password', {
        currentPassword,
        newPassword
      });

      // Update token if returned
      if (response.data.data.token) {
        localStorage.setItem('token', response.data.data.token);
        api.defaults.headers.common['Authorization'] = `Bearer ${response.data.data.token}`;
        setToken(response.data.data.token);
      }

      toast.success('Password changed successfully');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Password change failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // Context value object
  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
